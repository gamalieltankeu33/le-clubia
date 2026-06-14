-- 0039_member_number.sql
--
-- Numéro de membre auto-incrémenté, signature visuelle du Club. Chaque
-- membre se voit attribuer un numéro à l'inscription (ordre chronologique),
-- affiché partout côté frontend (profil, posts, sidebar) pour créer la
-- fierté d'appartenance.
--
-- Backfill : on remplit les membres existants par ordre d'inscription
-- AVANT de poser la contrainte UNIQUE / NOT NULL pour éviter tout conflit.

-- 1) Colonne nullable d'abord (le backfill viendra la remplir).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS member_number integer;

-- 2) Sequence pour les nouveaux inscrits. On laisse Postgres gérer le
--    compteur — pas de race condition possible vs un MAX()+1 manuel.
CREATE SEQUENCE IF NOT EXISTS public.profiles_member_number_seq;

-- 3) Backfill : on assigne des numéros aux profils existants par ordre
--    d'inscription (created_at ASC). Le ROW_NUMBER() commence à 1.
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) AS num
  FROM public.profiles
  WHERE member_number IS NULL
)
UPDATE public.profiles p
SET member_number = numbered.num
FROM numbered
WHERE p.id = numbered.id;

-- 4) Aligner la sequence sur le max actuel pour que les prochains nextval()
--    démarrent juste après. setval(..., is_called=true) → le prochain
--    nextval() renverra max+1.
SELECT setval(
  'public.profiles_member_number_seq',
  COALESCE((SELECT MAX(member_number) FROM public.profiles), 0),
  true
);

-- 5) Default = nextval pour les nouveaux inserts (signup direct via API).
ALTER TABLE public.profiles
  ALTER COLUMN member_number SET DEFAULT nextval('public.profiles_member_number_seq');

-- 6) Lock the sequence ownership to the column so DROP COLUMN propre.
ALTER SEQUENCE public.profiles_member_number_seq OWNED BY public.profiles.member_number;

-- 7) NOT NULL + UNIQUE maintenant que tout est rempli et qu'on a un default.
ALTER TABLE public.profiles
  ALTER COLUMN member_number SET NOT NULL;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_member_number_unique UNIQUE (member_number);

-- 8) Trigger BEFORE INSERT : filet de sécurité si jamais un trigger amont
--    (handle_new_user) crée la ligne sans laisser le default s'appliquer.
--    Idempotent : ne touche pas member_number s'il est déjà fourni.
CREATE OR REPLACE FUNCTION public.assign_member_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.member_number IS NULL THEN
    NEW.member_number := nextval('public.profiles_member_number_seq');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assign_member_number ON public.profiles;
CREATE TRIGGER trg_assign_member_number
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_member_number();

-- 9) Index implicite via UNIQUE — pas besoin d'index supplémentaire.

-- 10) Exposer member_number dans la RPC public_profiles_in (lecture
--     publique des auteurs côté communauté). Si la RPC existe déjà, on la
--     remplace avec le nouveau champ ; sinon CREATE.
CREATE OR REPLACE FUNCTION public.public_profiles_in(p_ids uuid[])
RETURNS TABLE (
  id uuid,
  first_name text,
  last_name text,
  avatar_url text,
  bio text,
  is_verified boolean,
  role public.user_role,
  created_at timestamptz,
  last_active_at timestamptz,
  member_number integer
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    p.id,
    p.first_name,
    p.last_name,
    p.avatar_url,
    p.bio,
    p.is_verified,
    p.role,
    p.created_at,
    p.last_active_at,
    p.member_number
  FROM public.profiles p
  WHERE p.id = ANY(p_ids);
$$;

GRANT EXECUTE ON FUNCTION public.public_profiles_in(uuid[]) TO authenticated;
