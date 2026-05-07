-- =====================================================================
-- Le Club IA — Migration 0005 : Storage des ressources
-- - Bucket "resource-files" (PRIVÉ, fichiers téléchargeables via URL signée)
-- - Bucket "resource-thumbnails" (public, miniatures de cards)
-- - Adaptation table resources : ajout `content` (pour les prompts) et
--   suppression de la check qui obligeait une URL.
-- Idempotente. Dépend de 0001_init.sql.
-- =====================================================================

-- ---------- 1. Adaptation table resources ----------

-- Drop la check qui exige au moins une URL : un type "prompt" stocke juste du texte.
do $$
declare cn text;
begin
  for cn in
    select conname from pg_constraint
    where conrelid = 'public.resources'::regclass
      and contype = 'c'
  loop
    execute format('alter table public.resources drop constraint %I', cn);
  end loop;
end $$;

-- Colonne `content` pour stocker le contenu d'un prompt
alter table public.resources
  add column if not exists content text;

-- ---------- 2. Bucket "resource-files" (privé) ----------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'resource-files',
  'resource-files',
  false,
  26214400,  -- 25 Mo
  array[
    'application/pdf',
    'application/zip',
    'application/x-zip-compressed',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
    'application/json'
  ]
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Lecture : tout utilisateur authentifié peut générer une URL signée.
-- (Quand Stripe sera branché, on pourra resserrer en exigeant is_active_member.)
drop policy if exists "resource-files authenticated read" on storage.objects;
create policy "resource-files authenticated read" on storage.objects
  for select using (
    bucket_id = 'resource-files' and auth.uid() is not null
  );

-- Upload / update / delete : admin uniquement
drop policy if exists "resource-files admin insert" on storage.objects;
create policy "resource-files admin insert" on storage.objects
  for insert with check (
    bucket_id = 'resource-files' and public.is_admin(auth.uid())
  );

drop policy if exists "resource-files admin update" on storage.objects;
create policy "resource-files admin update" on storage.objects
  for update using (
    bucket_id = 'resource-files' and public.is_admin(auth.uid())
  ) with check (
    bucket_id = 'resource-files' and public.is_admin(auth.uid())
  );

drop policy if exists "resource-files admin delete" on storage.objects;
create policy "resource-files admin delete" on storage.objects
  for delete using (
    bucket_id = 'resource-files' and public.is_admin(auth.uid())
  );

-- ---------- 3. Bucket "resource-thumbnails" (public) ----------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'resource-thumbnails',
  'resource-thumbnails',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "resource-thumbnails public read" on storage.objects;
create policy "resource-thumbnails public read" on storage.objects
  for select using (bucket_id = 'resource-thumbnails');

drop policy if exists "resource-thumbnails admin insert" on storage.objects;
create policy "resource-thumbnails admin insert" on storage.objects
  for insert with check (
    bucket_id = 'resource-thumbnails' and public.is_admin(auth.uid())
  );

drop policy if exists "resource-thumbnails admin update" on storage.objects;
create policy "resource-thumbnails admin update" on storage.objects
  for update using (
    bucket_id = 'resource-thumbnails' and public.is_admin(auth.uid())
  ) with check (
    bucket_id = 'resource-thumbnails' and public.is_admin(auth.uid())
  );

drop policy if exists "resource-thumbnails admin delete" on storage.objects;
create policy "resource-thumbnails admin delete" on storage.objects
  for delete using (
    bucket_id = 'resource-thumbnails' and public.is_admin(auth.uid())
  );
