-- =====================================================================
-- Le Club IA — Migration 0008b : Cron pour l'agent IA d'actualités
-- ATTENTION : avant d'exécuter ce fichier, REMPLACE manuellement :
--   <TON_PROJECT_REF>      par la référence projet (ex: abcdefg)
--   <TON_SERVICE_ROLE_KEY> par la clé service_role (Settings → API)
-- Pour récupérer ces valeurs : Supabase Dashboard → Settings → API
--
-- Pré-requis : extensions pg_cron + pg_net activées (Database → Extensions)
-- =====================================================================

-- Active les extensions si pas déjà fait (idempotent)
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Supprime l'ancien job s'il existe (rejouabilité)
do $$
declare jid bigint;
begin
  for jid in select jobid from cron.job where jobname = 'news-agent-every-6h'
  loop
    perform cron.unschedule(jid);
  end loop;
end $$;

-- Planifie l'agent toutes les 6h, à la minute 0 (00:00, 06:00, 12:00, 18:00 UTC)
select cron.schedule(
  'news-agent-every-6h',
  '0 */6 * * *',
  $cmd$
    select net.http_post(
      url := 'https://<TON_PROJECT_REF>.supabase.co/functions/v1/news-agent',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer <TON_SERVICE_ROLE_KEY>'
      ),
      body := jsonb_build_object('source', 'cron')
    ) as request_id;
  $cmd$
);

-- Vérification : devrait retourner une ligne
-- select * from cron.job where jobname = 'news-agent-every-6h';
