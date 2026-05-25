-- =====================================================================
-- Le Club IA — Migration 0055 : Plan "Découverte" (essai payant 1 mois)
--
-- Objectif : nouvelle porte d'entrée à 30 € / 1 mois, pour réduire la
-- friction d'inscription. L'accès aux formations level='advanced' sera
-- verrouillé pour les abonnés trial (voir Phase 2 — non incluse dans
-- cette migration).
--
-- ⚠️ is_active = false au départ. Tant que le produit côté Maketou
-- n'est pas créé et que le secret MAKETOU_PRODUCT_ID_TRIAL n'est pas
-- posé, la carte ne doit pas s'afficher sur /abonnement. Bascule en
-- true via : update pricing_plans set is_active = true where id = 'trial';
--
-- Idempotente.
-- =====================================================================

insert into public.pricing_plans (
  id, display_name, price_xof, duration_months, is_active, is_recommended
)
values (
  'trial', 'Plan Découverte', 30, 1, false, false
)
on conflict (id) do nothing;
