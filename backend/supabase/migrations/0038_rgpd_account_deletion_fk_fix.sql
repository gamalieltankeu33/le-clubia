-- =====================================================================
-- Le Club IA — Migration 0038 : prépare la suppression de compte RGPD
--
-- Avant d'exposer un endpoint "supprimer mon compte" (article 17 RGPD —
-- droit à l'effacement), on doit s'assurer que les ON DELETE des FK
-- pointant vers auth.users ne BLOQUENT pas la suppression.
--
-- Audit existant (la quasi-totalité des FK est déjà en CASCADE) :
--   - profiles, subscriptions, posts, post_likes, post_comments,
--     news_comments, user_formation_progress, member_points,
--     monthly_winners (user_id), notifications (user_id),
--     coach_conversations, formation_reviews, comment_mentions,
--     rate_limits → CASCADE ✓
--   - events.created_by → SET NULL ✓ (l'événement reste, créateur anonymisé)
--   - notifications.actor_id → SET NULL ✓ (notif conservée, acteur anonymisé)
--
-- Exception détectée : monthly_winners.selected_by → NO ACTION.
-- Si un admin qui a sélectionné un winner demande à supprimer son
-- compte, la suppression échouera avec "FK constraint violation".
-- Fix : passer en SET NULL (le winner reste enregistré, mais le
-- "sélectionneur" devient null — cohérent avec events.created_by).
-- =====================================================================

alter table public.monthly_winners
  drop constraint if exists monthly_winners_selected_by_fkey;

alter table public.monthly_winners
  add constraint monthly_winners_selected_by_fkey
  foreign key (selected_by)
  references auth.users(id)
  on delete set null;

-- Vérif post-migration :
--   select confdeltype from pg_constraint
--   where conname = 'monthly_winners_selected_by_fkey';
-- Attendu : 'n' (SET NULL)
