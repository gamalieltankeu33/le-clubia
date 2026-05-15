// Le Club IA — Edge Function "delete-my-account"
//
// Implémente l'article 17 RGPD (droit à l'effacement) : un user
// authentifié peut demander la suppression IRRÉVERSIBLE de son compte
// et de toutes ses données personnelles.
//
// Pipeline :
//   1. Auth check (JWT user obligatoire — pas de service-role caller)
//   2. Body validation : { confirmation: "SUPPRIMER" } littéralement
//   3. Cleanup storage :
//      - avatars/<userId>/* (avatar du user)
//      - post-images/<userId>/* (images uploadées dans ses posts)
//      Buckets admin (formation-covers, event-covers, news-covers,
//      resource-files, resource-thumbnails) ne sont pas nettoyés
//      automatiquement — si le user est admin, ses uploads admin
//      restent (anonymisation acceptable, le contenu publié reste
//      mais l'auteur est anonyme).
//   4. DELETE from auth.users via admin API → cascade ON DELETE
//      automatique vers : profiles, subscriptions, posts, post_likes,
//      post_comments, news_comments, user_formation_progress,
//      member_points, monthly_winners (user_id), notifications,
//      coach_conversations (→ coach_messages via FK enchaînée),
//      formation_reviews, comment_mentions, rate_limits.
//      Et SET NULL : events.created_by, notifications.actor_id,
//      monthly_winners.selected_by (migration 0038).
//
// Le frontend doit ENSUITE appeler supabase.auth.signOut() pour purger
// la session locale + caches React Query, et rediriger vers la landing.
//
// Pas d'idempotence côté serveur : si l'utilisateur clique 2 fois,
// le 2e appel échouera silencieusement parce que l'auth JWT pointera
// vers un user déjà supprimé → 401 propre.

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'
import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts'

const CONFIRMATION_TOKEN = 'SUPPRIMER'

interface DeleteResponse {
  ok: boolean
  error?: string
  deleted_user_id?: string
  storage_objects_removed?: number
}

serve(async (req: Request) => {
  const preflight = handleCorsPreflight(req)
  if (preflight) return preflight
  const headers = getCorsHeaders(req)
  const json = (status: number, body: DeleteResponse): Response =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...headers, 'Content-Type': 'application/json' },
    })

  if (req.method !== 'POST') {
    return json(405, { ok: false, error: 'Méthode non autorisée.' })
  }

  // ----- 1. Config + auth -----
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

  if (!supabaseUrl || !anonKey || !serviceKey) {
    return json(500, {
      ok: false,
      error: 'Configuration serveur incomplète.',
    })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return json(401, { ok: false, error: 'Authentification requise.' })
  }
  const token = authHeader.replace(/^Bearer\s+/i, '').trim()

  // Verify JWT et récupérer le user
  const sbAuth = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false },
  })
  const {
    data: { user },
    error: userErr,
  } = await sbAuth.auth.getUser(token)
  if (userErr || !user) {
    return json(401, { ok: false, error: 'Session invalide.' })
  }

  // ----- 2. Body validation -----
  let body: { confirmation?: unknown } = {}
  try {
    body = await req.json()
  } catch {
    return json(400, { ok: false, error: 'Body JSON invalide.' })
  }

  if (body.confirmation !== CONFIRMATION_TOKEN) {
    // Refus explicite — l'admin (ou un attaquant côté client qui
    // a bypassé l'UI) doit passer le token littéral pour confirmer.
    return json(400, {
      ok: false,
      error: `Confirmation invalide. Renvoie { confirmation: "${CONFIRMATION_TOKEN}" } pour valider.`,
    })
  }

  const userId = user.id
  const userEmail = user.email ?? '(unknown)'
  console.log(`[delete-my-account] Demande pour ${userEmail} (${userId})`)

  // ----- 3. Cleanup storage -----
  // Client service-role pour le bypass RLS sur storage.
  const sbAdmin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  })

  let storageObjectsRemoved = 0
  for (const bucket of ['avatars', 'post-images']) {
    try {
      // Liste tous les fichiers sous le dossier user
      const { data: files, error: listErr } = await sbAdmin.storage
        .from(bucket)
        .list(userId, { limit: 1000 })

      if (listErr) {
        console.warn(
          `[delete-my-account] List ${bucket}/${userId} → ${listErr.message}`,
        )
        continue
      }
      if (!files || files.length === 0) continue

      // Construit les paths complets (`{userId}/{filename}`)
      const paths = files
        .filter((f) => f.name)
        .map((f) => `${userId}/${f.name}`)
      if (paths.length === 0) continue

      const { error: rmErr } = await sbAdmin.storage.from(bucket).remove(paths)
      if (rmErr) {
        console.warn(
          `[delete-my-account] Remove ${bucket} (${paths.length}) → ${rmErr.message}`,
        )
        continue
      }
      storageObjectsRemoved += paths.length
      console.log(
        `[delete-my-account] ${bucket}/${userId} → ${paths.length} fichiers supprimés`,
      )
    } catch (err) {
      // Best-effort : on continue même si un bucket pose problème.
      // La suppression DB ci-dessous est ce qui compte vraiment côté
      // RGPD (les fichiers orphelins du bucket ne contiennent pas de
      // PII directement attribuable au user supprimé).
      console.warn(`[delete-my-account] Storage ${bucket} error:`, err)
    }
  }

  // ----- 4. Suppression auth.users (cascade automatique vers DB) -----
  // Cette opération est IRRÉVERSIBLE — les FK ON DELETE CASCADE de
  // public.profiles, public.subscriptions, public.posts, etc. vont
  // supprimer toutes les lignes liées. Audit FK fait en migration 0038.
  const { error: deleteErr } = await sbAdmin.auth.admin.deleteUser(userId)
  if (deleteErr) {
    console.error(
      `[delete-my-account] auth.admin.deleteUser(${userId}) → ${deleteErr.message}`,
    )
    return json(500, {
      ok: false,
      error: `Suppression impossible : ${deleteErr.message}`,
    })
  }

  console.log(
    `[delete-my-account] ✓ Compte supprimé : ${userEmail} (${userId}) — ${storageObjectsRemoved} fichiers storage`,
  )

  return json(200, {
    ok: true,
    deleted_user_id: userId,
    storage_objects_removed: storageObjectsRemoved,
  })
})
