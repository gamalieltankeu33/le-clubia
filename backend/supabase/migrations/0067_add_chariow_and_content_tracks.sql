-- =====================================================================
-- Le Club IA — Migration 0067 : Ajout des Parcours Chariow & Création de Contenu
--
-- Objectifs :
--   1. Ajouter le parcours "Produit Digital Express (1 Semaine sur Chariow)"
--   2. Ajouter le parcours "Création de Contenu & Communauté" (12 semaines)
--   3. Seeder les défis associés de manière dynamique.
-- =====================================================================

-- 1. Insertion des deux nouveaux parcours
insert into public.challenge_tracks (key, title, description)
values
  ('produit-express', 'Lancer son produit en 1 semaine (Chariow)', 'Un sprint intensif de 7 jours pour concevoir et lancer ton produit digital en utilisant Chariow pour encaisser tes paiements via Mobile Money et cartes bancaires.'),
  ('communaute-contenu', 'Création de Contenu & Communauté', 'Développe ta marque personnelle, crée une ligne éditoriale captivante et rassemble une communauté engagée autour de tes projets.')
on conflict (key) do update
set title = excluded.title, description = excluded.description;

-- 2. Seeding des défis hebdomadaires
do $$
declare
  t_express_id uuid;
  t_content_id uuid;
