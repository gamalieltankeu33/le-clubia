-- =====================================================================
-- Le Club IA — Migration 0007 : Storage communauté
-- - Bucket "post-images" : tout user authentifié peut uploader, lecture publique
-- - Bucket "avatars"     : un user ne peut écrire que dans son propre dossier
--                          (path = <user_id>/...), lecture publique
-- Idempotente.
-- =====================================================================

-- ---------- Bucket post-images ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'post-images',
  'post-images',
  true,
  3145728,  -- 3 Mo
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "post-images public read" on storage.objects;
create policy "post-images public read" on storage.objects
  for select using (bucket_id = 'post-images');

-- Tout user auth peut insérer (mais on stocke dans son dossier personnel)
drop policy if exists "post-images authenticated insert" on storage.objects;
create policy "post-images authenticated insert" on storage.objects
  for insert with check (
    bucket_id = 'post-images'
    and auth.uid() is not null
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Suppression : seulement son propre dossier (ou admin)
drop policy if exists "post-images own delete" on storage.objects;
create policy "post-images own delete" on storage.objects
  for delete using (
    bucket_id = 'post-images'
    and (
      auth.uid()::text = (storage.foldername(name))[1]
      or public.is_admin(auth.uid())
    )
  );

drop policy if exists "post-images own update" on storage.objects;
create policy "post-images own update" on storage.objects
  for update using (
    bucket_id = 'post-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  ) with check (
    bucket_id = 'post-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ---------- Bucket avatars ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152,  -- 2 Mo
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "avatars public read" on storage.objects;
create policy "avatars public read" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "avatars own folder insert" on storage.objects;
create policy "avatars own folder insert" on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and auth.uid() is not null
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "avatars own folder update" on storage.objects;
create policy "avatars own folder update" on storage.objects
  for update using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  ) with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "avatars own folder delete" on storage.objects;
create policy "avatars own folder delete" on storage.objects
  for delete using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
