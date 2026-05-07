# SECURITY AUDIT — Le Club IA

**Date** : 2026-05-06
**Périmètre** : RLS Supabase, edge functions, frontend, secrets, données sensibles
**Méthode** : audit statique du code + revue des migrations 0001-0011 et des 3 edge functions

---

## Résumé exécutif

| Criticité | Faille | Statut |
|---|---|---|
| 🔴 CRITIQUE | Email d'autres membres exposé via 5 queries frontend `from('profiles').select('email')` | **FIXÉ** (RPC `public_profiles_in`) |
| 🔴 CRITIQUE | `.env` non listé dans `.gitignore` (risque de leak des clés à un futur commit) | **FIXÉ** |
| 🟠 ÉLEVÉ | Edge function `coach-chat` sans vérification `is_active_member` (paying feature accessible aux non-membres) | **FIXÉ** |
| 🟠 ÉLEVÉ | Pas de limite côté serveur sur la longueur des messages Coach (abus tokens) | **FIXÉ** (8000 chars max + CHECK DB) |
| 🟠 ÉLEVÉ | Trigger functions sans `set search_path` (risque d'hijacking via search_path) | **FIXÉ** dans migration 0012 |
| 🟡 MOYEN | `posts.link_url` non validé en DB (URL arbitraire stockable) | **FIXÉ** (CHECK constraint http/https) |
| 🟡 MOYEN | Pas de longueur max DB sur `posts.content` / `post_comments.content` / `news_comments.content` | **FIXÉ** (CHECK constraints) |
| 🟡 MOYEN | `signInWithGoogle` redirige vers `/login` (route legacy) au lieu de `/auth` | **FIXÉ** |
| 🟢 FAIBLE | CORS `*` sur les 3 edge functions | À durcir post-launch (whitelist domaine prod) |
| 🟢 FAIBLE | Pas de rate limit applicatif sur posts/comments/likes | Recommandation V2 |
| 🟢 FAIBLE | Pas de captcha sur signup / reset password | Recommandation V2 (Cloudflare Turnstile) |

---

## A. Backend Supabase

### A.1 — Row Level Security (RLS)

✅ **TOUTES les tables publiques ont RLS activé** : profiles, subscriptions, formations, formation_chapters, user_formation_progress, posts, post_likes, post_comments, news_articles, news_comments, resources, coach_conversations, coach_messages, notifications.

✅ **Aucune policy USING (true)** ni filtrage sans user_id détecté.

✅ **Séparation claire** : SELECT (filtré par owner ou admin), INSERT (with check + active membership pour les actions premium), UPDATE/DELETE (owner ou admin).

#### 🔴 CRITIQUE — Fuite d'email PII

**Faille** : 5 fichiers frontend faisaient `supabase.from('profiles').select('id, first_name, last_name, email, avatar_url, is_verified')` pour hydrater les auteurs (posts, commentaires, notifications). Combiné à la RLS stricte "self or admin" sur profiles, soit :
- (a) la requête retourne vide pour les autres membres → UX cassée
- (b) la RLS a été relâchée dans le dashboard → email de tout membre récupérable par un attaquant authentifié

**Fichiers concernés** :
- `src/lib/community-queries.ts`
- `src/components/community/post-comment-section.tsx`
- `src/components/community/recent-posts-card.tsx`
- `src/components/community/post-card.tsx` (type)
- `src/components/news/news-comment-section.tsx`
- `src/routes/app/membres/$userId.tsx`
- `src/stores/notifications-store.ts` (lookup actor)

**Fix appliqué** :
- Migration `0012_security_hardening.sql` : nouvelle RPC `public.public_profiles_in(p_ids uuid[])` SECURITY DEFINER qui retourne uniquement les colonnes publiques (id, first_name, last_name, avatar_url, bio, is_verified, role, created_at, last_active_at). **L'email reste accessible uniquement via la table `profiles` directement, qui garde sa RLS stricte "self or admin".**
- Frontend : nouveau helper `src/lib/public-profile.ts` (`fetchPublicProfilesIn`, `fetchPublicProfile`). Les 7 fichiers ci-dessus ont été refactorés pour passer par la RPC, avec suppression du champ `email` de tous les types `Author` cross-user.
- `AvatarDisplay` continue d'accepter un `email` optionnel (utilisé uniquement pour le profil de l'utilisateur courant), avec fallback "M" (Membre) au lieu de "?" pour les profils sans nom.

### A.2 — Functions SECURITY DEFINER

