-- =====================================================================
-- Le Club IA — Migration 0043 : durcissement des fonctions SECURITY DEFINER
--
-- Contexte (Supabase advisor `*_security_definer_function_executable`) :
--   47 fonctions en SECURITY DEFINER sont executable par anon + authenticated.
--   Audit manuel → 4 catégories de vrais risques sécurité.
--
-- Risques traités :
--   1. `increment_user_points(p_uid, p_pts, …)` — privilege escalation :
--      n'importe qui peut s'auto-attribuer des points illimités.
--   2. `notify_active_members(...)` — phishing/spam : n'importe qui peut
--      broadcaster une notif à tous les membres actifs.
--   3. `cleanup_old_rate_limits()` — exposition d'un mécanisme interne.
--   4. `compute_active_mrr_xof()` — fuite du CA (donnée commerciale).
--   5. `get_admin_inactive_members()`/`get_admin_learning_engagement()` —
--      pas de check is_admin() interne → leak emails membres + stats privées.
--
-- Solution :
--   - REVOKE EXECUTE sur 1-3 + 4 depuis anon/authenticated.
--   - Ajoute un `raise exception` interne au début des fonctions admin
--     si l'appelant n'est pas admin.
--
-- ⚠️ La migration 0044 complète celle-ci en revokant aussi PUBLIC (sans
-- ça anon/authenticated héritent encore EXECUTE via le rôle PUBLIC).
--
-- Idempotente.
-- =====================================================================

-- ── 1. Privilege escalation : points utilisateur ─────────────────────
revoke execute on function public.increment_user_points(uuid, integer, text, uuid) from anon, authenticated;

-- ── 2. Spam : broadcast de notifications ─────────────────────────────
revoke execute on function public.notify_active_members(text, text, text, text, uuid, uuid) from anon, authenticated;

-- ── 3. Interne (cron) ─────────────────────────────────────────────────
revoke execute on function public.cleanup_old_rate_limits() from anon, authenticated;

-- ── 4. Donnée commerciale (MRR / CA) — admin only ─────────────────────
revoke execute on function public.compute_active_mrr_xof() from anon, authenticated;
grant execute on function public.compute_active_mrr_xof() to authenticated;
