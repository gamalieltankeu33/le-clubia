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

## Paiement Maketou (Mobile Money Afrique)

Le paiement est branché via [Maketou](https://api.maketou.net) — passerelle
Mobile Money africaine (Orange Money, Wave, MTN Money, Moov Money).
**Deux plans** sont gérés :

- `annual` — 99 000 FCFA / 12 mois (recommandé)
- `semestrial` — 69 000 FCFA / 6 mois

L'API Maketou ne supporte **qu'un produit par panier**, donc on crée
**deux produits dans le dashboard Maketou** (un par plan) et on les
mappe en variables d'env (`MAKETOU_PRODUCT_ID_ANNUAL` /
`MAKETOU_PRODUCT_ID_SEMESTRIAL`).

### Edge Functions

| Fonction | Rôle |
| --- | --- |
| `maketou-checkout` | Crée le panier Maketou + insère une `subscription` en `incomplete` avec le `cart_id`. Renvoie l'URL de paiement. |
| `maketou-verify`   | Au retour `?payment=success`, vérifie le panier Maketou et active la `subscription` si `status='completed'`. |

> Maketou **ne fournit pas de webhook** : la vérification se fait à la
> main via `GET /api/v1/stores/cart/{cartId}` au retour de paiement.

### Secrets à configurer

| Clé | Valeur |
| --- | --- |
| `MAKETOU_API_KEY` | Dashboard Maketou → boutique → Autres → Clés API |
| `MAKETOU_PRODUCT_ID_ANNUAL` | Produit "Plan Master Annuel" → Partager → Identifiant public |
| `MAKETOU_PRODUCT_ID_SEMESTRIAL` | Produit "Plan Progress 6 mois" → Partager → Identifiant public |

Configuration via CLI :

```bash
supabase secrets set MAKETOU_API_KEY=mkt_...
supabase secrets set MAKETOU_PRODUCT_ID_ANNUAL=...
supabase secrets set MAKETOU_PRODUCT_ID_SEMESTRIAL=...
```

Ou via le dashboard : Project Settings → Edge Functions → Manage secrets.

### Déploiement

```bash
cd backend
supabase functions deploy maketou-checkout
supabase functions deploy maketou-verify
```

### Migration DB associée

`0040_maketou_payment.sql` ajoute la colonne `subscriptions.maketou_cart_id`.
À appliquer **avant** de tester le paiement (sinon `maketou-checkout`
échouera à l'insert).