| Fonction | Migration | search_path | Note |
|---|---|---|---|
| `is_active_member(uid)` | 0001 | ✅ | OK |
| `is_admin(uid)` | 0001 | ✅ | OK |
| `handle_new_user()` | 0001 | ✅ | OK |
| `set_updated_at()` | 0001 | ❌ → ✅ FIXÉ | Trigger sans SECURITY DEFINER, mais ajout de search_path par hygiène |
| `bump_post_likes_count()` | 0001 | ❌ → ✅ FIXÉ | idem |
| `bump_post_comments_count()` | 0001 | ❌ → ✅ FIXÉ | idem |
| `bump_coach_conversation_updated_at()` | 0003 | ❌ → ✅ FIXÉ | idem |
| `get_public_member_count()` | 0009 | ✅ | OK |
| `check_user_exists(p_email)` | 0010 | ✅ | OK |
| `notify_active_members(...)` | 0011 | ✅ | OK |
| `notif_display_name(uuid)` | 0011 | ✅ | OK |
| `notif_excerpt(text, int)` | 0011 | ✅ | OK |
| `public_profiles_in(p_ids)` | 0012 (nouveau) | ✅ | OK |

#### 🟠 ÉLEVÉ — Trigger functions sans search_path

**Faille** : 4 trigger functions (`set_updated_at`, `bump_post_likes_count`, `bump_post_comments_count`, `bump_coach_conversation_updated_at`) n'avaient pas `set search_path = public, pg_temp`. Risque théorique de hijacking via un schéma malveillant placé en tête du search_path par un attaquant ayant accès au cluster (faible mais best practice).

**Fix** : migration 0012 ajoute `set search_path = public, pg_temp` aux 4 fonctions. Aucun changement comportemental.

### A.3 — Storage buckets

| Bucket | Public | Limite | RLS INSERT/UPDATE/DELETE | Verdict |
|---|---|---|---|---|
| `formation-covers` | ✅ public | 5 Mo | admin only | ✅ OK |
| `resource-files` | ❌ privé | 25 Mo | admin only / read = authenticated | ✅ OK (URLs signées) |
| `resource-thumbnails` | ✅ public | 5 Mo | admin only | ✅ OK |
| `post-images` | ✅ public | 3 Mo | own folder uniquement (path = user_id/...) | ✅ OK |
| `avatars` | ✅ public | 2 Mo | own folder uniquement | ✅ OK |
| `news-covers` | ✅ public | 5 Mo | admin only | ✅ OK |

✅ Aucun bucket public sans contrôle d'écriture. `resource-files` (le seul sensible) est bien privé.

### A.4 — Admin role enforcement

✅ **Frontend** : `useRequireAuth({ requireAdmin: true })` dans `/app/admin.tsx` (route layout) protège toutes les sous-routes admin via `Outlet`. Seul check côté client.

✅ **Backend** : la RLS impose le contrôle réel. Toutes les tables sensibles ont une policy `for all using (public.is_admin(auth.uid()))` séparée. Un utilisateur non-admin qui appellerait directement `from('formations').delete().eq('id', '...')` via la JS API sera refusé par la RLS.

✅ **Edge functions** : `news-agent` et `admin-stats` re-vérifient le role admin côté serveur avant d'exécuter. Pas de confiance aveugle au JWT.

---

## B. Frontend / Auth

### B.1 — Validation inputs

✅ **Sanitization HTML** : `src/lib/sanitize-html.ts` utilise DOMPurify avec une whitelist stricte de tags (p, br, strong, em, u, s, a, ul, ol, li, blockquote, code, pre, h1-h6, hr) et attributs (href, target, rel, class). Tous les liens sont forcés `target="_blank" rel="noopener noreferrer"` via hook DOMPurify.

✅ **Rendu HTML** : seul `post-card.tsx` utilise `dangerouslySetInnerHTML`, et uniquement avec `sanitizePostHtml()`.

#### 🟡 MOYEN — Validation URL `posts.link_url`

**Faille** : la validation côté frontend (post-composer) impose `^https?://` mais la DB acceptait toute string.

**Fix** : migration 0012 ajoute `CHECK (link_url is null OR link_url ~* '^https?://')` sur `posts.link_url`.

#### 🟡 MOYEN — Pas de limite DB sur les contenus user-controlled

**Fix** : migration 0012 ajoute des CHECK constraints :
- `posts.content` ≤ 10 000 caractères
- `post_comments.content` ≤ 4 000 caractères
- `news_comments.content` ≤ 4 000 caractères
- `coach_messages.content` ≤ 8 000 caractères
- `profiles.bio` ≤ 500 caractères

