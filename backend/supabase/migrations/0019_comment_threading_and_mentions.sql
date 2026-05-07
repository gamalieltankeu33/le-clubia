-- =====================================================================
-- Le Club IA — Migration 0019 : Threading commentaires (2 niveaux) +
-- système de mentions @ cliquables
--
-- Périmètre :
--   1. Colonnes parent_comment_id + replies_count sur post_comments.
--   2. Trigger qui maintient replies_count (INSERT / DELETE).
--   3. Trigger qui INTERDIT le 3e niveau (parent d'une réponse doit être
--      racine, parent_comment_id IS NULL).
--   4. Trigger notification "X a répondu à ton commentaire" (type
--      reply_to_comment, déjà présent dans la CHECK constraint depuis 0011).
--   5. Table comment_mentions (uniqueness comment_id + mentioned_user_id).
--   6. Extension du CHECK constraint notifications.type pour ajouter
--      'mention'.
--   7. Trigger notification mention.
--   8. RPC search_mentionable_users(p_query) pour le dropdown frontend.
--
-- Aligné sur le schéma réel : notifications utilise les colonnes
-- (user_id, type, title, message, link_url, related_id, actor_id).
-- Liens ancrés au format /app/communaute/{post_id}#comment-{id} pour
-- pouvoir scroller au commentaire.
--
-- Idempotente.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Colonnes parent_comment_id + replies_count
-- ---------------------------------------------------------------------
alter table public.post_comments
  add column if not exists parent_comment_id uuid
  references public.post_comments(id) on delete cascade;

create index if not exists idx_post_comments_parent
  on public.post_comments(parent_comment_id)
  where parent_comment_id is not null;

alter table public.post_comments
  add column if not exists replies_count integer not null default 0;

-- Backfill replies_count si le projet est déjà peuplé (idempotent — sur une
-- base vierge, c'est un no-op).
update public.post_comments parent
set replies_count = sub.cnt
from (
  select parent_comment_id, count(*)::int as cnt
  from public.post_comments
  where parent_comment_id is not null
  group by parent_comment_id
) sub
where parent.id = sub.parent_comment_id
  and parent.replies_count <> sub.cnt;

-- ---------------------------------------------------------------------
-- 2. Trigger maintien replies_count
-- ---------------------------------------------------------------------
create or replace function public.update_comment_replies_count()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if TG_OP = 'INSERT' and NEW.parent_comment_id is not null then
    update public.post_comments
      set replies_count = replies_count + 1
      where id = NEW.parent_comment_id;
  elsif TG_OP = 'DELETE' and OLD.parent_comment_id is not null then
    update public.post_comments
      set replies_count = greatest(replies_count - 1, 0)
      where id = OLD.parent_comment_id;
  end if;
  return coalesce(NEW, OLD);
end;
$$;

drop trigger if exists trg_comment_replies_count on public.post_comments;
create trigger trg_comment_replies_count
  after insert or delete on public.post_comments
  for each row execute function public.update_comment_replies_count();

-- ---------------------------------------------------------------------
-- 3. Trigger : interdit le 3e niveau
--    Si on tente d'attacher une réponse à un comment qui a déjà un parent,
--    on raise. Comme ça on garantit max 2 niveaux : root + 1 niveau de
--    réponses.
-- ---------------------------------------------------------------------
create or replace function public.enforce_max_2_comment_levels()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if NEW.parent_comment_id is not null then
    if exists (
      select 1 from public.post_comments
      where id = NEW.parent_comment_id
        and parent_comment_id is not null
    ) then
      raise exception 'Imbrication des commentaires limitée à 2 niveaux.'
        using errcode = 'check_violation';
    end if;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_enforce_max_2_comment_levels on public.post_comments;
create trigger trg_enforce_max_2_comment_levels
  before insert or update on public.post_comments
  for each row execute function public.enforce_max_2_comment_levels();

-- ---------------------------------------------------------------------
-- 4. Trigger notification "X a répondu à ton commentaire"
--    Type : reply_to_comment (déjà dans la CHECK constraint depuis 0017,
--    et existait déjà dans le périmètre 0011).
--    Lien : /app/communaute/{post_id}#comment-{id}
-- ---------------------------------------------------------------------
create or replace function public.handle_comment_reply_notification()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_parent_owner uuid;
  v_actor_name   text;
  v_excerpt      text;
begin
  if NEW.parent_comment_id is null then
    return NEW;
  end if;

  select user_id into v_parent_owner
    from public.post_comments
    where id = NEW.parent_comment_id;

  -- Pas d'auto-notif (l'auteur répond à son propre commentaire).
  if v_parent_owner is null or v_parent_owner = NEW.user_id then
    return NEW;
  end if;

  v_actor_name := public.notif_display_name(NEW.user_id);
  v_excerpt    := public.notif_excerpt(NEW.content, 120);

  insert into public.notifications
    (user_id, type, title, message, link_url, related_id, actor_id)
  values (
    v_parent_owner,
    'reply_to_comment',
    coalesce(v_actor_name, 'Quelqu''un') || ' a répondu à ton commentaire',
    coalesce(nullif(v_excerpt, ''), 'Nouvelle réponse.'),
    '/app/communaute/' || NEW.post_id::text || '#comment-' || NEW.id::text,
    NEW.id,
    NEW.user_id
  );

  return NEW;
end;
$$;

drop trigger if exists trg_notify_comment_reply on public.post_comments;
create trigger trg_notify_comment_reply
  after insert on public.post_comments
  for each row execute function public.handle_comment_reply_notification();

