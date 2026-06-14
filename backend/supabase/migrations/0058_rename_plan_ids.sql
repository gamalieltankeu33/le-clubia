-- Renommage des IDs de plans pour refléter les durées réelles :
--   'semestrial' (3 mois) → 'trimestrial'  (trimestriel)
--   'annual'     (6 mois) → 'semestrial'   (semestriel)
--
-- Approche : insert du nouvel ID → migration des FK → suppression de l'ancien ID.
-- Évite tout problème de contrainte en maintenant la cohérence à chaque étape.

BEGIN;

-- ── Étape 1 : semestrial (3 mois) → trimestrial ──────────────────────────
INSERT INTO pricing_plans (id, display_name, price_xof, duration_months, is_active, is_recommended, description)
SELECT 'trimestrial', display_name, price_xof, duration_months, is_active, is_recommended, description
FROM pricing_plans WHERE id = 'semestrial';

UPDATE subscriptions  SET plan_id          = 'trimestrial' WHERE plan_id          = 'semestrial';
UPDATE profiles       SET desired_plan_id  = 'trimestrial' WHERE desired_plan_id  = 'semestrial';

DELETE FROM pricing_plans WHERE id = 'semestrial';

-- ── Étape 2 : annual (6 mois) → semestrial ───────────────────────────────
INSERT INTO pricing_plans (id, display_name, price_xof, duration_months, is_active, is_recommended, description)
SELECT 'semestrial', display_name, price_xof, duration_months, is_active, is_recommended, description
FROM pricing_plans WHERE id = 'annual';

UPDATE subscriptions  SET plan_id          = 'semestrial' WHERE plan_id          = 'annual';
UPDATE profiles       SET desired_plan_id  = 'semestrial' WHERE desired_plan_id  = 'annual';

DELETE FROM pricing_plans WHERE id = 'annual';

COMMIT;
