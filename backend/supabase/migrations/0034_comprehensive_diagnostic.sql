-- Migration 0034: Comprehensive Diagnostic and Final Hardening
-- Objectif : S'assurer que TOUTES les tables existent, que les colonnes sont correctes,
-- et que les triggers ne font pas crasher les opérations de base.

-- 0. Types (si manquants)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_plan') THEN
    CREATE TYPE public.subscription_plan AS ENUM ('member', 'free_trial');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status') THEN
    CREATE TYPE public.subscription_status AS ENUM ('active', 'canceled', 'past_due', 'trialing', 'incomplete', 'unpaid');
  END IF;
END $$;

-- 1. Table profiles (S'assurer que les colonnes de gamification sont là)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS guides_seen TEXT[] DEFAULT '{}';

-- 2. Table subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid not null references public.profiles(id) on delete cascade,
  stripe_customer_id      text,
  stripe_subscription_id  text unique,
  plan                    public.subscription_plan default 'member' not null,
  status                  public.subscription_status not null,
  current_period_start    timestamptz,
  current_period_end      timestamptz,
  created_at              timestamptz default now() not null,
  updated_at              timestamptz default now() not null
);

-- 3. Table news_articles
CREATE TABLE IF NOT EXISTS public.news_articles (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique,
  title            text not null,
  content          text not null,
  cover_image_url  text,
  category         text not null default 'Actualité',
  source_url       text,
  author           text,
  is_published     boolean not null default false,
  published_at     timestamptz,
  created_at       timestamptz default now() not null,
  updated_at       timestamptz default now() not null,
  published_by_admin boolean not null default false
);

-- 4. Table posts
CREATE TABLE IF NOT EXISTS public.posts (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles(id) on delete cascade,
  content          text not null,
  image_url        text,
  link_url         text,
  hashtags         text[] default '{}',
  likes_count      integer default 0 not null,
  comments_count   integer default 0 not null,
  created_at       timestamptz default now() not null,
  updated_at       timestamptz default now() not null,
  is_pinned        boolean default false not null
);

-- 5. Table formation_reviews
CREATE TABLE IF NOT EXISTS public.formation_reviews (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  formation_id  uuid not null references public.formations(id) on delete cascade,
  chapter_id    uuid references public.formation_chapters(id) on delete cascade,
  rating        integer not null check (rating >= 1 and rating <= 5),
  comment       text,
  created_at    timestamptz default now() not null
);

-- 6. Fonction pour incrémenter les points (VERSION ULTIME)
CREATE OR REPLACE FUNCTION public.increment_user_points(
  p_user_id uuid,
  p_points integer,
  p_reason text default 'action',
  p_ref_id uuid default null
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- 1. Mise à jour du profil
  UPDATE public.profiles
  SET points = COALESCE(points, 0) + p_points,
      updated_at = now()
  WHERE id = p_user_id;

  -- 2. Log dans member_points (silencieux si la table manque)
  BEGIN
    INSERT INTO public.member_points (user_id, points, reason, reference_id)
    VALUES (p_user_id, p_points, p_reason, p_ref_id);
  EXCEPTION WHEN OTHERS THEN
    -- On ne bloque pas l'action principale pour un log
    NULL;
  END;
END;
$$;

-- 7. Ré-application des triggers de points (SÉCURISÉS)
CREATE OR REPLACE FUNCTION public.trg_fn_points_on_post()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- NEW.user_id est la bonne colonne pour posts
  PERFORM public.increment_user_points(NEW.user_id, 10, 'post_published', NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_points_new_post ON public.posts;
CREATE TRIGGER trg_points_new_post
  AFTER INSERT ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.trg_fn_points_on_post();

CREATE OR REPLACE FUNCTION public.trg_fn_points_on_like()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_author_id uuid;
BEGIN
  SELECT user_id INTO v_author_id FROM public.posts WHERE id = NEW.post_id;
  
  IF v_author_id IS NOT NULL AND v_author_id <> NEW.user_id THEN
    PERFORM public.increment_user_points(v_author_id, 2, 'like_received', NEW.post_id);
  END IF;
  
  PERFORM public.increment_user_points(NEW.user_id, 1, 'like_given', NEW.post_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_points_receive_like ON public.post_likes;
CREATE TRIGGER trg_points_receive_like
  AFTER INSERT ON public.post_likes
  FOR EACH ROW EXECUTE FUNCTION public.trg_fn_points_on_like();

-- 8. Forcer le rechargement du cache PostgREST
COMMENT ON TABLE public.news_articles IS 'Articles d''actualités IA';
COMMENT ON TABLE public.posts IS 'Publications de la communauté';
COMMENT ON TABLE public.formation_reviews IS 'Avis sur les formations';

-- 9. Audit des RLS News
ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "news select published members" ON public.news_articles;
CREATE POLICY "news select published members" ON public.news_articles
  FOR SELECT USING (
    (is_published AND public.is_active_member(auth.uid())) 
    OR public.is_admin(auth.uid())
  );
