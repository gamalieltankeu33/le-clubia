-- =====================================================================
-- Le Club IA — Migration 0015 : Indices additionnels pour performance
--
-- Objectif : pré-optimiser les requêtes les plus chaudes avant la montée
-- en charge (1000 utilisateurs simultanés en conférence + 100-500 DAU).
--
-- Note : certains indices ressemblent à ceux déjà créés dans 0001/0003/0011
-- mais avec un tri additionnel ou un partial WHERE — ils sont rangés sous
-- des noms distincts pour cohabiter sans conflit. Postgres choisit le plus
-- adapté selon la requête.
--
-- Sécurité : tous en `IF NOT EXISTS`, idempotents.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Posts : tri par engagement (likes_count desc) — utile pour un futur
--    feed "Tendances" ou "Top semaine".
--    Note : on ne filtre PAS sur is_deleted car la colonne n'existe pas
--    dans le schéma actuel (suppression = DELETE physique).
-- ---------------------------------------------------------------------
create index if not exists idx_posts_likes_count
  on public.posts(likes_count desc, created_at desc);

-- ---------------------------------------------------------------------
-- 2. Post comments : index composite (post_id, created_at ASC) — accélère
--    le fetchComments() qui trie par created_at asc pour un post donné.
--    L'index `idx_post_comments_post(post_id)` existant de 0001 reste OK,
--    celui-ci permet en plus le order by sans tri supplémentaire.
-- ---------------------------------------------------------------------
create index if not exists idx_post_comments_post_created
  on public.post_comments(post_id, created_at asc);

-- ---------------------------------------------------------------------
-- 3. Profiles : index sur le nom complet en lowercase, pour la recherche
--    de membres dans l'admin (case + accent insensitive côté requête).
-- ---------------------------------------------------------------------
create index if not exists idx_profiles_full_name_lower
  on public.profiles((lower(coalesce(first_name, '') || ' ' || coalesce(last_name, ''))));

-- ---------------------------------------------------------------------
-- 4. Notifications : partial index sur les non-lues (le cas le plus chaud
--    pour la cloche du header). Plus compact que l'index full de 0011.
-- ---------------------------------------------------------------------
create index if not exists idx_notifications_user_unread_partial
  on public.notifications(user_id, created_at desc)
  where is_read = false;

-- ---------------------------------------------------------------------
-- 5. Formation chapters : ordre d'affichage par formation. L'index
--    `idx_chapters_formation(formation_id)` existant ne couvre pas le
--    `order by order_index asc`.
-- ---------------------------------------------------------------------
create index if not exists idx_formation_chapters_formation_order
  on public.formation_chapters(formation_id, order_index asc);

-- ---------------------------------------------------------------------
-- 6. User formation progress : "mes formations en cours" / "récemment
--    consultées" — accès par user_id, filtré sur completed, trié par
--    updated_at.
-- ---------------------------------------------------------------------
create index if not exists idx_user_formation_progress_user_status
  on public.user_formation_progress(user_id, completed, updated_at desc);

-- ---------------------------------------------------------------------
-- 7. News articles : feed publié, tri descendant par created_at (différent
--    de l'index existant qui utilise published_at).
-- ---------------------------------------------------------------------
create index if not exists idx_news_articles_published_created
  on public.news_articles(created_at desc)
  where is_published = true;

-- ---------------------------------------------------------------------
-- 8. Subscriptions : check rapide is_active_member(uid). Partial index
--    qui accélère drastiquement le RPC le plus appelé du système (RLS
--    via is_active_member sur posts/likes/comments/coach_messages/etc.).
-- ---------------------------------------------------------------------
create index if not exists idx_subscriptions_user_active
  on public.subscriptions(user_id)
  where status in ('active', 'trialing');

-- ---------------------------------------------------------------------
-- 9. Coach messages : par conversation, ordre asc — déjà couvert par
--    `idx_coach_messages_conversation` de 0003 (conversation_id,
--    created_at). Aucune action ici, signalé pour traçabilité.
-- ---------------------------------------------------------------------

-- ---------------------------------------------------------------------
-- 10. Post likes : check rapide "user X a-t-il liké le post Y ?".
--     L'UNIQUE constraint (post_id, user_id) de 0001 crée déjà un index
--     implicite parfait pour cette requête. Aucune action — signalé pour
--     traçabilité.
-- ---------------------------------------------------------------------
