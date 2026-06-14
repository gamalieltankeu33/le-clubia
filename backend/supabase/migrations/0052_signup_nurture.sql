-- =====================================================================
-- Le Club IA — Migration 0052 : séquence de relance des inscrits non payants
--
-- Objectif : les personnes qui créent un compte (email + mot de passe)
-- mais ne prennent PAS d'abonnement reçoivent une séquence de relance
-- pour les motiver à finaliser :
--   palier 1 : 10 h après l'inscription
--   palier 2 : 24 h
--   palier 3 : 48 h
--   palier 4 : J+5 (120 h)
--   palier 5 : J+7 (168 h)
-- La séquence s'arrête dès que la personne s'abonne (filtrée par le cron)
-- ou après le 5ᵉ envoi.
--
-- Suivi via `profiles.nurture_stage` (0 = aucun envoi … 5 = séquence finie).
-- Opt-out via `profiles.email_pref_nurture` (lien de désinscription).
--
-- Backfill : tous les comptes EXISTANTS sont marqués stage=5 → ils ne
-- reçoivent JAMAIS de relance rétroactive. Seuls les comptes créés APRÈS
-- cette migration entrent dans la séquence.
--
-- Idempotente.
-- =====================================================================

alter table public.profiles
  add column if not exists nurture_stage smallint not null default 0,
  add column if not exists nurture_last_sent_at timestamptz,
  add column if not exists email_pref_nurture boolean not null default true;

-- Backfill : on neutralise la séquence pour tout l'existant (anti-spam).
update public.profiles
set nurture_stage = 5
where nurture_stage < 5;

-- Index partiel : le cron ne scanne que les comptes encore dans la séquence.
create index if not exists idx_profiles_nurture_pending
  on public.profiles (created_at)
  where nurture_stage < 5;
