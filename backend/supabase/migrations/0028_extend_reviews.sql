-- =====================================================================
-- Le Club IA — Migration 0028 : Extension des avis aux chapitres
-- =====================================================================

-- On ajoute chapter_id à la table existante
alter table public.formation_reviews 
  add column if not exists chapter_id uuid references public.chapters(id) on delete cascade;

-- On supprime l'ancienne contrainte unique (user, formation) car elle
-- empêchait d'avoir plusieurs avis (un par chapitre + un global)
alter table public.formation_reviews 
  drop constraint if exists formation_reviews_user_id_formation_id_key;

-- Nouvelle contrainte : un utilisateur ne peut donner qu'un avis par chapitre 
-- OU un avis global (si chapter_id est null) par formation.
create unique index if not exists idx_unique_review_per_target 
  on public.formation_reviews (user_id, formation_id, (coalesce(chapter_id, '00000000-0000-0000-0000-000000000000'::uuid)));

-- Index pour les perfs
create index if not exists idx_formation_reviews_chapter on public.formation_reviews(chapter_id);
