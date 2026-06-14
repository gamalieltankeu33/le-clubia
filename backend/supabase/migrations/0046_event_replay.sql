-- =====================================================================
-- Le Club IA — Migration 0046 : Masterclass Replay
--
-- Contexte :
--   Permettre de publier le replay vidéo d'une masterclass/live passée.
--   Un membre qui n'a pas assisté au live peut venir le revoir, comme
--   une formation à revoir. Rapport 1:1 event ↔ replay → on étend la
--   table events plutôt que créer une table dédiée (réutilise RLS,
--   policies membres, admin existant).
--
--   `replay_url`          : URL Vimeo / YouTube / Drive du replay.
--                           NULL tant que pas encore uploadé.
--   `replay_published_at` : horodatage de mise à disposition du replay
--                           (set automatiquement quand replay_url passe
--                           de NULL à non-NULL via trigger).
--
-- Idempotente.
-- =====================================================================

alter table public.events
  add column if not exists replay_url          text,
  add column if not exists replay_published_at timestamptz;

-- Trigger : renseigne replay_published_at au moment où un replay_url
-- est ajouté (NULL -> non-NULL). Si l'admin retire le lien, on remet à
-- NULL. Idempotent (ne réécrit pas la date si déjà publié).
create or replace function public.set_replay_published_at()
returns trigger
language plpgsql
as $$
begin
  if new.replay_url is not null and new.replay_url <> '' then
    if old.replay_url is null or old.replay_url = '' then
      new.replay_published_at = now();
    end if;
  else
    new.replay_published_at = null;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_events_replay_published_at on public.events;
create trigger trg_events_replay_published_at
  before update on public.events
  for each row execute function public.set_replay_published_at();

-- Index pour lister rapidement les events qui ont un replay dispo.
create index if not exists idx_events_with_replay
  on public.events(starts_at desc)
  where is_published = true and replay_url is not null;
