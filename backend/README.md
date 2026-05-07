# Backend — Le Club IA

Toute la logique côté Supabase, organisée selon la convention de la **Supabase CLI** :

```
backend/
└── supabase/
    ├── migrations/                # SQL appliqué à la base Supabase
    │   ├── 0001_init.sql          # Schéma initial : 11 tables + RLS + triggers
    │   └── 0003_coach_ia.sql      # Coach IA : conversations + messages
    └── functions/                 # Edge Functions Deno
        └── coach-chat/
            └── index.ts           # Endpoint POST /coach-chat (Claude Sonnet 4.5)
```

> Le fichier `0002_*` est volontairement réservé pour la migration Stripe d'une
> session future — pour ne pas avoir à renommer les fichiers ensuite.

---

## Appliquer une migration

### Option A — Dashboard Supabase (la plus simple, non-technique)

1. https://app.supabase.com → ton projet → **SQL Editor**
2. **New query** → copier-coller le contenu du fichier `.sql`
3. **Run**

Applique-les dans l'ordre numérique : `0001_init.sql` puis `0003_coach_ia.sql`.

### Option B — Supabase CLI

```bash
npm i -g supabase
cd backend
supabase login
supabase link --project-ref <ton-ref-projet>
supabase db push
```

---

## Déployer une Edge Function

### Option A — Dashboard Supabase

1. Dashboard → **Edge Functions** → **Deploy a new function**
2. Nomme-la **`coach-chat`** (le nom doit matcher exactement)
3. Copie-colle le contenu de `supabase/functions/coach-chat/index.ts`
4. Clique **Deploy**

### Option B — Supabase CLI

```bash
cd backend
supabase functions deploy coach-chat
```

---

## Secrets / variables d'env des Edge Functions

Le coach IA a besoin d'une clé API Anthropic. À configurer côté Supabase :

### Dashboard

Project Settings → **Edge Functions** → **Manage secrets** → ajoute :

| Clé                  | Valeur                                                              |
| -------------------- | ------------------------------------------------------------------- |
| `ANTHROPIC_API_KEY`  | Ta clé depuis https://console.anthropic.com → Settings → API Keys   |

> `SUPABASE_URL` et `SUPABASE_ANON_KEY` sont automatiquement injectées par
> Supabase dans toutes les Edge Functions, pas besoin de les ajouter.

### CLI

```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
```

Si la clé est absente quand un membre utilise le Coach IA, l'Edge Function
renvoie un **503** explicite ("Coach IA temporairement indisponible").

---

## Edge Functions à venir (paiement mobile money — 69 000 FCFA/an)

Le projet a pivoté de Stripe vers du **mobile money africain**
(Orange Money, Wave, MTN Money, Moov Money). Les fonctions à brancher :

- `create-mobile-money-charge` — initie un paiement annuel (69 000 FCFA)
- `mobile-money-webhook` — confirme le paiement et active la `subscription`
- `cancel-membership` — désactive l'abonnement (pas de reconduction auto,
  juste désactivation à la demande de l'utilisateur)

Les variables d'env Stripe restent dans `.env.example` à titre de placeholder
pour quand on choisira définitivement le partenaire de paiement.
