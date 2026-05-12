// Le Club IA — Edge Function "maketou-verify"
//
// Vérifie le statut d'un panier Maketou et active la subscription
// si le paiement est complété. Appelée par le frontend au retour
// `?payment=success` (PaymentSuccessHandler).
//
// Doc Maketou : https://api.maketou.net
//   GET /api/v1/stores/cart/{cartId}
//   Auth : Bearer {MAKETOU_API_KEY}
//   Réponse 200 : { id, status, paymentId, customerInfo, meta, ... }
//   Statuts : waiting_payment | completed | abandoned | payment_failed
//
// Variables d'env requises :
//   MAKETOU_API_KEY
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY (auto)

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'
import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts'

const MAKETOU_BASE_URL = 'https://api.maketou.net'

interface VerifyBody {
  userId?: string
  cartId?: string | null
}

interface MaketouCartStatus {
  id: string
  status: 'waiting_payment' | 'completed' | 'abandoned' | 'payment_failed'
  paymentId?: string
  customerInfo?: Record<string, unknown>
  meta?: Record<string, unknown>
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

  const apiKey = Deno.env.get('MAKETOU_API_KEY')
  if (!apiKey) {
    console.error('[maketou-verify] MAKETOU_API_KEY manquante')
    return json({ error: 'Service indisponible.' }, 503)
  }

