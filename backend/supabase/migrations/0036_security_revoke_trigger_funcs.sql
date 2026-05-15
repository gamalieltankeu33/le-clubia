-- =====================================================================
-- Le Club IA — Migration 0036 : Sécurité — fermeture surface d'attaque
--                                des trigger functions (Phase 1 audit)
--
-- Problème détecté par les advisors Supabase (mai 2026, ~85 findings
-- combinés `anon_security_definer_function_executable` +
-- `authenticated_security_definer_function_executable`) :
--
-- Toutes les fonctions trigger déclarées en SECURITY DEFINER dans le
-- schéma `public` sont automatiquement exposées via PostgREST à
-- `/rest/v1/rpc/<name>`. Bien que les appeler sans contexte trigger ne
-- fasse "rien d'utile" (la fonction lit TG_OP, NEW, OLD qui sont null
-- hors trigger), c'est de la surface d'attaque inutile :
--   - DoS possible : un attaquant peut spammer ces endpoints pour
--     déclencher des exceptions et consommer du CPU
--   - Fingerprinting : la simple existence des endpoints révèle la
--     structure interne de la DB
--   - Risque futur : si une de ces fonctions évoluait pour avoir une
--     logique métier callable hors trigger, on aurait une fuite
--
-- Fix : REVOKE EXECUTE FROM PUBLIC, anon, authenticated pour chaque
-- trigger function. Le moteur Postgres continue de les exécuter
-- automatiquement quand le trigger fire (les triggers tournent en tant
-- que owner = postgres). Aucun impact fonctionnel attendu.
--
-- Sont CONSERVÉS exécutables par anon/authenticated :
--   - is_active_member, is_admin (helpers RLS appelés depuis policies)
--   - public_profiles_in, check_rate_limit, check_user_exists (RPCs UX)
--   - get_active_pricing_plans, get_public_member_count, get_next_public_event
--   - get_my_liked_post_ids, get_post_likers*, get_formations_with_progress
--   - update_chapter_progress, search_mentionable_users
--   - get_member_daily_activity, get_monthly_*, get_my_monthly_points
--   - notif_display_name, notif_excerpt (helpers utilisés par triggers
--     internes mais aussi par jsonb_build_object côté frontend)
--   - compute_active_mrr_xof, get_admin_inactive_members,
--     get_admin_learning_engagement (admin RPCs, déjà protégés par
--     check is_admin() interne, REVOKE FROM anon implicite via absence
--     de grant)
-- =====================================================================

-- ----- Notifications (10) -----
revoke execute on function public.handle_comment_on_post_notification()    from public, anon, authenticated;
revoke execute on function public.handle_comment_reply_notification()      from public, anon, authenticated;
revoke execute on function public.handle_like_on_post_notification()       from public, anon, authenticated;
revoke execute on function public.handle_mention_notification()            from public, anon, authenticated;
revoke execute on function public.handle_new_article_notification()        from public, anon, authenticated;
revoke execute on function public.handle_new_formation_notification()      from public, anon, authenticated;
revoke execute on function public.handle_new_post_notification()           from public, anon, authenticated;
revoke execute on function public.handle_new_resource_notification()       from public, anon, authenticated;
revoke execute on function public.notify_on_event_published()              from public, anon, authenticated;
revoke execute on function public.notify_on_weekly_recap()                 from public, anon, authenticated;

-- ----- Auth user lifecycle (1) — trigger sur auth.users -----
revoke execute on function public.handle_new_user()                        from public, anon, authenticated;

-- ----- Points / gamification (8) -----
revoke execute on function public.points_on_chapter_completed()            from public, anon, authenticated;
revoke execute on function public.points_on_comment_added()                from public, anon, authenticated;
revoke execute on function public.points_on_like_received()                from public, anon, authenticated;
revoke execute on function public.points_on_post_published()               from public, anon, authenticated;
revoke execute on function public.trg_fn_points_formation_completion()     from public, anon, authenticated;
revoke execute on function public.trg_fn_points_new_comment()              from public, anon, authenticated;
revoke execute on function public.trg_fn_points_new_post()                 from public, anon, authenticated;
revoke execute on function public.trg_fn_points_receive_like()             from public, anon, authenticated;

-- ----- Membres / posts counters (3) -----
revoke execute on function public.assign_member_number()                   from public, anon, authenticated;
revoke execute on function public.bump_post_likes_count()                  from public, anon, authenticated;
revoke execute on function public.update_comment_replies_count()           from public, anon, authenticated;

-- =====================================================================
-- Vérification post-migration (à exécuter manuellement) :
--   select p.proname,
--          (select array_agg(grantee || ':' || privilege_type)
--           from information_schema.routine_privileges rp
--           where rp.specific_schema = 'public' and rp.routine_name = p.proname) as grants
--   from pg_proc p
--   join pg_namespace n on n.oid = p.pronamespace
--   join pg_type t on t.oid = p.prorettype
--   where n.nspname = 'public' and p.prosecdef = true and t.typname = 'trigger'
--   order by p.proname;
--
-- Attendu : aucune ligne ne contient 'anon:EXECUTE' ni 'authenticated:EXECUTE'.
-- Les triggers continuent de fire automatiquement (postgres role les exécute).
-- =====================================================================
