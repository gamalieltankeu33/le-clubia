-- =====================================================================
-- Le Club IA — Migration 0021 : RPC get_my_liked_post_ids
--
-- Pourquoi cette RPC ?
--   Aujourd'hui le frontend hydrate `liked_by_me` via un SELECT direct
--   sur post_likes : `select post_id from post_likes where user_id = ?
--   and post_id in (...)`. Cette lecture passe par la policy RLS
--   `likes select members` (cf. 0001) qui exige `is_active_member`
--   ou `is_admin`. Dans certains cas (membre qui vient de réactiver,
--   trialing avec current_period_end limite, état réseau intermédiaire),
--   la requête peut retourner 0 ligne alors que les likes existent
--   bien en base — l'utilisateur voit alors `liked_by_me = false`
--   après refresh. Symptôme : le coeur n'est plus rouge alors que la
--   ligne post_likes existe bien.
--
--   On expose donc une RPC SECURITY DEFINER qui se base directement
--   sur `auth.uid()` côté DB. Elle :
--     - bypass la RLS (mais ne révèle rien de sensible : seulement
--       les post_ids déjà fournis en argument que l'utilisateur a likés),
--     - garantit zéro mismatch entre l'utilisateur JS et l'utilisateur
--       JWT côté Postgres,
--     - reste très performante (1 round-trip, IN array, index existant
--       idx_post_likes_post + clé primaire (post_id, user_id)).
--
-- Idempotente.
-- =====================================================================

create or replace function public.get_my_liked_post_ids(
  p_post_ids uuid[]
)
returns table (post_id uuid)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select pl.post_id
  from public.post_likes pl
  where pl.user_id = auth.uid()
    and pl.post_id = any(p_post_ids);
$$;

revoke all on function public.get_my_liked_post_ids(uuid[]) from public;
grant execute on function public.get_my_liked_post_ids(uuid[]) to authenticated;
