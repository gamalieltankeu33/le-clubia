// Le Club IA — Edge Function "upload-avatar"
//
// Reçoit une image binaire dans le body et l'upload dans
// `avatars/<user.id>/avatar.<ext>`.
//
// Pourquoi cette indirection (au lieu du SDK supabase.storage.upload) :
// la policy RLS sur `storage.objects` est correcte (vérifiée par
// simulation SQL avec SET LOCAL request.jwt.claim.sub = ...). Mais en
// pratique, sur ce projet, Storage server ne propage PAS le claim
// `sub` du JWT vers Postgres au moment de l'INSERT — résultat :
// `auth.uid()` = NULL → policy refuse → "new row violates row-level
// security policy" alors que le user est bien authentifié.
//
// On contourne en faisant valider le JWT côté edge function (où
// supabase.auth.getUser() marche), puis on upload avec la
// `service_role` (qui ignore RLS). La sécurité reste équivalente :
//   - JWT obligatoire (verify_jwt = true côté gateway + getUser ici).
//   - Le PATH est calculé à partir de user.id validé, pas du body :
//     impossible pour un user d'uploader dans le dossier d'un autre.
//   - On limite la taille (1,5 Mo) et les mimes (jpg/png/webp).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'
import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts'

const MAX_BYTES = 1_500_000
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

Deno.serve(async (req: Request) => {
  const preflight = handleCorsPreflight(req)
  if (preflight) return preflight
  const cors = getCorsHeaders(req)
  const json = (b: unknown, status = 200) =>
    new Response(JSON.stringify(b), {
      status,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  const authHeader = req.headers.get('Authorization') ?? ''
  if (!authHeader.toLowerCase().startsWith('bearer ')) {
    return json({ error: 'Authentification requise.' }, 401)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  // 1. Authentifier le user via son JWT.
  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  })
  const { data: userData, error: userError } = await userClient.auth.getUser()
  if (userError || !userData.user) {
    return json({ error: 'Session invalide.' }, 401)
  }
  const user = userData.user

  // 2. Valider le content-type et la taille.
  const rawContentType = req.headers.get('content-type') ?? ''
  const contentType = rawContentType.split(';')[0].trim().toLowerCase()
  if (!ALLOWED_TYPES.includes(contentType)) {
    return json(
      { error: `Format non supporté (${contentType || 'inconnu'}). JPG / PNG / WebP uniquement.` },
      400,
    )
  }

  const buf = await req.arrayBuffer()
  if (buf.byteLength === 0) {
    return json({ error: 'Image vide.' }, 400)
  }
  if (buf.byteLength > MAX_BYTES) {
    return json({ error: `Image trop volumineuse (${Math.round(buf.byteLength / 1024)} Ko, max 1,5 Mo).` }, 413)
  }

  // 3. Upload avec service_role (bypass RLS). Path forcé sur user.id.
  const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  })
  const ext =
    contentType === 'image/png' ? 'png' : contentType === 'image/webp' ? 'webp' : 'jpg'
  const path = `${user.id}/avatar.${ext}`

  const { error: upErr } = await adminClient.storage
    .from('avatars')
    .upload(path, buf, {
      contentType,
      upsert: true,
      cacheControl: '3600',
    })
  if (upErr) {
    console.error('[upload-avatar] storage upload KO', upErr)
    const msg = typeof upErr === 'object' && 'message' in upErr ? String(upErr.message) : String(upErr)
    return json({ error: `Upload échec : ${msg.slice(0, 200)}` }, 500)
  }

  // 4. Si l'user avait un avatar à une AUTRE extension, on le nettoie
  // (pour éviter qu'un ancien .png reste après un nouvel .jpg).
  for (const other of ['jpg', 'png', 'webp']) {
    if (other === ext) continue
    await adminClient.storage
      .from('avatars')
      .remove([`${user.id}/avatar.${other}`])
      .catch(() => {})
  }

  // 5. URL publique avec cache-buster.
  const { data: pub } = adminClient.storage.from('avatars').getPublicUrl(path)
  return json({
    ok: true,
    path,
    url: `${pub.publicUrl}?v=${Date.now()}`,
  })
})
