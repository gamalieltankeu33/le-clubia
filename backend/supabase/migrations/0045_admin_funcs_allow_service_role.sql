-- =====================================================================
-- Le Club IA — Migration 0045 : bypass service_role sur les fonctions admin
--
-- Contexte : `admin-stats` (edge function) appelle compute_active_mrr_xof,
-- get_admin_inactive_members, get_admin_learning_engagement via un client
-- service_role (pour bypass RLS). Le check `is_admin(auth.uid())` ajouté
-- en 0043 plante avec service_role (auth.uid() = null).
--
-- Solution : autoriser explicitement service_role (admin-stats vérifie déjà
-- que l'appelant user est admin en amont). Pour les appels directs via
-- l'app authenticated, le check is_admin reste appliqué.
--
-- Idempotente.
-- =====================================================================

create or replace function public.compute_active_mrr_xof()
returns table (
  total_mrr_xof    bigint,
  active_count     bigint,
  semestrial_count bigint,
  annual_count     bigint,
  legacy_count     bigint
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if coalesce(auth.role(), '') <> 'service_role'
     and not public.is_admin(auth.uid()) then
    raise exception 'Accès refusé' using errcode = '42501';
  end if;
  return query
    with active_subs as (
      select s.user_id, coalesce(s.plan_id, 'annual') as plan_id
      from public.subscriptions s
      where s.status in ('active', 'trialing')
    ),
    joined as (
      select
        a.plan_id,
        pp.price_xof,
        pp.duration_months
      from active_subs a
      left join public.pricing_plans pp on pp.id = a.plan_id
    )
    select
      coalesce(sum(coalesce(price_xof, 0) / nullif(duration_months, 0)), 0)::bigint,
      count(*)::bigint,
      count(*) filter (where joined.plan_id = 'semestrial')::bigint,
      count(*) filter (where joined.plan_id = 'annual')::bigint,
      count(*) filter (where joined.plan_id = 'legacy_annual')::bigint
    from joined;
end;
$$;

create or replace function public.get_admin_inactive_members()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_result jsonb;
begin
  if coalesce(auth.role(), '') <> 'service_role'
     and not public.is_admin(auth.uid()) then
    raise exception 'Accès refusé' using errcode = '42501';
  end if;
  select jsonb_agg(t) into v_result
  from (
    select
      p.id,
      p.first_name,
      p.last_name,
      p.email,
      p.last_active_at,
      s.plan
    from public.profiles p
    join public.subscriptions s on s.user_id = p.id
    where s.status = 'active'
      and (p.last_active_at < now() - interval '30 days' or p.last_active_at is null)
      and p.role != 'admin'
    order by p.last_active_at asc nulls first
    limit 10
  ) t;
  return coalesce(v_result, '[]'::jsonb);
end;
$$;

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
  if coalesce(auth.role(), '') <> 'service_role'
     and not public.is_admin(auth.uid()) then
    raise exception 'Accès refusé' using errcode = '42501';
  end if;
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

  select count(*) into v_chapters_read_24h
  from public.user_formation_progress
  where completed = true
    and completed_at >= now() - interval '24 hours';

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

  v_result := jsonb_build_object(
    'top_formations', coalesce(v_top_formations, '[]'::jsonb),
    'chapters_read_24h', v_chapters_read_24h,
    'average_completion_rate', round(v_completion_rate::numeric, 1)
  );

  return v_result;
end;
$$;
