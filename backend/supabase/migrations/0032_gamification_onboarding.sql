-- Migration 0032: Gamification and Onboarding tracking

-- 1. Ajout de la colonne points et guides_seen dans les profils
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS guides_seen TEXT[] DEFAULT '{}';

-- Index pour le leaderboard
CREATE INDEX IF NOT EXISTS idx_profiles_points ON public.profiles(points DESC);

-- 2. Fonction pour incrémenter les points de manière sécurisée
CREATE OR REPLACE FUNCTION public.increment_user_points(uid UUID, pts INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles
  SET points = points + pts
  WHERE id = uid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Trigger : Points pour la complétion de chapitre (+10 pts)
CREATE OR REPLACE FUNCTION public.trg_fn_points_formation_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.completed = true AND (OLD.completed = false OR OLD.completed IS NULL) THEN
    PERFORM public.increment_user_points(NEW.user_id, 10);
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
  PERFORM public.increment_user_points(NEW.author_id, 5);
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
  IF post_author_id IS NOT NULL THEN
    PERFORM public.increment_user_points(post_author_id, 2);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_points_receive_like ON public.post_likes;
CREATE TRIGGER trg_points_receive_like
  AFTER INSERT ON public.post_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_fn_points_receive_like();
