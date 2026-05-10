-- =====================================================================
-- Migration 0038 — Renforcer la synchronisation des compteurs de likes
--                  + RPC pour les avatars likeurs (preview LinkedIn-style).
--
-- État au moment de la migration :
--   - bump_post_likes_count() est déjà SECURITY DEFINER (cf. 0026).
--   - post_likes a UNIQUE (post_id, user_id) (cf. 0001).
--   - formation_reviews a UNIQUE (user_id, formation_id) (cf. 0027).
--
-- Ce qu'apporte cette migration :
--   1. Réécriture défensive du trigger (COALESCE / GREATEST) pour blinder
--      le compteur même si likes_count devenait NULL pour une raison
--      exotique (migration accidentelle, NULL inséré manuellement…).
--   2. RPC get_post_likers(post_id, limit) : liste paginée des likeurs
--      pour le modal "Personnes qui ont aimé".
--   3. RPC get_post_likers_preview(post_ids[]) : 3 likeurs les plus
--      récents pour chaque post, pour la preview façon LinkedIn sous
--      chaque card.
--   4. Recompute des compteurs : filet de sécurité au cas où des
--      désyncs subsisteraient en prod.
-- =====================================================================

-- 1. Réécriture défensive du trigger
create or replace function public.bump_post_likes_count()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if TG_OP = 'INSERT' then
    update public.posts
       set likes_count = coalesce(likes_count, 0) + 1
     where id = new.post_id;
    return new;
  elsif TG_OP = 'DELETE' then
    update public.posts
       set likes_count = greatest(0, coalesce(likes_count, 0) - 1)
     where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$;

-- Recrée le trigger pour s'assurer qu'il est bien rattaché à la fonction
-- mise à jour (no-op si déjà bon).
drop trigger if exists trg_post_likes_count on public.post_likes;
create trigger trg_post_likes_count
  after insert or delete on public.post_likes
  for each row execute function public.bump_post_likes_count();

-- 2. RPC get_post_likers — liste complète paginée pour le modal.
create or replace function public.get_post_likers(
  p_post_id uuid,
  p_limit integer default 50
)
returns table (
  user_id     uuid,
  first_name  text,
  last_name   text,
  avatar_url  text,
  is_verified boolean,
  liked_at    timestamptz
)
language sql
security definer
set search_path = public, pg_temp
as $$
  select
    pr.id          as user_id,
    pr.first_name,
    pr.last_name,
    pr.avatar_url,
    pr.is_verified,
    pl.created_at  as liked_at
  from public.post_likes pl
  join public.profiles   pr on pr.id = pl.user_id
  where pl.post_id = p_post_id
  order by pl.created_at desc
  limit greatest(1, least(coalesce(p_limit, 50), 200));
$$;

grant execute on function public.get_post_likers(uuid, integer) to authenticated;

-- 3. RPC get_post_likers_preview — top 3 par post pour la preview en feed.
create or replace function public.get_post_likers_preview(
  p_post_ids uuid[]
)
returns table (
  post_id    uuid,
  user_id    uuid,
  first_name text,
  last_name  text,
  avatar_url text,
  rn         integer
)
language sql
security definer
set search_path = public, pg_temp
as $$
  select sub.post_id, sub.user_id, sub.first_name, sub.last_name, sub.avatar_url, sub.rn
  from (
    select
      pl.post_id,
      pr.id        as user_id,
      pr.first_name,
      pr.last_name,
      pr.avatar_url,
      row_number() over (
        partition by pl.post_id
        order by pl.created_at desc
      )::integer as rn
    from public.post_likes pl
    join public.profiles   pr on pr.id = pl.user_id
    where pl.post_id = any(p_post_ids)
  ) sub
  where sub.rn <= 3;
$$;

grant execute on function public.get_post_likers_preview(uuid[]) to authenticated;

-- 4. Filet de sécurité : recompute des compteurs.
update public.posts p
   set likes_count = (
         select count(*)
           from public.post_likes pl
          where pl.post_id = p.id
       )
 where coalesce(likes_count, -1) <> (
         select count(*)
           from public.post_likes pl
          where pl.post_id = p.id
       );
