-- =====================================================================
-- Le Club IA — Migration 0013 : Cron hebdo de l'agent news (V2)
--
-- Pivot stratégique : l'agent news-agent ne publie plus N articles toutes
-- les 6h. Il publie UN SEUL article récap hebdomadaire chaque dimanche
-- à 09:00 UTC.
--
-- AVANT D'EXÉCUTER CE FICHIER, REMPLACE manuellement :
--   <TON_PROJECT_REF>      par la référence projet (Settings → API → Project URL)
--   <TON_SERVICE_ROLE_KEY> par la clé service_role (Settings → API → Project API keys)
--
-- Pré-requis : extensions pg_cron + pg_net activées (Database → Extensions).
-- Idempotente : ré-exécutable, supprime l'ancien cron avant d'en créer un nouveau.
-- =====================================================================

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 1. Cleanup : supprime tous les anciens cron jobs liés à news-agent
--    (ancien nom 'news-agent-every-6h' de la migration 0008b, plus toute
--    autre variation au cas où).
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

-- 2. Nouveau cron : tous les dimanches à 09:00 UTC
--    Format crontab : minute heure jour-mois mois jour-semaine
--    (0 = dimanche, 1 = lundi, … 6 = samedi)
select cron.schedule(
  'news-weekly',
  '0 9 * * 0',
  $cmd$
    select net.http_post(
      url := 'https://<TON_PROJECT_REF>.supabase.co/functions/v1/news-agent',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer <TON_SERVICE_ROLE_KEY><TON_PROJECT_REF>
      ),
      body := jsonb_build_object('source', 'cron-weekly')
    ) as request_id;
  $cmd$
);

-- 3. Vérification (à exécuter manuellement après applique) :
-- select * from cron.job where jobname = 'news-weekly';
-- select * from cron.job_run_details where jobid = (
--   select jobid from cron.job where jobname = 'news-weekly'
-- ) order by start_time desc limit 5;
