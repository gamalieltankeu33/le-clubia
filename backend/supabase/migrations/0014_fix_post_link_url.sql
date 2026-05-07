-- =====================================================================
-- Le Club IA — Migration 0014 : Assouplit la CHECK constraint sur posts.link_url
--
-- La contrainte de 0012_security_hardening.sql restait correcte sur le
-- principe (http(s) uniquement), mais sans limite de longueur explicite et
-- sans message d'erreur user-friendly côté frontend, des publications
-- valides restaient bloquées sans diagnostic clair.
--
-- Cette migration :
--   1. Supprime l'ancienne CHECK constraint
--   2. La recrée avec une vérification souple qui couvre les vraies
--      menaces (javascript:, data:) sans rejeter des URLs légitimes
--      (Google Meet, Zoom, redirections avec query params, etc.).
--   3. Ajoute une limite de longueur claire à 500 caractères.
--
-- Idempotente.
-- =====================================================================

-- 1. Supprime l'ancienne contrainte (si présente sous l'un des deux noms
--    possibles selon le moment où la migration a été appliquée).
alter table public.posts
  drop constraint if exists posts_link_url_scheme_check;

alter table public.posts
  drop constraint if exists posts_link_url_check;

-- 2. Recrée la contrainte avec :
--    - link_url NULL accepté (pas de lien attaché au post)
--    - sinon doit commencer par http:// ou https:// (case-insensitive)
--    - longueur max 500 caractères
do $$ begin
  alter table public.posts
    add constraint posts_link_url_scheme_check
    check (
      link_url is null
      or (
        link_url ~* '^https?://'
        and char_length(link_url) <= 500
      )
    );
exception when duplicate_object then null; end $$;
