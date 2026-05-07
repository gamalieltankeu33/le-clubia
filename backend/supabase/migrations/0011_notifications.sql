-- =====================================================================
-- Le Club IA — Migration 0011 : Système de notifications in-app + Realtime
--
-- Objectif :
--   • Une table notifications par utilisateur, alimentée par triggers.
--   • RLS strict : chacun ne voit/modifie que les siennes.
--   • Helper notify_active_members() : crée 1 notif pour CHAQUE membre
--     actif (subscription = 'active'), excluant l'auteur de l'action.
--   • 6 triggers automatiques :
--       a. posts (INSERT) ............... new_post   → tous membres actifs
--       b. resources (INSERT/UPDATE) .... new_resource si is_published true
--       c. formations (INSERT/UPDATE) ... new_formation si is_published true
--       d. news_articles (INSERT/UPDATE)  new_article si is_published true
--       e. post_comments (INSERT) ....... comment_on_post → auteur du post
--       f. post_likes (INSERT) .......... like_on_post → auteur du post
--
-- Notes :
--   • Tous les triggers sont SECURITY DEFINER pour bypasser RLS lors de
--     l'insert dans notifications.
--   • Idempotente.
--   • Realtime : la table doit être ajoutée à la publication
--     `supabase_realtime` (cf. dernière section).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Table notifications
-- ---------------------------------------------------------------------
create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  type        text not null check (type in (
    'new_post',
    'new_resource',
    'new_formation',
    'new_article',
    'comment_on_post',
    'like_on_post',
    'reply_to_comment'
  )),
  title       text not null,
  message     text not null,
  link_url    text,
  related_id  uuid,
  actor_id    uuid references auth.users(id) on delete set null,
  is_read     boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists idx_notifications_user_unread
  on public.notifications(user_id, is_read, created_at desc);

create index if not exists idx_notifications_user_recent
  on public.notifications(user_id, created_at desc);

-- ---------------------------------------------------------------------
-- 2. RLS
-- ---------------------------------------------------------------------
alter table public.notifications enable row level security;

drop policy if exists "notifications: select own"            on public.notifications;
drop policy if exists "notifications: update own (is_read)"  on public.notifications;
drop policy if exists "notifications: delete own"            on public.notifications;

create policy "notifications: select own"
  on public.notifications
  for select
  using (auth.uid() = user_id);

-- L'utilisateur ne peut PAS insérer directement (réservé aux triggers
-- SECURITY DEFINER). Aucune policy INSERT n'est créée → tout INSERT
-- direct sera refusé.