-- ---------------------------------------------------------------------
-- 5. Étendre CHECK constraint notifications.type pour ajouter 'mention'
--    Doit conserver tous les types déjà autorisés (cumul des migrations
--    0011 et 0017).
-- ---------------------------------------------------------------------
do $$ begin
  alter table public.notifications
    drop constraint if exists notifications_type_check;
exception when undefined_object then null; end $$;

alter table public.notifications
  add constraint notifications_type_check
  check (type in (
    'new_post',
    'new_resource',
    'new_formation',
    'new_article',
    'comment_on_post',
    'like_on_post',
    'reply_to_comment',
    'weekly_recap',
    'event_announcement',
    'event_reminder_1day',
    'event_reminder_today',
    'mention'
  ));

-- ---------------------------------------------------------------------
-- 6. Table comment_mentions
--    Stocke les mentions @ d'un commentaire vers un membre.
--    Servira aussi à alimenter le compteur "mentions reçues" et les
--    notifications.
-- ---------------------------------------------------------------------
create table if not exists public.comment_mentions (
  id                  uuid primary key default gen_random_uuid(),
  comment_id          uuid not null references public.post_comments(id) on delete cascade,
  mentioned_user_id   uuid not null references auth.users(id) on delete cascade,
  created_at          timestamptz not null default now(),
  unique (comment_id, mentioned_user_id)
);

create index if not exists idx_comment_mentions_user
  on public.comment_mentions(mentioned_user_id);

create index if not exists idx_comment_mentions_comment
  on public.comment_mentions(comment_id);

alter table public.comment_mentions enable row level security;

drop policy if exists "comment_mentions read all"           on public.comment_mentions;
drop policy if exists "comment_mentions write own comment"  on public.comment_mentions;
drop policy if exists "comment_mentions delete own comment" on public.comment_mentions;

-- Lecture : tout membre authentifié (utile pour afficher les mentions
-- d'un commentaire visible).
create policy "comment_mentions read all"
  on public.comment_mentions
  for select
  to authenticated
  using (true);

-- Insert : uniquement l'auteur du commentaire.
create policy "comment_mentions write own comment"
  on public.comment_mentions
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.post_comments c
      where c.id = comment_id and c.user_id = auth.uid()
    )
  );

-- Delete : uniquement l'auteur du commentaire (peu utile, mais cohérent
-- pour permettre à l'auteur de retirer une mention sur son propre comment).
create policy "comment_mentions delete own comment"
  on public.comment_mentions
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.post_comments c
      where c.id = comment_id and c.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------
-- 7. Trigger notification "X t'a mentionné(e) dans un commentaire"
--    Pas de notif si on se mentionne soi-même.
-- ---------------------------------------------------------------------
create or replace function public.handle_mention_notification()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_comment_owner uuid;
  v_post_id       uuid;
  v_actor_name    text;
  v_excerpt       text;
begin
  select c.user_id, c.post_id, public.notif_excerpt(c.content, 120)
    into v_comment_owner, v_post_id, v_excerpt
    from public.post_comments c
    where c.id = NEW.comment_id;

  if v_comment_owner is null then
    return NEW;
  end if;

  -- Pas d'auto-notif si le membre se mentionne lui-même.
  if v_comment_owner = NEW.mentioned_user_id then
    return NEW;
  end if;

  v_actor_name := public.notif_display_name(v_comment_owner);

  insert into public.notifications
    (user_id, type, title, message, link_url, related_id, actor_id)
  values (
    NEW.mentioned_user_id,
    'mention',
    coalesce(v_actor_name, 'Quelqu''un') || ' t''a mentionné(e) dans un commentaire',
    coalesce(nullif(v_excerpt, ''), 'Nouvelle mention.'),
    '/app/communaute/' || v_post_id::text || '#comment-' || NEW.comment_id::text,
    NEW.comment_id,
    v_comment_owner
  );

  return NEW;
end;
$$;

drop trigger if exists trg_notify_mention on public.comment_mentions;
create trigger trg_notify_mention
  after insert on public.comment_mentions
  for each row execute function public.handle_mention_notification();

-- ---------------------------------------------------------------------
-- 8. RPC search_mentionable_users(p_query)
--    Retourne jusqu'à 8 membres actifs dont le nom contient p_query.
--    Préfixe-match prioritaire (ranked en premier).
-- ---------------------------------------------------------------------
create or replace function public.search_mentionable_users(p_query text default '')
returns table (
  id          uuid,
  full_name   text,
  first_name  text,
  last_name   text,
  avatar_url  text,
  bio         text,
  is_verified boolean
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with norm as (
    select trim(coalesce(p_query, '')) as q
  )
  select
    p.id,
    nullif(trim(coalesce(p.first_name, '') || ' ' || coalesce(p.last_name, '')), '') as full_name,
    p.first_name,
    p.last_name,
    p.avatar_url,
    p.bio,
    coalesce(p.is_verified, false) as is_verified
  from public.profiles p
  inner join public.subscriptions s on s.user_id = p.id
  cross join norm
  where s.status in ('active', 'trialing')
    and p.role in ('member', 'admin')
    and (
      norm.q = '' or
      lower(coalesce(p.first_name, '') || ' ' || coalesce(p.last_name, '')) like '%' || lower(norm.q) || '%' or
      lower(coalesce(p.first_name, '')) like lower(norm.q) || '%' or
      lower(coalesce(p.last_name, '')) like lower(norm.q) || '%'
    )
  order by
    case when lower(coalesce(p.first_name, '')) like lower((select q from norm)) || '%' then 0 else 1 end,
    p.first_name nulls last,
    p.last_name nulls last
  limit 8;
$$;

revoke all on function public.search_mentionable_users(text) from public;
grant execute on function public.search_mentionable_users(text) to authenticated;
