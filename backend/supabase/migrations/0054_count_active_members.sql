-- =====================================================================
-- Le Club IA — Migration 0054 : RPC publique pour le nombre de membres
--
-- Pourquoi : la page Communauté affiche « X membres · Y en ligne ».
-- La RLS sur `profiles` n'autorise un user qu'à voir SON profil (cf.
-- 0001 « profiles select self or admin »), donc un SELECT count(*)
-- depuis le frontend ne retourne pas la vraie valeur. On expose une
-- RPC SECURITY DEFINER qui compte les abonnements actifs (ce qui est
-- la définition d'un « membre » dans l'app).
--
-- Sécurité : SECURITY DEFINER + search_path verrouillé. La fonction
-- ne lit qu'un count, ne révèle aucune donnée individuelle. Accordée
-- uniquement aux users authentifiés.
-- =====================================================================

create or replace function public.count_active_members()
returns int
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select count(*)::int
  from public.subscriptions s
  where s.status in ('active','trialing')
    and (s.current_period_end is null or s.current_period_end > now())
$$;

revoke all on function public.count_active_members() from public;
grant execute on function public.count_active_members() to authenticated;
