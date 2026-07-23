// Le Club IA — Edge Function "chariow-verify"
//
// Vérifie le statut d'une transaction Chariow et active la subscription
// si le paiement est complété. Appelée par le frontend au retour
// `?payment=success` (PaymentSuccessHandler).
//
// Doc Chariow : https://chariow.dev
//   GET https://api.chariow.com/v1/sales/{transactionId}
//   Auth : Bearer {CHARIOW_API_KEY}
//   Réponse 200 : { message: "success", data: { id, status, payment: { status, transaction_id }, custom_metadata, ... } }
//   Statuts de vente : pending | completed | failed | abandoned | settled
//
// Variables d'env requises :
//   CHARIOW_API_KEY
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY (auto)

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'
import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts'

const CHARIOW_BASE_URL = 'https://api.chariow.com/v1'

interface VerifyBody {
  userId?: string
  cartId?: string | null // On garde cartId dans le JSON pour correspondre à l'appel front
}

interface ChariowSale {
  id: string
  status: 'pending' | 'completed' | 'failed' | 'abandoned' | 'settled'
  custom_metadata?: Record<string, unknown>
}

interface ChariowVerifyResponse {
  message: string
  data: ChariowSale
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

  const apiKey = Deno.env.get('CHARIOW_API_KEY')
  if (!apiKey) {
    console.error('[chariow-verify] CHARIOW_API_KEY manquante')
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
    // body vide accepté → on retrouvera le transaction_id en DB
  }

  if (body.userId && body.userId !== user.id) {
    return json({ error: 'Utilisateur non autorisé.' }, 403)
  }

