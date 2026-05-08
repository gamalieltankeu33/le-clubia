-- =====================================================================
-- Le Club IA — Migration 0025 : Durcissement sécurité (Audit V2)
--
-- Corrections apportées suite à l'audit complet :
--   1. Storage (resource-files) : restreindre la lecture aux membres actifs
--      et aux administrateurs (au lieu de 'authenticated' global).
--   2. RPC search_mentionable_users : restreindre l'appel aux membres
--      actifs et administrateurs (au lieu de 'authenticated' global).
--
-- Idempotente.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Storage : resource-files (PRIVÉ)
-- ---------------------------------------------------------------------
-- On supprime la politique trop permissive 'authenticated read' (0005)
-- pour la remplacer par une version qui vérifie is_active_member.
drop policy if exists "resource-files authenticated read" on storage.objects;

create policy "resource-files members read"
  on storage.objects
  for select
  using (
    bucket_id = 'resource-files'
    and (
      public.is_active_member(auth.uid()) 
      or public.is_admin(auth.uid())
    )
  );

-- ---------------------------------------------------------------------
-- 2. RPC search_mentionable_users
-- ---------------------------------------------------------------------
-- On modifie la fonction pour inclure un check de sécurité interne
-- en plus du grant execute, pour éviter que des non-membres listent
-- les membres actifs.
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
language plpgsql -- Changé de SQL à PLPGSQL pour permettre le IF de sécurité
stable
security definer
set search_path = public, pg_temp
as $$
begin
  -- Sécurité : Seuls les membres actifs ou admins peuvent chercher
  if not (public.is_active_member(auth.uid()) or public.is_admin(auth.uid())) then
    raise exception 'Accès réservé aux membres actifs.'
      using errcode = 'insufficient_privilege';
  end if;

  return query
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
    and (s.current_period_end is null or s.current_period_end > now()) -- Double check freshness
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
end;
$$;
