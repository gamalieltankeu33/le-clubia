-- =====================================================================
-- Le Club IA — Migration 0070 : Annonce et Email Broadcast des Challenges
--
-- Objectifs :
--   1. Insérer l'article d'annonce dans news_articles.
--   2. Déclencher automatiquement le trigger d'envoi d'email général.
-- =====================================================================

insert into public.news_articles (
  slug,
  title,
  content,
  category,
  author,
  is_published,
  published_at
)
values (
  'challenges-hebdomadaires-disponibles',
  'Nouveau dans Le Club IA : les Challenges hebdomadaires sont disponibles !',
  'Regarder des formations, c''est bien.
Les appliquer et lancer un vrai projet, c''est encore mieux.

C''est pourquoi nous venons d''ajouter une toute nouvelle fonctionnalité au sein du Club IA :

🔥 **Les Challenges hebdomadaires**

Désormais, chaque formation est accompagnée d''un parcours de 12 semaines conçu pour vous faire passer de la théorie à l''action.

Chaque semaine, vous recevrez :
*   ✅ une mission précise à accomplir
*   *   ✅ des exercices concrets
*   *   ✅ des livrables à réaliser
*   *   ✅ des preuves à valider
*   *   ✅ une progression étape par étape

L''objectif est simple :
À la fin des 12 semaines, vous ne direz plus :
« J''ai suivi la formation. »
Vous direz :
« J''ai lancé mon projet. »

Que vous souhaitiez :
*   🚀 créer un SaaS avec l''IA
*   *   💰 vendre votre premier produit digital
*   *   🌐 créer votre site internet
*   *   🎥 lancer votre activité de création de contenu
*   *   🤖 automatiser votre business

...vous avancerez semaine après semaine avec un plan clair et concret.

Le Club IA devient plus qu''une plateforme de formation.
Il devient un véritable accélérateur de projets.

Les premiers Challenges arrivent très bientôt. Préparez-vous à passer à l''action. 💙',
  'general',
  'Ghislain Tankeu',
  true,
  now()
)
on conflict (slug) do update
set title = excluded.title, content = excluded.content, category = excluded.category, author = excluded.author, is_published = excluded.is_published, published_at = excluded.published_at;
