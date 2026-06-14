-- =====================================================================
-- Le Club IA — Migration 0041 : Rappels d'expiration d'abonnement
--
-- Contexte :
--   Les abonnements Maketou ne se reconduisent pas automatiquement
--   (mobile money one-shot). Sans rappel, on perd ~30-40% des
--   renouvellements par simple oubli.
--
--   On envoie deux relances :
--     - J-7 : "Ton abonnement expire dans 7 jours."
--     - J-1 : "Demain, tu perds l'accès au Club."
--
--   Idempotence : 2 colonnes `reminder_*_sent_at` empêchent d'envoyer
--   plusieurs fois la même relance si la cron tourne plusieurs fois.
--
-- Idempotente.
-- =====================================================================

alter table public.subscriptions
  add column if not exists reminder_j7_sent_at timestamptz,
  add column if not exists reminder_j1_sent_at timestamptz;

create index if not exists idx_subscriptions_period_end_active
  on public.subscriptions(current_period_end)
  where status in ('active', 'trialing');
