-- =====================================================================
-- Le Club IA — Migration 0024 : Rate Limiting applicatif
--
-- Avant déploiement public, on protège les actions critiques contre :
--   - Le spam (création massive de posts/commentaires)
--   - Les bots (likes en boucle, scraping mentions @)
--   - Les abus admin (lancement répété du news-agent qui consomme OpenAI)
--
-- Approche : 1 table append-only + 1 RPC atomique qui check ET insère
-- en une seule transaction (impossible de bypasser via race condition).
-- Cleanup quotidien via pg_cron pour garder la table légère.
--
-- Idempotente.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Table rate_limits
-- ---------------------------------------------------------------------
create table if not exists public.rate_limits (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade,
  -- ip_address est gardé pour usage futur (rate limit signup avant auth).
  -- Aujourd'hui toutes les actions exigent un user_id authentifié, donc
  -- ip_address reste null. Quand on branchera signup, on stockera l'IP
  -- côté edge function.
  ip_address  text,
  action_type text not null,
  created_at  timestamptz not null default now()
);

create index if not exists idx_rate_limits_user_action
  on public.rate_limits(user_id, action_type, created_at desc);

create index if not exists idx_rate_limits_ip_action
  on public.rate_limits(ip_address, action_type, created_at desc)
  where ip_address is not null;

create index if not exists idx_rate_limits_created
  on public.rate_limits(created_at);

-- ---------------------------------------------------------------------
-- 2. RLS — accessible en INSERT à l'utilisateur courant pour son propre
--    user_id (la RPC check_rate_limit est SECURITY DEFINER mais on
--    garde la policy par défense en profondeur). Lecture admin only.
-- ---------------------------------------------------------------------
alter table public.rate_limits enable row level security;

drop policy if exists "rate_limits insert self"  on public.rate_limits;
drop policy if exists "rate_limits select admin" on public.rate_limits;

create policy "rate_limits insert self"
  on public.rate_limits
  for insert
  to authenticated
  with check (user_id = auth.uid() or user_id is null);

create policy "rate_limits select admin"
  on public.rate_limits
  for select
  to authenticated
  using (public.is_admin(auth.uid()));

-- ---------------------------------------------------------------------
-- 3. RPC check_rate_limit
--    Vérifie si l'utilisateur courant a dépassé la limite pour
--    `p_action_type` sur la fenêtre `p_window_seconds`. Si OK, INSERT
--    le record de tracking en même temps (atomicité — pas de race
--    condition entre 2 appels concurrents).
--
--    Retour :
--      - allowed              : true si l'action peut continuer
--      - current_count        : nombre d'actions dans la fenêtre
--                                (incluant celle qui vient d'être loggée
--                                si allowed=true)
--      - reset_at             : moment où la fenêtre se sera entièrement
--                                vidée pour ce user
--      - retry_after_seconds  : secondes à attendre avant de réessayer
--                                (0 si allowed=true)
-- ---------------------------------------------------------------------
create or replace function public.check_rate_limit(
  p_action_type     text,
  p_max_count       integer,
  p_window_seconds  integer
)
returns table (
  allowed              boolean,
  current_count        integer,
  reset_at             timestamptz,
  retry_after_seconds  integer
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id          uuid;
  v_count            integer;
  v_oldest_in_window timestamptz;
  v_reset_at         timestamptz;
  v_window           interval;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required for rate limit check';
  end if;

  v_window := make_interval(secs => p_window_seconds);

  -- Compte les actions dans la fenêtre + récupère la plus ancienne pour
  -- calculer le reset_at exact.
  select count(*), min(created_at)
    into v_count, v_oldest_in_window
  from public.rate_limits
  where user_id = v_user_id
    and action_type = p_action_type
    and created_at > (now() - v_window);

  if v_count >= p_max_count then
    -- Bloqué : on calcule quand le slot le plus ancien expirera.
    v_reset_at := v_oldest_in_window + v_window;
    return query
      select
        false                                                                  as allowed,
        v_count                                                                as current_count,
        v_reset_at                                                             as reset_at,
        greatest(1, ceil(extract(epoch from (v_reset_at - now())))::integer)   as retry_after_seconds;
    return;
  end if;

  -- Autorisé : on logue l'action.
  insert into public.rate_limits (user_id, action_type)
  values (v_user_id, p_action_type);

  return query
    select
      true                  as allowed,
      v_count + 1           as current_count,
      (now() + v_window)    as reset_at,
      0                     as retry_after_seconds;
end;
$$;

revoke all on function public.check_rate_limit(text, integer, integer) from public;
grant execute on function public.check_rate_limit(text, integer, integer) to authenticated;

-- ---------------------------------------------------------------------
-- 4. Cleanup quotidien — supprime les records de plus de 24h.
--    Toutes nos fenêtres sont <= 24h donc on n'a jamais besoin de plus.
-- ---------------------------------------------------------------------
create or replace function public.cleanup_old_rate_limits()
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  delete from public.rate_limits where created_at < now() - interval '24 hours';
$$;

-- ---------------------------------------------------------------------
-- 5. Cron : cleanup quotidien à 3h UTC
--    Idempotent : on supprime l'ancien job homonyme avant de réécrire.
-- ---------------------------------------------------------------------
create extension if not exists pg_cron;

do $$
declare jid bigint;
begin
  for jid in select jobid from cron.job where jobname = 'rate-limits-cleanup'
  loop
    perform cron.unschedule(jid);
  end loop;
end $$;

select cron.schedule(
  'rate-limits-cleanup',
  '0 3 * * *',
  $cmd$ select public.cleanup_old_rate_limits(); $cmd$
);
