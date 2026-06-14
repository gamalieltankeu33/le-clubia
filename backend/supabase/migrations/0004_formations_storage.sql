-- =====================================================================
-- Le Club IA — Migration 0004 : Storage bucket pour les couvertures
--                                 de formations.
-- Idempotente. Dépend de 0001_init.sql (helper public.is_admin).
-- =====================================================================

-- Bucket public, max 5 Mo par fichier, formats image courants.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'formation-covers',
  'formation-covers',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- =====================================================================
-- RLS sur storage.objects pour ce bucket
-- =====================================================================

-- Lecture publique (anonymes inclus, pour rendre les images sur la landing si besoin)
drop policy if exists "formation-covers public read" on storage.objects;
create policy "formation-covers public read" on storage.objects
  for select using (bucket_id = 'formation-covers');

-- Upload : admin uniquement
drop policy if exists "formation-covers admin insert" on storage.objects;
create policy "formation-covers admin insert" on storage.objects
  for insert with check (
    bucket_id = 'formation-covers' and public.is_admin(auth.uid())
  );

drop policy if exists "formation-covers admin update" on storage.objects;
create policy "formation-covers admin update" on storage.objects
  for update using (
    bucket_id = 'formation-covers' and public.is_admin(auth.uid())
  ) with check (
    bucket_id = 'formation-covers' and public.is_admin(auth.uid())
  );

drop policy if exists "formation-covers admin delete" on storage.objects;
create policy "formation-covers admin delete" on storage.objects
  for delete using (
    bucket_id = 'formation-covers' and public.is_admin(auth.uid())
  );
