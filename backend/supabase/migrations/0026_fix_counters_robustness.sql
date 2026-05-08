-- =====================================================================
-- Le Club IA — Migration 0026 : Robustesse des compteurs (likes/comments)
--
-- Pourquoi ?
--   Les fonctions de trigger bump_post_likes_count et bump_post_comments_count
--   ne sont pas SECURITY DEFINER. Lorsqu'un utilisateur like le post de
--   quelqu'un d'autre, le trigger tente d'UPDATE la table public.posts.
--   L'RLS bloque cette modification (on ne peut update que ses propres posts),
--   ce qui rend les compteurs asynchrones (0 au lieu de 1 après refresh).
--
-- Solution :
--   Passer ces fonctions en SECURITY DEFINER et forcer le search_path.
--   Recalculer tous les compteurs actuels pour corriger les erreurs passées.
-- =====================================================================

-- 1. Redéfinition des fonctions de comptage avec SECURITY DEFINER
create or replace function public.bump_post_likes_count()
returns trigger
language plpgsql
security definer
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

create or replace function public.bump_post_comments_count()
returns trigger
language plpgsql
security definer
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

-- 2. Recalcul massif des compteurs (Audit & Correction)
update public.posts p
set 
  likes_count = (select count(*) from public.post_likes where post_id = p.id),
  comments_count = (select count(*) from public.post_comments where post_id = p.id);

-- 3. RPC pour resynchroniser manuellement si besoin (ADMIN ONLY)
create or replace function public.resync_all_post_counters()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Accès admin requis.' using errcode = '42501';
  end if;

  update public.posts p
  set 
    likes_count = (select count(*) from public.post_likes where post_id = p.id),
    comments_count = (select count(*) from public.post_comments where post_id = p.id);
end;
$$;

revoke execute on function public.resync_all_post_counters() from public;
grant execute on function public.resync_all_post_counters() to authenticated;
