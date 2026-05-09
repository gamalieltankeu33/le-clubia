-- Migration 0033: Fix schema errors (author_id mismatch, broken FK, missing reviews)
-- Cette migration corrige plusieurs régressions :
--   * 0032 référençait posts.author_id (n'existe pas, la colonne est user_id)
--     → toute INSERT sur post_likes ou posts était rollback par les triggers,
--       d'où les likes "qui ne s'enregistrent pas" et les posts impossibles à publier.
--   * 0028 référençait public.chapters(id) au lieu de public.formation_chapters(id)
--     → la migration pouvait échouer et laisser formation_reviews sans chapter_id.
--   * Contrainte unique sur (user_id, formation_id, chapter_id) ne marchait pas
--     pour les avis globaux (chapter_id NULL) car NULL ≠ NULL en Postgres standard.

-- 1. Correction du trigger trg_fn_points_new_post (posts.user_id, pas author_id)
CREATE OR REPLACE FUNCTION public.trg_fn_points_new_post()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.increment_user_points(NEW.user_id, 10, 'post_published', NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Correction du trigger trg_fn_points_receive_like (posts.user_id, pas author_id)
CREATE OR REPLACE FUNCTION public.trg_fn_points_receive_like()
RETURNS TRIGGER AS $$
DECLARE
  post_author_id UUID;
BEGIN
  SELECT user_id INTO post_author_id FROM public.posts WHERE id = NEW.post_id;

  -- Points pour l'auteur (+2)
  IF post_author_id IS NOT NULL AND post_author_id <> NEW.user_id THEN
    PERFORM public.increment_user_points(post_author_id, 2, 'like_received', NEW.post_id);
  END IF;

  -- Points pour celui qui like (+1)
  PERFORM public.increment_user_points(NEW.user_id, 1, 'like_given', NEW.post_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. S'assurer que la table formation_reviews existe (cas où 0027 n'a pas tourné)
CREATE TABLE IF NOT EXISTS public.formation_reviews (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  formation_id  uuid not null references public.formations(id) on delete cascade,
  rating        integer not null check (rating >= 1 and rating <= 5),
  comment       text,
  created_at    timestamptz default now() not null
);

-- 4. Ajouter chapter_id si la 0028 a échoué (FK pointait vers public.chapters qui n'existe pas)
ALTER TABLE public.formation_reviews
  ADD COLUMN IF NOT EXISTS chapter_id uuid;

-- S'assurer que la FK pointe vers la bonne table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'formation_reviews_chapter_id_fkey'
  ) THEN
    ALTER TABLE public.formation_reviews
      ADD CONSTRAINT formation_reviews_chapter_id_fkey
      FOREIGN KEY (chapter_id) REFERENCES public.formation_chapters(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 5. Index unique correct (gère NULL avec COALESCE pour autoriser un avis "global"
--    + un avis par chapitre, sans permettre de doublons)
DROP INDEX IF EXISTS public.idx_unique_review_per_target;
ALTER TABLE public.formation_reviews
  DROP CONSTRAINT IF EXISTS formation_reviews_user_id_formation_id_key;
ALTER TABLE public.formation_reviews
  DROP CONSTRAINT IF EXISTS formation_reviews_user_id_formation_id_chapter_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_review_per_target
  ON public.formation_reviews (
    user_id,
    formation_id,
    (COALESCE(chapter_id, '00000000-0000-0000-0000-000000000000'::uuid))
  );

CREATE INDEX IF NOT EXISTS idx_formation_reviews_formation
  ON public.formation_reviews(formation_id);
CREATE INDEX IF NOT EXISTS idx_formation_reviews_user
  ON public.formation_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_formation_reviews_chapter
  ON public.formation_reviews(chapter_id);

-- 6. RLS pour formation_reviews
ALTER TABLE public.formation_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reviews select members" ON public.formation_reviews;
CREATE POLICY "reviews select members" ON public.formation_reviews
  FOR SELECT USING (public.is_active_member(auth.uid()) or public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "reviews insert self" ON public.formation_reviews;
CREATE POLICY "reviews insert self" ON public.formation_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id AND public.is_active_member(auth.uid()));

DROP POLICY IF EXISTS "reviews update self" ON public.formation_reviews;
CREATE POLICY "reviews update self" ON public.formation_reviews
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 7. Contrainte unique sur la progression utilisateur × chapitre (utilisée par les upsert)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_formation_progress_user_id_chapter_id_key') THEN
    ALTER TABLE public.user_formation_progress
      ADD CONSTRAINT user_formation_progress_user_id_chapter_id_key UNIQUE (user_id, chapter_id);
  END IF;
END $$;

-- 8. Nettoyage des anciens triggers redondants (Migration 0016)
-- On ne garde que ceux de 0032 qui logguent ET incrémentent profiles.points.
DROP TRIGGER IF EXISTS trg_points_post_published ON public.posts;
DROP TRIGGER IF EXISTS trg_points_comment_added ON public.post_comments;
DROP TRIGGER IF EXISTS trg_points_like_received ON public.post_likes;
DROP TRIGGER IF EXISTS trg_points_chapter_completed ON public.user_formation_progress;
