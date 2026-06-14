-- =====================================================================
-- Le Club IA — Migration 0016 : Système de points + classement mensuel V2
--
-- Objectif :
--   • Tracker les actions membre (post, comment, like reçu, chapitre fini)
--     pour identifier le membre le plus IMPACTANT (pas le plus volumineux).
--   • Cockpit admin uniquement (members ne voient pas le classement complet).
--   • Score final = points bruts × 3 multiplicateurs qualité :
--       - Engagement   : likes+commentaires reçus / posts publiés
--       - Régularité   : jours actifs sur 30
--       - Réciprocité  : commentaires donnés / likes reçus
--   • Sélection manuelle du gagnant par l'admin → prime 50 000 FCFA.
--
-- Tables :
--   - member_points     : log append-only des points (admin only RLS).
--   - monthly_winners   : 1 gagnant par mois (lecture publique pour le badge).
--
-- Triggers (4 SECURITY DEFINER, search_path verrouillé) :
--   • posts INSERT                      → +10 pts (post_published)
--   • post_comments INSERT              → +3  pts (comment_added)
--   • post_likes INSERT                 → +2  pts au RECEPTEUR (like_received)
--   • user_formation_progress completed → +5  pts (chapter_completed)
--
-- RPC :
--   • get_monthly_leaderboard(month_year)   → top 50 + multiplicateurs (admin only)
--   • get_monthly_global_stats(month_year)  → KPIs + top hashtag       (admin only)
--   • get_my_monthly_points(month_year)     → mes points + rang        (tout user)
--
-- Idempotente.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Table member_points (log append-only)
-- ---------------------------------------------------------------------
create table if not exists public.member_points (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  points        integer not null check (points > 0),
  reason        text not null,
  reference_id  uuid,
  created_at    timestamptz not null default now()
);

create index if not exists idx_member_points_user_created
  on public.member_points(user_id, created_at desc);

create index if not exists idx_member_points_month
  on public.member_points((to_char(created_at, 'YYYY-MM')), user_id);

alter table public.member_points enable row level security;

-- RLS strict : seuls les admins peuvent lire/écrire la table directement.
-- Les triggers sont SECURITY DEFINER → ils bypassent la RLS pour l'INSERT
-- automatique. Les membres voient leurs propres points via la RPC
-- get_my_monthly_points (SECURITY DEFINER, filtre sur auth.uid()).
drop policy if exists "member_points admin select" on public.member_points;
create policy "member_points admin select"
  on public.member_points
  for select
  using (public.is_admin(auth.uid()));

drop policy if exists "member_points admin all" on public.member_points;
create policy "member_points admin all"
  on public.member_points
  for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- ---------------------------------------------------------------------