  const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  })

  // -------- 3. Récupère la transaction à vérifier -----------------------
  let transactionId = body.cartId || null
  let pendingSubId: string | null = null

  if (!transactionId) {
    // Pas de transactionId explicite → on prend la dernière sub incomplete
    // de l'user avec un chariow_transaction_id non null.
    const { data: pending, error: pendingErr } = await adminClient
      .from('subscriptions')
      .select('id, chariow_transaction_id, plan_id')
      .eq('user_id', user.id)
      .eq('status', 'incomplete')
      .not('chariow_transaction_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (pendingErr) {
      console.error('[chariow-verify] lookup pending sub KO', pendingErr)
    }
    if (!pending?.chariow_transaction_id) {
      return json({ status: 'unknown', message: 'Aucun paiement en attente trouvé.' })
    }
    transactionId = pending.chariow_transaction_id
    pendingSubId = pending.id
  }

  // -------- 4. GET sale status sur Chariow ------------------------------
  let chariowResp: Response
  try {
    chariowResp = await fetch(`${CHARIOW_BASE_URL}/sales/${transactionId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
      },
    })
  } catch (e) {
    console.error('[chariow-verify] fetch Chariow KO', e)
    return json({ error: 'Service de paiement injoignable.' }, 502)
  }

  if (chariowResp.status === 404) {
    return json({ status: 'unknown', message: 'Transaction introuvable.' })
  }
  if (!chariowResp.ok) {
    const text = await chariowResp.text()
    console.error(`[chariow-verify] Chariow status=${chariowResp.status} body=${text}`)
    return json({ error: 'Erreur lors de la vérification.' }, 502)
  }

  let verifyRes: ChariowVerifyResponse
  try {
    verifyRes = (await chariowResp.json()) as ChariowVerifyResponse
  } catch (e) {
    console.error('[chariow-verify] réponse Chariow non-JSON', e)
    return json({ error: 'Réponse paiement invalide.' }, 502)
  }

  const sale = verifyRes.data
  if (!sale || !sale.status) {
    console.error('[chariow-verify] réponse Chariow vide ou incomplète', verifyRes)
    return json({ error: 'Réponse paiement incomplète.' }, 502)
  }

  // -------- 5. Sécurité : custom_metadata.userId doit matcher -----------
  const metaUserId = sale.custom_metadata && typeof sale.custom_metadata === 'object' 
    ? (sale.custom_metadata as any).userId 
    : null

  if (!metaUserId || metaUserId !== user.id) {
    console.warn(
      `[chariow-verify] sale ${transactionId} custom_metadata.userId=${metaUserId} ne matche pas user=${user.id}`,
    )
    return json({ error: 'Panier non rattaché à ton compte.' }, 403)
  }

  const metaPlanId = sale.custom_metadata ? (sale.custom_metadata as any).planId : undefined

  // -------- 6. Branchement selon status ---------------------------------
  if (sale.status === 'completed' || sale.status === 'settled') {
    // Récupère la durée + prix + display_name du plan
    const planId = metaPlanId || 'semestrial'
    const { data: plan } = await adminClient
      .from('pricing_plans')
      .select('display_name, price_xof, duration_months')
      .eq('id', planId)
      .maybeSingle()

    const durationMonths =
      plan?.duration_months ??
      (planId === 'trial' ? 1 : planId === 'trimestrial' ? 3 : planId === 'semestrial' ? 6 : 12)

    const periodStart = new Date()
    const periodEnd = new Date(periodStart)
    periodEnd.setMonth(periodEnd.getMonth() + durationMonths)

    // Si on a une sub `incomplete` correspondante → on la passe `active`.
    if (!pendingSubId) {
      const { data: matched } = await adminClient
        .from('subscriptions')
        .select('id')
        .eq('chariow_transaction_id', transactionId)
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
        console.error('[chariow-verify] update subscription KO', updErr)
        return json({ error: "Impossible d'activer ton abonnement." }, 500)
      }
    } else {
      // Aucune sub pré-créée trouvée → on en crée une directement
      const { error: insErr } = await adminClient.from('subscriptions').insert({
        user_id: user.id,
        plan: 'member',
        plan_id: planId,
        status: 'active',
        chariow_transaction_id: transactionId,
        current_period_start: periodStart.toISOString(),
        current_period_end: periodEnd.toISOString(),
      })
      if (insErr) {
        console.error('[chariow-verify] insert subscription KO', insErr)
        return json({ error: "Impossible d'activer ton abonnement." }, 500)
      }
    }

    // -------- 7. Email de bienvenue (envoi DIRECT Resend) ---------------
    try {
      const resendKey = Deno.env.get('RESEND_API_KEY') ?? ''
      if (resendKey && user.email) {
        const { data: profile } = await adminClient
          .from('profiles')
          .select('first_name')
          .eq('id', user.id)
          .maybeSingle()

        const { subject, html, text } = renderWelcomeEmail({
          firstName: profile?.first_name ?? '',
          priceEur: plan?.price_xof ?? null,
          durationMonths,
          periodEndIso: periodEnd.toISOString(),
        })

        const payload = JSON.stringify({
          from: 'Le Club IA <noreply@leclub-ia.com>',
          to: user.email,
          subject,
          html,
          text,
          reply_to: 'betterzapp@gmail.com',
        })
        
        const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
        for (let attempt = 0; attempt < 3; attempt++) {
          const resp = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${resendKey}`,
              'Content-Type': 'application/json',
            },
            body: payload,
          })
          if (resp.ok) break
          const errTxt = await resp.text()
          if ((resp.status === 429 || resp.status >= 500) && attempt < 2) {
            await sleep(700 * (attempt + 1))
            continue
          }
          console.error(
            `[chariow-verify] welcome Resend ${resp.status}: ${errTxt.slice(0, 200)}`,
          )
          break
        }
      }
    } catch (e) {
      console.error('[chariow-verify] welcome email KO (non-bloquant)', e)
    }

    return json({ status: 'activated', cartId: transactionId, planId })
  }

  if (sale.status === 'pending') {
    return json({ status: 'pending', cartId: transactionId })
  }

  // failed / abandoned
  if (!pendingSubId) {
    const { data: matched } = await adminClient
      .from('subscriptions')
      .select('id')
      .eq('chariow_transaction_id', transactionId)
      .eq('user_id', user.id)
      .maybeSingle()
    pendingSubId = matched?.id ?? null
  }

  if (pendingSubId) {
    await adminClient
      .from('subscriptions')
      .update({ status: 'unpaid' })
      .eq('id', pendingSubId)
  }
  return json({ status: 'failed', cartId: transactionId, chariowStatus: sale.status })
})

