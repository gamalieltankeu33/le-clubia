-- =====================================================================
-- Le Club IA — Migration 0060 : Table des candidatures d'accompagnement
-- =====================================================================

CREATE TABLE public.accompagnement_candidatures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  email TEXT NOT NULL,
  telephone TEXT NOT NULL,
  pays TEXT NOT NULL,
  projet_type TEXT NOT NULL,
  projet_ia TEXT NOT NULL,
  projet_raison TEXT NOT NULL,
  projet_blocage TEXT NOT NULL,
  deja_essaie BOOLEAN NOT NULL,
  deja_essaie_details TEXT,
  statut_actuel TEXT NOT NULL,
  heures_semaine TEXT NOT NULL,
  objectif_12m TEXT NOT NULL,
  pret_investir TEXT NOT NULL,
  budget TEXT NOT NULL,
  candidat_raison TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Activation de RLS (Row Level Security)
ALTER TABLE public.accompagnement_candidatures ENABLE ROW LEVEL SECURITY;

-- Autorise l'insertion pour tout le monde (public / anonyme et authentifié)
CREATE POLICY "Anyone can insert applications"
  ON public.accompagnement_candidatures
  FOR INSERTreg
  WITH CHECK (true);

-- Autorise la consultation uniquement pour les administrateurs
CREATE POLICY "Admins can select applications"
  ON public.accompagnement_candidatures
  FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));
