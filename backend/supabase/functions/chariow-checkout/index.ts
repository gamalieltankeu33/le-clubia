// Le Club IA — Edge Function "chariow-checkout"
//
// Crée une session de checkout chez Chariow et renvoie l'URL de
// paiement vers laquelle rediriger l'utilisateur. Crée également une
// subscription `incomplete` côté DB pour pouvoir vérifier la transaction
// ultérieurement via `chariow-verify` ou webhooks.
//
// Doc Chariow : https://chariow.dev
//   POST https://api.chariow.com/v1/checkout
//   Auth : Bearer {CHARIOW_API_KEY}
//   Body : { product_id, email, first_name, last_name, redirect_url, custom_metadata }
//   Réponse 200 : { message: "success", data: { step: "payment", payment: { checkout_url, transaction_id }, ... } }
//
// Variables d'env requises :
//   CHARIOW_API_KEY                 — clé API privée du dashboard Chariow
//   CHARIOW_PRODUCT_ID_TRIAL        — product_id pour le plan découverte
//   CHARIOW_PRODUCT_ID_TRIMESTRIAL  — product_id pour le plan progress
//   CHARIOW_PRODUCT_ID_SEMESTRIAL    — product_id pour le plan master
//   CHARIOW_PRODUCT_ID_ANNUAL       — product_id pour le plan premium
//
// Variables auto-injectées par Supabase :
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY
//
// Déployable via : `cd backend && supabase functions deploy chariow-checkout`

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'
import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts'

const CHARIOW_BASE_URL = 'https://api.chariow.com/v1'

type PlanId = 'trial' | 'trimestrial' | 'semestrial' | 'annual'

interface CheckoutBody {
  planId: PlanId
  email: string
  firstName?: string
  lastName?: string
  phone?: {
    number: string
    country_code: string
  }
  redirectURL?: string
  meta?: Record<string, unknown>
}

interface ChariowCheckoutResponse {
  message: string
  data: {
    step: 'payment' | 'completed' | 'already_purchased'
    payment?: {
      checkout_url: string
      transaction_id: string
    }
  }
}

