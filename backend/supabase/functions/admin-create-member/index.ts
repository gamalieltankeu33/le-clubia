// Le Club IA — Edge Function "admin-create-member"
//
// Permet à un admin de créer manuellement un compte membre + activer
// directement un abonnement, sans passer par le checkout Maketou.
// Cas d'usage : invité VIP, ambassadeur, paiement reçu hors-bande.
//
// Pipeline :
//   1. Auth check (JWT admin obligatoire)
//   2. Body validation : { email, plan_id, first_name?, last_name? }
//   3. invite via auth.admin.inviteUserByEmail → user créé en mode
//      "invited", reçoit un email Supabase avec lien magique pour
//      définir son mot de passe et se connecter
//   4. Le trigger handle_new_user crée la ligne profiles, on update
//      first_name/last_name si fournis
//   5. Crée une subscription `active` pour la durée du plan choisi
//
// Le template d'email "Invite user" peut être customisé dans Supabase
// Dashboard → Authentication → Email Templates → Invite user.

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'
import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts'

const APP_URL = 'https://leclub-ia.com'

interface CreateMemberRequest {
  email: string
  plan_id: 'semestrial' | 'trimestrial' | 'legacy_annual'
  first_name?: string
  last_name?: string
}

const PLAN_DURATION_MONTHS: Record<string, number> = {
  semestrial: 6,
  trimestrial: 3,
  legacy_annual: 12,
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

  // ---- 2. Body validation ----
  let body: CreateMemberRequest
  try {
    body = (await req.json()) as CreateMemberRequest
  } catch {
    return json(400, { ok: false, error: 'JSON invalide.' })
  }

  const email = (body.email ?? '').trim().toLowerCase()
  const planId = body.plan_id
  const firstName = body.first_name?.trim() || null
  const lastName = body.last_name?.trim() || null

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json(400, { ok: false, error: 'Adresse email invalide.' })
  }
  if (!planId || !(planId in PLAN_DURATION_MONTHS)) {
    return json(400, {
      ok: false,
      error: 'plan_id requis (semestrial | trimestrial | legacy_annual).',
    })
  }

  // ---- 3. Invitation Supabase ----
  // inviteUserByEmail crée le user en mode "invited" et envoie un mail
  // contenant un lien magique. À la réception, l'utilisateur définit son
  // mot de passe et est redirigé vers redirectTo.
  const { data: invited, error: inviteErr } =
    await sbAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${APP_URL}/app/dashboard`,
    })
  if (inviteErr || !invited?.user) {
    // L'erreur la plus fréquente : "User already registered" → renvoie
    // 409 pour que le front affiche un message clair.
    const msg = inviteErr?.message ?? 'Impossible de créer l\'invitation.'
    const isAlreadyExisting = /already/i.test(msg) ||
      /registered/i.test(msg) ||
      /exists/i.test(msg)
    return json(isAlreadyExisting ? 409 : 500, {
      ok: false,
      error: isAlreadyExisting
        ? 'Un compte avec cet email existe déjà.'
        : msg,
    })
  }

  const newUserId = invited.user.id

  // ---- 4. Profile : update si nom/prénom fournis ----
  // Le trigger handle_new_user a déjà créé la ligne profiles
  // (lecture/écriture asynchrone, le insert est rapide mais on
  // tolère l'erreur si la ligne n'existe pas encore).
  if (firstName || lastName) {
    const { error: profileErr } = await sbAdmin
      .from('profiles')
      .update({
        ...(firstName && { first_name: firstName }),
        ...(lastName && { last_name: lastName }),
      })
      .eq('id', newUserId)
    if (profileErr) {
      console.warn(
        `[admin-create-member] update profile ${newUserId} → ${profileErr.message}`,
      )
    }
  }

  // ---- 5. Subscription active pour la durée du plan ----
  const months = PLAN_DURATION_MONTHS[planId]
  const start = new Date()
  const end = new Date(start)
  end.setMonth(end.getMonth() + months)

  const { error: subErr } = await sbAdmin.from('subscriptions').insert({
    user_id: newUserId,
    plan: 'member',
    plan_id: planId,
    status: 'active',
    current_period_start: start.toISOString(),
    current_period_end: end.toISOString(),
  })
  if (subErr) {
    console.error(
      `[admin-create-member] insert subscription ${newUserId} → ${subErr.message}`,
    )
    // L'invitation est partie, l'utilisateur existe — on ne rollback
    // pas. L'admin pourra activer manuellement via le dialog existant
    // si la sub n'a pas été créée.
    return json(200, {
      ok: true,
      warning:
        "Compte créé mais l'abonnement n'a pas pu être activé automatiquement. Active-le manuellement.",
      user_id: newUserId,
      email,
    })
  }

  console.log(
    `[admin-create-member] ✓ Invitation envoyée à ${email} (${newUserId}), plan ${planId} actif jusqu'au ${end.toISOString()}`,
  )

  return json(200, {
    ok: true,
    user_id: newUserId,
    email,
    plan_id: planId,
    current_period_end: end.toISOString(),
  })
})