// ---------------------------------------------------------------------------
// Email de bienvenue (template inline, autonome, envoi direct Resend)
// ---------------------------------------------------------------------------

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function renderWelcomeEmail(d: {
  firstName: string
  priceEur: number | null
  durationMonths: number
  periodEndIso: string
}) {
  const APP_URL = 'https://leclub-ia.com'
  const dashUrl = `${APP_URL}/app/dashboard`
  const greeting = d.firstName ? `Bienvenue ${escapeHtml(d.firstName)} !` : 'Bienvenue !'
  const subject = '🎉 Bienvenue dans Le Club IA — ton accès est ouvert'
  const preheader = 'Ton paiement est confirmé. Accède à ton tableau de bord.'
  let periodEnd = ''
  try {
    periodEnd = new Date(d.periodEndIso).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    /* noop */
  }
  const priceLine =
    d.priceEur != null ? `${d.priceEur} € pour ${d.durationMonths} mois` : ''

  const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:#FAFAF9;font-family:Inter,Arial,sans-serif;color:#0A0A0A;">
<div style="display:none;font-size:1px;color:#FAFAF9;max-height:0;overflow:hidden;">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAFAF9;padding:32px 16px;"><tr><td align="center">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
    <tr><td align="center" style="padding-bottom:24px;">
      <table role="presentation" cellpadding="0" cellspacing="0"><tr>
        <td align="center" style="padding:0;"><img src="https://leclub-ia.com/brand/wordmark.png" alt="Leclub.ia" width="150" height="34" style="display:block;border:0;outline:none;" /></td>
      </tr></table>
    </td></tr>
    <tr><td style="background:#FFFFFF;border-radius:20px;border:1px solid #E5E5E5;padding:32px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr><td align="center" style="padding-bottom:8px;"><span style="font-size:32px;line-height:1;">🎉</span></td></tr>
        <tr><td align="center" style="padding-bottom:8px;"><h1 style="margin:0;font-family:Georgia,serif;font-size:24px;font-weight:700;color:#0A0A0A;letter-spacing:-0.02em;">Bienvenue dans Le Club IA</h1></td></tr>
        <tr><td align="center" style="padding-bottom:24px;"><p style="margin:0;font-size:14px;color:#737373;">Ton paiement est confirmé. Ton accès est ouvert 🚀</p></td></tr>
        <tr><td style="font-size:15px;line-height:1.6;color:#0A0A0A;">
          <p style="margin:0 0 12px;">${greeting}</p>
          <p style="margin:0 0 16px;">Tu fais maintenant partie du Club. Tu as accès à <strong>toutes les formations IA</strong>, au <strong>Coach IA</strong>, à la <strong>communauté privée</strong>, à la <strong>veille hebdomadaire</strong> et au <strong>coaching live mensuel</strong>.</p>
          ${
            priceLine
              ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#FAFAF9;border:1px solid #E5E5E5;border-radius:12px;padding:16px;margin:16px 0;"><tr><td style="font-size:14px;color:#525252;line-height:1.7;">
            <strong style="color:#0A0A0A;">Récapitulatif</strong><br>
            Formule : ${escapeHtml(priceLine)}${periodEnd ? `<br>Accès valable jusqu'au ${escapeHtml(periodEnd)}` : ''}
          </td></tr></table>`
              : ''
          }
        </td></tr>
        <tr><td align="center" style="padding:24px 0 0;"><a href="${dashUrl}" style="display:inline-block;background:#1E40AF;color:#ffffff;text-decoration:none;font-weight:600;font-size:16px;padding:14px 28px;border-radius:9999px;">Accéder à mon tableau de bord</a></td></tr>
      </table>
    </td></tr>
    <tr><td align="center" style="padding:24px 16px 0;">
      <p style="margin:0;font-size:12px;color:#737373;line-height:1.6;">Pour revenir plus tard, connecte-toi avec ton email et ton mot de passe : <a href="${APP_URL}/auth" style="color:#1E40AF;text-decoration:underline;font-weight:600;">se connecter à mon espace</a></p>
      <p style="margin:10px 0 0;font-size:12px;color:#737373;line-height:1.6;">Une question ? Réponds simplement à cet email.</p>
      <p style="margin:12px 0 0;font-size:11px;color:#A3A3A3;">Le Club IA — Édité par BetterZapp LLC</p>
    </td></tr>
  </table>
</td></tr></table></body></html>`

  const text = [
    `Bienvenue dans Le Club IA 🎉`,
    ``,
    greeting,
    ``,
    `Ton paiement est confirmé, ton accès est ouvert.`,
    priceLine ? `Formule : ${priceLine}${periodEnd ? ` (jusqu'au ${periodEnd})` : ''}` : ``,
    ``,
    `Accède à ton tableau de bord : ${dashUrl}`,
    ``,
    `Pour revenir plus tard, connecte-toi : ${APP_URL}/auth`,
    ``,
    `Une question ? Réponds simplement à cet email.`,
  ].join('\n')

  return { subject, html, text }
}