serve(async (req: Request) => {
  const preflight = handleCorsPreflight(req)
  if (preflight) return preflight

  const cors = getCorsHeaders(req)
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  // -------- 1. Vérification des secrets ---------------------------------
  const apiKey = Deno.env.get('CHARIOW_API_KEY')
  const productIds: Record<PlanId, string | undefined> = {
    trial: Deno.env.get('CHARIOW_PRODUCT_ID_TRIAL'),
    trimestrial: Deno.env.get('CHARIOW_PRODUCT_ID_TRIMESTRIAL'),
    semestrial: Deno.env.get('CHARIOW_PRODUCT_ID_SEMESTRIAL'),
    annual: Deno.env.get('CHARIOW_PRODUCT_ID_ANNUAL'),
  }

  if (!apiKey) {
    console.error('[chariow-checkout] CHARIOW_API_KEY manquante')
    return json({ error: 'Paiement temporairement indisponible.' }, 503)
  }

  // -------- 2. Auth user ------------------------------------------------
  const authHeader = req.headers.get('Authorization') || ''
  if (!authHeader.toLowerCase().startsWith('bearer ')) {
    return json({ error: 'Authentification requise.' }, 401)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

  // Client avec JWT user → lit le user authentifié
  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  })
  const { data: userData, error: userError } = await userClient.auth.getUser()
  if (userError || !userData.user) {
    return json({ error: 'Session invalide.' }, 401)
  }
  const user = userData.user

  // -------- 3. Validation payload ---------------------------------------
  let body: CheckoutBody
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Payload JSON invalide.' }, 400)
  }

  if (
    body.planId !== 'trial' &&
    body.planId !== 'trimestrial' &&
    body.planId !== 'semestrial' &&
    body.planId !== 'annual'
  ) {
    return json({ error: 'planId invalide (attendu : trial | trimestrial | semestrial | annual).' }, 400)
  }
  if (!body.email || typeof body.email !== 'string') {
    return json({ error: 'email requis.' }, 400)
  }

  const product_id = productIds[body.planId]
  if (!product_id) {
    console.error(`[chariow-checkout] product_id manquant pour le plan ${body.planId}`)
    return json({ error: 'Configuration produit incomplète. Contacte le support.' }, 503)
  }

  // Client admin (service role) pour bypass RLS sur la mise à jour de la subscription.
  const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  })

  // -------- 4. Vérifie que le plan existe et est actif ------------------
  const { data: plan, error: planErr } = await adminClient
    .from('pricing_plans')
    .select('id, display_name, price_xof, duration_months, is_active')
    .eq('id', body.planId)
    .maybeSingle()

  if (planErr || !plan) {
    console.error('[chariow-checkout] plan introuvable', planErr)
    return json({ error: 'Plan introuvable.' }, 400)
  }
  if (!plan.is_active) {
    return json({ error: 'Ce plan n’est plus disponible.' }, 400)
  }

  // -------- 5. Appel API Chariow ----------------------------------------
  const chariowPayload = {
    product_id,
    email: body.email,
    first_name: body.firstName || 'Membre',
    last_name: body.lastName || 'Le Club IA',
    phone: body.phone || {
      number: '0700000000',
      country_code: 'CI',
    },
    redirect_url: body.redirectURL,
    custom_metadata: {
      ...(body.meta || {}),
      userId: user.id,
      planId: body.planId,
    },
  }

  let chariowResp: Response
  try {
    chariowResp = await fetch(`${CHARIOW_BASE_URL}/checkout`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(chariowPayload),
    })
  } catch (e) {
    console.error('[chariow-checkout] fetch Chariow KO', e)
    return json({ error: 'Le service de paiement est injoignable. Réessaie dans un instant.' }, 502)
  }

  if (!chariowResp.ok) {
    const errBody = await chariowResp.text()
    console.error(
      `[chariow-checkout] Chariow status=${chariowResp.status} body=${errBody}`,
    )
    let message = "Impossible d'initier le paiement. Réessaie."
    if (chariowResp.status === 401) {
      message = 'Configuration paiement invalide. Contacte le support.'
    } else if (chariowResp.status === 404) {
      message = 'Produit indisponible ou non publié sur Chariow.'
    }
    return json({ error: message }, 502)
  }

  let data: ChariowCheckoutResponse
  try {
    data = (await chariowResp.json()) as ChariowCheckoutResponse
  } catch (e) {
    console.error('[chariow-checkout] réponse Chariow non-JSON', e)
    return json({ error: 'Réponse paiement invalide.' }, 502)
  }

  if (data?.data?.step !== 'payment' || !data?.data?.payment?.checkout_url || !data?.data?.payment?.transaction_id) {
    console.error('[chariow-checkout] réponse Chariow incomplète ou non-payment', data)
    return json({ error: 'Le processus de paiement n\'a pas pu être initié.' }, 502)
  }

  const transactionId = data.data.payment.transaction_id
  const checkoutUrl = data.data.payment.checkout_url

  // -------- 6. Crée/réutilise la subscription "incomplete" --------------
  const { data: existingIncomplete } = await adminClient
    .from('subscriptions')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'incomplete')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existingIncomplete?.id) {
    const { error: updErr } = await adminClient
      .from('subscriptions')
      .update({ plan_id: body.planId, chariow_transaction_id: transactionId })
      .eq('id', existingIncomplete.id)
    if (updErr) {
      console.error('[chariow-checkout] update incomplete sub KO', updErr)
    }
  } else {
    const { error: insertErr } = await adminClient.from('subscriptions').insert({
      user_id: user.id,
      plan: 'member',
      plan_id: body.planId,
      status: 'incomplete',
      chariow_transaction_id: transactionId,
    })
    if (insertErr) {
      console.error('[chariow-checkout] insert subscription KO', insertErr)
    }
  }

  // -------- 7. Retourne l'URL de paiement -------------------------------
  return json({
    id: transactionId,
    url: checkoutUrl,
  })
})
