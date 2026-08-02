-- =====================================================================
-- Le Club IA — Migration 0071 : Ajout des champs de diagnostic à la table des candidatures
-- =====================================================================

ALTER TABLE public.accompagnement_candidatures
  ADD COLUMN IF NOT EXISTS score INTEGER,
  ADD COLUMN IF NOT EXISTS qualified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_western BOOLEAN DEFAULT false;
