-- =====================================================================
-- Le Club IA — Migration 0065 : Challenges de la Semaine
--
-- Objectifs :
--   1. Créer la table challenge_weeks (défis hebdo).
--   2. Créer la table challenge_submissions (livrables des membres).
--   3. Modifier la table posts pour supporter les badges challenge.
--   4. Trigger points_on_challenge_submitted pour attribuer +20 points.
--   5. Seeder les 8 challenges de départ.
-- =====================================================================

-- 1. Ajout de colonnes pour les badges de challenge dans posts
alter table public.posts
  add column if not exists challenge_week_number integer,
  add column if not exists challenge_project_name text;

comment on column public.posts.challenge_week_number is
  'Numéro de la semaine si ce post est une soumission de challenge.';
comment on column public.posts.challenge_project_name is
  'Nom du projet associé à ce challenge.';

-- 2. Création de la table challenge_weeks
create table if not exists public.challenge_weeks (
  id uuid primary key default gen_random_uuid(),
  week_number integer unique not null,
  title text not null,
  description text not null,
  tasks jsonb default '[]'::jsonb not null,
  is_active boolean default true not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists idx_challenge_weeks_number on public.challenge_weeks(week_number);

-- 3. Création de la table challenge_submissions
create table if not exists public.challenge_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  challenge_week_id uuid not null references public.challenge_weeks(id) on delete cascade,
  project_name text not null,
  deliverable_url text,
  deliverable_description text not null,
  post_id uuid references public.posts(id) on delete set null,
  completed_tasks jsonb default '[]'::jsonb not null,
  created_at timestamptz default now() not null,
  unique (user_id, challenge_week_id)
);

create index if not exists idx_submissions_user on public.challenge_submissions(user_id);
create index if not exists idx_submissions_week on public.challenge_submissions(challenge_week_id);

-- 4. RLS sur challenge_weeks
alter table public.challenge_weeks enable row level security;

create policy select_challenge_weeks on public.challenge_weeks
  for select to authenticated using (true);

create policy admin_challenge_weeks on public.challenge_weeks
  for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- RLS sur challenge_submissions
alter table public.challenge_submissions enable row level security;

create policy select_challenge_submissions on public.challenge_submissions
  for select to authenticated using (true);

create policy insert_challenge_submissions on public.challenge_submissions
  for insert to authenticated with check (auth.uid() = user_id);

create policy delete_challenge_submissions on public.challenge_submissions
  for delete to authenticated using (auth.uid() = user_id);

-- 5. Trigger points_on_challenge_submitted (+20 points)
create or replace function public.points_on_challenge_submitted()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.member_points (user_id, points, reason, reference_id)
  values (new.user_id, 20, 'challenge_submitted', new.id);
  return new;
end;
$$;

drop trigger if exists trg_points_challenge_submitted on public.challenge_submissions;
create trigger trg_points_challenge_submitted
  after insert on public.challenge_submissions
  for each row execute function public.points_on_challenge_submitted();

