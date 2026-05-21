-- =====================================================================
-- Le Club IA — Migration 0047 : Index de scalabilité
--
-- Audit performance Supabase (database-linter) :
--   - 12 foreign keys SANS index couvrant → jointures + cascade deletes
--     lents quand les tables grossissent (10k+ membres).
--   - 2 paires d'index identiques → surcoût d'écriture inutile.
--
-- Ajoute les index FK manquants + supprime les doublons.
-- Idempotente.
-- =====================================================================

-- ── Index FK manquants ───────────────────────────────────────────────
create index if not exists idx_events_created_by
  on public.events(created_by);

create index if not exists idx_formation_reviews_chapter_id
  on public.formation_reviews(chapter_id);
create index if not exists idx_formation_reviews_formation_id
  on public.formation_reviews(formation_id);

create index if not exists idx_monthly_winners_selected_by
  on public.monthly_winners(selected_by);
create index if not exists idx_monthly_winners_user_id
  on public.monthly_winners(user_id);

create index if not exists idx_news_comments_user_id
  on public.news_comments(user_id);

create index if not exists idx_notifications_actor_id
  on public.notifications(actor_id);

create index if not exists idx_post_comments_user_id
  on public.post_comments(user_id);

create index if not exists idx_post_likes_user_id
  on public.post_likes(user_id);

create index if not exists idx_profiles_desired_plan_id
  on public.profiles(desired_plan_id);

create index if not exists idx_user_formation_progress_chapter_id
  on public.user_formation_progress(chapter_id);
create index if not exists idx_user_formation_progress_formation_id
  on public.user_formation_progress(formation_id);

-- ── Suppression des index dupliqués ──────────────────────────────────
-- coach_conversations : {coach_conv_user_idx, idx_coach_conv_user_recent}
drop index if exists public.coach_conv_user_idx;
-- coach_messages : {coach_messages_conv_idx, idx_coach_messages_conversation}
drop index if exists public.coach_messages_conv_idx;
