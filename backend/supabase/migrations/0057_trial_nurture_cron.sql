-- =====================================================================
-- Le Club IA — Migration 0057 : cron quotidien des emails de relance
-- pour le mois d'essai (plan_id='trial').
--
-- Appelle l'edge function `trial-nurture-cron` chaque jour à 10:00 UTC.
-- La fonction décide elle-même qui relancer (J+7 / J+21 / J+27 / J+30)
-- et n'envoie qu'un email max par sub et par exécution.
--
-- Idempotente.
-- =====================================================================

select cron.unschedule('trial-nurture-daily')
where exists (select 1 from cron.job where jobname = 'trial-nurture-daily');

select cron.schedule(
  'trial-nurture-daily',
  '0 10 * * *',
  $$
  select net.http_post(
    url := 'https://uzsohjzrwgqmwiorzrky.supabase.co/functions/v1/trial-nurture-cron',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-trial-nurture-token', 'lcia_trial_5d8e9a2c1f7b34a690cf48ed25b78fa1'
    ),
    body := '{}'::jsonb
  );
  $$
);