### B.2 — Mot de passe

✅ Validation 8 caractères min côté frontend (signup et reset-password).
✅ Supabase Auth applique son propre check côté serveur.

📝 **Recommandation V2** : activer le check "leaked passwords" dans Supabase Dashboard → Authentication → Policies, et imposer une force minimale (1 chiffre + 1 majuscule).

### B.3 — Variables d'environnement

#### 🔴 CRITIQUE — `.env` non gitignoré

**Faille** : `.gitignore` ne couvrait pas `.env` (seulement `*.local`). Le projet n'est pas encore initialisé en git, mais à la première `git init && git add .` les valeurs réelles seraient parties dans l'historique.

**Fix** : ajout de `.env`, `.env.local`, `.env.*.local` à `.gitignore`.

✅ **Aucune clé secrète en dur** dans le code source frontend (vérifié par grep). Les seules variables exposées au client sont `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (clés publiques par design), `VITE_STRIPE_PUBLISHABLE_KEY`, `VITE_HERO_VIDEO_URL`.

✅ `.env.example` contient uniquement des placeholders (`xxxxxxxxxxx.supabase.co`, `pk_test_...`).

### B.4 — JWT et session

✅ Toutes les pages protégées (`/app/*`) utilisent `useRequireAuth()` qui attend `isInitialized` avant de prendre une décision. Pas de fuite UI avant hydratation du store.

✅ Listener `onAuthStateChange` réhydrate proprement le store cross-tab (login/logout détecté partout).

### B.5 — XSS / Open Redirect

✅ Aucune redirection dynamique basée sur params URL (`?redirect=...`) détectée.

✅ Les liens externes dans posts ont `rel="noopener noreferrer" target="_blank"` (forcé par DOMPurify hook).

#### 🟡 MOYEN — `signInWithGoogle` redirigeait vers `/login` (legacy)

**Fix** : `redirectTo` corrigé en `/auth`. Pas une vraie faille de sécurité (URL hardcodée à `window.location.origin`), mais cohérence post-fusion login/signup.

---

## C. Edge functions

### C.1 — `coach-chat`

✅ Auth JWT valide (vérif `supabase.auth.getUser()`).
✅ Quota 30 messages/jour appliqué côté serveur (compteur via RLS sur `coach_messages`).
✅ Clé Anthropic jamais retournée au client.

#### 🟠 ÉLEVÉ — Pas de check `is_active_member`

**Faille** : tout utilisateur authentifié (même sans abonnement actif) pouvait consommer le Coach IA, qui est une feature payante.

**Fix** : ajout d'un appel `supabase.rpc('is_active_member', { uid: user.id })` après la vérification d'auth. Réponse 403 + message clair si non-membre.

#### 🟠 ÉLEVÉ — Pas de garde-fou sur la longueur du message user

**Faille** : un attaquant pouvait envoyer un message de 100 000 caractères pour exploser le coût Anthropic et le quota global.

**Fix** : ajout d'une limite stricte de 8 000 caractères côté edge function (réponse 400 si dépassé) + CHECK constraint DB sur `coach_messages.content`.

### C.2 — `news-agent`

✅ Auth : service-role (cron) **OU** admin via JWT + double-check `profiles.role = 'admin'` via service-role.
✅ Pas d'injection : tous les inserts via supabase-js (paramétrés).
✅ `stripHtml` sanitise les descriptions RSS avant envoi à Anthropic.
✅ Catégorie validée contre une whitelist (`ALLOWED_CATEGORIES`).
✅ Title tronqué à 200 caractères.

### C.3 — `admin-stats`

✅ Auth JWT + check `profiles.role = 'admin'` via service-role.
✅ Retourne les emails des inscriptions récentes (légitime pour la modération admin).

---

## D. Protections avancées

### D.1 — Rate limiting

📝 **Recommandation V2** :
- Aujourd'hui : Supabase Auth a son rate limit natif (signin, password-reset, etc.) — actif par défaut.
- À ajouter quand le trafic monte : rate limit applicatif sur `post_comments INSERT` (max 30/h) et `post_likes INSERT` (max 100/h) via une fonction PostgreSQL ou un middleware.
- Ne pas mettre côté frontend (bypassable par appel API direct).

### D.2 — Brute force / D.3 — Captcha

📝 **Recommandations V2** :
- Activer "MFA" et "Leaked password protection" dans Supabase Dashboard → Authentication → Policies.
- Ajouter Cloudflare Turnstile sur signup et reset-password quand la plateforme est visible publiquement.

---

## E. Données sensibles

### E.1 — PII exposée

✅ **Email** : désormais protégé par la RLS stricte sur profiles + RPC `public_profiles_in` côté frontend (cf. fix CRITIQUE A.1).
✅ **`/app/membres/$userId`** ne fuite plus l'email du membre consulté.
✅ **L'admin** garde l'accès complet aux emails (via la policy `is_admin(auth.uid())` sur profiles + admin-stats edge function).

### E.2 — Logs

✅ Aucun `console.log` / `console.error` ne logge :
- de tokens (vérifié via grep)
- de mots de passe
- de clés API

Les `console.error(err)` présents dans 14 fichiers loggent uniquement l'objet erreur Supabase ou un message générique. Acceptable pour le debug ; à remplacer par un logger structuré (Sentry / Logflare) en V2.

---

## Actions à faire côté Supabase Dashboard

Trois actions critiques après application de la migration 0012 :

### 1. Appliquer la migration 0012 sur ton projet Supabase

```bash
cd backend
supabase db push
```

ou via Dashboard → SQL Editor → coller le contenu de `0012_security_hardening.sql` → Run.

### 2. Vérifier que la RLS profiles est bien `self or admin`

Dashboard → Authentication → Policies → table `profiles`. Tu dois voir uniquement :
- `profiles select self or admin` (auth.uid() = id OR is_admin)
- `profiles update self`
- `profiles admin all`

⚠ Si une policy permissive type `select for authenticated using (true)` traîne, **supprime-la** : la nouvelle RPC `public_profiles_in` sert maintenant les profils publics au frontend, la table profiles n'a plus à exposer l'email.

### 3. (Recommandé) Activer "Leaked password protection"

Dashboard → Authentication → Policies → Password requirements → activer "Check passwords against HaveIBeenPwned". Refuse les mots de passe connus comme compromis.

### 4. (Recommandé) Restreindre CORS post-launch

Dans les 3 edge functions (`coach-chat`, `news-agent`, `admin-stats`), `Access-Control-Allow-Origin` est actuellement à `*`. À durcir en production avec le domaine final (ex: `https://leclubia.com`) une fois déployé.

### 5. (Recommandé) Vérifier les Redirect URLs autorisées

Dashboard → Authentication → URL Configuration → ajouter :
- `http://localhost:5173/auth` (dev)
- `http://localhost:5173/reset-password`
- `https://<ton-domaine-prod>/auth`
- `https://<ton-domaine-prod>/reset-password`

---

## Fichiers modifiés par cet audit

### Backend
- `backend/supabase/migrations/0012_security_hardening.sql` (nouveau)
- `backend/supabase/functions/coach-chat/index.ts` (is_active_member + max length)

### Frontend
- `frontend/.gitignore` (ajout `.env`)
- `frontend/src/lib/public-profile.ts` (nouveau — RPC helper)
- `frontend/src/lib/community-queries.ts` (use RPC)
- `frontend/src/components/community/post-card.tsx` (drop email field)
- `frontend/src/components/community/post-comment-section.tsx`
- `frontend/src/components/community/recent-posts-card.tsx`
- `frontend/src/components/news/news-comment-section.tsx`
- `frontend/src/components/initials-avatar.tsx` (fallback "M")
- `frontend/src/routes/app/membres/$userId.tsx`
- `frontend/src/stores/auth-store.ts` (signInWithGoogle redirect → /auth, requestPasswordReset/updatePassword existant)
- `frontend/src/stores/notifications-store.ts` (loadActors via RPC)

---

## Recommandations V2

1. **Rate limiting applicatif** sur posts/comments/likes (PostgreSQL function ou edge function middleware).
2. **Cloudflare Turnstile** sur signup et reset-password (anti-bot quand visible publiquement).
3. **Logger structuré** (Sentry, Logflare) pour remplacer les `console.error` éparpillés.
4. **MFA optionnel** côté Supabase Auth pour les admins.
5. **Audit log** : table `admin_audit_log` qui trace les actions admin (suppression posts, formations, modification users).
6. **CORS restreint** (`Access-Control-Allow-Origin: https://leclubia.com`) sur les 3 edge functions une fois le domaine prod fixé.
7. **Renforcer la complexité de mot de passe** : 1 chiffre + 1 majuscule en plus des 8 caractères actuels.
8. **Scan secrets périodique** : intégrer `gitleaks` ou `trufflehog` dans la CI une fois le repo initialisé.
9. **WAF / DDoS** : Cloudflare devant Vercel/Netlify quand le projet sera en prod.
