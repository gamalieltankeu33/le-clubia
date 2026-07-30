-- =====================================================================
-- Le Club IA — Migration 0064 : Comptage réel des apprenants
--
-- Objectif :
--   Calculer le nombre réel d'apprenants distincts ayant accédé ou commencé
--   la formation sur Le Club IA, sans utiliser de compteurs simulés.
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
  is_premium         boolean,
  created_at         timestamptz,
  updated_at         timestamptz,
  total_chapters     integer,
  completed_chapters integer,
  progress_percent   integer,
  has_started        boolean,
  is_enrolled        boolean,
  participants_count integer
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
    f.is_premium,
    f.created_at,
    f.updated_at,
    coalesce(c.total, 0)::integer       as total_chapters,
    coalesce(p.completed, 0)::integer   as completed_chapters,
    case
      when coalesce(c.total, 0) = 0 then 0
      else round(coalesce(p.sum_progress, 0)::numeric / c.total::numeric)::integer
    end                                 as progress_percent,
    coalesce(p.has_started, false)      as has_started,
    coalesce(e.is_enrolled, false)      as is_enrolled,
    coalesce(part.count, 0)::integer    as participants_count
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
  left join (
    select formation_id, true as is_enrolled
    from public.formation_enrollments
    where user_id = auth.uid()
  ) e on e.formation_id = f.id
  left join (
    -- Compte réel des membres distincts inscrits ou ayant commencé la formation
    select formation_id, count(distinct user_id) as count
    from (
      select user_id, formation_id from public.formation_enrollments
      union
      select user_id, formation_id from public.user_formation_progress
    ) combined
    group by formation_id
  ) part on part.formation_id = f.id
  where f.is_published = true
  order by f.created_at desc;
$$;

grant execute on function public.get_formations_with_progress() to authenticated;

comment on function public.get_formations_with_progress() is
  'Retourne le catalogue de formations enrichi de la progression du membre, de son etat d''inscription et du total réel d''apprenants distincts.';
