-- =====================================================================
-- Le Club IA — Migration 0042 : restreindre le listing des buckets publics
--
-- Contexte (Supabase advisor `public_bucket_allows_listing`) :
--   6 buckets en `public=true` ont un policy SELECT ouvert au rôle
--   `public` (= anon + authenticated). Conséquence : n'importe qui
--   peut ENUMERER les fichiers via /storage/v1/object/list/<bucket>.
--   Un concurrent pourrait aspirer tout le contenu publié.
--
-- Correctif :
--   On garde `public=true` sur les buckets (les URLs servies via
--   /storage/v1/object/public/... restent accessibles sans auth,
--   bypassant RLS — c'est nécessaire pour afficher les images sur
--   la landing et les emails). On restreint juste le SELECT (LIST)
--   au rôle `authenticated`, ce qui supprime l'énumération anonyme
--   sans rien casser dans le code frontend (aucun appel `.list()`).
--
-- Idempotente : DROP IF EXISTS + CREATE.
-- =====================================================================

drop policy if exists "avatars public read"           on storage.objects;
drop policy if exists "event-covers public read"      on storage.objects;
drop policy if exists "formation-covers public read"  on storage.objects;
drop policy if exists "news-covers public read"       on storage.objects;
drop policy if exists "post-images public read"       on storage.objects;
drop policy if exists "resource-thumbnails public read" on storage.objects;

create policy "avatars members read"
  on storage.objects for select to authenticated
  using (bucket_id = 'avatars');

create policy "event-covers members read"
  on storage.objects for select to authenticated
  using (bucket_id = 'event-covers');

create policy "formation-covers members read"
  on storage.objects for select to authenticated
  using (bucket_id = 'formation-covers');

create policy "news-covers members read"
  on storage.objects for select to authenticated
  using (bucket_id = 'news-covers');

create policy "post-images members read"
  on storage.objects for select to authenticated
  using (bucket_id = 'post-images');

create policy "resource-thumbnails members read"
  on storage.objects for select to authenticated
  using (bucket_id = 'resource-thumbnails');
