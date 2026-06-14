-- =====================================================================
-- Le Club IA — Migration 0006 : Membres certifiés + dernière activité
-- - profiles.is_verified : badge "Certifié" attribuable par un admin
-- - profiles.last_active_at : dernière activité réelle (mise à jour côté
--   app à l'init de session ou via les triggers d'activité)
-- Idempotente.
-- =====================================================================

alter table public.profiles
  add column if not exists is_verified boolean default false not null;

alter table public.profiles
  add column if not exists last_active_at timestamptz;

create index if not exists idx_profiles_last_active
  on public.profiles(last_active_at desc nulls last);

create index if not exists idx_profiles_is_verified
  on public.profiles(is_verified)
  where is_verified = true;
