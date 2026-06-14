-- =====================================================================
-- Le Club IA — Migration 0037 : Sécurité Phase 3 — hygiène DB
--
-- Cible 2 catégories de findings advisor restantes :
--
-- 1. function_search_path_mutable (3 fonctions)
--    `bump_conversation_updated_at`, `notif_excerpt`,
--    `set_news_articles_updated_at` n'ont pas `search_path` fixé.
--    Risque théorique : un attaquant avec accès au cluster pourrait
--    placer un schéma malveillant en tête du search_path et hijacker
--    les fonctions internes (ex: regexp_replace) que ces functions
--    appellent sans qualification. Fix best-practice.
--
-- 2. public_bucket_allows_listing (6 buckets)
--    Les buckets publics `avatars`, `event-covers`, `formation-covers`,
--    `news-covers`, `post-images`, `resource-thumbnails` ont chacun
--    une policy SELECT "X members read" qui permet de LISTER les
--    fichiers via /storage/v1/object/list/<bucket>. L'accès direct par
--    URL fonctionne sans cette policy (les buckets sont publics).
--    Donc la policy n'apporte aucune fonctionnalité — juste de la
--    surface d'attaque (énumération de fichiers, fingerprinting).
--    Vérifié grep côté frontend : aucun appel `.list(` sur ces
--    buckets, donc drop sans impact.
--
-- NON inclus dans cette migration :
--    - `pg_net` extension dans schema `public` (1 finding restant) :
--      déplacer vers `extensions` schema casserait notre cron
--      `news-weekly` qui hardcode `net.http_post(...)`. À reprendre
--      séparément avec update coordonné du cron.
-- =====================================================================

-- ----- 1. SET search_path sur les 3 fonctions ------------------------

alter function public.bump_conversation_updated_at()
  set search_path = public, pg_temp;

alter function public.notif_excerpt(text, integer)
  set search_path = public, pg_temp;

alter function public.set_news_articles_updated_at()
  set search_path = public, pg_temp;

-- ----- 2. Drop 6 policies SELECT inutiles sur storage.objects --------

drop policy if exists "avatars members read"             on storage.objects;
drop policy if exists "event-covers members read"        on storage.objects;
drop policy if exists "formation-covers members read"    on storage.objects;
drop policy if exists "news-covers members read"         on storage.objects;
drop policy if exists "post-images members read"         on storage.objects;
drop policy if exists "resource-thumbnails members read" on storage.objects;

-- =====================================================================
-- Vérifications post-migration (à exécuter manuellement) :
--
-- 1. Les 3 fonctions ont bien un search_path fixé :
--    select p.proname, pg_get_function_arguments(p.oid),
--           p.proconfig as config
--    from pg_proc p
--    join pg_namespace n on n.oid = p.pronamespace
--    where n.nspname = 'public'
--      and p.proname in (
--        'bump_conversation_updated_at',
--        'notif_excerpt',
--        'set_news_articles_updated_at'
--      );
--    Attendu : proconfig contient 'search_path=public, pg_temp'.
--
-- 2. Les 6 policies sont bien drop :
--    select polname from pg_policy
--    where polrelid = 'storage.objects'::regclass
--      and polname like '%members read';
--    Attendu : aucune ligne pour les 6 buckets ci-dessus
--    (la policy `resource-files members read` est SEPARATE et reste,
--     bucket privé qui A BESOIN de la policy pour le read membre).
--
-- 3. Test fonctionnel : recharger l'app et vérifier que les avatars,
--    images de cover, etc. s'affichent toujours (les URLs publiques
--    ne dépendent PAS de la policy SELECT, mais double-check).
-- =====================================================================
