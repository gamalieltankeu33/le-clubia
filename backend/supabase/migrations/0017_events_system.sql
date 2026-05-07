-- =====================================================================
-- Le Club IA — Migration 0017 : Système d'événements + emails transactionnels
--
-- Périmètre :
--   1. Table events (coaching live, masterclass, Q&A) + bucket storage covers
--   2. Préférences email RGPD sur profiles (3 toggles opt-in/out)
--   3. Extension du type notifications (weekly_recap, event_announcement,
--      event_reminder)
--   4. Triggers de notif in-app au moment de la publication d'un récap
--      weekly OU d'un event publié
--   5. Cron events-daily-reminders à 9h UTC (J-1 + jour J)
--
-- Idempotente.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Préférences email RGPD sur profiles (opt-out individuel par type)
-- ---------------------------------------------------------------------
alter table public.profiles
  add column if not exists email_pref_weekly_recap boolean not null default true;

alter table public.profiles
  add column if not exists email_pref_event_announce boolean not null default true;

alter table public.profiles
  add column if not exists email_pref_event_reminders boolean not null default true;

-- ---------------------------------------------------------------------
-- 2. Extension du CHECK constraint sur notifications.type
--    Ajout des nouveaux types weekly_recap, event_announcement,
--    event_reminder_1day, event_reminder_today.
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
    'event_reminder_today'
  ));

