-- =====================================================================
-- Le Club IA — Migration 0051 : auth du broadcast news par token partagé
--
-- La migration 0050 authentifiait l'appel pg_net → broadcast-news-email
-- avec la clé service_role en dur. Mais depuis le passage de Supabase
-- aux nouvelles clés API (sb_secret_…), cette clé legacy ne correspond
-- plus à SUPABASE_SERVICE_ROLE_KEY injecté dans la fonction → 401
-- "Service-role requis" (même problème latent sur les autres crons).
--
-- Fix : on passe un header `x-broadcast-token` avec un secret partagé,
-- comparé en dur côté fonction. Indépendant du format des clés.
--
-- Idempotente.
-- =====================================================================

create or replace function public.trg_broadcast_news_email()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.is_published = true
     and coalesce(new.category, '') <> 'weekly-recap'
     and new.email_broadcast_at is null
     and (tg_op = 'INSERT' or coalesce(old.is_published, false) = false)
  then
    perform net.http_post(
      url := 'https://uzsohjzrwgqmwiorzrky.supabase.co/functions/v1/broadcast-news-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-broadcast-token', 'lcia_nb_f0e66daf64b0d58216920a7a1a51e0318ceb195c7391e9e5'
      ),
      body := jsonb_build_object('article_id', new.id)
    );
  end if;
  return new;
end;
$$;
