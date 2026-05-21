-- =====================================================================
-- Le Club IA — Migration 0048 : RLS perf (initplan) + dédoublonnage
--
-- Audit performance Supabase :
--   - auth_rls_initplan (66) : les policies appelaient auth.uid() /
--     is_admin(auth.uid()) / is_active_member(auth.uid()) DIRECTEMENT,
--     donc ré-évaluées PAR LIGNE. À 10k lignes = 10k appels par requête.
--     Fix : wrapper dans (select auth.uid()) → Postgres l'évalue UNE
--     fois (InitPlan). Gain majeur à grande échelle.
--   - multiple_permissive_policies : suppression des policies doublons
--     exactes (mêmes qual/cmd) qui étaient évaluées en double.
--
-- Sémantique de sécurité INCHANGÉE (mêmes conditions, juste optimisées).
-- Idempotente (DROP IF EXISTS + CREATE).
-- =====================================================================

-- ── Suppression des policies doublons (perf) ────────────────────────
drop policy if exists "formations select published members" on public.formations;
drop policy if exists "resources select published members" on public.resources;
drop policy if exists "subs select self" on public.subscriptions;
drop policy if exists "coach_msg delete self" on public.coach_messages;
drop policy if exists "coach_msg insert self" on public.coach_messages;
drop policy if exists "coach_msg select self" on public.coach_messages;
drop policy if exists "progress upsert self" on public.user_formation_progress;


-- ── admin_audit_log ───────────────────────────────────────────────
drop policy if exists "audit_log admin select" on public.admin_audit_log;
create policy "audit_log admin select" on public.admin_audit_log
  as permissive for select to authenticated
  using (is_admin((select auth.uid())));

-- ── coach_conversations ───────────────────────────────────────────────
drop policy if exists "coach_conv delete self" on public.coach_conversations;
create policy "coach_conv delete self" on public.coach_conversations
  as permissive for delete to public
  using (((select auth.uid()) = user_id));
drop policy if exists "coach_conv insert self" on public.coach_conversations;
create policy "coach_conv insert self" on public.coach_conversations
  as permissive for insert to public
  with check (((select auth.uid()) = user_id));
drop policy if exists "coach_conv select self" on public.coach_conversations;
create policy "coach_conv select self" on public.coach_conversations
  as permissive for select to public
  using (((select auth.uid()) = user_id));
drop policy if exists "coach_conv update self" on public.coach_conversations;
create policy "coach_conv update self" on public.coach_conversations
  as permissive for update to public
  using (((select auth.uid()) = user_id))
  with check (((select auth.uid()) = user_id));

-- ── coach_messages ───────────────────────────────────────────────
drop policy if exists "coach_msg delete via conversation" on public.coach_messages;
create policy "coach_msg delete via conversation" on public.coach_messages
  as permissive for delete to public
  using ((EXISTS ( SELECT 1 FROM coach_conversations c WHERE ((c.id = coach_messages.conversation_id) AND (c.user_id = (select auth.uid()))))));
drop policy if exists "coach_msg insert via conversation" on public.coach_messages;
create policy "coach_msg insert via conversation" on public.coach_messages
  as permissive for insert to public
  with check ((EXISTS ( SELECT 1 FROM coach_conversations c WHERE ((c.id = coach_messages.conversation_id) AND (c.user_id = (select auth.uid()))))));
drop policy if exists "coach_msg select via conversation" on public.coach_messages;
create policy "coach_msg select via conversation" on public.coach_messages
  as permissive for select to public
  using ((EXISTS ( SELECT 1 FROM coach_conversations c WHERE ((c.id = coach_messages.conversation_id) AND (c.user_id = (select auth.uid()))))));

-- ── comment_mentions ───────────────────────────────────────────────
drop policy if exists "comment_mentions delete own comment" on public.comment_mentions;
create policy "comment_mentions delete own comment" on public.comment_mentions
  as permissive for delete to authenticated
  using ((EXISTS ( SELECT 1 FROM post_comments c WHERE ((c.id = comment_mentions.comment_id) AND (c.user_id = (select auth.uid()))))));
