-- =====================================================================
-- Le Club IA — Migration 0068 : Nettoyage des textes et des retours à la ligne
--
-- Objectifs :
--   1. Remplacer les caractères littéraux '\n' par de vrais retours à la ligne Postgres.
--   2. Corriger les coquilles orthographiques (ex: 'décentent' -> 'détectent').
-- =====================================================================

-- 1. Remplacement des '\n' littéraux par des retours à la ligne réels
update public.challenge_weeks
set description = replace(description, E'\\n', E'\n');

-- 2. Correction des coquilles orthographiques dans les descriptions
update public.challenge_weeks
set description = replace(description, 'décentent', 'détectent')
where description like '%décentent%';

update public.challenge_weeks
set description = replace(description, 'de predilection', 'de prédilection')
where description like '%de predilection%';

update public.challenge_weeks
set description = replace(description, 'coeur', 'cœur')
where description like '%coeur%';
