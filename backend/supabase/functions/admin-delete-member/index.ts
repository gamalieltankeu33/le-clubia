// Le Club IA — Edge Function "admin-delete-member"
//
// Permet à un admin de supprimer IRRÉVOCABLEMENT le compte d'un autre
// membre. Symétrique de delete-my-account, mais déclenchée par un
// admin et ciblant un autre user.
//
// Pipeline :
//   1. Auth check (JWT admin obligatoire)
//   2. Body validation : { user_id }
//   3. Garde : on refuse self-delete (l'admin doit utiliser
//      delete-my-account pour son propre compte)
//   4. Cleanup storage (avatars + post-images du user ciblé)
//   5. DELETE from auth.users via admin API → cascade ON DELETE
//      automatique (cf. commentaires dans delete-my-account)

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'
import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts'

interface DeleteRequest {
  user_id: string
}

serve(async (req: Request) => {
  const preflight = handleCorsPreflight(req)
  if (preflight) return preflight
  const cors = getCorsHeaders(req)
  const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })

  if (req.method !== 'POST') {
    return json(405, { ok: false, error: 'Méthode non autorisée.' })
  }

  // ---- Config ----
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  if (!supabaseUrl || !anonKey || !serviceKey) {
    return json(500, { ok: false, error: 'Configuration serveur incomplète.' })
  }

  // ---- 1. Auth + admin check ----
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return json(401, { ok: false, error: 'Authentification requise.' })
  }
  const token = authHeader.replace(/^Bearer\s+/i, '').trim()

  const sbAuth = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false },
  })
  const {
    data: { user: caller },
    error: userErr,
  } = await sbAuth.auth.getUser(token)
  if (userErr || !caller) {
    return json(401, { ok: false, error: 'Session invalide.' })
  }

  const sbAdmin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  })

  const { data: callerProfile } = await sbAdmin
    .from('profiles')
    .select('role')
    .eq('id', caller.id)
    .maybeSingle()
  if (callerProfile?.role !== 'admin') {
    return json(403, { ok: false, error: 'Réservé aux administrateurs.' })
  }

  // ---- 2. Body ----
  let body: DeleteRequest
  try {
    body = (await req.json()) as DeleteRequest
  } catch {
    return json(400, { ok: false, error: 'JSON invalide.' })
  }
  const targetUserId = body.user_id?.trim()
  if (!targetUserId) {
    return json(400, { ok: false, error: 'user_id requis.' })
  }

  // ---- 3. Garde anti self-delete ----
  if (targetUserId === caller.id) {
    return json(400, {
      ok: false,
      error:
        "Utilise la fonction delete-my-account pour supprimer ton propre compte.",
    })
  }

  // Pré-fetch email pour le log avant suppression
  const { data: targetProfile } = await sbAdmin
    .from('profiles')
    .select('email')
    .eq('id', targetUserId)
    .maybeSingle()
  const targetEmail = targetProfile?.email ?? '(inconnu)'

  // ---- 4. Cleanup storage ----
  let storageObjectsRemoved = 0
  const buckets = ['avatars', 'post-images']
  for (const bucket of buckets) {
    try {
      const { data: files, error: listErr } = await sbAdmin.storage
        .from(bucket)
        .list(targetUserId)
      if (listErr) {
        console.warn(
          `[admin-delete-member] List ${bucket}/${targetUserId} → ${listErr.message}`,
        )
        continue
      }
      const paths = (files ?? []).map((f) => `${targetUserId}/${f.name}`)
      if (paths.length === 0) continue

      const { error: rmErr } = await sbAdmin.storage.from(bucket).remove(paths)
      if (rmErr) {
        console.warn(
          `[admin-delete-member] Remove ${bucket} (${paths.length}) → ${rmErr.message}`,
        )
        continue
      }
      storageObjectsRemoved += paths.length
    } catch (err) {
      console.warn(`[admin-delete-member] Storage ${bucket} error:`, err)
    }
  }

  // ---- 5. Delete user (cascade ON DELETE auto) ----
  const { error: deleteErr } = await sbAdmin.auth.admin.deleteUser(targetUserId)
  if (deleteErr) {
    console.error(
      `[admin-delete-member] auth.admin.deleteUser(${targetUserId}) → ${deleteErr.message}`,
    )
    return json(500, {
      ok: false,
      error: 'Impossible de supprimer le compte. Réessaie.',
    })
  }

  console.log(
    `[admin-delete-member] ✓ ${targetEmail} (${targetUserId}) supprimé par admin ${caller.email} — ${storageObjectsRemoved} fichiers storage`,
  )

  return json(200, {
    ok: true,
    deleted_user_id: targetUserId,
    storage_objects_removed: storageObjectsRemoved,
  })
})