drop policy if exists "comment_mentions write own comment" on public.comment_mentions;
create policy "comment_mentions write own comment" on public.comment_mentions
  as permissive for insert to authenticated
  with check ((EXISTS ( SELECT 1 FROM post_comments c WHERE ((c.id = comment_mentions.comment_id) AND (c.user_id = (select auth.uid()))))));

-- ── events ───────────────────────────────────────────────
drop policy if exists "events admin all" on public.events;
create policy "events admin all" on public.events
  as permissive for all to public
  using (is_admin((select auth.uid())))
  with check (is_admin((select auth.uid())));
drop policy if exists "events read members" on public.events;
create policy "events read members" on public.events
  as permissive for select to public
  using ((((is_published = true) AND (is_active_member((select auth.uid())) OR is_admin((select auth.uid())))) OR is_admin((select auth.uid()))));

-- ── formation_chapters ───────────────────────────────────────────────
drop policy if exists "chapters admin all" on public.formation_chapters;
create policy "chapters admin all" on public.formation_chapters
  as permissive for all to public
  using (is_admin((select auth.uid())))
  with check (is_admin((select auth.uid())));
drop policy if exists "chapters select members" on public.formation_chapters;
create policy "chapters select members" on public.formation_chapters
  as permissive for select to public
  using ((is_admin((select auth.uid())) OR (is_active_member((select auth.uid())) AND (EXISTS ( SELECT 1 FROM formations f WHERE ((f.id = formation_chapters.formation_id) AND f.is_published))))));

-- ── formation_reviews ───────────────────────────────────────────────
drop policy if exists "reviews insert self" on public.formation_reviews;
create policy "reviews insert self" on public.formation_reviews
  as permissive for insert to public
  with check ((((select auth.uid()) = user_id) AND is_active_member((select auth.uid()))));
drop policy if exists "reviews select members" on public.formation_reviews;
create policy "reviews select members" on public.formation_reviews
  as permissive for select to public
  using ((is_active_member((select auth.uid())) OR is_admin((select auth.uid()))));
drop policy if exists "reviews update self" on public.formation_reviews;
create policy "reviews update self" on public.formation_reviews
  as permissive for update to public
  using (((select auth.uid()) = user_id))
  with check (((select auth.uid()) = user_id));

-- ── formations ───────────────────────────────────────────────
drop policy if exists "formations admin all" on public.formations;
create policy "formations admin all" on public.formations
  as permissive for all to public
  using (is_admin((select auth.uid())))
  with check (is_admin((select auth.uid())));
drop policy if exists "formations select members" on public.formations;
create policy "formations select members" on public.formations
  as permissive for select to public
  using (((is_published AND is_active_member((select auth.uid()))) OR is_admin((select auth.uid()))));

-- ── member_points ───────────────────────────────────────────────
drop policy if exists "member_points admin only" on public.member_points;
create policy "member_points admin only" on public.member_points
  as permissive for all to authenticated
  using ((EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = 'admin'::user_role)))))
  with check (false);

-- ── monthly_winners ───────────────────────────────────────────────
drop policy if exists "monthly_winners admin delete" on public.monthly_winners;
create policy "monthly_winners admin delete" on public.monthly_winners
  as permissive for delete to authenticated
  using ((EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = 'admin'::user_role)))));
drop policy if exists "monthly_winners admin update" on public.monthly_winners;
create policy "monthly_winners admin update" on public.monthly_winners
  as permissive for update to authenticated
  using ((EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = 'admin'::user_role)))));
drop policy if exists "monthly_winners admin write" on public.monthly_winners;
create policy "monthly_winners admin write" on public.monthly_winners
  as permissive for insert to authenticated
  with check ((EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = 'admin'::user_role)))));

-- ── news_articles ───────────────────────────────────────────────
drop policy if exists "news admin all" on public.news_articles;
create policy "news admin all" on public.news_articles
  as permissive for all to public
  using (is_admin((select auth.uid())))
  with check (is_admin((select auth.uid())));
drop policy if exists "news select published members" on public.news_articles;
create policy "news select published members" on public.news_articles
  as permissive for select to public
  using (((is_published AND is_active_member((select auth.uid()))) OR is_admin((select auth.uid()))));

