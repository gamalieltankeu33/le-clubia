-- Migration 0059 : ajout du Plan Premium annuel à 230 €
-- ID = 'annual', 12 mois, ~19 €/mois, non recommandé par défaut

INSERT INTO pricing_plans (id, display_name, price_xof, duration_months, is_recommended, is_active, description, monthly_price_xof)
VALUES (
  'annual',
  'Plan Premium',
  230,
  12,
  false,
  true,
  'Le meilleur tarif. Maîtrise totale sur 12 mois.',
  19
)
ON CONFLICT (id) DO UPDATE SET
  display_name       = EXCLUDED.display_name,
  price_xof          = EXCLUDED.price_xof,
  duration_months    = EXCLUDED.duration_months,
  is_recommended     = EXCLUDED.is_recommended,
  is_active          = EXCLUDED.is_active,
  description        = EXCLUDED.description,
  monthly_price_xof  = EXCLUDED.monthly_price_xof;
