-- =====================================================================
-- Le Club IA — Migration 0061 : Statut et Notes sur les Candidatures
-- =====================================================================

ALTER TABLE public.accompagnement_candidatures
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'Nouveau',
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Mettre à jour la politique de modification pour les administrateurs
CREATE POLICY "Admins can update applications"
  ON public.accompagnement_candidatures
  FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));
