-- =====================================================================
-- Le Club IA — Migration 0058 : verrouillage Premium pour Plan Découverte
--
-- Objectif : certaines formations et ressources sont réservées aux plans
-- payants pleins (semestrial / annual / legacy_annual). Les utilisateurs
-- en Plan Découverte (plan_id='trial') voient un cadenas sur ces items
-- et un écran "upgrade requis" s'ils tentent d'y accéder.
--
-- Changements :
--   1. Colonne is_premium boolean sur formations et resources.
--   2. Marque comme premium les 3 formations + 4 ressources listées.
--   3. Helper is_trial_user(uid) (true ssi sub active avec plan_id='trial').
--   4. RLS sur formation_chapters : un trial ne peut PAS lire les chapitres
--      d'une formation premium (le video_url et le contenu sont là).
--   5. RPC get_formations_with_progress() renvoie aussi is_premium pour
--      que le front puisse dessiner le cadenas sans round-trip supplémentaire.
--
-- Note Storage : les PDF des ressources premium restent accessibles via
-- signed URL si un trial bidouille les devtools. Le gate front suffit
-- pour v1 (trial users sont des clients payants 30 €, pas des scrapers).
-- Phase 2 si besoin : policy sur storage.objects qui joint à resources.
--
-- Idempotente.
-- =====================================================================

-- ── 1. Colonnes is_premium ─────────────────────────────────────────────
alter table public.formations
  add column if not exists is_premium boolean not null default false;

alter table public.resources
  add column if not exists is_premium boolean not null default false;

comment on column public.formations.is_premium is
  'Réservée aux plans supérieurs (semestrial/annual/legacy). Verrouillée pour les trial.';
comment on column public.resources.is_premium is
  'Réservée aux plans supérieurs (semestrial/annual/legacy). Verrouillée pour les trial.';

-- ── 2. Marquer les 7 items ─────────────────────────────────────────────
-- Formations :
--   - Micro-SaaS Builder
--   - IA productive
--   - Creéer et Vendre ton produit digital en 24h
update public.formations
  set is_premium = true
  where id in (
    'b0b4e9b0-390c-4d6c-a438-d749b2cbbc49',
    '9d6f645d-5d2f-46a8-ae96-0d4c03e1bfea',
    '57e4f732-4307-482f-8394-08f0d680d544'
  );

-- Ressources :
--   - 81-prompts-marketing-claude
--   - Templates de Threads Facebook & X
--   - SYSTÈME VIRAL
--   - l'outils incroyable pour créer du contenu viral
update public.resources
  set is_premium = true
  where id in (
    '2606de03-e24a-4368-83b8-c62a7951efbc',
    '086a43e9-1b07-4c53-a890-9a75242bdba6',
    '44cf625d-f639-42a9-a1eb-015ae7f4d47d',
    'd3876d1a-3d03-453c-abc7-d56b88a6940c'
  );

-- ── 3. Helper is_trial_user ────────────────────────────────────────────
create or replace function public.is_trial_user(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce((
    select plan_id = 'trial'
    from public.subscriptions
    where user_id = uid
      and status in ('active', 'trialing')
      and (current_period_end is null or current_period_end > now())
    order by created_at desc
    limit 1
  ), false);
$$;

grant execute on function public.is_trial_user(uuid) to authenticated;

-- ── 4. RLS formation_chapters : bloquer les chapitres premium aux trial ─
-- On garde le pattern existant (initplan-optimisé, cf. 0048) et on ajoute
-- la clause "and (not f.is_premium or not is_trial_user(...))" sur le
-- exists vers formations.
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
      )
    )
  );

-- ── 5. RPC : renvoie aussi is_premium ──────────────────────────────────
-- Le front a besoin de connaître is_premium pour dessiner le cadenas
-- sur la carte sans refaire un round-trip. On garde tout le reste
-- identique à la version de 0037. DROP avant CREATE car on change le
-- type retour (postgres refuse un CREATE OR REPLACE qui modifie OUT).
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
    f.is_premium,
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
