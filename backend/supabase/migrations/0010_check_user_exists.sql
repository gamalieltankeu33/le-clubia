-- =====================================================================
-- Le Club IA — Migration 0010 : RPC publique check_user_exists
-- Permet à la page /auth de détecter si un email a déjà un compte,
-- afin d'afficher dynamiquement l'écran "login" ou "signup" sans
-- multiplier les pages.
--
-- Sécurité : la fonction est SECURITY DEFINER et ne révèle qu'un
-- booléen. Acceptable du point de vue confidentialité (l'attaquant
-- aurait toute façon la même info en testant un signup).
-- Idempotente.
-- =====================================================================

create or replace function public.check_user_exists(p_email text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_email is null or length(trim(p_email)) = 0 then
    return false;
  end if;
  return exists (
    select 1 from auth.users where lower(email) = lower(trim(p_email))
  );
end;
$$;

grant execute on function public.check_user_exists(text) to anon;
grant execute on function public.check_user_exists(text) to authenticated;
