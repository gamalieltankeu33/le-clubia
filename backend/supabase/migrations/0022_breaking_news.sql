-- =====================================================================
-- Le Club IA — Migration 0022 : nouvelle catégorie 'breaking-news'
--
-- Objectif :
--   L'admin peut désormais déclencher manuellement l'agent IA pour
--   publier UN article focus sur l'actualité IA la plus marquante des
--   dernières 48h (vs récap hebdo automatique du dimanche). Ces
--   articles ont la catégorie 'breaking-news' et un nouveau flag
--   `published_by_admin = true` pour distinguer les déclenchements
--   manuels du cron.
--
-- Périmètre :
--   1. Colonne news_articles.published_by_admin (boolean, default false).
--   2. CHECK constraint sur news_articles.category (formalise les
--      valeurs autorisées + ajoute 'breaking-news').
--   3. Trigger notify_on_weekly_recap : étendu pour notifier in-app
--      les 2 catégories ('weekly-recap', 'breaking-news') avec des
--      messages distincts.
--   4. Trigger handle_new_article_notification : skip aussi
--      'breaking-news' pour éviter la double notif (sinon le membre
--      reçoit `new_article` ET `weekly_recap`).
--
-- Idempotente.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Colonne published_by_admin
-- ---------------------------------------------------------------------
alter table public.news_articles
  add column if not exists published_by_admin boolean not null default false;

-- ---------------------------------------------------------------------
-- 2. CHECK constraint sur category
--    On formalise la liste des valeurs autorisées. Les categories
--    historiques détectées dans le code : 'weekly-recap' (récap auto),
--    plus les valeurs éditoriales libres ('news', 'tutorial', 'opinion',
--    'analysis') et la nouvelle 'breaking-news'.
--    Drop préalable pour idempotence (si une version antérieure existait).
-- ---------------------------------------------------------------------
do $$ begin
  alter table public.news_articles
    drop constraint if exists news_articles_category_check;
exception when undefined_object then null; end $$;

alter table public.news_articles
  add constraint news_articles_category_check
  check (category in (
    'weekly-recap',
    'breaking-news',
    'news',
    'tutorial',
    'opinion',
    'analysis'
  ));

-- ---------------------------------------------------------------------
-- 3. Trigger notify_on_weekly_recap : étendu aux 2 catégories
--    Notification in-app distincte selon la catégorie. Réutilise le
--    type existant 'weekly_recap' côté table notifications (pas besoin
--    d'étendre la CHECK constraint, on regroupe sous le même type
--    sémantique : "actualité IA importante poussée à tous les membres").
-- ---------------------------------------------------------------------
create or replace function public.notify_on_weekly_recap()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  is_publish boolean := false;
  notif_title text;
  notif_message text;
begin
  if NEW.category not in ('weekly-recap', 'breaking-news') then
    return NEW;
  end if;
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

  if NEW.category = 'breaking-news' then
    notif_title := '🔥 Actu IA chaude du moment';
    notif_message := coalesce(
      nullif(public.notif_excerpt(NEW.content, 140), ''),
      'Une actualité IA importante vient d''être publiée.'
    );
  else
    notif_title := '📰 Le récap IA de la semaine est dispo';
    notif_message := 'Découvre les actualités IA marquantes de cette semaine.';
  end if;

  insert into public.notifications
    (user_id, type, title, message, link_url, related_id, actor_id)
  select
    p.id,
    'weekly_recap',
    notif_title,
    notif_message,
    '/app/actualites/' || NEW.slug,
    NEW.id,
    null
  from public.profiles p
  inner join public.subscriptions s on s.user_id = p.id
  where s.status in ('active', 'trialing');

  return NEW;
end;
$$;

-- ---------------------------------------------------------------------
-- 4. Trigger handle_new_article_notification : skip aussi 'breaking-news'
--    Sans ça, un breaking-news déclencherait deux notifs ('new_article'
--    via 0011 + 'weekly_recap' via le trigger ci-dessus).
-- ---------------------------------------------------------------------
create or replace function public.handle_new_article_notification()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_should_notify boolean := false;
begin
  -- Skip les categories qui ont leur propre trigger spécialisé
  -- (notify_on_weekly_recap gère weekly-recap + breaking-news).
  if NEW.category in ('weekly-recap', 'breaking-news') then
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
