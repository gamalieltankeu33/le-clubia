-- =============================================================================
-- Migration 0073: Séquence de Relances Email Automatiques Blueprint IA VIP
-- =============================================================================

-- Ajouter les colonnes de suivi des relances sur accompagnement_candidatures
ALTER TABLE public.accompagnement_candidatures
ADD COLUMN IF NOT EXISTS nurture_stage INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS joined_vip_group BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS last_nurture_at TIMESTAMPTZ;

-- Index pour requêtes rapides du cron de relance
CREATE INDEX IF NOT EXISTS idx_candidatures_nurture ON public.accompagnement_candidatures(nurture_stage, joined_vip_group, created_at);
