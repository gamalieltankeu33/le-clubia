-- Migration 0032: Gamification and Onboarding tracking

-- 1. Ajout de la colonne points et guides_seen dans les profils
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS guides_seen TEXT[] DEFAULT '{}';

-- Index pour le leaderboard
CREATE INDEX IF NOT EXISTS idx_profiles_points ON public.profiles(points DESC);

-- 2. Fonction pour incrémenter les points de manière sécurisée
-- Elle met à jour le compteur dans profiles ET log dans member_points si la table existe
CREATE OR REPLACE FUNCTION public.increment_user_points(uid UUID, pts INTEGER, reason TEXT DEFAULT 'action', ref_id UUID DEFAULT NULL)
RETURNS VOID AS $$
BEGIN
  -- 1. Update counter in profiles
  UPDATE public.profiles
  SET points = points + pts
  WHERE id = uid;

  -- 2. Log in member_points if the table exists
  -- On utilise un bloc BEGIN/EXCEPTION au cas où la table n'existe pas encore (idempotence)
  BEGIN
    INSERT INTO public.member_points (user_id, points, reason, reference_id)
    VALUES (uid, pts, reason, ref_id);
  EXCEPTION WHEN undefined_table THEN
    -- Table non existante, on ignore
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Trigger : Points pour la complétion de chapitre (+10 pts)
CREATE OR REPLACE FUNCTION public.trg_fn_points_formation_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.completed = true AND (OLD.completed = false OR OLD.completed IS NULL) THEN
    PERFORM public.increment_user_points(NEW.user_id, 10, 'chapter_completed', NEW.chapter_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_points_formation_completion ON public.user_formation_progress;
CREATE TRIGGER trg_points_formation_completion
  AFTER UPDATE ON public.user_formation_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_fn_points_formation_completion();

-- 4. Trigger : Points pour un nouveau post (+5 pts)
CREATE OR REPLACE FUNCTION public.trg_fn_points_new_post()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.increment_user_points(NEW.author_id, 10, 'post_published', NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_points_new_post ON public.posts;
CREATE TRIGGER trg_points_new_post
  AFTER INSERT ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_fn_points_new_post();

-- 5. Trigger : Points pour recevoir un like (+2 pts à l'auteur du post)
CREATE OR REPLACE FUNCTION public.trg_fn_points_receive_like()
RETURNS TRIGGER AS $$
DECLARE
  post_author_id UUID;
BEGIN
  SELECT author_id INTO post_author_id FROM public.posts WHERE id = NEW.post_id;
  -- Points pour l'auteur (+2)
  IF post_author_id IS NOT NULL AND post_author_id <> NEW.user_id THEN
    PERFORM public.increment_user_points(post_author_id, 2, 'like_received', NEW.post_id);
  END IF;
  -- Points pour celui qui like (+1) pour encourager l'engagement
  PERFORM public.increment_user_points(NEW.user_id, 1, 'like_given', NEW.post_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_points_receive_like ON public.post_likes;
CREATE TRIGGER trg_points_receive_like
  AFTER INSERT ON public.post_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_fn_points_receive_like();

-- 6. Trigger : Points pour un nouveau commentaire (+5 pts)
CREATE OR REPLACE FUNCTION public.trg_fn_points_new_comment()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.increment_user_points(NEW.user_id, 5, 'comment_added', NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_points_new_comment ON public.post_comments;
CREATE TRIGGER trg_points_new_comment
  AFTER INSERT ON public.post_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_fn_points_new_comment();
