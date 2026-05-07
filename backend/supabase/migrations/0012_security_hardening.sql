-- =====================================================================
-- Le Club IA — Migration 0012 : Durcissement sécurité (audit V1)
--
-- Objectifs :
--   1. PII : exposer un profil PUBLIC (sans email) via RPC SECURITY DEFINER,
--      pour que la communauté/feed puisse afficher les auteurs sans fuiter
--      l'adresse email à des tiers. La table profiles garde sa RLS stricte
--      "self or admin".
--   2. search_path : ajouter `set search_path = public, pg_temp` à toutes
--      les fonctions trigger / helpers existantes pour bloquer le hijacking.
--   3. CHECK constraints : durcir les colonnes user-controlled (URLs, longueur
--      du contenu posts/commentaires) pour éviter abus côté client.
--
-- Idempotente.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. RPC : récupérer les profils PUBLICS (sans email)
-- ---------------------------------------------------------------------
-- Le client appelle supabase.rpc('public_profiles_in', { p_ids: [...] })
-- pour hydrater les auteurs (posts, commentaires, notifications, etc.).
-- Les emails restent visibles uniquement à soi + admin via la table directe.
create or replace function public.public_profiles_in(p_ids uuid[])
returns table (
  id              uuid,
  first_name      text,
  last_name       text,
  avatar_url      text,
  bio             text,
  is_verified     boolean,
  role            user_role,
  created_at      timestamptz,
  last_active_at  timestamptz
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    p.id,
    p.first_name,
    p.last_name,
    p.avatar_url,
    p.bio,
    p.is_verified,
    p.role,
    p.created_at,
    p.last_active_at
  from public.profiles p
  where p.id = any(p_ids);
$$;

revoke execute on function public.public_profiles_in(uuid[]) from public;
grant execute on function public.public_profiles_in(uuid[]) to authenticated;

-- ---------------------------------------------------------------------
-- 2. search_path sur les triggers/helpers
-- ---------------------------------------------------------------------

-- Helper updated_at (utilisé par 6+ tables)
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Compteur post_likes
create or replace function public.bump_post_likes_count()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if TG_OP = 'INSERT' then
    update public.posts set likes_count = likes_count + 1 where id = new.post_id;
    return new;
  elsif TG_OP = 'DELETE' then
    update public.posts set likes_count = greatest(0, likes_count - 1) where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$;

-- Compteur post_comments
create or replace function public.bump_post_comments_count()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if TG_OP = 'INSERT' then
    update public.posts set comments_count = comments_count + 1 where id = new.post_id;
    return new;
  elsif TG_OP = 'DELETE' then
    update public.posts set comments_count = greatest(0, comments_count - 1) where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$;

-- Bump conversation Coach
create or replace function public.bump_coach_conversation_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  update public.coach_conversations
  set updated_at = now()
  where id = new.conversation_id;
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- 3. CHECK constraints — limites user-controlled
-- ---------------------------------------------------------------------

-- 3a. posts.link_url : http(s) seulement OU null
do $$ begin
  alter table public.posts
    add constraint posts_link_url_scheme_check
    check (link_url is null or link_url ~* '^https?://');
exception when duplicate_object then null; end $$;

-- 3b. posts.content : 10 000 caractères max (Tiptap stocke du HTML, ~ 5k chars utiles)
do $$ begin
  alter table public.posts
    add constraint posts_content_max_length
    check (char_length(content) <= 10000);
exception when duplicate_object then null; end $$;

-- 3c. post_comments.content : 4 000 caractères max
do $$ begin
  alter table public.post_comments
    add constraint post_comments_content_max_length
    check (char_length(content) <= 4000);
exception when duplicate_object then null; end $$;

-- 3d. news_comments.content : 4 000 caractères max
do $$ begin
  alter table public.news_comments
    add constraint news_comments_content_max_length
    check (char_length(content) <= 4000);
exception when duplicate_object then null; end $$;

-- 3e. coach_messages.content : 8 000 caractères max (stop tokens abuse)
do $$ begin
  alter table public.coach_messages
    add constraint coach_messages_content_max_length
    check (char_length(content) <= 8000);
exception when duplicate_object then null; end $$;

-- 3f. profiles.bio : 500 caractères max (déjà géré côté frontend, on durcit côté DB)
do $$ begin
  alter table public.profiles
    add constraint profiles_bio_max_length
    check (bio is null or char_length(bio) <= 500);
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- 4. Note : les fonctions SECURITY DEFINER existantes ont déjà
--    `set search_path` — vérifié dans 0001 (is_admin, is_active_member,
--    handle_new_user), 0009 (get_public_member_count), 0010
--    (check_user_exists), 0011 (notify_active_members, notif_*).
--    Aucune action supplémentaire requise.
-- ---------------------------------------------------------------------
