-- =====================================================================
-- Le Club IA — Migration 0062 : Intégration Chariow
--
-- Contexte :
--   Chariow est la nouvelle passerelle de paiement.
--   On stocke le `chariow_transaction_id` sur la subscription pour
--   pouvoir vérifier les transactions lors du retour et via webhooks.
--
-- Idempotente.
-- =====================================================================

alter table public.subscriptions
  add column if not exists chariow_transaction_id text;

create index if not exists idx_subscriptions_chariow_transaction_id
  on public.subscriptions(chariow_transaction_id);
