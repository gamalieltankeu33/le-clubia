-- =====================================================================
-- Le Club IA — Migration 0030 : Posts épinglés (Pin)
-- =====================================================================

-- 1. Ajout de la colonne is_pinned à la table posts
alter table public.posts 
  add column if not exists is_pinned boolean default false not null;

-- 2. Index pour optimiser le tri (pinned d'abord, puis date décroissante)
create index if not exists idx_posts_pinned_created 
  on public.posts (is_pinned desc, created_at desc);

-- 3. Politique RLS : seul un admin peut modifier is_pinned
-- (On assume que les politiques existantes permettent déjà la suppression par l'admin)
-- Si besoin de préciser l'update :
-- drop policy if exists "Admins can update pinning" on public.posts;
-- create policy "Admins can update pinning" on public.posts
--   for update to authenticated
--   using (public.is_admin(auth.uid()))
--   with check (public.is_admin(auth.uid()));
