-- =====================================================================
-- Le Club IA — Migration 0035 : Fix du cron hebdo news-weekly
--
-- La migration 0013 a créé le cron avec des placeholders
-- `<TON_PROJECT_REF>` et `<TON_SERVICE_ROLE_KEY>` qui n'ont jamais été
-- remplacés → le cron tourne tous les dimanches mais part en erreur
-- DNS sur un domaine invalide. Aucun récap hebdomadaire n'a donc été
-- publié depuis le déploiement.
--
-- Cette migration corrige le problème en utilisant Supabase Vault pour
-- stocker la service_role_key (chiffrée au repos, pas en clair dans la
-- table cron.job).
--
-- ===== PRÉ-REQUIS MANUEL =====
-- Avant d'appliquer cette migration, l'admin doit créer le secret
-- vault via le SQL editor Supabase (une seule fois) :
--
--   select vault.create_secret(
--     '<TA_SERVICE_ROLE_KEY>',         -- valeur sensible (collée une fois)
--     'news_agent_cron_service_key',   -- nom logique réutilisable
--     'JWT service-role pour le cron news-weekly'
--   );
--
-- Récupération de la clé : Supabase Dashboard → Settings → API →
-- Project API keys → service_role (révéler).
-- =====================================================================

create extension if not exists pg_cron;
create extension if not exists pg_net;
create extension if not exists supabase_vault;

-- 1. Cleanup : supprime l'ancien cron cassé et toute variante orpheline.
do $$
declare jid bigint;
begin
  for jid in
    select jobid
    from cron.job
    where jobname in (
      'news-agent-cron',
      'news-agent-6h',
      'news-agent-every-6h',
      'news-weekly'
    )
  loop
    perform cron.unschedule(jid);
  end loop;
end $$;

-- 2. Nouveau cron : dimanche 9h UTC, lit le JWT depuis Vault.
--    Si le secret n'existe pas encore au moment de l'exécution, l'appel
--    HTTP partira sans Authorization valide et l'edge function
--    répondra 401 — c'est le comportement attendu (échec lisible dans
--    cron.job_run_details au lieu d'un échec silencieux DNS).
select cron.schedule(
  'news-weekly',
  '0 9 * * 0',
  $cmd$
    select net.http_post(
      url := 'https://uzsohjzrwgqmwiorzrky.supabase.co/functions/v1/news-agent',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization',
        'Bearer ' || coalesce(
          (select decrypted_secret
           from vault.decrypted_secrets
           where name = 'news_agent_cron_service_key'
           limit 1),
          ''
        )
      ),
      body := jsonb_build_object('source', 'cron-weekly')
    ) as request_id;
  $cmd$
);

-- 3. Vérifs à exécuter manuellement après la migration :
--   - select * from cron.job where jobname = 'news-weekly';
--   - select * from vault.decrypted_secrets where name = 'news_agent_cron_service_key';
--   - Pour un test à chaud sans attendre dimanche :
--       select cron.schedule('news-weekly-test', '* * * * *', ...);
--     puis observer cron.job_run_details et la table news_articles.