create policy "notifications: update own (is_read)"
  on public.notifications
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "notifications: delete own"
  on public.notifications
  for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- 3. Helper : notifier tous les membres actifs (sauf l'auteur)
-- ---------------------------------------------------------------------
create or replace function public.notify_active_members(
  p_type       text,
  p_title      text,
  p_message    text,
  p_link_url   text,
  p_related_id uuid,
  p_actor_id   uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications
    (user_id, type, title, message, link_url, related_id, actor_id)
  select
    p.id,
    p_type,
    p_title,
    p_message,
    p_link_url,
    p_related_id,
    p_actor_id
  from public.profiles p
  inner join public.subscriptions s on s.user_id = p.id
  where s.status = 'active'
    -- exclut l'auteur de l'action s'il y en a un
    and (p_actor_id is null or p.id <> p_actor_id);
end;
$$;

-- ---------------------------------------------------------------------
-- 4. Helpers utilitaires : extraire un nom + un extrait
-- ---------------------------------------------------------------------
create or replace function public.notif_display_name(p_user_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_first text;
  v_last  text;
begin
  if p_user_id is null then
    return 'Quelqu''un';
  end if;
  select first_name, last_name
    into v_first, v_last
    from public.profiles
    where id = p_user_id;
  if v_first is null and v_last is null then
    return 'Un membre';
  end if;
  return trim(both ' ' from coalesce(v_first, '') || ' ' || coalesce(v_last, ''));
end;
$$;

-- Renvoie un extrait plain-text d'un texte HTML (max p_max_len chars)
create or replace function public.notif_excerpt(p_html text, p_max_len int default 100)
returns text
language plpgsql
immutable
as $$
declare
  v_plain text;
begin
  if p_html is null then
    return '';
  end if;
  -- strip tags HTML basiques
  v_plain := regexp_replace(p_html, '<[^>]+>', '', 'g');
  -- collapse whitespace
  v_plain := regexp_replace(v_plain, '\s+', ' ', 'g');
  v_plain := trim(v_plain);
  if length(v_plain) <= p_max_len then
    return v_plain;
  end if;
  return substring(v_plain from 1 for p_max_len) || '…';
end;
$$;

-- ---------------------------------------------------------------------
-- 5. Trigger a — posts INSERT → new_post
-- ---------------------------------------------------------------------
create or replace function public.handle_new_post_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_name text;
  v_excerpt    text;
begin
  v_actor_name := public.notif_display_name(new.user_id);
  v_excerpt    := public.notif_excerpt(new.content, 100);

  perform public.notify_active_members(
    'new_post',
    v_actor_name || ' a publié dans la communauté',
    coalesce(nullif(v_excerpt, ''), 'Nouveau post à découvrir.'),
    '/app/communaute/' || new.id::text,
    new.id,
    new.user_id
  );
  return new;
end;
$$;

drop trigger if exists trg_notify_new_post on public.posts;
create trigger trg_notify_new_post
  after insert on public.posts
  for each row execute function public.handle_new_post_notification();

-- ---------------------------------------------------------------------
-- 6. Trigger b — resources publication → new_resource
-- Couvre INSERT (créée déjà publiée) ET UPDATE (passage de false → true).
-- ---------------------------------------------------------------------
create or replace function public.handle_new_resource_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_should_notify boolean := false;
begin
  if TG_OP = 'INSERT' then
    v_should_notify := new.is_published;
  elsif TG_OP = 'UPDATE' then
    v_should_notify := new.is_published and not coalesce(old.is_published, false);
  end if;

  if not v_should_notify then
    return new;
  end if;

  perform public.notify_active_members(
    'new_resource',
    'Nouvelle ressource : ' || new.title,
    coalesce(nullif(left(new.description, 140), ''), 'Une nouvelle ressource est disponible.'),
    '/app/ressources',
    new.id,
    null
  );
  return new;
end;
$$;

drop trigger if exists trg_notify_new_resource on public.resources;
create trigger trg_notify_new_resource
  after insert or update on public.resources
  for each row execute function public.handle_new_resource_notification();

-- ---------------------------------------------------------------------
-- 7. Trigger c — formations publication → new_formation
-- Le schéma utilise un boolean is_published (pas un enum status).
-- ---------------------------------------------------------------------
create or replace function public.handle_new_formation_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_should_notify boolean := false;
begin
  if TG_OP = 'INSERT' then
    v_should_notify := new.is_published;
  elsif TG_OP = 'UPDATE' then
    v_should_notify := new.is_published and not coalesce(old.is_published, false);
  end if;

  if not v_should_notify then
    return new;
  end if;

  perform public.notify_active_members(
    'new_formation',
    'Nouvelle formation : ' || new.title,
    coalesce(nullif(left(new.description, 140), ''), 'Une nouvelle formation est disponible.'),
    '/app/formations/' || new.slug,
    new.id,
    null
  );
  return new;
end;
$$;

drop trigger if exists trg_notify_new_formation on public.formations;
create trigger trg_notify_new_formation
  after insert or update on public.formations
  for each row execute function public.handle_new_formation_notification();

-- ---------------------------------------------------------------------
-- 8. Trigger d — news_articles publication → new_article
-- ---------------------------------------------------------------------
create or replace function public.handle_new_article_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_should_notify boolean := false;
begin
  if TG_OP = 'INSERT' then
    v_should_notify := new.is_published;
  elsif TG_OP = 'UPDATE' then
    v_should_notify := new.is_published and not coalesce(old.is_published, false);
  end if;

  if not v_should_notify then
    return new;
  end if;

  perform public.notify_active_members(
    'new_article',
    new.title,
    coalesce(nullif(public.notif_excerpt(new.content, 140), ''), 'Une nouvelle actualité est disponible.'),
    '/app/actualites/' || new.slug,
    new.id,
    null
  );
  return new;
end;
$$;

drop trigger if exists trg_notify_new_article on public.news_articles;
create trigger trg_notify_new_article
  after insert or update on public.news_articles
  for each row execute function public.handle_new_article_notification();

-- ---------------------------------------------------------------------
-- 9. Trigger e — post_comments INSERT → comment_on_post (auteur du post)
-- ---------------------------------------------------------------------
create or replace function public.handle_comment_on_post_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_post_owner uuid;
  v_actor_name text;
  v_excerpt    text;
begin
  select user_id into v_post_owner
    from public.posts
    where id = new.post_id;

  if v_post_owner is null then
    return new;
  end if;

  -- pas d'auto-notif
  if v_post_owner = new.user_id then
    return new;
  end if;

  v_actor_name := public.notif_display_name(new.user_id);
  v_excerpt    := public.notif_excerpt(new.content, 120);

  insert into public.notifications
    (user_id, type, title, message, link_url, related_id, actor_id)
  values (
    v_post_owner,
    'comment_on_post',
    v_actor_name || ' a commenté ton post',
    coalesce(nullif(v_excerpt, ''), 'Nouveau commentaire.'),
    '/app/communaute/' || new.post_id::text,
    new.post_id,
    new.user_id
  );

  return new;
end;
$$;

drop trigger if exists trg_notify_comment_on_post on public.post_comments;
create trigger trg_notify_comment_on_post
  after insert on public.post_comments
  for each row execute function public.handle_comment_on_post_notification();

-- ---------------------------------------------------------------------
-- 10. Trigger f — post_likes INSERT → like_on_post (auteur du post)
-- ---------------------------------------------------------------------
create or replace function public.handle_like_on_post_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_post_owner   uuid;
  v_post_excerpt text;
  v_actor_name   text;
begin
  select user_id, public.notif_excerpt(content, 100)
    into v_post_owner, v_post_excerpt
    from public.posts
    where id = new.post_id;

  if v_post_owner is null then
    return new;
  end if;

  if v_post_owner = new.user_id then
    return new;
  end if;

  v_actor_name := public.notif_display_name(new.user_id);

  insert into public.notifications
    (user_id, type, title, message, link_url, related_id, actor_id)
  values (
    v_post_owner,
    'like_on_post',
    v_actor_name || ' a aimé ton post',
    coalesce(nullif(v_post_excerpt, ''), 'Quelqu''un a aimé ton post.'),
    '/app/communaute/' || new.post_id::text,
    new.post_id,
    new.user_id
  );

  return new;
end;
$$;

drop trigger if exists trg_notify_like_on_post on public.post_likes;
create trigger trg_notify_like_on_post
  after insert on public.post_likes
  for each row execute function public.handle_like_on_post_notification();

-- ---------------------------------------------------------------------
-- 11. Realtime publication
-- Ajoute la table notifications à la publication supabase_realtime
-- pour activer les events INSERT/UPDATE/DELETE côté client.
-- Note : si la publication n'existe pas encore (projet vierge), Supabase
-- la créera automatiquement, mais sur un projet existant elle existe
-- déjà et on l'enrichit.
-- ---------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    -- ajoute la table si pas déjà membre
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'notifications'
    ) then
      execute 'alter publication supabase_realtime add table public.notifications';
    end if;
  end if;
end$$;

-- ---------------------------------------------------------------------
-- 12. Grants
-- ---------------------------------------------------------------------
grant execute on function public.notify_active_members(text, text, text, text, uuid, uuid) to service_role;
grant execute on function public.notif_display_name(uuid) to service_role;
grant execute on function public.notif_excerpt(text, int) to service_role;