-- 2. Table monthly_winners (1 par mois, choisi par l'admin)
-- ---------------------------------------------------------------------
create table if not exists public.monthly_winners (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  month_year      text not null,
  prize_amount    integer not null default 50000,
  prize_currency  text not null default 'XOF',
  notes           text,
  selected_by     uuid references auth.users(id) on delete set null,
  selected_at     timestamptz not null default now(),
  unique (month_year)
);

-- Backfill safe : ajoute la colonne notes si une version antérieure existait
alter table public.monthly_winners
  add column if not exists notes text;

create index if not exists idx_monthly_winners_user
  on public.monthly_winners(user_id);

alter table public.monthly_winners enable row level security;

-- Lecture pour tous les users authentifiés (badge "Membre du mois" public).
drop policy if exists "monthly_winners read all" on public.monthly_winners;
create policy "monthly_winners read all"
  on public.monthly_winners
  for select
  using (auth.uid() is not null);

drop policy if exists "monthly_winners admin write" on public.monthly_winners;
create policy "monthly_winners admin write"
  on public.monthly_winners
  for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- ---------------------------------------------------------------------
-- 3. Trigger : post publié → +10 points à l'auteur
-- ---------------------------------------------------------------------
create or replace function public.points_on_post_published()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.member_points (user_id, points, reason, reference_id)
  values (new.user_id, 10, 'post_published', new.id);
  return new;
end;
$$;

drop trigger if exists trg_points_post_published on public.posts;
create trigger trg_points_post_published
  after insert on public.posts
  for each row execute function public.points_on_post_published();

-- ---------------------------------------------------------------------
-- 4. Trigger : commentaire ajouté → +3 points à l'auteur
-- ---------------------------------------------------------------------
create or replace function public.points_on_comment_added()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.member_points (user_id, points, reason, reference_id)
  values (new.user_id, 3, 'comment_added', new.id);
  return new;
end;
$$;

drop trigger if exists trg_points_comment_added on public.post_comments;
create trigger trg_points_comment_added
  after insert on public.post_comments
  for each row execute function public.points_on_comment_added();

-- ---------------------------------------------------------------------
-- 5. Trigger : like reçu → +2 points à l'auteur du POST liké
--    (auto-like ignoré pour éviter la triche)
-- ---------------------------------------------------------------------
create or replace function public.points_on_like_received()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  post_owner uuid;
begin
  select user_id into post_owner
    from public.posts
    where id = new.post_id;
  if post_owner is not null and post_owner <> new.user_id then
    insert into public.member_points (user_id, points, reason, reference_id)
    values (post_owner, 2, 'like_received', new.post_id);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_points_like_received on public.post_likes;
create trigger trg_points_like_received
  after insert on public.post_likes
  for each row execute function public.points_on_like_received();

-- ---------------------------------------------------------------------
-- 6. Trigger : chapitre formation complété → +5 points
-- ---------------------------------------------------------------------
create or replace function public.points_on_chapter_completed()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.completed = true and (TG_OP = 'INSERT' or coalesce(old.completed, false) = false) then
    insert into public.member_points (user_id, points, reason, reference_id)
    values (new.user_id, 5, 'chapter_completed', new.chapter_id);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_points_chapter_completed on public.user_formation_progress;
create trigger trg_points_chapter_completed
  after insert or update on public.user_formation_progress
  for each row execute function public.points_on_chapter_completed();

-- ---------------------------------------------------------------------
-- 7. RPC : classement mensuel V2 avec multiplicateurs qualité (ADMIN ONLY)
-- ---------------------------------------------------------------------
-- Score final = raw_points × engagement_score × regularity_score × reciprocity_score
--
-- engagement_score  : (likes + comments reçus) / posts → capé à 5 (cap haut)
-- regularity_score  : 0.5 + (active_days / 30) × 1.5 → range [0.5, 2]
-- reciprocity_score : 0.5 + (comments donnés / likes reçus) → capé à 2
--
-- → Récompense l'IMPACT (réactions reçues), la RÉGULARITÉ (présence quotidienne)
-- et la RÉCIPROCITÉ (interaction avec les autres). Un membre qui spamme 100
-- posts d'1 ligne sans engagement aura un score raw élevé mais multiplicateurs
-- bas → score final modéré. Un membre avec 5 posts très commentés battra le
-- spammeur.
create or replace function public.get_monthly_leaderboard(
  p_month_year text default to_char(now() at time zone 'UTC', 'YYYY-MM')
)
returns table (
  user_id            uuid,
  first_name         text,
  last_name          text,
  full_name          text,
  avatar_url         text,
  is_verified        boolean,
  raw_points         bigint,
  posts_count        bigint,
  comments_count     bigint,
  likes_received     bigint,
  chapters_completed bigint,
  active_days        bigint,
  engagement_score   numeric,
  regularity_score   numeric,
  reciprocity_score  numeric,
  final_score        numeric,
  rank               bigint
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  -- Garde admin : seul un admin peut consulter le classement complet
  if not public.is_admin(auth.uid()) then
    raise exception 'Accès admin requis.' using errcode = '42501';
  end if;

  return query
  with month_data as (
    select
      mp.user_id,
      sum(mp.points)::bigint                                                         as raw_points,
      count(distinct case when mp.reason = 'post_published'    then mp.reference_id end)::bigint as posts_count,
      count(distinct case when mp.reason = 'comment_added'     then mp.reference_id end)::bigint as comments_count,
      count(case when mp.reason = 'like_received'              then 1 end)::bigint              as likes_received,
      count(distinct case when mp.reason = 'chapter_completed' then mp.reference_id end)::bigint as chapters_completed,
      count(distinct (mp.created_at at time zone 'UTC')::date)::bigint                as active_days
    from public.member_points mp
    where to_char(mp.created_at at time zone 'UTC', 'YYYY-MM') = p_month_year
    group by mp.user_id
  ),
  scored as (
    select
      md.*,
      -- Engagement : (likes + comments reçus) / posts, capé à 5x
      case
        when md.posts_count > 0 then
          least(((md.likes_received + md.comments_count)::numeric / md.posts_count) / 3.0, 5.0)
        else 1.0
      end as engagement_score,
      -- Régularité : 0.5 (peu actif) à 2.0 (présent tous les jours)
      (0.5 + (least(md.active_days, 30)::numeric / 30.0) * 1.5) as regularity_score,
      -- Réciprocité : encourage à commenter les autres, capé à 2x
      case
        when md.likes_received > 0 then
          least(0.5 + (md.comments_count::numeric / md.likes_received), 2.0)
        else 1.0
      end as reciprocity_score
    from month_data md
  )
  select
    p.id        as user_id,
    p.first_name,
    p.last_name,
    trim(both ' ' from coalesce(p.first_name, '') || ' ' || coalesce(p.last_name, '')) as full_name,
    p.avatar_url,
    p.is_verified,
    coalesce(s.raw_points, 0)         as raw_points,
    coalesce(s.posts_count, 0)        as posts_count,
    coalesce(s.comments_count, 0)     as comments_count,
    coalesce(s.likes_received, 0)     as likes_received,
    coalesce(s.chapters_completed, 0) as chapters_completed,
    coalesce(s.active_days, 0)        as active_days,
    coalesce(s.engagement_score, 1)::numeric  as engagement_score,
    coalesce(s.regularity_score, 0.5)::numeric as regularity_score,
    coalesce(s.reciprocity_score, 1)::numeric as reciprocity_score,
    coalesce(
      s.raw_points * s.engagement_score * s.regularity_score * s.reciprocity_score,
      0
    )::numeric as final_score,
    rank() over (
      order by coalesce(
        s.raw_points * s.engagement_score * s.regularity_score * s.reciprocity_score,
        0
      ) desc
    ) as rank
  from public.profiles p
  left join scored s on s.user_id = p.id
  where p.role in ('member', 'admin')
    and coalesce(s.raw_points, 0) > 0
  order by final_score desc nulls last
  limit 50;
end;
$$;

revoke execute on function public.get_monthly_leaderboard(text) from public;
grant execute on function public.get_monthly_leaderboard(text) to authenticated;

-- ---------------------------------------------------------------------
-- 8. RPC : stats globales du mois (ADMIN ONLY)
-- ---------------------------------------------------------------------
create or replace function public.get_monthly_global_stats(
  p_month_year text default to_char(now() at time zone 'UTC', 'YYYY-MM')
)
returns table (
  active_members        bigint,
  total_posts           bigint,
  total_comments        bigint,
  total_likes_received  bigint,
  formations_completed  bigint,
  total_active_days     bigint,
  top_hashtag           text
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Accès admin requis.' using errcode = '42501';
  end if;

  return query
  with stats as (
    select
      count(distinct mp.user_id)::bigint                                                       as active_members,
      count(distinct case when mp.reason = 'post_published'    then mp.reference_id end)::bigint as total_posts,
      count(distinct case when mp.reason = 'comment_added'     then mp.reference_id end)::bigint as total_comments,
      count(case when mp.reason = 'like_received'              then 1 end)::bigint              as total_likes_received,
      count(distinct case when mp.reason = 'chapter_completed' then mp.reference_id end)::bigint as formations_completed,
      count(distinct (mp.user_id, (mp.created_at at time zone 'UTC')::date))::bigint            as total_active_days
    from public.member_points mp
    where to_char(mp.created_at at time zone 'UTC', 'YYYY-MM') = p_month_year
  ),
  top_tag as (
    select tag, count(*)::bigint as cnt
    from (
      select unnest(p.hashtags) as tag
      from public.posts p
      where to_char(p.created_at at time zone 'UTC', 'YYYY-MM') = p_month_year
        and p.hashtags is not null
        and array_length(p.hashtags, 1) > 0
    ) t
    group by tag
    order by cnt desc
    limit 1
  )
  select
    s.active_members,
    s.total_posts,
    s.total_comments,
    s.total_likes_received,
    s.formations_completed,
    s.total_active_days,
    coalesce((select tag from top_tag), 'aucun') as top_hashtag
  from stats s;
end;
$$;

revoke execute on function public.get_monthly_global_stats(text) from public;
grant execute on function public.get_monthly_global_stats(text) to authenticated;

-- ---------------------------------------------------------------------
-- 9. RPC : mes points du mois en cours (tout user authentifié)
-- ---------------------------------------------------------------------
create or replace function public.get_my_monthly_points(
  p_month_year text default to_char(now() at time zone 'UTC', 'YYYY-MM')
)
returns table (
  total_points  bigint,
  rank          bigint,
  total_members bigint
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with monthly as (
    select user_id, sum(points)::bigint as total_points
    from public.member_points
    where to_char(created_at at time zone 'UTC', 'YYYY-MM') = p_month_year
    group by user_id
  ),
  ranked as (
    select
      user_id,
      total_points,
      rank() over (order by total_points desc) as rank
    from monthly
  )
  select
    coalesce(r.total_points, 0)                              as total_points,
    coalesce(r.rank, (select count(*) + 1 from ranked))::bigint as rank,
    (select count(*) from ranked)::bigint                    as total_members
  from (select 1) dummy
  left join ranked r on r.user_id = auth.uid();
$$;

revoke execute on function public.get_my_monthly_points(text) from public;
grant execute on function public.get_my_monthly_points(text) to authenticated;

-- ---------------------------------------------------------------------
-- 10. RPC : détail journalier d'un membre pour un mois (ADMIN ONLY)
--      Utilisé par la modale "Voir détail" sur la page classement.
-- ---------------------------------------------------------------------
create or replace function public.get_member_daily_activity(
  p_user_id    uuid,
  p_month_year text default to_char(now() at time zone 'UTC', 'YYYY-MM')
)
returns table (
  day      date,
  points   bigint,
  actions  bigint
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Accès admin requis.' using errcode = '42501';
  end if;

  return query
  select
    (mp.created_at at time zone 'UTC')::date as day,
    sum(mp.points)::bigint                   as points,
    count(*)::bigint                         as actions
  from public.member_points mp
  where mp.user_id = p_user_id
    and to_char(mp.created_at at time zone 'UTC', 'YYYY-MM') = p_month_year
  group by (mp.created_at at time zone 'UTC')::date
  order by day asc;
end;
$$;

revoke execute on function public.get_member_daily_activity(uuid, text) from public;
grant execute on function public.get_member_daily_activity(uuid, text) to authenticated;
