-- =====================================================================
-- Le Club IA — Migration 0031 : Autoriser les admins à modifier les posts
-- (Nécessaire pour l'épinglage et la modération)
-- =====================================================================

-- 1. On autorise l'admin à modifier n'importe quel post
drop policy if exists "Admins can update any post" on public.posts;
create policy "Admins can update any post" on public.posts
  for update to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- Note : La politique "posts update self" existe déjà et permet aux membres
-- de modifier leurs propres posts. Cette nouvelle politique s'y ajoute.