-- ── news_comments ───────────────────────────────────────────────
drop policy if exists "news_comments delete self or admin" on public.news_comments;
create policy "news_comments delete self or admin" on public.news_comments
  as permissive for delete to public
  using ((((select auth.uid()) = user_id) OR is_admin((select auth.uid()))));
drop policy if exists "news_comments insert self" on public.news_comments;
create policy "news_comments insert self" on public.news_comments
  as permissive for insert to public
  with check ((((select auth.uid()) = user_id) AND is_active_member((select auth.uid()))));
drop policy if exists "news_comments select members" on public.news_comments;
create policy "news_comments select members" on public.news_comments
  as permissive for select to public
  using ((is_active_member((select auth.uid())) OR is_admin((select auth.uid()))));
drop policy if exists "news_comments update self" on public.news_comments;
create policy "news_comments update self" on public.news_comments
  as permissive for update to public
  using (((select auth.uid()) = user_id))
  with check (((select auth.uid()) = user_id));

-- ── notifications ───────────────────────────────────────────────
drop policy if exists "notifications: delete own" on public.notifications;
create policy "notifications: delete own" on public.notifications
  as permissive for delete to public
  using (((select auth.uid()) = user_id));
drop policy if exists "notifications: select own" on public.notifications;
create policy "notifications: select own" on public.notifications
  as permissive for select to public
  using (((select auth.uid()) = user_id));
drop policy if exists "notifications: update own (is_read)" on public.notifications;
create policy "notifications: update own (is_read)" on public.notifications
  as permissive for update to public
  using (((select auth.uid()) = user_id))
  with check (((select auth.uid()) = user_id));

-- ── post_comments ───────────────────────────────────────────────
drop policy if exists "post_comments delete self or admin" on public.post_comments;
create policy "post_comments delete self or admin" on public.post_comments
  as permissive for delete to public
  using ((((select auth.uid()) = user_id) OR is_admin((select auth.uid()))));
drop policy if exists "post_comments insert self" on public.post_comments;
create policy "post_comments insert self" on public.post_comments
  as permissive for insert to public
  with check ((((select auth.uid()) = user_id) AND is_active_member((select auth.uid()))));
drop policy if exists "post_comments update self" on public.post_comments;
create policy "post_comments update self" on public.post_comments
  as permissive for update to public
  using (((select auth.uid()) = user_id))
  with check (((select auth.uid()) = user_id));

-- ── post_likes ───────────────────────────────────────────────
drop policy if exists "likes delete self" on public.post_likes;
create policy "likes delete self" on public.post_likes
  as permissive for delete to public
  using (((select auth.uid()) = user_id));
drop policy if exists "likes insert self" on public.post_likes;
create policy "likes insert self" on public.post_likes
  as permissive for insert to public
  with check ((((select auth.uid()) = user_id) AND is_active_member((select auth.uid()))));

-- ── posts ───────────────────────────────────────────────
drop policy if exists "Admins can update any post" on public.posts;
create policy "Admins can update any post" on public.posts
  as permissive for update to authenticated
  using (is_admin((select auth.uid())))
  with check (is_admin((select auth.uid())));
drop policy if exists "posts delete self or admin" on public.posts;
create policy "posts delete self or admin" on public.posts
  as permissive for delete to public
  using ((((select auth.uid()) = user_id) OR is_admin((select auth.uid()))));
drop policy if exists "posts insert self" on public.posts;
create policy "posts insert self" on public.posts
  as permissive for insert to public
  with check ((((select auth.uid()) = user_id) AND is_active_member((select auth.uid()))));
drop policy if exists "posts update self" on public.posts;
create policy "posts update self" on public.posts
  as permissive for update to public
  using ((((select auth.uid()) = user_id) OR is_admin((select auth.uid()))))
  with check ((((select auth.uid()) = user_id) OR is_admin((select auth.uid()))));

