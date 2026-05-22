-- =====================================================================
-- Le Club IA — Migration 0053 : cron horaire de la séquence de relance
--
-- Appelle l'edge function `signup-nurture-cron` toutes les heures. La
-- fonction décide elle-même qui relancer (paliers 10h/24h/48h/J+5/J+7)
-- et n'envoie qu'un mail max par personne et par exécution.
--
-- Auth interne par header `x-nurture-token` (cf. fonction).
-- Idempotente : on retire le job existant avant de le (re)créer.
-- =====================================================================

select cron.unschedule('signup-nurture-hourly')
where exists (select 1 from cron.job where jobname = 'signup-nurture-hourly');

select cron.schedule(
  'signup-nurture-hourly',
  '0 * * * *',
  $$
  select net.http_post(
    url := 'https://uzsohjzrwgqmwiorzrky.supabase.co/functions/v1/signup-nurture-cron',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-nurture-token', 'lcia_nurt_a7d21f6b09e84c3d5f1908b2a6c4e7d3'
    ),
    body := '{}'::jsonb
  );
  $$
);
