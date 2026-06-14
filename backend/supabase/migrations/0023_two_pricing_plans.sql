-- =====================================================================
-- Le Club IA — Migration 0023 : Pricing à 2 plans (semestriel + annuel)
--
-- Contexte :
--   Le Club IA passe d'un plan unique à 79 000 FCFA / an à 2 plans :
--     - 'semestrial'    : 69 000 FCFA / 6 mois  (~11 500 FCFA / mois)
--     - 'annual'        : 99 000 FCFA / 12 mois (~8 250 FCFA / mois) ⭐
--     - 'legacy_annual' : 79 000 FCFA / 12 mois — historique conservé
--                         pour les early adopters
--
-- Approche choisie :
--   On NE TOUCHE PAS à l'enum subscription_plan (rétrocompat —
--   ALTER TYPE + UPDATE ne se commitent pas dans la même transaction).
--   À la place on ajoute :
--     - Une table `pricing_plans` qui contient les 3 plans + leur prix.
--     - Une colonne `subscriptions.plan_id text` qui pointe vers
--       pricing_plans.id (la source de vérité pour la facturation).
--     - Une colonne `profiles.desired_plan_id text` qui mémorise le
--       choix fait au signup (pour que l'admin puisse pré-sélectionner
--       le plan à l'activation manuelle).
--   L'enum `plan` historique reste en place, ignoré par la nouvelle
--   logique de pricing.
--
--   Backfill automatique : tous les abonnés actuels (créés avant
--   2026-05-07, date de bascule) sont marqués 'legacy_annual' pour
--   conserver leur tarif 79 000 FCFA.
--
-- Idempotente.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Table pricing_plans
-- ---------------------------------------------------------------------
create table if not exists public.pricing_plans (
  id              text primary key,
  display_name    text not null,
  price_xof       integer not null check (price_xof > 0),
  duration_months integer not null check (duration_months > 0),
  is_active       boolean not null default true,
  is_recommended  boolean not null default false,
  description     text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

drop trigger if exists trg_pricing_plans_updated_at on public.pricing_plans;
create trigger trg_pricing_plans_updated_at
  before update on public.pricing_plans
  for each row execute function public.set_updated_at();

-- Seed/Upsert des 3 plans. UPSERT pour idempotence : ré-appliquer la
-- migration ne dupliquera pas et synchronisera les prix si on les
-- ajuste plus tard côté SQL.
insert into public.pricing_plans
  (id, display_name, price_xof, duration_months, is_active, is_recommended, description)
values
  ('semestrial',    'Plan Progress',         69000,  6, true,  false, 'Idéal pour lancer ta transformation IA sur 6 mois'),
  ('annual',        'Plan Master',           99000, 12, true,  true,  'La maîtrise totale. Économise 39 000 FCFA par an.'),
  ('legacy_annual', 'Annuel (ancien tarif)', 79000, 12, false, false, 'Plan historique pour les early adopters')
on conflict (id) do update set
  display_name    = excluded.display_name,
  price_xof       = excluded.price_xof,
  duration_months = excluded.duration_months,
  is_active       = excluded.is_active,
  is_recommended  = excluded.is_recommended,
  description     = excluded.description;

-- RLS : tout le monde peut lire les plans actifs, seuls les admins
-- peuvent écrire (= ajuster les tarifs depuis Supabase Studio).
alter table public.pricing_plans enable row level security;

drop policy if exists "pricing_plans read public"  on public.pricing_plans;
drop policy if exists "pricing_plans manage admin" on public.pricing_plans;

-- Lecture publique des plans actifs (pour la landing non-authentifiée).
-- Les inactifs (= legacy_annual) ne fuient pas — seul l'admin les voit.
create policy "pricing_plans read public"
  on public.pricing_plans
  for select
  to anon, authenticated
  using (is_active = true or public.is_admin(auth.uid()));

create policy "pricing_plans manage admin"
  on public.pricing_plans
  for all
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

grant select on public.pricing_plans to anon, authenticated;

-- ---------------------------------------------------------------------
-- 2. Colonne subscriptions.plan_id — référence vers pricing_plans
-- ---------------------------------------------------------------------
alter table public.subscriptions
  add column if not exists plan_id text
  references public.pricing_plans(id) on delete set null;

create index if not exists idx_subscriptions_plan_id
  on public.subscriptions(plan_id);

-- Backfill legacy : toutes les subs créées avant la date de bascule
-- gardent leur tarif 79 000 FCFA via le plan 'legacy_annual'. Ne touche
-- pas aux subs déjà migrées (idempotent).
update public.subscriptions
set plan_id = 'legacy_annual'
where plan_id is null
  and created_at < timestamptz '2026-05-07 00:00:00+00';

-- Pour les éventuelles subs créées exactement au moment de la bascule
-- mais sans choix explicite : par défaut on les bascule sur 'annual'
-- (le plan recommandé). L'admin pourra ajuster manuellement.
update public.subscriptions
set plan_id = 'annual'
where plan_id is null;

-- ---------------------------------------------------------------------
-- 3. Colonne profiles.desired_plan_id — choix au signup
-- ---------------------------------------------------------------------
alter table public.profiles
  add column if not exists desired_plan_id text
  references public.pricing_plans(id) on delete set null;

-- ---------------------------------------------------------------------
-- 4. RPC publique : get_active_pricing_plans()
--    Utilisée par la landing pour afficher les 2 cartes.
--    Retourne aussi le monthly_price calculé pour l'affichage
--    "X FCFA / mois" sous chaque carte.
-- ---------------------------------------------------------------------
create or replace function public.get_active_pricing_plans()
returns table (
  id                 text,
  display_name       text,
  price_xof          integer,
  duration_months    integer,
  is_recommended     boolean,
  description        text,
  monthly_price_xof  integer
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    id,
    display_name,
    price_xof,
    duration_months,
    is_recommended,
    description,
    (price_xof / duration_months)::integer as monthly_price_xof
  from public.pricing_plans
  where is_active = true
  -- annuel en premier (12 > 6) pour mettre en avant la formule recommandée.
  order by duration_months desc;
$$;

revoke all on function public.get_active_pricing_plans() from public;
grant execute on function public.get_active_pricing_plans() to anon, authenticated;

-- ---------------------------------------------------------------------
-- 5. RPC interne : compute_active_mrr_xof()
--    Source de vérité pour le calcul du MRR (Monthly Recurring Revenue)
--    en FCFA, à partir des abonnements active+trialing et de leur plan.
--    Utilisée par la edge function admin-stats.
-- ---------------------------------------------------------------------
create or replace function public.compute_active_mrr_xof()
returns table (
  total_mrr_xof    bigint,
  active_count     bigint,
  semestrial_count bigint,
  annual_count     bigint,
  legacy_count     bigint
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
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
    -- MRR = somme(prix / durée). Si plan_id est null ou inconnu (cas
    -- exceptionnel), on tombe à 0 plutôt que d'inventer un montant.
    coalesce(sum(coalesce(price_xof, 0) / nullif(duration_months, 0)), 0)::bigint as total_mrr_xof,
    count(*)::bigint                                                              as active_count,
    count(*) filter (where plan_id = 'semestrial')::bigint                        as semestrial_count,
    count(*) filter (where plan_id = 'annual')::bigint                            as annual_count,
    count(*) filter (where plan_id = 'legacy_annual')::bigint                     as legacy_count
  from joined;
$$;

revoke all on function public.compute_active_mrr_xof() from public;
grant execute on function public.compute_active_mrr_xof() to authenticated;
