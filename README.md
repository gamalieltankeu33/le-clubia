# Le Club IA

> Communauté francophone premium pour les passionnés d'IA.
> Abonnement annuel à **69 000 FCFA/an** (paiement par mobile money africain : Orange Money, Wave, MTN Money, Moov Money) qui débloque 4 piliers : Formations, Communauté, Actualités IA, Ressources.

---

## Stack technique

| Couche                | Outil                                                       |
| --------------------- | ----------------------------------------------------------- |
| Frontend              | React 19 + Vite + TypeScript                                |
| Routing               | TanStack Router (file-based, dans `frontend/src/routes/`)   |
| Styling               | Tailwind CSS v4 + shadcn/ui                                 |
| State global          | Zustand                                                     |
| Data fetching / cache | TanStack Query                                              |
| Icônes                | Lucide                                                      |
| Backend               | Supabase (Postgres + Auth + Storage + Edge Functions Deno)  |
| Paiements             | Stripe (Checkout + Customer Portal + Webhooks)              |
| Emails                | Resend                                                      |
| Hébergement           | Vercel (frontend) + Supabase (backend natif)                |

---

## Architecture du repo

```
leclubia/
├── frontend/               # App React (Vite)
│   ├── src/
│   │   ├── routes/         # Routes file-based TanStack Router
│   │   │   ├── __root.tsx  # layout racine
│   │   │   ├── index.tsx   # /        — landing publique
│   │   │   ├── signup.tsx  # /signup
│   │   │   └── login.tsx   # /login
│   │   ├── components/
│   │   │   ├── ui/         # composants shadcn (Button, Input, Label…)
│   │   │   ├── site-header.tsx
│   │   │   ├── site-footer.tsx
│   │   │   └── auth-shell.tsx
│   │   ├── lib/utils.ts    # helper `cn()`
│   │   ├── index.css       # tokens Tailwind v4 + palette Le Club IA
│   │   └── main.tsx        # bootstrap : Router + QueryClient
│   ├── .env.example
│   └── package.json
│
├── backend/                       # Côté Supabase (convention CLI)
│   └── supabase/
│       ├── migrations/
│       │   ├── 0001_init.sql      # Schéma initial : 11 tables + RLS
│       │   └── 0003_coach_ia.sql  # Coach IA : conversations + messages
│       └── functions/
│           └── coach-chat/        # Edge Function Coach IA (Claude Sonnet 4.5)
│
└── README.md                      # ce fichier
```

---

## Démarrer en local

> Pré-requis : Node.js 20+ (déjà installé sur ta machine).

```bash
cd frontend
npm install         # déjà fait, mais à relancer après chaque pull
npm run dev
```

Ouvre ensuite **http://localhost:5173**.

Tu verras :
- `/` — la landing publique
- `/signup` — formulaire d'inscription (UI seulement, pas encore branché)
- `/login` — formulaire de connexion (UI seulement)

Pour produire un build de production :

```bash
npm run build       # compile TS + bundle Vite → frontend/dist
npm run preview     # sert le build localement pour vérifier
```

---

## Comptes externes nécessaires

À créer **avant la prochaine session** (où on branchera l'auth + Stripe) :

### 1. Supabase — base de données + auth

1. Crée un compte sur https://app.supabase.com
2. Crée un nouveau projet (région **Europe** de préférence — Frankfurt ou Paris)
3. Note le mot de passe Postgres dans un coffre (1Password, Bitwarden…)
4. Une fois le projet prêt, va dans **SQL Editor** et applique le contenu de
   `backend/supabase/migrations/0001_init.sql` (copier-coller + Run)
5. Récupère dans **Settings → API** :
   - `Project URL` → `VITE_SUPABASE_URL`
   - `anon public` → `VITE_SUPABASE_ANON_KEY`
   - `service_role` (secret !) → `SUPABASE_SERVICE_ROLE_KEY` (côté backend uniquement)

### 2. Paiement — pivot mobile money

Le projet a pivoté vers un **abonnement annuel à 69 000 FCFA/an** payé par
**mobile money africain** (Orange Money, Wave, MTN Money, Moov Money).
L'intégration de l'API mobile money sera faite plus tard.

Les variables d'env Stripe restent dans `backend/.env.example` à titre de
placeholder pour quand on intègrera la solution mobile money — mais Stripe
ne sera pas utilisé en production.

### 3. Resend — emails transactionnels

1. Crée un compte sur https://resend.com
2. Vérifie ton domaine d'envoi (ou utilise leur domaine de test pour démarrer)
3. **API Keys → Create** → `RESEND_API_KEY`

---

## Variables d'environnement

Deux fichiers `.env.example` sont fournis :

- `frontend/.env.example` — variables exposées au navigateur (préfixées `VITE_`)
- `backend/.env.example` — variables serveur (Edge Functions, secrets Stripe, Resend…)

**Pour démarrer**, copie-les en `.env` (sans `.example`) et remplis-les. Aucun
`.env` ne doit être commit (le `.gitignore` les exclut).

```bash
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
```

---

## Roadmap des sessions

| Session    | Livrable                                                                  |
| ---------- | ------------------------------------------------------------------------- |
| **1 (✅)** | Init projet, stack, schéma SQL complet, landing + signup + login (UI)     |
| 2          | Auth Supabase branchée + onboarding 3 étapes                              |
| 3          | Stripe Checkout + webhook + protection des routes membres                 |
| 4          | Layout dashboard + sidebar + page d'accueil membre                        |
| 5          | Bloc Formations (catalogue + page détail + suivi de progression)          |
| 6          | Bloc Communauté (feed + composer Tiptap + likes + commentaires)           |
| 7          | Bloc Actualités IA + Bloc Ressources                                      |
| 8          | Polish, déploiement Vercel, mise en mode Stripe live                      |

---

## Identité visuelle

| Élément          | Valeur                                                  |
| ---------------- | ------------------------------------------------------- |
| Fond principal   | `#FAFAF9` (blanc cassé)                                 |
| Texte            | `#0A0A0A`                                               |
| Accent primaire  | `#1E40AF` (bleu profond — sérieux, confiance)           |
| Accent secondaire| `#F97316` (orange chaleureux)                           |
| Gris UI          | `#737373` (texte secondaire), `#E5E5E5` (bordures)      |
| Police corps     | Inter                                                   |
| Police titres    | Bricolage Grotesque                                     |
| Border-radius    | 12–16 px sur cards, 8 px sur boutons                    |
| Ton              | Tutoiement systématique, jamais d'emoji dans la UI      |

---

## Conventions

- **Tutoiement** partout dans la UI ("tu", "ton", "rejoins", etc.).
- **Pas d'emoji** dans la UI — uniquement des icônes Lucide.
- **Composants UI** vivent dans `frontend/src/components/ui/` (style shadcn).
- Les routes sont **file-based** : ajouter un fichier `frontend/src/routes/foo.tsx` crée
  automatiquement la route `/foo` (le plugin Vite régénère `routeTree.gen.ts` au dev/build).
