# Images de la landing

Place ici les visuels qui apparaissent sur la page d'accueil (`/`). La landing
les détecte **automatiquement** : il n'y a aucun code à modifier. Si une image
est absente, un fallback élégant (gradient ou avatar à initiales) est affiché à
la place.

## Structure des dossiers

```
public/landing/
├── formations/   ← thumbnails des cards "formation" (preview Catalogue)
├── avatars/      ← photos des 3 auteurs de posts (preview Communauté)
├── articles/     ← covers des 3 articles (preview Actualités)
└── members/      ← 12 photos du carrousel "Ils sont déjà dans Le Club"
```

## Formations (`formations/`)

Trois images, ratio idéalement 4:3 ou 16:9, format JPG/PNG/WebP, ~400×300 px
recommandé.

| Fichier            | Apparaît dans la card |
| ------------------ | --------------------- |
| `formation-1.jpg`  | "ChatGPT pour les pros" |
| `formation-2.jpg`  | "Automatiser avec Make" |
| `formation-3.jpg`  | "Vidéo IA avec Sora" |

Pour changer les titres / niveaux / durées, édite
`frontend/src/components/landing/previews/formations-preview.tsx`.

## Avatars communauté (`avatars/`)

Trois photos rondes, format JPG/PNG/WebP, ~200×200 px recommandé.

| Fichier         | Membre fictif        |
| --------------- | -------------------- |
| `avatar-1.jpg`  | Camille R. (Créatrice de contenu) |
| `avatar-2.jpg`  | Yanis B. (Entrepreneur) |
| `avatar-3.jpg`  | Sofia M. (Designeuse IA) |

Pour changer les noms / posts, édite
`frontend/src/components/landing/previews/community-preview.tsx`.

## Articles (`articles/`)

Trois covers, ratio 16:9 ou 4:3, ~400×225 px recommandé.

| Fichier          | Article              |
| ---------------- | -------------------- |
| `article-1.jpg`  | "OpenAI dévoile GPT-5…" |
| `article-2.jpg`  | "Anthropic lance Claude Code…" |
| `article-3.jpg`  | "Mistral AI lève 600 M€…" |

Pour changer les titres / catégories, édite
`frontend/src/components/landing/previews/news-preview.tsx`.

## Membres mis en avant (`members/`)

Six photos **portrait** pour la gallery éditoriale "Ils sont déjà membres".
Format JPG/PNG/WebP, ratio **3:4**, ~600×800 px recommandé. Le format portrait
est important : les cartes sont en aspect-ratio 3:4 et la photo prend toute la
carte (object-cover).

| Fichier         | Membre fictif | Expertise                     |
| --------------- | ------------- | ----------------------------- |
| `member-1.jpg`  | Anna L.       | Expert YouTube IA             |
| `member-2.jpg`  | Marc D.       | Expert automatisation Make    |
| `member-3.jpg`  | Léa M.        | Expert dev SaaS IA            |
| `member-4.jpg`  | Tom B.        | Expert prompt engineering     |
| `member-5.jpg`  | Inès K.       | Expert monétisation IA        |
| `member-6.jpg`  | Théo G.       | Expert vidéo IA (Sora, Runway)|

La liste complète (noms + expertises) est dans
`frontend/src/components/landing/featured-members.tsx`.

## En l'absence d'image

- **Formations / Articles** : la zone thumbnail affiche un gradient coloré
  cohérent avec le design.
- **Avatars de la preview Communauté** : un cercle rempli avec les initiales
  en blanc.
- **Membres mis en avant** : un grand gradient coloré (cohérent par membre)
  remplit la carte avec les **initiales en énorme** au centre, puis le nom et
  l'expertise par-dessus comme avec une photo.

Tu peux donc déployer la landing **sans aucune image** : elle reste élégante
grâce aux fallbacks. Drop tes fichiers au fur et à mesure que tu les as.

## Note technique

Le dossier `public/` de Vite est servi tel quel. Une image placée à
`public/landing/formations/formation-1.jpg` est accessible à l'URL
`/landing/formations/formation-1.jpg` en production.
