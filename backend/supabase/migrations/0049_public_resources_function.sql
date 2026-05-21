-- =====================================================================
-- Le Club IA — Migration 0049 : remplacer la vue resources_public
--
-- Contexte (Supabase advisor `security_definer_view`) :
--   La vue `public.resources_public` était en SECURITY DEFINER pour
--   exposer les titres de ressources sur la landing PUBLIQUE (la table
--   `resources` est réservée aux membres actifs via RLS).
--
--   Problème : une vue SECURITY DEFINER est signalée par le linter et,
--   surtout, on ne peut PAS la passer en security_invoker sans casser
--   l'accès anonyme — et ouvrir la table `resources` à anon exposerait
--   des colonnes sensibles (download_url, file_url, external_url,
--   content).
--
-- Fix : on remplace la vue par une FONCTION SECURITY DEFINER qui ne
--   renvoie QUE les colonnes sûres (jamais les URLs ni le contenu).
--   C'est le pattern Supabase recommandé pour exposer un sous-ensemble
--   public d'une table protégée (cf. get_active_pricing_plans,
--   get_public_member_count).
--
-- Idempotente.
-- =====================================================================

create or replace function public.get_public_resources(p_limit integer default 6)
returns table (
  id            uuid,
  title         text,
  resource_type public.resource_type,
  category      text,
  created_at    timestamptz
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select id, title, resource_type, category, created_at
  from public.resources
  where is_published = true
  order by created_at desc
  limit greatest(1, least(coalesce(p_limit, 6), 50));
$$;

revoke all on function public.get_public_resources(integer) from public;
grant execute on function public.get_public_resources(integer) to anon, authenticated;

-- On retire la vue SECURITY DEFINER désormais inutile.
drop view if exists public.resources_public;