-- ── pricing_plans ───────────────────────────────────────────────
drop policy if exists "pricing_plans manage admin" on public.pricing_plans;
create policy "pricing_plans manage admin" on public.pricing_plans
  as permissive for all to authenticated
  using (is_admin((select auth.uid())))
  with check (is_admin((select auth.uid())));
drop policy if exists "pricing_plans read public" on public.pricing_plans;
create policy "pricing_plans read public" on public.pricing_plans
  as permissive for select to anon, authenticated
  using (((is_active = true) OR is_admin((select auth.uid()))));

-- ── profiles ───────────────────────────────────────────────
drop policy if exists "profiles admin all" on public.profiles;
create policy "profiles admin all" on public.profiles
  as permissive for all to public
  using (is_admin((select auth.uid())))
  with check (is_admin((select auth.uid())));
drop policy if exists "profiles insert self" on public.profiles;
create policy "profiles insert self" on public.profiles
  as permissive for insert to public
  with check (((select auth.uid()) = id));
drop policy if exists "profiles select self or admin" on public.profiles;
create policy "profiles select self or admin" on public.profiles
  as permissive for select to public
  using ((((select auth.uid()) = id) OR is_admin((select auth.uid()))));
drop policy if exists "profiles update self" on public.profiles;
create policy "profiles update self" on public.profiles
  as permissive for update to public
  using (((select auth.uid()) = id))
  with check (((select auth.uid()) = id));

-- ── rate_limits ───────────────────────────────────────────────
drop policy if exists "rate_limits insert self" on public.rate_limits;
create policy "rate_limits insert self" on public.rate_limits
  as permissive for insert to authenticated
  with check (((user_id = (select auth.uid())) OR (user_id IS NULL)));
drop policy if exists "rate_limits select admin" on public.rate_limits;
create policy "rate_limits select admin" on public.rate_limits
  as permissive for select to authenticated
  using (is_admin((select auth.uid())));

-- ── resources ───────────────────────────────────────────────
drop policy if exists "resources admin all" on public.resources;
create policy "resources admin all" on public.resources
  as permissive for all to public
  using (is_admin((select auth.uid())))
  with check (is_admin((select auth.uid())));
drop policy if exists "resources select members" on public.resources;
create policy "resources select members" on public.resources
  as permissive for select to public
  using (((is_published AND is_active_member((select auth.uid()))) OR is_admin((select auth.uid()))));

-- ── subscriptions ───────────────────────────────────────────────
drop policy if exists "subscriptions admin delete" on public.subscriptions;
create policy "subscriptions admin delete" on public.subscriptions
  as permissive for delete to authenticated
  using (is_admin((select auth.uid())));
drop policy if exists "subscriptions admin insert" on public.subscriptions;
create policy "subscriptions admin insert" on public.subscriptions
  as permissive for insert to authenticated
  with check (is_admin((select auth.uid())));
drop policy if exists "subscriptions admin update" on public.subscriptions;
create policy "subscriptions admin update" on public.subscriptions
  as permissive for update to authenticated
  using (is_admin((select auth.uid())))
  with check (is_admin((select auth.uid())));
drop policy if exists "subscriptions select self" on public.subscriptions;
create policy "subscriptions select self" on public.subscriptions
  as permissive for select to public
  using ((((select auth.uid()) = user_id) OR is_admin((select auth.uid()))));

-- ── user_formation_progress ───────────────────────────────────────────────
drop policy if exists "progress delete self" on public.user_formation_progress;
create policy "progress delete self" on public.user_formation_progress
  as permissive for delete to public
  using (((select auth.uid()) = user_id));
drop policy if exists "progress insert self" on public.user_formation_progress;
create policy "progress insert self" on public.user_formation_progress
  as permissive for insert to public
  with check ((((select auth.uid()) = user_id) AND is_active_member((select auth.uid()))));
drop policy if exists "progress select self" on public.user_formation_progress;
create policy "progress select self" on public.user_formation_progress
  as permissive for select to public
  using (((select auth.uid()) = user_id));
drop policy if exists "progress update self" on public.user_formation_progress;
create policy "progress update self" on public.user_formation_progress
  as permissive for update to public
  using (((select auth.uid()) = user_id))
  with check (((select auth.uid()) = user_id));
