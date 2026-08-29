-- =====================================================================
-- Le Club IA — Migration 0078 : Champs WhatsApp et Pays (Onboarding)
--
-- Objectif : Ajouter les colonnes pour recueillir le numéro WhatsApp
-- et le pays de l'utilisateur lors de son inscription/onboarding.
-- =====================================================================

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS whatsapp_number text,
ADD COLUMN IF NOT EXISTS country text;
