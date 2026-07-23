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

## Paiement Chariow

Le paiement est branché via [Chariow](https://chariow.com) — passerelle de paiement supportant les cartes bancaires, les crypto-monnaies et les solutions de Mobile Money (Orange Money, Wave, MTN Money, Moov Money).
**Deux plans** sont principalement gérés :

- `semestrial` — Plan Master (6 mois)
- `trimestrial` — Plan Progress (3 mois)

### Edge Functions

| Fonction | Rôle |
| --- | --- |
| `chariow-checkout` | Crée la transaction Chariow + insère une `subscription` en `incomplete` avec le `transaction_id`. Renvoie l'URL de paiement. |
| `chariow-verify`   | Au retour `?payment=success`, vérifie la transaction Chariow et active la `subscription` si `status` est complété. |

### Secrets à configurer

| Clé | Valeur |
| --- | --- |
| `CHARIOW_API_KEY` | Dashboard Chariow → Développeurs → Clés API |
| `CHARIOW_PRODUCT_ID_TRIMESTRIAL` | Produit "Plan Progress" (3 mois) → data-product-id |
| `CHARIOW_PRODUCT_ID_SEMESTRIAL` | Produit "Plan Master" (6 mois) → data-product-id |

Configuration via CLI :

```bash
supabase secrets set CHARIOW_API_KEY=sk_...
supabase secrets set CHARIOW_PRODUCT_ID_TRIMESTRIAL=prd_...
supabase secrets set CHARIOW_PRODUCT_ID_SEMESTRIAL=prd_...
```

Ou via le dashboard : Project Settings → Edge Functions → Manage secrets.

### Déploiement

```bash
cd backend
supabase functions deploy chariow-checkout
supabase functions deploy chariow-verify
```

### Migration DB associée

`0062_add_chariow_transaction_id.sql` ajoute la colonne `subscriptions.chariow_transaction_id`.
À appliquer **avant** de tester le paiement (sinon `chariow-checkout` échouera à l'insert).