  // -------- 1. Auth user ------------------------------------------------
  const authHeader = req.headers.get('Authorization') || ''
  if (!authHeader.toLowerCase().startsWith('bearer ')) {
    return json({ error: 'Authentification requise.' }, 401)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  })
  const { data: userData, error: userError } = await userClient.auth.getUser()
  if (userError || !userData.user) {
    return json({ error: 'Session invalide.' }, 401)
  }
  const user = userData.user

  // -------- 2. Parse body ------------------------------------------------
  let body: VerifyBody = {}
  try {
    body = await req.json()
  } catch {
    // body vide accepté → on retrouvera le cartId en DB
  }

  if (body.userId && body.userId !== user.id) {
    return json({ error: 'Utilisateur non autorisé.' }, 403)
  }

  const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  })

  // -------- 3. Récupère le cartId à vérifier ----------------------------
  let cartId = body.cartId || null
  let pendingSubId: string | null = null

  if (!cartId) {
    // Pas de cartId explicite → on prend la dernière sub incomplete
    // de l'user avec un maketou_cart_id non null.
    const { data: pending, error: pendingErr } = await adminClient
      .from('subscriptions')
      .select('id, maketou_cart_id, plan_id')
      .eq('user_id', user.id)
      .eq('status', 'incomplete')
      .not('maketou_cart_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (pendingErr) {
      console.error('[maketou-verify] lookup pending sub KO', pendingErr)
    }
    if (!pending?.maketou_cart_id) {
      return json({ status: 'unknown', message: 'Aucun paiement en attente trouvé.' })
    }
    cartId = pending.maketou_cart_id
    pendingSubId = pending.id
  }

  // -------- 4. GET cart status sur Maketou ------------------------------
  let maketouResp: Response
  try {
    maketouResp = await fetch(`${MAKETOU_BASE_URL}/api/v1/stores/cart/${cartId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
      },
    })
  } catch (e) {
    console.error('[maketou-verify] fetch Maketou KO', e)
    return json({ error: 'Service de paiement injoignable.' }, 502)
  }

  if (maketouResp.status === 404) {
    return json({ status: 'unknown', message: 'Panier introuvable.' })
  }
  if (!maketouResp.ok) {
    const text = await maketouResp.text()
    console.error(`[maketou-verify] Maketou status=${maketouResp.status} body=${text}`)
    return json({ error: 'Erreur lors de la vérification.' }, 502)
  }

  let cart: MaketouCartStatus
  try {
    cart = (await maketouResp.json()) as MaketouCartStatus
  } catch (e) {
    console.error('[maketou-verify] réponse Maketou non-JSON', e)
    return json({ error: 'Réponse paiement invalide.' }, 502)
  }

  // -------- 5. Sécurité : meta.userId doit matcher --------------------
  // Empêche un user A de "réclamer" un panier d'un user B en passant
  // son cartId au verify.
  const metaUserId = cart.meta && typeof cart.meta === 'object' ? (cart.meta as any).userId : null
  if (!metaUserId || metaUserId !== user.id) {
    console.warn(
      `[maketou-verify] cart ${cartId} meta.userId=${metaUserId} ne matche pas user=${user.id}`,
    )
    return json({ error: 'Panier non rattaché à ton compte.' }, 403)
  }

  const metaPlanId = (cart.meta as any).planId as 'annual' | 'semestrial' | undefined

  // -------- 6. Branchement selon status ---------------------------------
  if (cart.status === 'completed') {
    // Récupère la durée + prix + display_name du plan
    const planId = metaPlanId || 'annual'
    const { data: plan } = await adminClient
      .from('pricing_plans')
      .select('display_name, price_xof, duration_months')
      .eq('id', planId)
      .maybeSingle()

    const durationMonths = plan?.duration_months ?? (planId === 'semestrial' ? 6 : 12)

    const periodStart = new Date()
    const periodEnd = new Date(periodStart)
    periodEnd.setMonth(periodEnd.getMonth() + durationMonths)

    // Si on a une sub `incomplete` correspondante → on la passe `active`.
    // Sinon (cas du verify direct sans pendingSubId connu) → on cherche
    // par maketou_cart_id.
    if (!pendingSubId) {
      const { data: matched } = await adminClient
        .from('subscriptions')
        .select('id')
        .eq('maketou_cart_id', cartId)
        .eq('user_id', user.id)
        .maybeSingle()
      pendingSubId = matched?.id ?? null
    }

    if (pendingSubId) {
      const { error: updErr } = await adminClient
        .from('subscriptions')
        .update({
          status: 'active',
          plan_id: planId,
          current_period_start: periodStart.toISOString(),
          current_period_end: periodEnd.toISOString(),
        })
        .eq('id', pendingSubId)
      if (updErr) {
        console.error('[maketou-verify] update subscription KO', updErr)
        return json({ error: "Impossible d'activer ton abonnement." }, 500)
      }
    } else {
      // Aucune sub pré-créée trouvée → on en crée une directement
      // (cas dégradé, ex : insert au checkout avait échoué).
      const { error: insErr } = await adminClient.from('subscriptions').insert({
        user_id: user.id,
        plan: 'member',
        plan_id: planId,
        status: 'active',
        maketou_cart_id: cartId,
        current_period_start: periodStart.toISOString(),
        current_period_end: periodEnd.toISOString(),
      })
      if (insErr) {
        console.error('[maketou-verify] insert subscription KO', insErr)
        return json({ error: "Impossible d'activer ton abonnement." }, 500)
      }
    }

    // -------- 7. Email de confirmation + bienvenue ----------------------
    // Best-effort : un échec d'envoi NE doit PAS faire planter le verify.
    // Le user a déjà payé et son abo est activé, c'est ça qui compte.
    try {
      const { data: profile } = await adminClient
        .from('profiles')
        .select('first_name')
        .eq('id', user.id)
        .maybeSingle()

      const monthlyPrice =
        plan?.price_xof && plan?.duration_months
          ? Math.round(plan.price_xof / plan.duration_months)
          : undefined

      await fetch(`${supabaseUrl}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'welcome',
          to: user.email,
          data: {
            member_first_name: profile?.first_name ?? '',
            plan_display_name: plan?.display_name ?? '',
            monthly_price_xof: monthlyPrice,
            amount_paid_xof: plan?.price_xof,
            duration_months: durationMonths,
            period_end_iso: periodEnd.toISOString(),
            reference: cartId,
          },
        }),
      })
    } catch (e) {
      console.error('[maketou-verify] welcome email KO (non-bloquant)', e)
    }

    return json({ status: 'activated', cartId, planId })
  }

  if (cart.status === 'waiting_payment') {
    return json({ status: 'pending', cartId })
  }

  // payment_failed / abandoned
  if (pendingSubId) {
    await adminClient
      .from('subscriptions')
      .update({ status: 'unpaid' })
      .eq('id', pendingSubId)
  }
  return json({ status: 'failed', cartId, maketouStatus: cart.status })
})
