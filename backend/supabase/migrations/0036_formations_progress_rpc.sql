-- =====================================================================
-- Le Club IA — Migration 0036 : RPC catalogue formations + progression
--
-- Objectif :
--   Le catalogue /app/formations affichait la progression du membre via
--   2 queries séparées (formations + user_formation_progress) puis un
--   merge JS. La nouvelle UX (tube Skool sur chaque card) demande la
--   progression sur TOUTES les cards en permanence — autant le calculer
--   en SQL en un seul round-trip.
--
-- Périmètre :
--   1. Fonction get_formations_with_progress() : retourne pour chaque
--      formation publiée :
--        - les colonnes de la table formations
--        - total_chapters       : nombre de chapitres
--        - completed_chapters   : chapitres marqués completed pour auth.uid()
--        - progress_percent     : 0..100, arrondi
--        - has_started          : true si au moins une row dans
--          user_formation_progress (même non-completed) — sert à afficher
--          le badge "En cours" avant le 1er chapitre validé.
--
--   2. SECURITY DEFINER pour éviter d'exposer user_formation_progress
--      d'autres users via la jointure ; le filtre user_id = auth.uid()
--      garantit que chaque user ne voit que sa propre progression.
--
--   3. GRANT EXECUTE aux authenticated.
--
-- Idempotente.
-- =====================================================================

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
      else round((coalesce(p.completed, 0)::numeric / c.total::numeric) * 100)::integer
    end                                 as progress_percent,
    coalesce(p.started, false)          as has_started
  from public.formations f
  left join (
    select formation_id, count(*) as total
    from public.formation_chapters
    group by formation_id
  ) c on c.formation_id = f.id
  left join (
    select
      formation_id,
      count(*) filter (where completed = true) as completed,
      true                                     as started
    from public.user_formation_progress
    where user_id = auth.uid()
    group by formation_id
  ) p on p.formation_id = f.id
  where f.is_published = true
  order by f.created_at desc;
$$;

grant execute on function public.get_formations_with_progress() to authenticated;

comment on function public.get_formations_with_progress() is
  'Retourne le catalogue de formations publiées enrichi de la progression du membre courant. Utilisé par /app/formations.';
