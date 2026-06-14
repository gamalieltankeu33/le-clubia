-- =====================================================================
-- Le Club IA — Migration 0037 : progression vidéo par chapitre
--
-- Objectif :
--   Avant, on stockait juste `completed = true/false` par chapitre.
--   Le tube de progression du catalogue restait à 0% tant qu'aucun
--   chapitre n'avait été complété → frustrant pour les membres en
--   cours de visionnage.
--
--   Maintenant, on stocke aussi `progress_percent` (0..100) par
--   chapitre, mis à jour en streaming pendant la lecture (toutes les
--   5s côté frontend). À 90%, le chapitre devient automatiquement
--   `completed = true`.
--
-- Périmètre :
--   1. Colonne progress_percent sur user_formation_progress (CHECK + DEFAULT 0).
--   2. Backfill : 100 si completed=true, 0 sinon.
--   3. NOT NULL après backfill.
--   4. RPC update_chapter_progress() : upsert sécurisé avec :
--        - max() pour ne JAMAIS faire reculer le %
--        - completed=true automatique si pct >= 90
--        - increment_user_points(+10) déclenché UNE seule fois (à la
--          transition non-completed → completed)
--   5. RPC get_formations_with_progress() RÉ-ÉCRITE : le %
--      formation = ROUND(SUM(progress_percent par chapitre) / total).
--      Une formation à 5 chapitres dont l'un est à 60% donne
--      maintenant ~12% au catalogue (au lieu de 0% avant).
--
-- Idempotente. Dépend de 0001_init + 0036_formations_progress_rpc.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Colonne progress_percent
-- ---------------------------------------------------------------------
alter table public.user_formation_progress
  add column if not exists progress_percent integer
    check (progress_percent >= 0 and progress_percent <= 100)
    default 0;

-- ---------------------------------------------------------------------
-- 2. Backfill : on aligne le legacy avec le nouveau modèle
-- ---------------------------------------------------------------------
update public.user_formation_progress
   set progress_percent = 100
 where completed = true
   and (progress_percent is null or progress_percent < 100);

update public.user_formation_progress
   set progress_percent = 0
 where completed = false
   and progress_percent is null;

-- ---------------------------------------------------------------------
-- 3. NOT NULL une fois le backfill fait
-- ---------------------------------------------------------------------
alter table public.user_formation_progress
  alter column progress_percent set not null;

-- ---------------------------------------------------------------------
-- 4. RPC update_chapter_progress(chapter_id, percent, position?)
--    - Refuse les anonymes.
--    - Clamp [0, 100].
--    - max() côté DB pour éviter toute régression visuelle si un tick
--      tardif arrive après un saut en avant.
--    - completed automatique à >= 90.
--    - Points +10 déclenchés UNE seule fois (à la bascule).
-- ---------------------------------------------------------------------
create or replace function public.update_chapter_progress(
  p_chapter_id        uuid,
  p_progress_percent  integer,
  p_position_seconds  integer default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id        uuid := auth.uid();
  v_formation_id   uuid;
  v_was_completed  boolean;
  v_should_complete boolean;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select formation_id into v_formation_id
    from public.formation_chapters
   where id = p_chapter_id;

  if v_formation_id is null then
    raise exception 'Chapter not found';
  end if;

  p_progress_percent := greatest(0, least(100, p_progress_percent));
  v_should_complete := p_progress_percent >= 90;

  select completed into v_was_completed
    from public.user_formation_progress
   where user_id = v_user_id
     and chapter_id = p_chapter_id;

  insert into public.user_formation_progress (
    user_id,
    chapter_id,
    formation_id,
    progress_percent,
    completed,
    completed_at,
    last_position_seconds
  )
  values (
    v_user_id,
    p_chapter_id,
    v_formation_id,
    p_progress_percent,
    v_should_complete,
    case when v_should_complete then now() else null end,
    coalesce(p_position_seconds, 0)
  )
  on conflict (user_id, chapter_id) do update set
    progress_percent      = greatest(public.user_formation_progress.progress_percent, excluded.progress_percent),
    completed             = public.user_formation_progress.completed or excluded.completed,
    completed_at          = coalesce(public.user_formation_progress.completed_at, excluded.completed_at),
    last_position_seconds = coalesce(excluded.last_position_seconds, public.user_formation_progress.last_position_seconds);

  -- Side effect points : uniquement à la transition vers completed.
  if v_should_complete and coalesce(v_was_completed, false) = false then
    perform public.increment_user_points(
      v_user_id,
      10,
      'chapter_completed',
      p_chapter_id
    );
  end if;
end;
$$;

grant execute on function public.update_chapter_progress(uuid, integer, integer) to authenticated;

comment on function public.update_chapter_progress(uuid, integer, integer) is
  'Upsert de la progression sur un chapitre. Ne descend jamais le pourcentage. Auto-complète à >= 90 et déclenche les points en une seule fois.';

-- ---------------------------------------------------------------------
-- 5. Réécriture get_formations_with_progress() :
--    progress_percent formation = SUM(% chapitres) / total_chapters
--    (au lieu de completed_chapters / total_chapters × 100).
-- ---------------------------------------------------------------------
create or replace function public.get_formations_with_progress()
returns table (
  id                 uuid,
  slug               text,
  title              text,
  description        text,
  category           text,
  cover_image_url    text,
  level              public.formation_level,
  duration_minutes   integer,
  is_published       boolean,
  created_at         timestamptz,
  updated_at         timestamptz,
  total_chapters     integer,
  completed_chapters integer,
  progress_percent   integer,
  has_started        boolean
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    f.id,
    f.slug,
    f.title,
    f.description,
    f.category,
    f.cover_image_url,
    f.level,
    f.duration_minutes,
    f.is_published,
    f.created_at,
    f.updated_at,
    coalesce(c.total, 0)::integer       as total_chapters,
    coalesce(p.completed, 0)::integer   as completed_chapters,
    case
      when coalesce(c.total, 0) = 0 then 0
      else round(coalesce(p.sum_progress, 0)::numeric / c.total::numeric)::integer
    end                                 as progress_percent,
    coalesce(p.has_started, false)      as has_started
  from public.formations f
  left join (
    select formation_id, count(*) as total
    from public.formation_chapters
    group by formation_id
  ) c on c.formation_id = f.id
  left join (
    select
      formation_id,
      sum(progress_percent)                    as sum_progress,
      count(*) filter (where completed = true) as completed,
      bool_or(progress_percent > 0)            as has_started
    from public.user_formation_progress
    where user_id = auth.uid()
    group by formation_id
  ) p on p.formation_id = f.id
  where f.is_published = true
  order by f.created_at desc;
$$;

grant execute on function public.get_formations_with_progress() to authenticated;