begin
  -- Récupération des IDs
  select id into t_express_id from public.challenge_tracks where key = 'produit-express';
  select id into t_content_id from public.challenge_tracks where key = 'communaute-contenu';

  -- =====================================================================
  -- SEED PARCOURS 5 : PRODUIT DIGITAL EXPRESS (1 SEMAINE)
  -- =====================================================================
  insert into public.challenge_weeks (track_id, week_number, title, description, tasks)
  values
  (
    t_express_id, 1, 'Le Sprint 7 Jours (Lancement Chariow)',
    '### Objectif\nCréer et lancer ton produit digital en seulement 7 jours en utilisant Chariow pour encaisser les paiements (Mobile Money & Cartes).\n\n### Contexte\nCe parcours express est idéal pour tester la demande rapidement sans fioritures. Chariow te permet de vendre tes fichiers ou templates en quelques minutes sans compétences techniques.\n\n### Programme du Sprint :\n- **Jour 1 & 2 : Conception** : Rédige un e-book de 5 pages ou crée un template Notion pratique résolvant un problème précis.\n- **Jour 3 : Inscription** : Crée ton compte marchand sur Chariow et configure tes informations de paiement (Mobile Money).\n- **Jour 4 : Création du Produit** : Ajoute ton produit sur ta boutique Chariow (titre, prix, image et fichier téléchargeable).\n- **Jour 5 : Personnalisation** : Rends ta boutique Chariow attractive (logo, couverture).\n- **Jour 6 : Trafic & Partage** : Publie ton lien Chariow sur tes réseaux et groupes ciblés.\n- **Jour 7 : Lancement** : Valide ta première transaction de test ou de vente.',
    '[
      {"id": "p5_w1_t1", "label": "Créer le produit digital (PDF, Template)", "optional": false},
      {"id": "p5_w1_t2", "label": "Créer et valider ta boutique sur Chariow", "optional": false},
      {"id": "p5_w1_t3", "label": "Ajouter le produit téléchargeable sur Chariow", "optional": false},
      {"id": "p5_w1_t4", "label": "Publier le lien de la boutique Chariow et le partager", "optional": false}
    ]'::jsonb
  )
  on conflict (track_id, week_number) do update
  set title = excluded.title, description = excluded.description, tasks = excluded.tasks;

  -- =====================================================================
  -- SEED PARCOURS 6 : CRÉATION DE CONTENU & COMMUNAUTÉ (12 SEMAINES)
  -- =====================================================================
  insert into public.challenge_weeks (track_id, week_number, title, description, tasks)
  values
  (
    t_content_id, 1, 'La Niche & Le Positionnement',
    '### Objectif\nDéfinir ton sujet de prédilection, le canal principal et l''audience cible.\n\n### Contexte\nPour attirer une communauté, tu dois être identifié comme l''expert d''un sujet précis. Choisis ton domaine (IA, No-code, Growth) et ta plateforme principale.',
    '[{"id": "p6_w1_t1", "label": "Définir ta thématique principale et ta sous-niche", "optional": false}, {"id": "p6_w1_t2", "label": "Choisir ta plateforme de prédilection (LinkedIn, YouTube, TikTok)", "optional": false}]'::jsonb
  ),
  (
    t_content_id, 2, 'L''Identité de Marque & Profil',
    '### Objectif\nOptimiser ton profil pour transformer les visiteurs en abonnés.\n\n### Contexte\nTon profil est ta vitrine. Crée une bannière claire, une photo de profil professionnelle et rédige une accroche qui explique ce que tu apportes.',
    '[{"id": "p6_w2_t1", "label": "Générer ou choisir une photo de profil et bannière professionnelles", "optional": false}, {"id": "p6_w2_t2", "label": "Rédiger ton accroche de profil (Qui tu aides et comment)", "optional": false}]'::jsonb
  ),
  (
    t_content_id, 3, 'La Stratégie Éditoriale',
    '### Objectif\nDéfinir tes piliers de contenu et planifier 1 mois d''idées.\n\n### Contexte\nLa régularité demande de l''organisation. Choisis 3 piliers (ex: Éducation, Inspiration, Coulisses) et liste tes premiers sujets.',
    '[{"id": "p6_w3_t1", "label": "Définir tes 3 grands piliers de contenu", "optional": false}, {"id": "p6_w3_t2", "label": "Lister 15 idées de posts ou vidéos", "optional": false}]'::jsonb
  ),
  (
    t_content_id, 4, 'Le Hook & Les Structures de Posts',
    '### Objectif\nMaîtriser l''art d''écrire des accroches percutantes et de structurer ses publications.\n\n### Contexte\nSans une bonne accroche, ton contenu ne sera pas lu. Apprends à capter l''attention dès les premières lignes.',
    '[{"id": "p6_w4_t1", "label": "Rédiger 5 variations d''accroches pour ton premier sujet", "optional": false}, {"id": "p6_w4_t2", "label": "Choisir un format de structure (Carrousel, Texte court, Storytelling)", "optional": false}]'::jsonb
  ),
  (
    t_content_id, 5, 'Production en Lot (Batching)',
    '### Objectif\nPrendre de l''avance en rédigeant ou filmant 5 publications en une seule fois.\n\n### Contexte\nLe batching te permet de rester serein. En créant tes contenus par bloc, tu améliores leur qualité globale et gagnes du temps.',
    '[{"id": "p6_w5_t1", "label": "Rédiger ou filmer 5 contenus d''avance", "optional": false}, {"id": "p6_w5_t2", "label": "Planifier ces 5 publications dans un outil dédié ou calendrier", "optional": false}]'::jsonb
  ),
  (
    t_content_id, 6, 'Premier Post & Interaction',
    '### Objectif\nPublier ton premier contenu officiel et interagir avec ton écosystème.\n\n### Contexte\nL''algorithme favorise l''engagement. Publie ton post et passe 15 minutes à commenter des comptes de ta niche.',
    '[{"id": "p6_w6_t1", "label": "Publier ton premier post à forte valeur ajoutée", "optional": false}, {"id": "p6_w6_t2", "label": "Laisser 10 commentaires pertinents sur d''autres profils", "optional": false}]'::jsonb
  ),
  (
    t_content_id, 7, 'Le Lead Magnet & Capture',
    '### Objectif\nCréer un aimant à prospects (Lead Magnet) gratuit pour capturer des adresses emails.\n\n### Contexte\nTa communauté ne doit pas dépendre uniquement des algorithmes. Offre un PDF ou template utile en échange d''une inscription.',
    '[{"id": "p6_w7_t1", "label": "Créer un lead magnet simple (checklist, guide, template)", "optional": false}, {"id": "p6_w7_t2", "label": "Mettre en place une page de capture d''emails", "optional": false}]'::jsonb
  ),
  (
    t_content_id, 8, 'L''Engagement & Réseau',
    '### Objectif\nCréer des connexions directes et authentiques en message privé (MP).\n\n### Contexte\nLa communauté se construit un à un. Échange avec les membres qui réagissent à tes posts et propose-leur de l''aide.',
    '[{"id": "p6_w8_t1", "label": "Contacter en MP 5 personnes ayant réagi à tes contenus", "optional": false}, {"id": "p6_w8_t2", "label": "Établir une relation de valeur sans chercher à vendre", "optional": false}]'::jsonb
  ),
  (
    t_content_id, 9, 'Lancement du Canal Communautaire',
    '### Objectif\nCréer un groupe de discussion privé (WhatsApp, Telegram ou Discord) pour rassembler tes membres les plus engagés.\n\n### Contexte\nUn groupe privé permet des échanges plus directs et crée un sentiment d''appartenance fort.',
    '[{"id": "p6_w9_t1", "label": "Créer ton canal (ex: Groupe WhatsApp privé)", "optional": false}, {"id": "p6_w9_t2", "label": "Inviter tes 15 membres les plus actifs à rejoindre le canal", "optional": false}]'::jsonb
  ),
  (
    t_content_id, 10, 'L''Événement Live / Masterclass',
    '### Objectif\nOrganiser et animer un atelier ou live gratuit pour apporter une valeur massive.\n\n### Contexte\nLe live crée une confiance inégalée. Propose un sujet précis (ex: Résoudre X problème) et réponds aux questions en direct.',
    '[{"id": "p6_w10_t1", "label": "Planifier et annoncer la date d''un live ou d''une masterclass", "optional": false}, {"id": "p6_w10_t2", "label": "Animer le live et délivrer de la valeur pendant 45 minutes", "optional": false}]'::jsonb
  ),
  (
    t_content_id, 11, 'Analyse des Stats & Itération',
    '### Objectif\nAnalyser tes statistiques de portée, d''inscriptions et de clics pour optimiser ta stratégie.\n\n### Contexte\nLes chiffres ne mentent pas. Regarde quels sujets et formats ont le mieux fonctionné et adapte ton planning de contenu.',
    '[{"id": "p6_w11_t1", "label": "Relever les indicateurs de performance (portée, clics, leads)", "optional": false}, {"id": "p6_w11_t2", "label": "Ajuster tes accroches (Hooks) selon les résultats", "optional": false}]'::jsonb
  ),
  (
    t_content_id, 12, 'L''Offre Communautaire 🚀',
    '### Objectif\nPrésenter une offre payante (coaching, formation, produit) à ta communauté active.\n\n### Contexte\nC''est l''aboutissement de ton travail. Si ta communauté a reçu de la valeur gratuitement, une partie sera ravie d''aller plus loin avec ton offre payante.',
    '[{"id": "p6_w12_t1", "label": "Rédiger et publier l''offre payante à destination de ta communauté", "optional": false}, {"id": "p6_w12_t2", "label": "Obtenir ta première vente ou réservation d''appel d''accompagnement", "optional": false}]'::jsonb
  )
  on conflict (track_id, week_number) do update
  set title = excluded.title, description = excluded.description, tasks = excluded.tasks;

end $$;
