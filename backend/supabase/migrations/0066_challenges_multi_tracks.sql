-- =====================================================================
-- Le Club IA — Migration 0066 : Challenges Multi-Parcours
--
-- Objectifs :
--   1. Ajouter active_challenge_track_id dans profiles.
--   2. Créer la table challenge_tracks (les 4 parcours).
--   3. Recréer la table challenge_weeks avec track_id et unique(track_id, week_number).
--   4. Recréer la table challenge_submissions.
--   5. Seeder les 4 parcours et les 48 défis hebdomadaires détaillés.
-- =====================================================================

-- 1. Ajout de la colonne active_challenge_track_id dans profiles
alter table public.profiles
  add column if not exists active_challenge_track_id uuid;

-- 2. Création de la table challenge_tracks
create table if not exists public.challenge_tracks (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  title text not null,
  description text,
  created_at timestamptz default now() not null
);

-- RLS sur challenge_tracks
alter table public.challenge_tracks enable row level security;

create policy select_challenge_tracks on public.challenge_tracks
  for select to authenticated using (true);

create policy admin_challenge_tracks on public.challenge_tracks
  for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- Ajouter la clé étrangère sur profiles
alter table public.profiles
  drop constraint if exists fk_profiles_active_challenge_track,
  add constraint fk_profiles_active_challenge_track
    foreign key (active_challenge_track_id)
    references public.challenge_tracks(id)
    on delete set null;

-- 3. Recréation des tables challenge_weeks et challenge_submissions
drop table if exists public.challenge_submissions cascade;
drop table if exists public.challenge_weeks cascade;

create table public.challenge_weeks (
  id uuid primary key default gen_random_uuid(),
  track_id uuid not null references public.challenge_tracks(id) on delete cascade,
  week_number integer not null,
  title text not null,
  description text not null,
  tasks jsonb default '[]'::jsonb not null,
  is_active boolean default true not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique (track_id, week_number)
);

create index idx_challenge_weeks_track_num on public.challenge_weeks(track_id, week_number);

