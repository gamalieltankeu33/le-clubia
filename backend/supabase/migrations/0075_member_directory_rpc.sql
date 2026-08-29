-- Migration pour ajouter une RPC permettant de rechercher et lister les membres (Annuaire)

create or replace function public.search_directory_members(
  p_query text default '',
  p_role text default null,
  p_limit int default 50,
  p_offset int default 0
)
returns table (
  id          uuid,
  full_name   text,
  first_name  text,
  last_name   text,
  avatar_url  text,
  bio         text,
  role        text,
  is_verified boolean,
  member_number bigint,
  created_at  timestamptz
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
    p.role,
    coalesce(p.is_verified, false) as is_verified,
    p.member_number,
    p.created_at
  from public.profiles p
  inner join public.subscriptions s on s.user_id = p.id
  cross join norm
  where s.status in ('active', 'trialing')
    and (p_role is null or p.role = p_role)
    and (
      norm.q = '' or
      lower(coalesce(p.first_name, '') || ' ' || coalesce(p.last_name, '')) like '%' || lower(norm.q) || '%'
    )
  order by
    p.created_at desc
  limit p_limit
  offset p_offset;
$$;

revoke all on function public.search_directory_members(text, text, int, int) from public;
grant execute on function public.search_directory_members(text, text, int, int) to authenticated;
