-- =====================================================================
-- Le Club IA — Migration 0018 : finalisation système événements
--
-- Périmètre :
--   1. Renommage de la colonne zoom_url → meet_url (terminologie
--      "Google Meet" partout dans l'app), avec copie best-effort des
--      valeurs existantes si la migration tourne sur une base déjà peuplée.
--   2. RPC publique get_next_public_event() — retourne le prochain
--      événement publié dans le futur, accessible sans auth (landing).
--
-- La colonne announcement_sent_at est déjà en place (migration 0017),
-- on ne la recrée pas. Migration idempotente.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Renommage zoom_url → meet_url (idempotent)
-- ---------------------------------------------------------------------
do $$
declare
  has_zoom    boolean;
  has_meet    boolean;
begin
  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'events'
      and column_name = 'zoom_url'
  ) into has_zoom;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'events'
      and column_name = 'meet_url'
  ) into has_meet;

  if has_zoom and not has_meet then
    -- Cas standard : renommage simple, pas de perte de données.
    execute 'alter table public.events rename column zoom_url to meet_url';
  elsif has_zoom and has_meet then
    -- Les deux colonnes coexistent : copie zoom_url → meet_url quand
    -- meet_url est null, puis suppression de zoom_url.
    execute $sql$
      update public.events
      set meet_url = zoom_url
      where meet_url is null and zoom_url is not null
    $sql$;
    execute 'alter table public.events drop column zoom_url';
  elsif not has_zoom and not has_meet then
    -- Aucune des deux : on crée meet_url.
    execute 'alter table public.events add column meet_url text';
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 2. RPC get_next_public_event() — exposée à anon + authenticated
--    Sert à alimenter la bannière "Prochain coaching live" sur la
--    landing publique sans nécessiter d'auth.
-- ---------------------------------------------------------------------
create or replace function public.get_next_public_event()
returns table (
  id uuid,
  title text,
  description text,
  starts_at timestamptz,
  duration_minutes integer,
  cover_image_url text,
  speaker_name text,
  type text
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    id,
    title,
    description,
    starts_at,
    duration_minutes,
    cover_image_url,
    speaker_name,
    type::text
  from public.events
  where is_published = true
    and starts_at > now()
  order by starts_at asc
  limit 1;
$$;

revoke all on function public.get_next_public_event() from public;
grant execute on function public.get_next_public_event() to anon, authenticated;