create table public.challenge_submissions (
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

create index idx_submissions_user_challenge on public.challenge_submissions(user_id);
create index idx_submissions_week_challenge on public.challenge_submissions(challenge_week_id);

-- RLS sur les tables
alter table public.challenge_weeks enable row level security;
create policy select_challenge_weeks on public.challenge_weeks for select to authenticated using (true);
create policy admin_challenge_weeks on public.challenge_weeks for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

alter table public.challenge_submissions enable row level security;
create policy select_challenge_submissions on public.challenge_submissions for select to authenticated using (true);
create policy insert_challenge_submissions on public.challenge_submissions for insert to authenticated with check (auth.uid() = user_id);
create policy delete_challenge_submissions on public.challenge_submissions for delete to authenticated using (auth.uid() = user_id);

-- Recréer le trigger points_on_challenge_submitted
drop trigger if exists trg_points_challenge_submitted on public.challenge_submissions;
create trigger trg_points_challenge_submitted
  after insert on public.challenge_submissions
  for each row execute function public.points_on_challenge_submitted();

-- 4. Seeding des 4 parcours
insert into public.challenge_tracks (key, title, description)
values
  ('produit-digital', 'Produits Digitaux', 'Apprends à créer et vendre ton premier produit d''information (Ebook, Template Notion, Mini-formation) de A à Z en utilisant l''intelligence artificielle.'),
  ('micro-saas', 'Micro-SaaS avec l''IA', 'Développe et lance une application web de niche intégrant des API d''intelligence artificielle pour résoudre un problème récurrent de manière automatisée.'),
  ('site-internet', 'Site Internet avec l''IA', 'Conçois, design et mets en ligne un site internet premium (vitrine, e-commerce, portfolio) responsive et optimisé pour le SEO grâce aux meilleurs outils d''IA.'),
  ('video-ia', 'Création Vidéo / Édition IA', 'Développe ton audience et ton trafic organique en apprenant à scénariser, générer et monter des vidéos professionnelles via l''IA (TikTok, YouTube Faceless).')
on conflict (key) do update
set title = excluded.title, description = excluded.description;

-- 5. Seeding des 48 semaines de défis
do $$
declare
  t_prod_id uuid;
  t_saas_id uuid;
  t_site_id uuid;
  t_video_id uuid;
begin
  -- Récupération des IDs des parcours
  select id into t_prod_id from public.challenge_tracks where key = 'produit-digital';
  select id into t_saas_id from public.challenge_tracks where key = 'micro-saas';
  select id into t_site_id from public.challenge_tracks where key = 'site-internet';
  select id into t_video_id from public.challenge_tracks where key = 'video-ia';

  -- =====================================================================
  -- SEED PARCOURS 1 : PRODUITS DIGITAUX
  -- =====================================================================
  insert into public.challenge_weeks (track_id, week_number, title, description, tasks)
  values
  (
    t_prod_id, 1, 'Le Problème & La Cible',
    '### Objectif\nValider un problème urgent à résoudre et identifier qui est prêt à payer pour la solution.\n\n### Contexte\nUn produit digital qui ne résout pas un problème douloureux ne se vend pas. Avant de créer, définis précisément ta cible.',
    '[{"id": "p1_w1_t1", "label": "Définir le client idéal (Avatar)", "optional": false}, {"id": "p1_w1_t2", "label": "Énumérer 3 frustrations majeures de cet avatar", "optional": false}, {"id": "p1_w1_t3", "label": "Choisir le format du produit (Ebook, Template, Cours)", "optional": false}]'::jsonb
  ),
  (
    t_prod_id, 2, 'Proposition de Valeur & Hook',
    '### Objectif\nFormuler une offre irrésistible en une seule phrase (Hook) qui capte l''attention en moins de 3 secondes.\n\n### Contexte\nLe Hook est ce que les gens voient en premier. Il doit expliquer clairement quel est le bénéfice principal et comment tu résous le problème.',
    '[{"id": "p1_w2_t1", "label": "Rédiger ton Hook principal (H1) : J''aide X à faire Y sans Z", "optional": false}, {"id": "p1_w2_t2", "label": "Définir les 3 grands bénéfices du produit", "optional": false}]'::jsonb
  ),
  (
    t_prod_id, 3, 'Sommaire & Plan d''Action',
    '### Objectif\nStructurer l''arborescence et le contenu détaillé de ton produit digital pour guider ta création.\n\n### Contexte\nUn bon plan te permet d''éviter la page blanche. Il structure l''apprentissage ou le template Notion de manière fluide et logique.',
    '[{"id": "p1_w3_t1", "label": "Rédiger la table des matières ou le plan de modules", "optional": false}, {"id": "p1_w3_t2", "label": "Définir ce qui sera inclus dans chaque section", "optional": false}]'::jsonb
  ),
  (
    t_prod_id, 4, 'Création du Contenu (Partie 1)',
    '### Objectif\nRédiger ou concevoir la première moitié fonctionnelle de ton produit digital.\n\n### Contexte\nC''est le moment de créer la valeur. Rédige les premiers chapitres ou construis le coeur de ton template Notion.',
    '[{"id": "p1_w4_t1", "label": "Écrire les 2 premiers modules ou concevoir la base du template", "optional": false}, {"id": "p1_w4_t2", "label": "Structurer les exercices pratiques de ces modules", "optional": false}]'::jsonb
  ),
  (
    t_prod_id, 5, 'Création du Contenu (Partie 2)',
    '### Objectif\nFinaliser l''intégralité du contenu brut de ton produit digital.\n\n### Contexte\nComplète la rédaction ou le développement. À la fin de cette semaine, le produit doit exister dans sa version brute.',
    '[{"id": "p1_w5_t1", "label": "Rédiger les derniers chapitres ou peaufiner le template", "optional": false}, {"id": "p1_w5_t2", "label": "Ajouter les conclusions et ressources de fin", "optional": false}]'::jsonb
  ),
  (
    t_prod_id, 6, 'Design & Identité Visuelle',
    '### Objectif\nCréer une couverture premium et mettre en page le produit pour le rendre professionnel.\n\n### Contexte\nLa valeur perçue passe par le visuel. Une belle couverture 3D et une mise en page soignée justifient ton prix.',
    '[{"id": "p1_w6_t1", "label": "Créer la couverture (eCover) sur Canva", "optional": false}, {"id": "p1_w6_t2", "label": "Mettre en page le PDF ou appliquer un thème premium au template", "optional": false}]'::jsonb
  ),
  (
    t_prod_id, 7, 'La Landing Page & Capture',
    '### Objectif\nCréer la page de présentation (Landing Page) pour expliquer ton offre et capturer des prospects.\n\n### Contexte\nTa landing page est ton vendeur en ligne. Elle doit utiliser le copywriting pour transformer des visiteurs en inscrits.',
    '[{"id": "p1_w7_t1", "label": "Écrire les textes de vente (copywriting)", "optional": false}, {"id": "p1_w7_t2", "label": "Créer et publier la landing page simple en ligne", "optional": false}]'::jsonb
  ),
  (
    t_prod_id, 8, 'Configuration Paiement & Livraison',
    '### Objectif\nConfigurer la passerelle de paiement et automatiser l''envoi de ton produit digital après l''achat.\n\n### Contexte\nTout doit être automatique. Quand un utilisateur paie, il doit recevoir instantanément son lien de téléchargement par email.',
    '[{"id": "p1_w8_t1", "label": "Connecter Stripe, Paypal ou Mobile Money", "optional": false}, {"id": "p1_w8_t2", "label": "Configurer la redirection post-achat pour télécharger le produit", "optional": false}]'::jsonb
  ),
  (
    t_prod_id, 9, 'Trafic Organique (Lancement V1)',
    '### Objectif\nAttirer tes premiers visiteurs sur ta landing page sans dépenser un seul centime en publicité.\n\n### Contexte\nPartage la genèse de ton projet sur les réseaux sociaux. Offre un extrait ou un accès anticipé pour créer de l''engagement.',
    '[{"id": "p1_w9_t1", "label": "Rédiger un post de valeur sur LinkedIn ou Facebook", "optional": false}, {"id": "p1_w9_t2", "label": "Offrir un extrait gratuit du produit en échange d''un avis", "optional": false}]'::jsonb
  ),
  (
    t_prod_id, 10, 'Collecte de Feedback',
    '### Objectif\nObtenir les retours de tes premiers lecteurs/utilisateurs pour corriger les faiblesses du produit.\n\n### Contexte\nLe feedback est la clé de l''amélioration. Identifie ce qui a plu et ce qui a manqué de clarté.',
    '[{"id": "p1_w10_t1", "label": "Envoyer un questionnaire court aux premiers lecteurs", "optional": false}, {"id": "p1_w10_t2", "label": "Récolter au moins 3 témoignages écrits", "optional": false}]'::jsonb
  ),
  (
    t_prod_id, 11, 'Optimisation de l''Offre',
    '### Objectif\nAjuster le produit et les textes de vente en fonction des feedbacks recueillis.\n\n### Contexte\nCorrige les coquilles, clarifie les passages complexes et intègre un bonus exclusif pour augmenter la valeur perçue.',
    '[{"id": "p1_w11_t1", "label": "Appliquer les corrections suggérées par les lecteurs", "optional": false}, {"id": "p1_w11_t2", "label": "Ajouter un bonus exclusif pour augmenter la valeur perçue", "optional": false}]'::jsonb
  ),
  (
    t_prod_id, 12, 'Lancement Officiel 🚀',
    '### Objectif\nLancer publiquement et à grande échelle ton produit digital auprès de ton audience.\n\n### Contexte\nC''est l''étape finale. Envoie un email de vente, publie sur tes réseaux et mesure tes résultats.',
    '[{"id": "p1_w12_t1", "label": "Envoyer un email de vente à toute ta base", "optional": false}, {"id": "p1_w12_t2", "label": "Faire une annonce officielle de lancement avec offre limitée", "optional": false}]'::jsonb
  );

  -- =====================================================================
  -- SEED PARCOURS 2 : MICRO-SAAS AVEC L'IA
  -- =====================================================================
  insert into public.challenge_weeks (track_id, week_number, title, description, tasks)
  values
  (
    t_saas_id, 1, 'Le Problème & La Cible',
    '### Objectif\nTrouver un problème de niche récurrent pouvant être automatisé par une API d''IA.\n\n### Contexte\nUn bon SaaS résout une douleur précise. Analyse les processus répétitifs ou inefficaces chez les professionnels (facturation, rédaction, tri...).',
    '[{"id": "p2_w1_t1", "label": "Identifier un processus fastidieux pour les pros", "optional": false}, {"id": "p2_w1_t2", "label": "Définir l''audience cible et estimer leur budget", "optional": false}]'::jsonb
  ),
  (
    t_saas_id, 2, 'Le Cahier des Charges du MVP',
    '### Objectif\nDéfinir le périmètre minimum fonctionnel de ton logiciel (le MVP) pour aller vite sur le marché.\n\n### Contexte\nNe cherche pas à coder 50 options. Reste focalisé sur un écran de saisie, un appel API, et l''affichage du résultat.',
    '[{"id": "p2_w2_t1", "label": "Lister les 3 écrans indispensables (Login, Dashboard, Outil)", "optional": false}, {"id": "p2_w2_t2", "label": "Rédiger le parcours utilisateur étape par étape", "optional": false}]'::jsonb
  ),
  (
    t_saas_id, 3, 'Initialisation du Projet & Stack',
    '### Objectif\nConfigurer ton environnement de développement et initialiser ton dépôt de code.\n\n### Contexte\nConfigure la structure React/Next.js ou ton outil No-code. Mets en place ton dépôt de code GitHub pour versionner ton projet.',
    '[{"id": "p2_w3_t1", "label": "Créer le projet localement (NextJS, Vite, No-code)", "optional": false}, {"id": "p2_w3_t2", "label": "Connecter ton dépôt de code sur GitHub", "optional": false}]'::jsonb
  ),
  (
    t_saas_id, 4, 'Base de Données & Supabase',
    '### Objectif\nCréer les tables de données et configurer la connexion utilisateur (Auth).\n\n### Contexte\nConnecte ton application à Supabase. Crée la table de profil utilisateur et configure l''inscription par email.',
    '[{"id": "p2_w4_t1", "label": "Configurer ton projet Supabase et son SDK", "optional": false}, {"id": "p2_w4_t2", "label": "Créer la table profiles et tester la connexion email", "optional": false}]'::jsonb
  ),
  (
    t_saas_id, 5, 'Maquette & Interface Frontend',
    '### Objectif\nCoder l''interface utilisateur de ton tableau de bord et du formulaire.\n\n### Contexte\nCrée une expérience fluide. L''utilisateur doit pouvoir saisir ses données facilement et voir où s''afficheront les résultats générés par l''IA.',
    '[{"id": "p2_w5_t1", "label": "Coder le formulaire de saisie utilisateur", "optional": false}, {"id": "p2_w5_t2", "label": "Préparer la zone d''affichage des résultats générés", "optional": false}]'::jsonb
  ),
  (
    t_saas_id, 6, 'Intégration de l''API IA',
    '### Objectif\nConnecter ton application à l''API d''OpenAI, Anthropic ou un service similaire.\n\n### Contexte\nC''est le coeur de ton SaaS. Configure les variables d''environnement de manière sécurisée et passe ton premier appel API réel.',
    '[{"id": "p2_w6_t1", "label": "Configurer la clé API IA de manière sécurisée en backend", "optional": false}, {"id": "p2_w6_t2", "label": "Écrire la fonction backend qui interroge l''IA et retourne la réponse", "optional": false}]'::jsonb
  ),
  (
    t_saas_id, 7, 'Déploiement V1 & Landing Page',
    '### Objectif\nMettre ton application en ligne et concevoir sa landing page de présentation.\n\n### Contexte\nDéploie ton SaaS sur Vercel. Rends-le accessible publiquement et prépare une page d''accueil simple avec un appel à l''action clair.',
    '[{"id": "p2_w7_t1", "label": "Déployer l''application frontend sur Vercel ou Netlify", "optional": false}, {"id": "p2_w7_t2", "label": "Créer la landing page de présentation avec un bouton de test", "optional": false}]'::jsonb
  ),
  (
    t_saas_id, 8, 'Configuration Stripe & Crédits',
    '### Objectif\nConfigurer les paiements Stripe pour monétiser l''utilisation de ton SaaS.\n\n### Contexte\nUn SaaS doit être payant. Configure Stripe Checkout, crée tes tarifs d''abonnement et mets à jour les crédits de tes membres.',
    '[{"id": "p2_w8_t1", "label": "Créer les produits et prix dans ton dashboard Stripe", "optional": false}, {"id": "p2_w8_t2", "label": "Connecter le tunnel de paiement Stripe et gérer la redirection", "optional": false}]'::jsonb
  ),
  (
    t_saas_id, 9, 'Test Utilisateur (Bêta Privée)',
    '### Objectif\nValider le fonctionnement de ton SaaS auprès de 3 vrais utilisateurs cibles.\n\n### Contexte\nDonne des accès à tes premiers testeurs. Observe comment ils utilisent ton application et corrige les points bloquants.',
    '[{"id": "p2_w9_t1", "label": "Fournir un accès de test à 3 personnes de ta cible", "optional": false}, {"id": "p2_w9_t2", "label": "Recueillir leurs retours d''expérience et identifier les bugs", "optional": false}]'::jsonb
  ),
  (
    t_saas_id, 10, 'Optimisation & Sécurité',
    '### Objectif\nSécuriser les appels serveurs, corriger les bugs critiques et peaufiner les performances.\n\n### Contexte\nMets en place du rate-limiting pour éviter de te faire vider ton compte OpenAI par des robots, et nettoie ton code.',
    '[{"id": "p2_w10_t1", "label": "Ajouter une protection (rate-limiting) sur tes routes API", "optional": false}, {"id": "p2_w10_t2", "label": "Corriger au moins 2 bugs rapportés par tes testeurs", "optional": false}]'::jsonb
  ),
  (
    t_saas_id, 11, 'Copywriting & Vidéo Démo',
    '### Objectif\nCréer une courte vidéo de démonstration de 1 minute pour augmenter les conversions.\n\n### Contexte\nLes gens aiment voir le produit en action avant de s''inscrire. Enregistre une démo rapide sur Loom et intègre-la sur ta landing page.',
    '[{"id": "p2_w11_t1", "label": "Rédiger et enregistrer une vidéo démo produit de 60 secondes (Loom)", "optional": false}, {"id": "p2_w11_t2", "label": "Intégrer le player vidéo de manière visible sur ta landing", "optional": false}]'::jsonb
  ),
  (
    t_saas_id, 12, 'Lancement Officiel 🚀',
    '### Objectif\nLancer publiquement ton Micro-SaaS sur Product Hunt et dans la communauté.\n\n### Contexte\nC''est le grand jour. Publie sur Product Hunt, partage sur LinkedIn, et suis l''acquisition de tes premiers clients payants.',
    '[{"id": "p2_w12_t1", "label": "Préparer et publier la fiche produit sur Product Hunt", "optional": false}, {"id": "p2_w12_t2", "label": "Partager le lien de lancement sur tes réseaux sociaux", "optional": false}]'::jsonb
  );

  -- =====================================================================
  -- SEED PARCOURS 3 : SITE INTERNET AVEC L'IA
  -- =====================================================================
  insert into public.challenge_weeks (track_id, week_number, title, description, tasks)
  values
  (
    t_site_id, 1, 'Objectif & Choix du Projet',
    '### Objectif\nDéfinir le type de site (vitrine, e-commerce, portfolio) et son objectif de conversion.\n\n### Contexte\nUn site web doit avoir un but clair : récolter des emails, recevoir des demandes de devis ou vendre. Choisis la stack technologique (Lovable, Wix, Framer) adaptée.',
    '[{"id": "p3_w1_t1", "label": "Décrire le but principal et la cible du site", "optional": false}, {"id": "p3_w1_t2", "label": "Choisir la stack technique de création IA", "optional": false}]'::jsonb
  ),
  (
    t_site_id, 2, 'L''Arborescence & Les Contenus',
    '### Objectif\nStructurer la navigation de ton site et rédiger les textes des différentes sections.\n\n### Contexte\nDéfinis le plan des pages (Accueil, Services, Contact, À propos) et prépare les textes bruts. Une bonne structure aide le visiteur et améliore le SEO.',
    '[{"id": "p3_w2_t1", "label": "Créer le plan de navigation (Sitemap) du site", "optional": false}, {"id": "p3_w2_t2", "label": "Rédiger les textes bruts pour chaque page/section", "optional": false}]'::jsonb
  ),
  (
    t_site_id, 3, 'Wireframes & Identité Visuelle',
    '### Objectif\nCréer la maquette en noir et blanc (Wireframe) et définir ta charte graphique.\n\n### Contexte\nSélectionne une palette de 3 couleurs et tes typographies. Dessine le squelette de la page d''accueil sur Figma ou Canva pour valider l''ergonomie.',
    '[{"id": "p3_w3_t1", "label": "Choisir une palette de couleurs et tes typographies", "optional": false}, {"id": "p3_w3_t2", "label": "Dessiner le squelette de la page d''accueil", "optional": false}]'::jsonb
  ),
  (
    t_site_id, 4, 'Création de la Page d''Accueil (V1)',
    '### Objectif\nConstruire la structure globale et la section d''en-tête (Hero) de ton site.\n\n### Contexte\nConfigure ton projet dans ton constructeur. Intègre ton Hook principal (H1) et ton bouton d''appel à l''action principal de manière percutante.',
    '[{"id": "p3_w4_t1", "label": "Initialiser ton projet dans l''outil web", "optional": false}, {"id": "p3_w4_t2", "label": "Créer la section d''en-tête (Hero) avec Hook et CTA", "optional": false}]'::jsonb
  ),
  (
    t_site_id, 5, 'Pages Secondaires (Services & À propos)',
    '### Objectif\nConstruire les pages internes de ton site pour présenter tes offres et ton parcours.\n\n### Contexte\nRédige et mets en page la section Services et la section "À propos". Assure-toi que la navigation entre ces pages est fluide.',
    '[{"id": "p3_w5_t1", "label": "Créer et intégrer la page de description des services/produits", "optional": false}, {"id": "p3_w5_t2", "label": "Créer la page À propos avec ton storytelling", "optional": false}]'::jsonb
  ),
  (
    t_site_id, 6, 'Page Contact & Formulaire',
    '### Objectif\nIntégrer un formulaire de contact fonctionnel pour récolter les prospects.\n\n### Contexte\nTon site doit pouvoir capturer des leads. Ajoute un formulaire propre (avec Tally ou un outil intégré) et teste l''envoi d''emails de test.',
    '[{"id": "p3_w6_t1", "label": "Créer la page de contact et y insérer un formulaire", "optional": false}, {"id": "p3_w6_t2", "label": "Tester le formulaire et valider la bonne réception de l''email", "optional": false}]'::jsonb
  ),
  (
    t_site_id, 7, 'Optimisation Mobile & Ergonomie',
    '### Objectif\nS''assurer que ton site s''affiche parfaitement sur smartphone et tablette (Responsive).\n\n### Contexte\nPlus de 50% du trafic web est mobile. Vérifie que tes textes ne débordent pas, que les images sont centrées et que les menus fonctionnent sur mobile.',
    '[{"id": "p3_w7_t1", "label": "Tester et ajuster chaque page sur simulateur mobile", "optional": false}, {"id": "p3_w7_t2", "label": "Optimiser la navigation mobile (menu burger)", "optional": false}]'::jsonb
  ),
  (
    t_site_id, 8, 'SEO & Vitesse de Chargement',
    '### Objectif\nConfigurer le référencement naturel de base et optimiser la vitesse de ton site.\n\n### Contexte\nRemplis les balises Title et Description. Compresse les images au format WebP pour obtenir un excellent score de rapidité.',
    '[{"id": "p3_w8_t1", "label": "Remplir les balises Meta Title et Meta Description de chaque page", "optional": false}, {"id": "p3_w8_t2", "label": "Compresser toutes les images pour améliorer le chargement", "optional": false}]'::jsonb
  ),
  (
    t_site_id, 9, 'Connexion Domaine & SSL',
    '### Objectif\nPublier ton site sous ton propre nom de domaine avec une connexion sécurisée (HTTPS).\n\n### Contexte\nConnecte ton nom de domaine personnalisé. Configure tes DNS et vérifie que le certificat SSL (HTTPS) est actif pour rassurer tes visiteurs.',
    '[{"id": "p3_w9_t1", "label": "Acheter et lier un nom de domaine à ton hébergeur", "optional": false}, {"id": "p3_w9_t2", "label": "Valider le bon fonctionnement du HTTPS (cadenas)", "optional": false}]'::jsonb
  ),
  (
    t_site_id, 10, 'Recueil d''Avis (Bêta Test)',
    '### Objectif\nFaire tester ton site à des proches ou membres de la communauté pour détecter d''éventuels soucis.\n\n### Contexte\nLes testeurs externes détectent des choses que tu ne vois plus. Demande des retours sur l''utilisabilité et la clarté de ton offre.',
    '[{"id": "p3_w10_t1", "label": "Envoyer le lien du site à 3 personnes pour obtenir des retours", "optional": false}, {"id": "p3_w10_t2", "label": "Lister les points bloquants ou confus signalés", "optional": false}]'::jsonb
  ),
  (
    t_site_id, 11, 'Corrections Finales',
    '### Objectif\nAppliquer les modifications demandées par tes testeurs et finaliser le design.\n\n### Contexte\nPrends en compte les remarques pertinentes. Corrige les fautes, optimise les appels à l''action et finalise chaque détail visuel.',
    '[{"id": "p3_w11_t1", "label": "Appliquer les corrections visuelles et textuelles suite aux retours", "optional": false}, {"id": "p3_w11_t2", "label": "Vérifier à nouveau le tunnel de contact ou de vente", "optional": false}]'::jsonb
  ),
  (
    t_site_id, 12, 'Lancement Officiel 🚀',
    '### Objectif\nLancer officiellement ton site internet et générer tes premiers visiteurs.\n\n### Contexte\nPublie un post LinkedIn/Facebook pour annoncer la mise en ligne, et partage ton projet avec le Club IA.',
    '[{"id": "p3_w12_t1", "label": "Rédiger et publier un post d''annonce de lancement", "optional": false}, {"id": "p3_w12_t2", "label": "Partager ton site finalisé dans la communauté", "optional": false}]'::jsonb
  );

  -- =====================================================================
  -- SEED PARCOURS 4 : CRÉATION VIDÉO / ÉDITION IA
  -- =====================================================================
  insert into public.challenge_weeks (track_id, week_number, title, description, tasks)
  values
  (
    t_video_id, 1, 'Le Positionnement & La Niche',
    '### Objectif\nChoisir le sujet de ta chaîne, ta plateforme principale (YouTube, TikTok) et ton format.\n\n### Contexte\nPour réussir en vidéo, il faut un positionnement précis. Choisis ta thématique (Finances, Tech, Storytelling) et ton style de vidéo (sans visage, avec avatar).',
    '[{"id": "p4_w1_t1", "label": "Définir le thème de ton contenu et ton format principal", "optional": false}, {"id": "p4_w1_t2", "label": "Rédiger la biographie de tes futurs comptes sociaux", "optional": false}]'::jsonb
  ),
  (
    t_video_id, 2, 'Identité Visuelle de la Chaîne',
    '### Objectif\nCréer l''avatar, la bannière et la charte graphique de ta chaîne.\n\n### Contexte\nL''identité visuelle donne une image professionnelle. Génère un avatar de chaîne avec Midjourney/Leonardo et crée une bannière épurée sur Canva.',
    '[{"id": "p4_w2_t1", "label": "Générer un avatar professionnel avec une IA générative", "optional": false}, {"id": "p4_w2_t2", "label": "Créer la bannière et configurer le profil social", "optional": false}]'::jsonb
  ),
  (
    t_video_id, 3, 'Ligne Éditoriale & 5 Sujets',
    '### Objectif\nPlanifier tes 5 premières idées de vidéos à fort potentiel.\n\n### Contexte\nAnalyse ce qui fonctionne chez tes concurrents. Rédige 5 titres accrocheurs qui suscitent la curiosité et prépare ton planning.',
    '[{"id": "p4_w3_t1", "label": "Lister 5 idées de vidéos avec titres optimisés", "optional": false}, {"id": "p4_w3_t2", "label": "Créer ton calendrier éditorial de publication", "optional": false}]'::jsonb
  ),
  (
    t_video_id, 4, 'Écriture du Premier Script',
    '### Objectif\nRédiger le script complet de ta première vidéo en insistant sur l''introduction.\n\n### Contexte\nLes 5 premières secondes (le Hook) déterminent si le spectateur reste ou part. Rédige ton script en insistant sur le rythme et la clarté.',
    '[{"id": "p4_w4_t1", "label": "Rédiger l''introduction (Hook) accrocheur (5 sec)", "optional": false}, {"id": "p4_w4_t2", "label": "Écrire le script détaillé de ta vidéo (1 à 3 minutes)", "optional": false}]'::jsonb
  ),
  (
    t_video_id, 5, 'Enregistrement Voix & Audio',
    '### Objectif\nGénérer une voix off professionnelle avec l''IA ou enregistrer ta propre voix.\n\n### Contexte\nUtilise ElevenLabs pour cloner ta voix ou choisir un profil adapté. Nettoie les bruits de fond de ton enregistrement pour avoir un son clair.',
    '[{"id": "p4_w5_t1", "label": "Générer la voix off via ElevenLabs ou l''enregistrer au micro", "optional": false}, {"id": "p4_w5_t2", "label": "Nettoyer l''audio (bruit, écho) pour un rendu professionnel", "optional": false}]'::jsonb
  ),
  (
    t_video_id, 6, 'Montage & Effets Visuels (V1)',
    '### Objectif\nAssembler tes visuels, vidéos de stock et voix off dans ton logiciel de montage.\n\n### Contexte\nUtilise CapCut ou Premiere. Importe ta voix off, cale tes médias d''illustration et ajoute des transitions rythmées.',
    '[{"id": "p4_w6_t1", "label": "Importer l''audio et caler tes premiers médias d''illustration", "optional": false}, {"id": "p4_w6_t2", "label": "Ajouter des transitions fluides et tes premiers effets sonores", "optional": false}]'::jsonb
  ),
  (
    t_video_id, 7, 'Sous-titres & Rendu Final',
    '### Objectif\nAjouter des sous-titres dynamiques et exporter ta vidéo finale.\n\n### Contexte\nBeaucoup regardent les vidéos sans le son. Génère des sous-titres automatiques sur CapCut, stylise-les, puis exporte ta vidéo en haute définition (1080p).',
    '[{"id": "p4_w7_t1", "label": "Générer et styliser des sous-titres dynamiques sur CapCut", "optional": false}, {"id": "p4_w7_t2", "label": "Exporter ta vidéo finale en format 1080p", "optional": false}]'::jsonb
  ),
  (
    t_video_id, 8, 'Première Publication & Titrage',
    '### Objectif\nPublier ta première vidéo en ligne en optimisant les tags et la description.\n\n### Contexte\nRédige une description contenant tes mots clés, choisis un titre optimisé pour le taux de clic et publie la vidéo sur TikTok, Shorts ou YouTube.',
    '[{"id": "p4_w8_t1", "label": "Rédiger le titre, tags et description optimisés SEO", "optional": false}, {"id": "p4_w8_t2", "label": "Publier officiellement la vidéo en ligne", "optional": false}]'::jsonb
  ),
  (
    t_video_id, 9, 'Production de la Vidéo 2',
    '### Objectif\nProduire et publier ta deuxième vidéo de manière plus rapide.\n\n### Contexte\nLa régularité est reine. Reprends ton sujet N°2, rédige, enregistre, monte et publie ta deuxième vidéo en appliquant la même méthodologie.',
    '[{"id": "p4_w9_t1", "label": "Créer le script et l''audio pour ton deuxième sujet", "optional": false}, {"id": "p4_w9_t2", "label": "Monter et publier ta deuxième vidéo", "optional": false}]'::jsonb
  ),
  (
    t_video_id, 10, 'Analyse des Statistiques',
    '### Objectif\nAnalyser tes premiers chiffres d''audience pour comprendre la rétention.\n\n### Contexte\nConsulte tes statistiques. Regarde le nombre de vues et repère à quel moment précis les spectateurs quittent ta vidéo afin d''améliorer tes hooks.',
    '[{"id": "p4_w10_t1", "label": "Analyser le taux de rétention moyen de tes vidéos", "optional": false}, {"id": "p4_w10_t2", "label": "Identifier 2 pistes d''améliorations sur ton montage ou ton écriture", "optional": false}]'::jsonb
  ),
  (
    t_video_id, 11, 'Production de la Vidéo 3',
    '### Objectif\nProduire et publier une troisième vidéo en appliquant les optimisations apprises.\n\n### Contexte\nCrée ta troisième vidéo en insistant sur le rythme de ton introduction (Hook) et la clarté visuelle pour retenir l''attention plus longtemps.',
    '[{"id": "p4_w11_t1", "label": "Écrire, monter et publier ta troisième vidéo", "optional": false}, {"id": "p4_w11_t2", "label": "Mettre en pratique les optimisations de rétention", "optional": false}]'::jsonb
  ),
  (
    t_video_id, 12, 'Bilan & Stratégie de Croissance 🚀',
    '### Objectif\nÉtablir ton calendrier et ta stratégie de publication pour les 30 prochains jours.\n\n### Contexte\nFélicitations, tu as lancé ta machine. Rédige ton bilan, compile tes résultats de vues et prépare ton planning de création du mois prochain.',
    '[{"id": "p4_w12_t1", "label": "Compiler tes statistiques globales (vues, abonnés)", "optional": false}, {"id": "p4_w12_t2", "label": "Créer ton calendrier de publication sur 30 jours", "optional": false}]'::jsonb
  );

end $$;
