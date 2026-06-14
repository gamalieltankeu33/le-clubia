-- =====================================================================
-- Le Club IA — Migration 0050 : email automatique à chaque actualité
--
-- Objectif : dès qu'un article est publié (formulaire admin, toggle
-- "Publier", ou agent), un email part automatiquement à tous les
-- membres actifs opt-in. Avant : seuls les articles passés par l'agent
-- (avec send_email) ou le récap hebdo envoyaient un email — un article
-- créé/publié à la main ne partait jamais par mail.
--
-- Mécanisme : trigger AFTER INSERT/UPDATE sur news_articles → appelle
-- l'edge function `broadcast-news-email` via pg_net dès le passage en
-- is_published=true. Centralisé = impossible de publier sans email.
--
-- Exclusions / garde-fous :
--   - `weekly-recap` est exclu : c'est le digest du dimanche, déjà
--     envoyé par le cron news-agent (on évite le double).
--   - `email_broadcast_at` (idempotence) : un article n'est broadcasté
--     qu'une fois, même si le trigger re-fire (édition, republish).
--
-- Idempotente.
-- =====================================================================

alter table public.news_articles
  add column if not exists email_broadcast_at timestamptz;

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
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6c29oanpyd2dxbXdpb3J6cmt5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Nzk3Nzk1MCwiZXhwIjoyMDkzNTUzOTUwfQ.ufe2jB2oZsSNmWLjj6BxXdsU_BtrHqPmN1WvwHcM6Yo'
      ),
      body := jsonb_build_object('article_id', new.id)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_news_email_broadcast on public.news_articles;
create trigger trg_news_email_broadcast
  after insert or update on public.news_articles
  for each row execute function public.trg_broadcast_news_email();
