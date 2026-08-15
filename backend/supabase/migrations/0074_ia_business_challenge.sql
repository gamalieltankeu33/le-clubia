-- =====================================================================
-- Le Club IA -- Migration 0074 : Offre AI Business Sprint (Accès restreint)
-- =====================================================================

-- 1. Colonnes is_challenge_allowed
alter table public.formations
  add column if not exists is_challenge_allowed boolean not null default false;

alter table public.resources
  add column if not exists is_challenge_allowed boolean not null default false;

comment on column public.formations.is_challenge_allowed is
  'Indique si la formation est accessible aux abonnés du AI Business Sprint.';
comment on column public.resources.is_challenge_allowed is
  'Indique si la ressource est accessible aux abonnés du AI Business Sprint.';

-- 2. Plan challenge dans pricing_plans
insert into public.pricing_plans (
  id, display_name, price_xof, duration_months, is_active, is_recommended, description
)
values (
  'challenge_ia_business',
  'AI Business Sprint',
  30,
  1,
  true,
  false,
  'Accès 1 mois au programme intensif AI Business Sprint.'
)
on conflict (id) do update set
  display_name = excluded.display_name,
  price_xof = excluded.price_xof,
  is_active = true,
  duration_months = 1;

-- 3. Nettoyage des doublons fictifs si créés précédemment
delete from public.formations where id = 'd5a8f902-7b1e-4c3a-9210-8f74e6123456' and title ilike 'AI Business Sprint : Créer%';
delete from public.resources where id = 'f912cd34-5678-4901-ab23-cdef01234567';

-- 4. Activer l'accès pour la formation existante "AI Business Sprint" (ou la dernière formation créée)
update public.formations
  set is_challenge_allowed = true
  where id in (
    select id from public.formations order by created_at desc limit 1
  )
  or title ilike '%sprint%'
  or title ilike '%business%'
  or slug ilike '%sprint%';

-- 5. Activer l'accès pour la ressource "Classer les prompts" (ou la dernière ressource créée)
update public.resources
  set is_challenge_allowed = true
  where id in (
    select id from public.resources order by created_at desc limit 1
  )
  or title ilike '%classer%'
  or title ilike '%prompt%'
  or category ilike '%prompt%';

-- 6. Helper SQL is_challenge_user
create or replace function public.is_challenge_user(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce((
    select plan_id = 'challenge_ia_business'
    from public.subscriptions
    where user_id = uid
      and status in ('active', 'trialing')
      and (current_period_end is null or current_period_end > now())
    order by created_at desc
    limit 1
  ), false);
$$;

grant execute on function public.is_challenge_user(uuid) to authenticated;

-- 7. RLS formation_chapters
drop policy if exists "chapters select members" on public.formation_chapters;
create policy "chapters select members" on public.formation_chapters
  as permissive for select to public
  using (
    public.is_admin((select auth.uid())) or (
      public.is_active_member((select auth.uid()))
      and exists (
        select 1 from public.formations f
        where f.id = formation_id
          and f.is_published
          and (
            not f.is_premium
            or not public.is_trial_user((select auth.uid()))
          )
          and (
            not public.is_challenge_user((select auth.uid()))
            or f.is_challenge_allowed
          )
      )
    )
  );

-- 8. RPC get_formations_with_progress
drop function if exists public.get_formations_with_progress();
create function public.get_formations_with_progress()
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
  is_challenge_allowed boolean,
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
    f.is_challenge_allowed,
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
    (f.base_participants_count + coalesce(ec.enroll_count, 0))::integer as participants_count
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
    select formation_id, count(*) as enroll_count
    from public.formation_enrollments
    group by formation_id
  ) ec on ec.formation_id = f.id
  where f.is_published = true
  order by f.created_at desc;
$$;

grant execute on function public.get_formations_with_progress() to authenticated;