-- ---------------------------------------------------------------------
-- 3. Table events
-- ---------------------------------------------------------------------
create table if not exists public.events (
  id                    uuid primary key default gen_random_uuid(),
  title                 text not null,
  description           text,
  type                  text not null default 'coaching'
                        check (type in ('coaching', 'masterclass', 'qa', 'other')),
  speaker_name          text,
  speaker_bio           text,
  starts_at             timestamptz not null,
  duration_minutes      integer not null default 90 check (duration_minutes > 0),
  zoom_url              text,
  cover_image_url       text,
  is_published          boolean not null default false,
  notify_on_publish     boolean not null default true,
  notify_1_day_before   boolean not null default true,
  notify_on_day         boolean not null default true,
  -- Marqueurs idempotents : empêchent l'envoi multiple des emails / notifs
  -- pour un même event si l'admin re-clique "Publier" ou si le cron est
  -- relancé.
  announcement_sent_at  timestamptz,
  reminder_1day_sent_at timestamptz,
  reminder_today_sent_at timestamptz,
  created_by            uuid references auth.users(id) on delete set null,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists idx_events_starts_at
  on public.events(starts_at)
  where is_published = true;

create index if not exists idx_events_published_upcoming
  on public.events(is_published, starts_at);

drop trigger if exists trg_events_updated_at on public.events;
create trigger trg_events_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

alter table public.events enable row level security;

drop policy if exists "events read members" on public.events;
create policy "events read members"
  on public.events
  for select
  using (
    is_published = true
    and (public.is_active_member(auth.uid()) or public.is_admin(auth.uid()))
    or public.is_admin(auth.uid())
  );

drop policy if exists "events admin all" on public.events;
create policy "events admin all"
  on public.events
  for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- ---------------------------------------------------------------------
-- 4. Bucket storage event-covers (public, 5 Mo, image)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'event-covers',
  'event-covers',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "event-covers public read" on storage.objects;
create policy "event-covers public read" on storage.objects
  for select using (bucket_id = 'event-covers');

drop policy if exists "event-covers admin insert" on storage.objects;
create policy "event-covers admin insert" on storage.objects
  for insert with check (
    bucket_id = 'event-covers' and public.is_admin(auth.uid())
  );

drop policy if exists "event-covers admin update" on storage.objects;
create policy "event-covers admin update" on storage.objects
  for update using (
    bucket_id = 'event-covers' and public.is_admin(auth.uid())
  ) with check (
    bucket_id = 'event-covers' and public.is_admin(auth.uid())
  );

drop policy if exists "event-covers admin delete" on storage.objects;
create policy "event-covers admin delete" on storage.objects
  for delete using (
    bucket_id = 'event-covers' and public.is_admin(auth.uid())
  );

-- ---------------------------------------------------------------------
-- 5. Trigger : notif in-app au moment où un weekly-recap est publié
--    (les autres news_articles déclenchent déjà new_article via 0011)
-- ---------------------------------------------------------------------
create or replace function public.notify_on_weekly_recap()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  is_publish boolean := false;
begin
  if NEW.category <> 'weekly-recap' then
    return NEW;
  end if;
  if TG_OP = 'INSERT' and NEW.is_published then
    is_publish := true;
  elsif TG_OP = 'UPDATE'
    and NEW.is_published = true
    and coalesce(OLD.is_published, false) = false then
    is_publish := true;
  end if;

  if is_publish then
    insert into public.notifications
      (user_id, type, title, message, link_url, related_id, actor_id)
    select
      p.id,
      'weekly_recap',
      '📰 Le récap IA de la semaine est dispo',
      'Découvre les actualités IA marquantes de cette semaine.',
      '/app/actualites/' || NEW.slug,
      NEW.id,
      null
    from public.profiles p
    inner join public.subscriptions s on s.user_id = p.id
    where s.status in ('active', 'trialing');
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_notify_weekly_recap on public.news_articles;
create trigger trg_notify_weekly_recap
  after insert or update on public.news_articles
  for each row execute function public.notify_on_weekly_recap();

-- Le trigger existant trg_notify_new_article (migration 0011) notifie
-- TOUTE news publiée. Pour éviter le doublon sur les weekly-recap, on
-- met à jour la fonction existante pour qu'elle skip les weekly-recap.
create or replace function public.handle_new_article_notification()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_should_notify boolean := false;
begin
  -- Skip les weekly-recap : ils ont leur propre trigger spécialisé.
  if NEW.category = 'weekly-recap' then
    return NEW;
  end if;

  if TG_OP = 'INSERT' then
    v_should_notify := NEW.is_published;
  elsif TG_OP = 'UPDATE' then
    v_should_notify := NEW.is_published and not coalesce(OLD.is_published, false);
  end if;

  if not v_should_notify then
    return NEW;
  end if;

  perform public.notify_active_members(
    'new_article',
    NEW.title,
    coalesce(nullif(public.notif_excerpt(NEW.content, 140), ''), 'Une nouvelle actualité est disponible.'),
    '/app/actualites/' || NEW.slug,
    NEW.id,
    null
  );
  return NEW;
end;
$$;

-- ---------------------------------------------------------------------
-- 6. Trigger : notif in-app au moment où un event est publié
--    (transition is_published false → true OU INSERT déjà publié)
-- ---------------------------------------------------------------------
create or replace function public.notify_on_event_published()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  is_publish boolean := false;
  start_label text;
begin
  if TG_OP = 'INSERT' and NEW.is_published then
    is_publish := true;
  elsif TG_OP = 'UPDATE'
    and NEW.is_published = true
    and coalesce(OLD.is_published, false) = false then
    is_publish := true;
  end if;

  if not is_publish then
    return NEW;
  end if;

  start_label := to_char(NEW.starts_at at time zone 'UTC', 'DD/MM/YYYY HH24h"00"');

  insert into public.notifications
    (user_id, type, title, message, link_url, related_id, actor_id)
  select
    p.id,
    'event_announcement',
    '🎯 Nouveau coaching live programmé',
    NEW.title || ' — ' || start_label || ' UTC',
    '/app/events',
    NEW.id,
    null
  from public.profiles p
  inner join public.subscriptions s on s.user_id = p.id
  where s.status in ('active', 'trialing');

  return NEW;
end;
$$;

drop trigger if exists trg_notify_event_published on public.events;
create trigger trg_notify_event_published
  after insert or update on public.events
  for each row execute function public.notify_on_event_published();

-- ---------------------------------------------------------------------
-- 7. Cron events-daily-reminders : tous les jours à 9h UTC
--    AVANT D'EXÉCUTER, REMPLACE :
--      <TON_PROJECT_REF>      par la référence projet
--      <TON_SERVICE_ROLE_KEY> par la clé service_role
-- ---------------------------------------------------------------------
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Cleanup ancien cron homonyme
do $$
declare jid bigint;
begin
  for jid in select jobid from cron.job where jobname = 'events-daily-reminders'
  loop
    perform cron.unschedule(jid);
  end loop;
end $$;

select cron.schedule(
  'events-daily-reminders',
  '0 9 * * *',
  $cmd$
    select net.http_post(
      url := 'https://<TON_PROJECT_REF>.supabase.co/functions/v1/events-reminder-cron',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer <TON_SERVICE_ROLE_KEY>'
      ),
      body := jsonb_build_object('source', 'cron-daily-9h')
    ) as request_id;
  $cmd$
);
