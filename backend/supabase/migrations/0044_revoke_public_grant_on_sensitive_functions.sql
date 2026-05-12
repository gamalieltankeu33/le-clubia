-- =====================================================================
-- Le Club IA — Migration 0044 : revoke PUBLIC sur les fonctions sensibles
--
-- La migration 0043 avait REVOKE depuis anon/authenticated, mais le
-- privilège était hérité via PUBLIC (visible dans pg_proc.proacl avec
-- "=X/postgres" en tête). Il faut donc REVOKE depuis PUBLIC pour
-- réellement couper l'accès.
--
-- Idempotente.
-- =====================================================================

revoke execute on function public.increment_user_points(uuid, integer, text, uuid) from public;
revoke execute on function public.notify_active_members(text, text, text, text, uuid, uuid) from public;
revoke execute on function public.cleanup_old_rate_limits() from public;

revoke execute on function public.compute_active_mrr_xof() from public;
grant execute on function public.compute_active_mrr_xof() to authenticated;

revoke execute on function public.get_admin_inactive_members() from public, anon;
grant execute on function public.get_admin_inactive_members() to authenticated;

revoke execute on function public.get_admin_learning_engagement() from public, anon;
grant execute on function public.get_admin_learning_engagement() to authenticated;