-- 6. Seeding des 8 défis de départ
insert into public.challenge_weeks (week_number, title, description, tasks)
values
(
  1,
  'L''Idée & Le Pitch',
  '### Objectif\nChoisis ton idée de projet IA ou SaaS. Formule ton pitch de manière claire et concise. Qui est ta cible ? Quel problème résous-tu ?\n\n### Consignes\nExplique en quelques lignes le problème que tu as identifié et ta solution. Ne cherche pas à être parfait, l''important est d''avoir une direction claire.',
  '[
    {"id": "w1_t1", "label": "Rédiger le pitch court (1-2 phrases)", "optional": false},
    {"id": "w1_t2", "label": "Définir le client idéal (avatar cible)", "optional": false},
    {"id": "w1_t3", "label": "Valider le potentiel (recherche rapide d''alternatives)", "optional": true}
  ]'::jsonb
),
(
  2,
  'La Proposition de Valeur & Hook',
  '### Objectif\nCrée une proposition de valeur unique. Quel est le bénéfice principal de ta solution ? Écris le titre accrocheur (Hook) pour ton futur site.\n\n### Consignes\nLe "Hook" doit capter l''attention en moins de 3 secondes. Présente-le à la communauté pour recevoir des retours.',
  '[
    {"id": "w2_t1", "label": "Rédiger ton titre principal (H1)", "optional": false},
    {"id": "w2_t2", "label": "Définir 3 bénéfices clés pour l''utilisateur", "optional": false},
    {"id": "w2_t3", "label": "Valider la clarté auprès de 3 personnes", "optional": true}
  ]'::jsonb
),
(
  3,
  'La Landing Page & Waitlist',
  '### Objectif\nConçois une landing page simple pour récolter des emails (waitlist). Tu peux utiliser Lovable, Bolt, Wix, Framer ou tout autre outil.\n\n### Consignes\nLa page doit contenir ton Hook, tes bénéfices clés, et un champ de capture email. Partage le lien pour que les membres s''inscrivent !',
  '[
    {"id": "w3_t1", "label": "Choisir un outil de création de landing page", "optional": false},
    {"id": "w3_t2", "label": "Intégrer un formulaire de capture d''emails (waitlist)", "optional": false},
    {"id": "w3_t3", "label": "Publier le site en ligne (nom de domaine ou sous-domaine)", "optional": false}
  ]'::jsonb
),
(
  4,
  'Premier Trafic Organique',
  '### Objectif\nPublie un post sur les réseaux sociaux (LinkedIn, TikTok, Twitter) pour présenter ton projet et rediriger vers ta landing page.\n\n### Consignes\nRédige une histoire (storytelling) sur pourquoi tu construis ce projet. Récupère tes premiers inscrits sur la waitlist.',
  '[
    {"id": "w4_t1", "label": "Rédiger un post d''acquisition sur un réseau social", "optional": false},
    {"id": "w4_t2", "label": "Ajouter le lien de ta landing page en commentaire ou bios", "optional": false},
    {"id": "w4_t3", "label": "Obtenir tes 5 premiers inscrits sur ta waitlist", "optional": false}
  ]'::jsonb
),
(
  5,
  'Le MVP (Produit Minimum Viable)',
  '### Objectif\nConstruis la version la plus simple de ton produit (sans code avec Lovable/Bolt ou avec Cursor) qui délivre la valeur principale.\n\n### Consignes\nNe te disperse pas sur le design ou des options secondaires. Concentre-toi uniquement sur le service de base.',
  '[
    {"id": "w5_t1", "label": "Lister les fonctionnalités indispensables (MVP scope)", "optional": false},
    {"id": "w5_t2", "label": "Créer l''interface et la logique de base", "optional": false},
    {"id": "w5_t3", "label": "Tester le produit de bout en bout", "optional": false}
  ]'::jsonb
),
(
  6,
  'Intégration Supabase & Auth',
  '### Objectif\nAjoute la connexion utilisateur et configure ta base de données Supabase pour enregistrer les données de ton projet.\n\n### Consignes\nPermets à tes utilisateurs de se créer un compte et de sauvegarder leur progression ou leurs fichiers.',
  '[
    {"id": "w6_t1", "label": "Configurer Supabase Auth dans ton application", "optional": false},
    {"id": "w6_t2", "label": "Créer les tables nécessaires en DB", "optional": false},
    {"id": "w6_t3", "label": "Connecter le frontend à Supabase (lire/écrire)", "optional": false}
  ]'::jsonb
),
(
  7,
  'Paiement & Stripe',
  '### Objectif\nConnecte Stripe ou ton moyen de paiement mobile money pour monétiser ton produit.\n\n### Consignes\nUn projet n''est un business que lorsque quelqu''un paie pour. Configure tes tarifs et teste le tunnel d''achat.',
  '[
    {"id": "w7_t1", "label": "Créer et configurer un compte Stripe ou marchand money", "optional": false},
    {"id": "w7_t2", "label": "Créer des produits / abonnements de test", "optional": false},
    {"id": "w7_t3", "label": "Effectuer un paiement de test réussi en mode Sandbox", "optional": false}
  ]'::jsonb
),
(
  8,
  'Lancement Officiel',
  '### Objectif\nLance officiellement ton produit sur Product Hunt, dans des groupes privés et auprès de ta waitlist.\n\n### Consignes\nEnvoie l''email de lancement à ta waitlist avec un code de réduction de lancement. C''est le grand jour !',
  '[
    {"id": "w8_t1", "label": "Envoyer un email de lancement à ta waitlist", "optional": false},
    {"id": "w8_t2", "label": "Publier ton projet sur Product Hunt ou des forums ciblés", "optional": false},
    {"id": "w8_t3", "label": "Recueillir les retours des 3 premiers clients payants", "optional": true}
  ]'::jsonb
)
on conflict (week_number) do update
set title = excluded.title,
    description = excluded.description,
    tasks = excluded.tasks;
