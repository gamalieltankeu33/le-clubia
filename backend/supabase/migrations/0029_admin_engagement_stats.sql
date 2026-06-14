-- =====================================================================
-- Le Club IA — Migration 0029 : Statistiques d'engagement pédagogique
-- =====================================================================

-- 1. RPC : get_admin_learning_engagement()
--    Retourne le top 5 des formations, le taux de complétion moyen
--    et l'activité de lecture (24h).
-- ---------------------------------------------------------------------
create or replace function public.get_admin_learning_engagement()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_top_formations jsonb;
  v_completion_rate float;
  v_chapters_read_24h bigint;
  v_result jsonb;
begin
  -- Top 5 formations les plus populaires (basé sur le nombre de chapitres validés)
  select jsonb_agg(t) into v_top_formations
  from (
    select 
      f.title as name,
      count(up.chapter_id) as completions
    from public.user_formation_progress up
    join public.formations f on f.id = up.formation_id
    where up.completed = true
    group by f.id, f.title
    order by completions desc
    limit 5
  ) t;

  -- Activité de lecture (24h) : chapitres validés aujourd'hui
  select count(*) into v_chapters_read_24h
  from public.user_formation_progress
  where completed = true
    and completed_at >= now() - interval '24 hours';

  -- Taux de complétion moyen :
  -- Moyenne des (chapitres complétés par user / chapitres totaux de la formation)
  with user_stats as (
    select 
      up.user_id,
      up.formation_id,
      count(*) filter (where up.completed = true) as chapters_completed,
      (select count(*) from public.chapters c where c.formation_id = up.formation_id) as total_chapters
    from public.user_formation_progress up
    group by up.user_id, up.formation_id
  )
  select coalesce(avg(chapters_completed::float / nullif(total_chapters, 0)), 0) * 100
  into v_completion_rate
  from user_stats
  where total_chapters > 0;

  -- Assemblage du JSON final
  v_result := jsonb_build_object(
    'top_formations', coalesce(v_top_formations, '[]'::jsonb),
    'chapters_read_24h', v_chapters_read_24h,
    'average_completion_rate', round(v_completion_rate::numeric, 1)
  );

  return v_result;
end;
$$;

revoke all on function public.get_admin_learning_engagement() from public;
grant execute on function public.get_admin_learning_engagement() to authenticated;
