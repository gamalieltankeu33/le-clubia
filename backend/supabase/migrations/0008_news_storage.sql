-- =====================================================================
-- Le Club IA — Migration 0008 : Storage des actualités
-- Bucket "news-covers" (public, 5 Mo, image only) — uploads admin uniquement.
-- Idempotente.
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'news-covers',
  'news-covers',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "news-covers public read" on storage.objects;
create policy "news-covers public read" on storage.objects
  for select using (bucket_id = 'news-covers');

drop policy if exists "news-covers admin insert" on storage.objects;
create policy "news-covers admin insert" on storage.objects
  for insert with check (
    bucket_id = 'news-covers' and public.is_admin(auth.uid())
  );

drop policy if exists "news-covers admin update" on storage.objects;
create policy "news-covers admin update" on storage.objects
  for update using (
    bucket_id = 'news-covers' and public.is_admin(auth.uid())
  ) with check (
    bucket_id = 'news-covers' and public.is_admin(auth.uid())
  );

drop policy if exists "news-covers admin delete" on storage.objects;
create policy "news-covers admin delete" on storage.objects
  for delete using (
    bucket_id = 'news-covers' and public.is_admin(auth.uid())
  );

-- Index pour le check de déduplication source_url côté agent IA
create index if not exists idx_news_articles_source_url
  on public.news_articles(source_url)
  where source_url is not null;
