-- =====================================================================
-- Le Club IA — Migration 0009 : Stats publiques pour la landing
-- Crée une RPC `get_public_member_count()` qui retourne le nombre de
-- membres ayant fini leur onboarding. Accessible aux visiteurs anonymes
-- (anon role) pour alimenter le social proof de la landing.
-- Idempotente.
-- =====================================================================

create or replace function public.get_public_member_count()
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::int
  from public.profiles
  where role = 'member'
    and onboarding_completed = true;
$$;

grant execute on function public.get_public_member_count() to anon;
grant execute on function public.get_public_member_count() to authenticated;
