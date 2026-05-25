// Le Club IA — Edge Function "maketou-checkout"
//
// Crée un panier chez Maketou (Mobile Money) et renvoie l'URL de
// paiement vers laquelle rediriger l'utilisateur. Crée également une
// subscription `incomplete` côté DB pour pouvoir vérifier le panier
// ultérieurement via `maketou-verify`.
//
// Doc Maketou : https://api.maketou.net
//   POST /api/v1/stores/cart/checkout
//   Auth : Bearer {MAKETOU_API_KEY}
//   Body : { productDocumentId, email, firstName, lastName, phone?,
//            redirectURL?, meta? }
//   Réponse 201 : { cart: { id, status, ... }, redirectUrl }
//
// Variables d'env requises :
//   MAKETOU_API_KEY                — clé API de la boutique Maketou
//   MAKETOU_PRODUCT_ID_ANNUAL      — productDocumentId du plan annuel
//   MAKETOU_PRODUCT_ID_SEMESTRIAL  — productDocumentId du plan semestriel
//
// Variables auto-injectées par Supabase :
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY
//
// Déployable via : `cd backend && supabase functions deploy maketou-checkout`

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'
import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts'

const MAKETOU_BASE_URL = 'https://api.maketou.net'

type PlanId = 'annual' | 'semestrial' | 'trial'

interface CheckoutBody {
  planId: PlanId
  email: string
  firstName?: string
  lastName?: string
  phone?: string
  redirectURL?: string
  meta?: Record<string, unknown>
}

interface MaketouCart {
  id: string
  status: string
  createdAt?: string
  updatedAt?: string
  customerInfo?: Record<string, unknown>
}

interface MaketouCheckoutResponse {
  cart: MaketouCart
  redirectUrl: string
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
  const apiKey = Deno.env.get('MAKETOU_API_KEY')
  const productIds: Record<PlanId, string | undefined> = {
    annual: Deno.env.get('MAKETOU_PRODUCT_ID_ANNUAL'),
    semestrial: Deno.env.get('MAKETOU_PRODUCT_ID_SEMESTRIAL'),
    trial: Deno.env.get('MAKETOU_PRODUCT_ID_TRIAL'),
  }
  if (!apiKey) {
    console.error('[maketou-checkout] MAKETOU_API_KEY manquante')
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
    body.planId !== 'annual' &&
    body.planId !== 'semestrial' &&
    body.planId !== 'trial'
  ) {
    return json({ error: 'planId invalide (attendu : annual | semestrial | trial).' }, 400)
  }
  if (!body.email || typeof body.email !== 'string') {
    return json({ error: 'email requis.' }, 400)
  }

  const productDocumentId = productIds[body.planId]
  if (!productDocumentId) {
    console.error(`[maketou-checkout] productDocumentId manquant pour ${body.planId}`)
    return json({ error: 'Configuration produit incomplète. Contacte le support.' }, 503)
  }

  // Client admin (service role) pour bypass RLS sur la mise à jour de
  // la subscription. Sécurisé car on a déjà authentifié `user` au-dessus.
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
    console.error('[maketou-checkout] plan introuvable', planErr)
    return json({ error: 'Plan introuvable.' }, 400)
  }
  if (!plan.is_active) {
    return json({ error: 'Ce plan n’est plus disponible.' }, 400)
  }

  // -------- 5. Appel API Maketou ----------------------------------------
  // Le `meta` retourné par Maketou via GET /cart sert au verify pour
  // s'assurer que le panier appartient bien à l'utilisateur courant.
  const maketouPayload = {
    productDocumentId,
    email: body.email,
    firstName: body.firstName || 'Membre',
    lastName: body.lastName || 'Le Club IA',
    phone: body.phone,
    redirectURL: body.redirectURL,
    meta: {
      ...(body.meta || {}),
      userId: user.id,
      planId: body.planId,
    },
  }

  let maketouResp: Response
  try {
    maketouResp = await fetch(`${MAKETOU_BASE_URL}/api/v1/stores/cart/checkout`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(maketouPayload),
    })
  } catch (e) {
    console.error('[maketou-checkout] fetch Maketou KO', e)
    return json({ error: 'Le service de paiement est injoignable. Réessaie dans un instant.' }, 502)
  }

  if (!maketouResp.ok) {
    const errBody = await maketouResp.text()
    console.error(
      `[maketou-checkout] Maketou status=${maketouResp.status} body=${errBody}`,
    )
    // Messages courants de la doc :
    //  - 400 INVALID_PRODUCT
    //  - 401 INVALID_API_KEY
    //  - 422 validation
    let message = "Impossible d'initier le paiement. Réessaie."
    if (maketouResp.status === 401) {
      message = 'Configuration paiement invalide. Contacte le support.'
    } else if (maketouResp.status === 400) {
      message = 'Produit indisponible. Contacte le support.'
    }
    return json({ error: message }, 502)
  }

  let data: MaketouCheckoutResponse
  try {
    data = (await maketouResp.json()) as MaketouCheckoutResponse
  } catch (e) {
    console.error('[maketou-checkout] réponse Maketou non-JSON', e)
    return json({ error: 'Réponse paiement invalide.' }, 502)
  }

  if (!data?.cart?.id || !data?.redirectUrl) {
    console.error('[maketou-checkout] réponse Maketou incomplète', data)
    return json({ error: 'Réponse paiement incomplète.' }, 502)
  }

  // -------- 6. Crée/réutilise la subscription "incomplete" --------------
  // Idempotent : si l'utilisateur a déjà une subscription `incomplete`
  // (clic répété, retour arrière, double-soumission), on la met à jour
  // avec le nouveau panier au lieu d'empiler des lignes en double + des
  // paniers Maketou orphelins. Sinon, on insère une nouvelle ligne.
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
      .update({ plan_id: body.planId, maketou_cart_id: data.cart.id })
      .eq('id', existingIncomplete.id)
    if (updErr) {
      console.error('[maketou-checkout] update incomplete sub KO', updErr)
    }
  } else {
    const { error: insertErr } = await adminClient.from('subscriptions').insert({
      user_id: user.id,
      plan: 'member',
      plan_id: body.planId,
      status: 'incomplete',
      maketou_cart_id: data.cart.id,
    })
    if (insertErr) {
      // Non bloquant : on log + on continue. Le user peut quand même
      // payer ; au pire le verify fallback sur le cartId passé en query.
      console.error('[maketou-checkout] insert subscription KO', insertErr)
    }
  }

  // -------- 7. Retourne l'URL de paiement -------------------------------
  return json({
    id: data.cart.id,
    url: data.redirectUrl,
  })
})
