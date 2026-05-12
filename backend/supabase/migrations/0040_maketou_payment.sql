-- =====================================================================
-- Le Club IA — Migration 0040 : Intégration Maketou
--
-- Contexte :
--   Maketou est la passerelle de paiement Mobile Money (Orange Money,
--   Wave, MTN Money, Moov Money) choisie pour les abonnements.
--   Doc API : https://api.maketou.net  (Bearer token par boutique).
--
--   Maketou ne fournit PAS de webhook. La vérification se fait à la
--   main au retour `redirectURL` : on appelle GET /cart/{id} et on
--   vérifie le `status` ('completed' = paiement OK).
--
--   On stocke donc le `cart_id` Maketou sur la subscription pour
--   pouvoir :
--     - le vérifier ensuite via l'edge function `maketou-verify`,
--     - tracer les paniers abandonnés/échoués côté admin.
--
-- Idempotente.
-- =====================================================================

alter table public.subscriptions
  add column if not exists maketou_cart_id text;

create index if not exists idx_subscriptions_maketou_cart_id
  on public.subscriptions(maketou_cart_id);
