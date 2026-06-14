-- =====================================================================
-- Le Club IA — Migration 0039 : Audit log des actions admin
--
-- Objectif : traçabilité des actions critiques (création/modif/suppr de
-- contenus, changements de rôle, etc.) effectuées par les admins. Très
-- apprécié en audit due-dil et utile pour le debugging "qui a fait
-- quoi quand ?".
--
-- Architecture :
--   - 1 table append-only `admin_audit_log` (pas d'UPDATE/DELETE)
--   - 1 fonction trigger générique `log_admin_action()` qui capture
--     l'INSERT/UPDATE/DELETE avec auth.uid() comme acteur
--   - 5 triggers sur les tables sensibles :
--       formations, news_articles, events, resources, pricing_plans
--     Plus 1 trigger spécifique sur profiles pour les changements de
--     role (promotion/démotion admin).
--   - RLS : SELECT admin only, aucun INSERT/UPDATE/DELETE depuis le
--     client (seuls les triggers DB peuvent écrire via service-role).
--
-- Limite assumée : si une action admin passe par service_role direct
-- (ex: script de seed, edge function admin-only), auth.uid() = null et
-- l'acteur sera enregistré comme NULL. Acceptable pour V1 — on logge
-- au moins l'action.
-- =====================================================================

-- ----- Table -----

create table if not exists public.admin_audit_log (
  id            uuid primary key default gen_random_uuid(),
  actor_id     uuid references auth.users(id) on delete set null,
  action       text not null check (action in ('insert','update','delete')),
  target_table text not null,
  target_id    text,  -- text car parfois pas un uuid (ex: pricing_plans.id = 'annual')
  -- Snapshot before/after pour debugger : on garde le diff complet.
  -- jsonb pour pouvoir requêter par champ si besoin (ex: tous les
  -- changements où is_published a basculé).
  before       jsonb,
  after        jsonb,
  created_at   timestamptz not null default now()
);

-- Index pour les vues admin courantes
create index if not exists admin_audit_log_created_at_idx
  on public.admin_audit_log (created_at desc);
create index if not exists admin_audit_log_actor_created_idx
  on public.admin_audit_log (actor_id, created_at desc)
  where actor_id is not null;
create index if not exists admin_audit_log_target_idx
  on public.admin_audit_log (target_table, target_id);

comment on table public.admin_audit_log is
  'Trace append-only des actions admin sur les tables sensibles. Ecrit uniquement par triggers DB (RLS bloque INSERT/UPDATE/DELETE client).';

-- ----- RLS -----

alter table public.admin_audit_log enable row level security;

-- SELECT : admin only
drop policy if exists "audit_log admin select" on public.admin_audit_log;
create policy "audit_log admin select" on public.admin_audit_log
  for select
  to authenticated
  using (public.is_admin(auth.uid()));

-- Pas de policy INSERT/UPDATE/DELETE : avec RLS enabled et zéro policy
-- pour ces commandes, RIEN ne peut écrire depuis un client (anon ou
-- authenticated). Les triggers DB tournent en SECURITY DEFINER en
-- bypassant RLS, donc ils peuvent insérer. Defense in depth.

-- ----- Trigger function générique -----

create or replace function public.log_admin_action()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor uuid := auth.uid();  -- null si appel service_role direct
  v_target_id text;
begin
  -- Récupère l'ID cible selon l'opération. Pour DELETE c'est OLD,
  -- pour INSERT/UPDATE c'est NEW. On stringify pour gérer les tables
  -- avec id text (pricing_plans).
  if tg_op = 'DELETE' then
    v_target_id := (row_to_json(OLD)->>'id');
    insert into public.admin_audit_log (actor_id, action, target_table, target_id, before, after)
    values (v_actor, 'delete', tg_table_name, v_target_id, to_jsonb(OLD), null);
    return OLD;
  elsif tg_op = 'UPDATE' then
    v_target_id := (row_to_json(NEW)->>'id');
    -- N'enregistre que si quelque chose a réellement changé (sinon
    -- les triggers updated_at génèrent du bruit).
    if to_jsonb(NEW) is distinct from to_jsonb(OLD) then
      insert into public.admin_audit_log (actor_id, action, target_table, target_id, before, after)
      values (v_actor, 'update', tg_table_name, v_target_id, to_jsonb(OLD), to_jsonb(NEW));
    end if;
    return NEW;
  elsif tg_op = 'INSERT' then
    v_target_id := (row_to_json(NEW)->>'id');
    insert into public.admin_audit_log (actor_id, action, target_table, target_id, before, after)
    values (v_actor, 'insert', tg_table_name, v_target_id, null, to_jsonb(NEW));
    return NEW;
  end if;
  return null;
end;
$$;

comment on function public.log_admin_action() is
  'Trigger générique pour audit log. Capture INSERT/UPDATE/DELETE avec auth.uid() comme acteur.';

-- Revoke EXECUTE : la fonction ne doit être callable QUE comme trigger.
revoke execute on function public.log_admin_action() from public, anon, authenticated;

-- ----- Triggers sur les tables sensibles -----

drop trigger if exists audit_log_formations on public.formations;
create trigger audit_log_formations
  after insert or update or delete on public.formations
  for each row execute function public.log_admin_action();

drop trigger if exists audit_log_news_articles on public.news_articles;
create trigger audit_log_news_articles
  after insert or update or delete on public.news_articles
  for each row execute function public.log_admin_action();

drop trigger if exists audit_log_events on public.events;
create trigger audit_log_events
  after insert or update or delete on public.events
  for each row execute function public.log_admin_action();

drop trigger if exists audit_log_resources on public.resources;
create trigger audit_log_resources
  after insert or update or delete on public.resources
  for each row execute function public.log_admin_action();

drop trigger if exists audit_log_pricing_plans on public.pricing_plans;
create trigger audit_log_pricing_plans
  after insert or update or delete on public.pricing_plans
  for each row execute function public.log_admin_action();

-- ----- Trigger spécifique : changement de role sur profiles -----
-- On NE logge PAS toutes les updates de profiles (l'utilisateur modifie
-- son bio, sa photo, ses centres d'intérêt en permanence — bruit).
-- On logge UNIQUEMENT les changements de `role`, car promouvoir
-- quelqu'un admin (ou le rétrograder) est une action critique.

create or replace function public.log_profile_role_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'UPDATE' and NEW.role is distinct from OLD.role then
    insert into public.admin_audit_log
      (actor_id, action, target_table, target_id, before, after)
    values (
      auth.uid(),
      'update',
      'profiles.role',
      NEW.id::text,
      jsonb_build_object('role', OLD.role),
      jsonb_build_object('role', NEW.role)
    );
  end if;
  return NEW;
end;
$$;

revoke execute on function public.log_profile_role_change() from public, anon, authenticated;

drop trigger if exists audit_log_profile_role on public.profiles;
create trigger audit_log_profile_role
  after update of role on public.profiles
  for each row execute function public.log_profile_role_change();

-- =====================================================================
-- Vérifs post-migration (à exécuter manuellement) :
--
-- 1. La table est bien protégée par RLS :
--    \d public.admin_audit_log
--    + policies : SELECT seulement, admin only.
--
-- 2. Test : faire un UPDATE sur une formation depuis le dashboard
--    admin, puis vérifier la trace :
--    select id, action, target_table, target_id, actor_id, created_at
--    from public.admin_audit_log
--    order by created_at desc
--    limit 5;
--
-- 3. Un user non-admin authentifié essaye de lire :
--    select * from public.admin_audit_log limit 1;
--    Attendu : RLS bloque, 0 lignes retournées.
-- =====================================================================
