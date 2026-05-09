-- =====================================================================
-- Le Club IA — Migration 0035 : support PDF pour les ressources
--
-- Objectif :
--   Permettre l'upload d'un PDF (avec metadata nom + taille) pour les
--   ressources de type prompt / template / guide_pdf. Les outils
--   (tool_link) restent inchangés (URL externe). Les anciennes
--   ressources avec `content` texte continuent de fonctionner
--   (fallback membre).
--
-- Périmètre :
--   1. Colonnes file_url, file_size_kb, file_name sur public.resources
--   2. Resserrement de la policy SELECT du bucket resource-files :
--      lecture restreinte aux membres actifs + admins (avant : tout
--      utilisateur authentifié). Le bucket reste celui de 0005 — on
--      n'en crée pas un nouveau pour ne pas orphaner les fichiers
--      déjà uploadés.
--   3. Le bucket accepte désormais explicitement application/pdf
--      (déjà whitelisté en 0005, on ne change rien sur cet aspect).
--
-- Idempotente. Dépend de 0001_init + 0005_resources_storage.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Nouvelles colonnes sur public.resources
-- ---------------------------------------------------------------------
alter table public.resources
  add column if not exists file_url      text,
  add column if not exists file_size_kb  integer,
  add column if not exists file_name     text;

-- `content` doit rester nullable (déjà le cas depuis 0005, on le
-- réaffirme au cas où une migration parallèle l'aurait rendu NOT NULL).
alter table public.resources
  alter column content drop not null;

-- ---------------------------------------------------------------------
-- 2. Tightening de la policy SELECT du bucket resource-files
--    Avant : tout utilisateur authentifié pouvait générer une URL signée.
--    Après : seuls les membres actifs (via subscriptions) ou admins.
-- ---------------------------------------------------------------------
drop policy if exists "resource-files authenticated read" on storage.objects;
drop policy if exists "resource-files members read" on storage.objects;

create policy "resource-files members read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'resource-files'
    and (public.is_active_member(auth.uid()) or public.is_admin(auth.uid()))
  );

-- Les policies INSERT / UPDATE / DELETE (admin uniquement) restent
-- celles de 0005 — pas de modification nécessaire.

-- ---------------------------------------------------------------------
-- 3. Forcer le rechargement du cache PostgREST pour exposer les
--    nouvelles colonnes via l'API REST.
-- ---------------------------------------------------------------------
comment on column public.resources.file_url     is 'Path relatif dans le bucket resource-files (PDF privé).';
comment on column public.resources.file_size_kb is 'Taille en kilobytes du PDF associé, pour affichage UI.';
comment on column public.resources.file_name    is 'Nom de fichier d''origine, pour préserver l''UX au téléchargement.';
