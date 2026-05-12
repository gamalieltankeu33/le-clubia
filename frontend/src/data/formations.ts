export interface Chapter {
  title: string;
  duration?: string;
  description?: string;
}

export interface Formation {
  id: string;
  title: string;
  subtitle: string;
  shortDescription: string;
  longDescription: string;
  category: string;
  level: "debutant" | "intermediaire" | "avance";
  duration: string;
  chapters: Chapter[];
  image?: string;
  color?: string;
}

export const FORMATIONS: Formation[] = [
  {
    id: "ia-foundations",
    title: "IA Foundations",
    subtitle: "Tes premiers pas avec ChatGPT, Claude et les outils IA essentiels",
    shortDescription: "Découvre les outils IA incontournables et apprends à les utiliser comme un pro dès le premier jour.",
    longDescription: "L'IA peut transformer ta vie pro et perso, mais encore faut-il savoir par où commencer. Cette formation te donne les fondations : comprendre ChatGPT, Claude, Gemini, savoir quel outil choisir pour quelle tâche, écrire des prompts qui marchent, et intégrer l'IA dans tes routines quotidiennes. Tu sortiras de cette formation avec les bases solides pour tout le reste.",
    category: "Outils IA",
    level: "debutant",
    duration: "2h30",
    color: "from-blue-500/20 to-cyan-500/20",
    chapters: [
      { title: "Introduction à l'IA générative", duration: "15 min", description: "c'est quoi vraiment, pourquoi 2024 a tout changé" },
      { title: "Les 4 outils essentiels", duration: "30 min", description: "ChatGPT, Claude, Gemini, Perplexity : forces et limites" },
      { title: "Le prompt engineering", duration: "40 min", description: "la méthode CLAIR pour écrire des prompts qui marchent" },
      { title: "Tes 10 cas d'usage du quotidien", duration: "30 min", description: "emails, recherche, brainstorming, traduction, etc." },
      { title: "Sécurité et confidentialité", duration: "15 min", description: "ce qu'il ne faut JAMAIS partager avec une IA" },
      { title: "Construis ton workspace IA", duration: "20 min", description: "quels abonnements prendre, dans quel ordre" },
    ],
  },
  {
    id: "ia-productivite",
    title: "IA Productivité",
    subtitle: "Fais en 1h ce qui te prend 8h",
    shortDescription: "Apprends à automatiser tes tâches répétitives et libérer 4 à 6 heures par semaine grâce aux outils IA modernes.",
    longDescription: "Tu es submergé(e) par les emails, les réunions, les tâches admin ? Cette formation te montre comment l'IA peut récupérer 4 à 6 heures de ton temps chaque semaine. On voit ensemble comment automatiser tes emails, transcrire et synthétiser tes réunions, gérer ton agenda, classer tes fichiers, et utiliser Notion AI comme un assistant personnel. Le tout en 2h chrono.",
    category: "Automatisation",
    level: "debutant",
    duration: "2h",
    color: "from-emerald-500/20 to-teal-500/20",
    chapters: [
      { title: "Le diagnostic productivité", duration: "15 min", description: "repère où tu perds du temps avec un audit IA" },
      { title: "Emails et messages au pilote automatique", duration: "30 min", description: "Superhuman, Shortwave, ChatGPT, Accio Work" },
      { title: "Réunions et notes", duration: "25 min", description: "transcription, résumés actionnables, suivi auto" },
      { title: "Agenda, tâches, fichiers", duration: "30 min", description: "Notion AI, Reclaim, Raycast" },
      { title: "Routines IA quotidiennes", duration: "20 min", description: "ton workflow type d'une journée optimisée" },
    ],
  },
  {
    id: "youtube-faceless-mastery",
    title: "YouTube Faceless Mastery",
    subtitle: "Construis une chaîne YouTube rentable sans jamais montrer ton visage",
    shortDescription: "Lance et fais croître une chaîne YouTube qui génère des revenus passifs, sans te montrer.",
    longDescription: "YouTube reste la plateforme #1 pour générer des revenus passifs avec du contenu IA. Cette formation est THE guide complet pour lancer ta chaîne sans visage : choisir la bonne niche, écrire des scripts qui retiennent l'attention, créer des voix IA naturelles, monter avec des outils 100% IA, optimiser pour l'algo, et monétiser dès les premiers mois. Que tu vises la passion ou les revenus, tu auras tout en main.",
    category: "Vidéo IA",
    level: "intermediaire",
    duration: "4h",
    color: "from-red-500/20 to-orange-500/20",
    chapters: [
      { title: "Choisir LA bonne niche", duration: "25 min", description: "méthode + outils + 30 niches porteuses 2026" },
      { title: "L'architecture d'une chaîne qui scale", duration: "20 min", description: "branding, identité, ligne éditoriale" },
      { title: "Scripts qui retiennent", duration: "35 min", description: "la structure secret des vidéos virales" },
      { title: "Voix IA naturelles", duration: "30 min", description: "ElevenLabs, ChatGPT Voice, alternatives gratuites" },
      { title: "Visuels et B-rolls IA", duration: "40 min", description: "Midjourney, Runway, banques d'images" },
      { title: "Montage IA en 1h", duration: "35 min", description: "CapCut, Descript, Adobe Express" },
      { title: "Optimisation YouTube", duration: "30 min", description: "titres, miniatures, SEO, hooks" },
      { title: "Monétisation", duration: "25 min", description: "AdSense, affiliation, sponsoring, produits perso" },
    ],
  },
  {
    id: "content-sans-visage",
    title: "Content Sans Visage",
    subtitle: "Devenir créateur anonyme sur Instagram, TikTok et LinkedIn",
    shortDescription: "La méthode pour créer du contenu engageant sur les réseaux sociaux sans jamais te montrer.",
    longDescription: "Pas envie de te montrer en story ou en reel ? Pas besoin. Cette formation te donne la stratégie pour devenir un créateur de contenu anonyme respecté et rentable sur Instagram, TikTok et LinkedIn. Tu apprends les formats sans visage qui cartonnent, comment générer des carrousels et des reels avec l'IA, comment programmer ton contenu en avance, et comment développer une communauté fidèle.",
    category: "Création de contenu IA",
    level: "intermediaire",
    duration: "3h30",
    color: "from-purple-500/20 to-pink-500/20",
    chapters: [
      { title: "Pourquoi le faceless explose en 2026", duration: "15 min", description: "la grande tendance" },
      { title: "Choisir tes plateformes", duration: "20 min", description: "Instagram, TikTok, LinkedIn : laquelle pour toi" },
      { title: "Carrousels Instagram qui convertissent", duration: "35 min", description: "Canva + Claude" },
      { title: "Reels et TikToks faceless viraux", duration: "45 min", description: "formats, scripts, sons" },
      { title: "Construire ta communauté", duration: "20 min", description: "engagement, DM, conversions" },
    ],
  },
  {
    id: "ia-smartcash-creators",
    title: "IA Smartcash Creators",
    subtitle: "La compétence incontournable pour monétiser ton contenu avec l'IA",
    shortDescription: "Transforme tes contenus en revenus récurrents avec les meilleures stratégies de monétisation IA.",
    longDescription: "Créer du contenu c'est bien, gagner de l'argent avec c'est mieux. Cette formation est ton playbook pour monétiser à 360° : affiliation IA, sponsorings, partenariats, freelance, vente de formations, lancements de produits. Tu apprendras à identifier les opportunités, négocier les bons contrats, et bâtir des sources de revenus multiples qui ne dépendent pas d'une seule plateforme.",
    category: "Business IA",
    level: "intermediaire",
    duration: "4h30",
    color: "from-amber-500/20 to-yellow-500/20",
    chapters: [
      { title: "Les 7 modèles de monétisation IA", duration: "25 min", description: "choisis ton ou tes modèles" },
      { title: "Affiliation IA massive", duration: "40 min", description: "outils, tunnels, plateformes" },
      { title: "Sponsoring et partenariats", duration: "35 min", description: "comment les attirer, négocier les tarifs" },
      { title: "Freelance IA premium", duration: "30 min", description: "niches rémunératrices, plateformes" },
      { title: "Vendre tes propres formations", duration: "40 min", description: "création, hébergement, marketing" },
      { title: "Coaching et consulting IA", duration: "25 min", description: "packs, prix, livrables" },
      { title: "Membership / abonnements", duration: "30 min", description: "modèle Le Club IA décortiqué" },
      { title: "Diversification stratégique", duration: "20 min", description: "la règle des 4 piliers de revenus" },
      { title: "Mindset entrepreneur IA", duration: "15 min", description: "éviter les pièges des débutants" },
    ],
  },
  {
    id: "ia-product-maker",
    title: "IA Product Maker",
    subtitle: "Crée et vends ton premier produit digital avec l'IA",
    shortDescription: "Lance ton premier produit digital qui génère des ventes : ebook, formation, template, prompt pack.",
    longDescription: "Avoir son propre produit digital, c'est l'étape qui transforme un créateur en entrepreneur. Cette formation te guide pas à pas pour lancer ton premier produit : ebook professionnel en 48h, formation en ligne complète, packs de prompts ou de templates, mini-outils SaaS. Tu apprends à valider l'idée, créer le produit avec l'IA, le packager joliment, et le vendre sur les bonnes plateformes.",
    category: "Business IA",
    level: "intermediaire",
    duration: "3h",
    color: "from-indigo-500/20 to-violet-500/20",
    chapters: [
      { title: "Quel produit créer ?", duration: "25 min", description: "matrice de décision + 50 idées" },
      { title: "Valider l'idée en 48h", duration: "20 min", description: "sondages, landing, pré-vente" },
      { title: "Ebook pro en 48h", duration: "45 min", description: "Claude + Canva + Gumroad" },
      { title: "Formation en ligne", duration: "40 min", description: "script, enregistrement, hébergement" },
      { title: "Packs prompts et templates", duration: "25 min", description: "un best-seller méconnu" },
      { title: "Pricing, vente et lancement", duration: "25 min", description: "stratégies qui marchent" },
    ],
  },
  {
    id: "ia-closer",
    title: "IA Closer",
    subtitle: "Trouver et signer tes premiers clients grâce à l'IA",
    shortDescription: "La méthode complète pour trouver des prospects, les approcher et signer des clients premium grâce aux outils IA.",
    longDescription: "Avoir une compétence IA c'est bien, mais sans clients tu ne fais pas un revenu. Cette formation est THE guide pour les freelances et consultants : trouver des prospects ciblés avec les outils IA modernes, écrire des messages d'approche qui obtiennent des réponses, mener des appels de découverte, négocier tes prix, signer les contrats. Tu sortiras avec un funnel d'acquisition complet, prêt à générer tes premiers clients.",
    category: "Business IA",
    level: "avance",
    duration: "4h",
    color: "from-green-500/20 to-emerald-500/20",
    chapters: [
      { title: "Ton offre irrésistible", duration: "25 min", description: "méthode pour packager une offre qui se vend seule" },
      { title: "Trouver tes prospects idéaux", duration: "40 min", description: "Apollo, LinkedIn Sales Nav, Hunter" },
      { title: "Cold email IA", duration: "40 min", description: "Lemlist, Instantly, scripts personnalisés" },
      { title: "DM LinkedIn et Twitter", duration: "30 min", description: "la méthode soft sell" },
      { title: "Appels de découverte", duration: "35 min", description: "script, posture, conversion" },
      { title: "Pricing et négociation", duration: "25 min", description: "comment ne pas vendre au rabais" },
      { title: "Closer en DM", duration: "30 min", description: "pour tes followers / community" },
      { title: "Automatiser le suivi", duration: "25 min", description: "n8n + Notion CRM" },
    ],
  },
  {
    id: "micro-saas-builder",
    title: "Micro-SaaS Builder",
    subtitle: "Lance ton premier SaaS avec l'IA, même sans coder une ligne",
    shortDescription: "Construis et lance un mini-SaaS rentable sans compétences techniques, grâce à des outils no-code IA.",
    longDescription: "Un SaaS, c'est le rêve de tout entrepreneur : revenus récurrents, scalable, vendable. Cette formation casse le mythe du 'il faut savoir coder'. Avec les outils IA modernes (Lovable, Bolt, v0, Cursor), tu peux lancer un mini-SaaS fonctionnel en 2 semaines. Tu apprends à valider l'idée, construire la V1 sans code, le commercialiser, et scaler à tes premiers MRR. Bonus : on décortique 10 micro-SaaS qui font 1k-10k€/mois.",
    category: "Développement IA",
    level: "avance",
    duration: "5h",
    color: "from-cyan-500/20 to-sky-500/20",
    chapters: [
      { title: "C'est quoi un micro-SaaS ?", duration: "20 min", description: "vs SaaS traditionnel, exemples qui rapportent" },
      { title: "Trouver une idée qui se vend", duration: "30 min", description: "méthodes, validation" },
      { title: "Stack no-code IA 2026", duration: "30 min", description: "Lovable, Bolt, Supabase, Stripe" },
      { title: "Construire ta V1", duration: "60 min", description: "landing + app fonctionnelle en 2 jours" },
      { title: "Authentification et paiement", duration: "40 min", description: "Supabase Auth + Stripe" },
      { title: "Hébergement et nom de domaine", duration: "20 min", description: "Vercel, Cloudflare" },
      { title: "Lancement et premiers users", duration: "35 min", description: "Product Hunt, communautés" },
      { title: "Pricing et MRR", duration: "25 min", description: "modèles, métriques, optimisation" },
      { title: "Scaler ou vendre", duration: "25 min", description: "vers les 10k€/mois ou la sortie" },
    ],
  },
  {
    id: "creer-un-site-ia",
    title: "Créer un site internet avec l'IA",
    subtitle: "Ton site professionnel en quelques heures avec les meilleurs outils IA",
    shortDescription: "Apprends à concevoir, structurer et déployer un site web moderne et performant en utilisant l'IA.",
    longDescription: "Plus besoin de passer des semaines sur du code complexe. Dans cette formation, nous utilisons les outils IA de pointe pour générer le design, rédiger le contenu et structurer ton site web. Que ce soit pour un portfolio, un site vitrine ou un blog, tu découvriras comment l'IA peut accélérer chaque étape de la création.",
    category: "Développement IA",
    level: "debutant",
    duration: "2h",
    color: "from-orange-500/20 to-amber-500/20",
    chapters: [
      { title: "Planification et structure", duration: "20 min", description: "définir ton arborescence avec l'IA" },
      { title: "Design et UI assistés", duration: "30 min", description: "générer des maquettes et des visuels" },
      { title: "Rédaction de contenu stratégique", duration: "30 min", description: "du copywriting qui convertit grâce à l'IA" },
      { title: "Outils de création rapide", duration: "20 min", description: "découvrir Framer, Wix ADI ou 10Web" },
      { title: "Déploiement et SEO", duration: "20 min", description: "mettre ton site en ligne et l'optimiser" },
    ],
  },
];
