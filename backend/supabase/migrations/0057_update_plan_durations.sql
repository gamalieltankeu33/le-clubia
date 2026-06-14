-- Mise à jour des durées des plans d'abonnement
-- Plan Master   : 12 mois → 6 mois  (tarif inchangé : 150 €)
-- Plan Progress : 6 mois  → 3 mois  (tarif inchangé : 100 €)

UPDATE pricing_plans
SET
  duration_months = 6,
  description     = 'La maîtrise totale. Économise 50 € tous les 6 mois.'
WHERE id = 'annual';

UPDATE pricing_plans
SET
  duration_months = 3,
  description     = 'Idéal pour lancer ta transformation IA sur 3 mois'
WHERE id = 'semestrial';
