-- =====================================================================
-- Le Club IA — Migration 0056 : Suivi de la séquence emails pour les
-- abonnements Plan Découverte (trial)
--
-- 5 emails sur le mois d'essai :
--   stage 1 : J0  — Welcome (envoyé à l'activation par admin-activate-trial)
--   stage 2 : J+7 — Engagement check-in
--   stage 3 : J+21 (J-9) — Upgrade nudge
--   stage 4 : J+27 (J-3) — Final reminder
--   stage 5 : J+30 — Expiration / réactive
--
-- Suivi via subscriptions.trial_nurture_stage (0 = aucun envoyé,
-- 5 = séquence terminée). Sur les abos non-trial → reste à 0,
-- ignoré par le cron.
--
-- Idempotente.
-- =====================================================================

alter table public.subscriptions
  add column if not exists trial_nurture_stage smallint not null default 0,
  add column if not exists trial_nurture_last_sent_at timestamptz;

-- Index partiel : le cron ne scanne que les trials en cours de séquence.
create index if not exists idx_subscriptions_trial_nurture_pending
  on public.subscriptions (current_period_start)
  where plan_id = 'trial' and trial_nurture_stage < 5;
