// Le Club IA — Edge Function "admin-activate-trial"
//
// Active manuellement un abonnement "Plan Découverte" (1 mois, 30 €)
// pour un utilisateur identifié par email. Réservé aux admins.
//
// Flow :
//   1. Appelant doit être admin (vérif via JWT + profile.role).
//   2. On trouve le profil cible par email.
//   3. Refus si la cible a déjà une sub active non expirée.
//   4. Insert d'une subscription trial : status='active',
//      current_period_start = NOW, current_period_end = NOW + 1 mois,
//      trial_nurture_stage = 1 (le welcome compte comme stage 1,
//      le cron démarrera donc au stage 2 = J+7).
//   5. Envoi DIRECT Resend du mail de bienvenue trial (avec retry
//      anti-429 comme partout ailleurs).
//
// verify_jwt = true (gateway).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'
import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts'

const APP_URL = 'https://leclub-ia.com'
const FROM = 'Le Club IA <noreply@leclub-ia.com>'
const REPLY_TO = 'betterzapp@gmail.com'

interface Body {
  email?: string
}

Deno.serve(async (req: Request) => {
  const preflight = handleCorsPreflight(req)
  if (preflight) return preflight
  const cors = getCorsHeaders(req)
  const json = (b: unknown, status = 200) =>
    new Response(JSON.stringify(b), {
      status,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })

  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const authHeader = req.headers.get('Authorization') ?? ''
  if (!authHeader.toLowerCase().startsWith('bearer ')) {
    return json({ error: 'Authentification requise.' }, 401)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  // 1. Valider l'appelant + qu'il est admin.
  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  })
  const { data: userData, error: userError } = await userClient.auth.getUser()
  if (userError || !userData.user) return json({ error: 'Session invalide.' }, 401)
  const caller = userData.user

  const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  })

  const { data: callerProfile } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', caller.id)
    .maybeSingle()
  if (callerProfile?.role !== 'admin') {
    return json({ error: 'Réservé aux administrateurs.' }, 403)
  }

  // 2. Parse body.
  let body: Body = {}
  try {
    body = await req.json()
  } catch {
    return json({ error: 'JSON invalide.' }, 400)
  }
  const email = (body.email ?? '').trim().toLowerCase()
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: 'Email cible requis et valide.' }, 400)
  }

  // 3. Trouver le profil cible par email.
  const { data: target, error: targetErr } = await adminClient
    .from('profiles')
    .select('id, email, first_name')
    .eq('email', email)
    .maybeSingle()
  if (targetErr || !target) {
    return json(
      { error: `Aucun compte trouvé pour ${email}. La personne doit d'abord s'inscrire.` },
      404,
    )
  }

  // 4. Activation idempotente : on cherche la sub la plus récente du user.
  // Si elle existe → on la passe en trial actif (équivalent à choisir une
  // autre formule dans le dropdown admin existant). Sinon → INSERT.
  // Ce comportement matche celui des autres options (annual/semestrial)
  // dans /app/admin/members → un admin peut basculer un user vers
  // n'importe quel plan, y compris l'essai.
  const now = new Date()
  const periodEnd = new Date(now)
  periodEnd.setMonth(periodEnd.getMonth() + 1)

  const { data: existing } = await adminClient
    .from('subscriptions')
    .select('id')
    .eq('user_id', target.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const payload = {
    plan: 'member',
    plan_id: 'trial',
    status: 'active' as const,
    current_period_start: now.toISOString(),
    current_period_end: periodEnd.toISOString(),
    trial_nurture_stage: 1,
    trial_nurture_last_sent_at: now.toISOString(),
  }

  if (existing?.id) {
    const { error: updErr } = await adminClient
      .from('subscriptions')
      .update(payload)
      .eq('id', existing.id)
    if (updErr) {
      console.error('[admin-activate-trial] update KO', updErr)
      return json({ error: `Erreur DB : ${updErr.message}` }, 500)
    }
  } else {
    const { error: insErr } = await adminClient.from('subscriptions').insert({
      user_id: target.id,
      ...payload,
    })
    if (insErr) {
      console.error('[admin-activate-trial] insert KO', insErr)
      return json({ error: `Erreur DB : ${insErr.message}` }, 500)
    }
  }

  // 6. Envoi du welcome — best-effort, on ne fait pas planter
  // l'activation si l'email échoue.
  const resendKey = Deno.env.get('RESEND_API_KEY') ?? ''
  let emailSent = false
  if (resendKey && target.email) {
    const { subject, html, text } = renderWelcomeTrial({
      firstName: target.first_name ?? '',
      periodEndIso: periodEnd.toISOString(),
    })
    const payload = JSON.stringify({
      from: FROM,
      to: target.email,
      subject,
      html,
      text,
      reply_to: REPLY_TO,
    })
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const resp = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: payload,
        })
        if (resp.ok) {
          emailSent = true
          break
        }
        const errTxt = await resp.text()
        if ((resp.status === 429 || resp.status >= 500) && attempt < 2) {
          await sleep(700 * (attempt + 1))
          continue
        }
        console.error(`[admin-activate-trial] Resend ${resp.status}: ${errTxt.slice(0, 200)}`)
        break
      } catch (e) {
        if (attempt < 2) {
          await sleep(700 * (attempt + 1))
          continue
        }
        console.error('[admin-activate-trial] fetch Resend KO', e)
      }
    }
  }

  console.log(
    `[admin-activate-trial] activated trial for ${email} by admin ${caller.email} — email_sent=${emailSent}`,
  )
  return json({
    ok: true,
    email,
    period_end: periodEnd.toISOString(),
    email_sent: emailSent,
  })
})

// ---------------------------------------------------------------------------
// Template welcome — spécifique trial (mentionne durée 1 mois + limites)
// ---------------------------------------------------------------------------

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function renderWelcomeTrial(d: { firstName: string; periodEndIso: string }) {
  const greeting = d.firstName
    ? `Bienvenue ${escapeHtml(d.firstName)} !`
    : 'Bienvenue !'
  const subject = '🎁 Tu as 30 jours pour explorer Le Club IA'
  const preheader = 'Ton accès Plan Découverte est ouvert.'
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
  const dashUrl = `${APP_URL}/app/dashboard`

  const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:#FAFAF9;font-family:Inter,Arial,sans-serif;color:#0A0A0A;">
<div style="display:none;font-size:1px;color:#FAFAF9;max-height:0;overflow:hidden;">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAFAF9;padding:32px 16px;"><tr><td align="center">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
    <tr><td align="center" style="padding-bottom:24px;">
      <table role="presentation" cellpadding="0" cellspacing="0"><tr>
        <td style="background:#1E40AF;color:#FFFFFF;font-family:Georgia,serif;font-weight:700;font-size:22px;padding:10px 24px;border-radius:9999px;letter-spacing:-0.02em;">leclub<span style="color:#F97316;font-weight:800;">.</span>ia</td>
      </tr></table>
    </td></tr>
    <tr><td style="background:#FFFFFF;border-radius:20px;border:1px solid #E5E5E5;padding:32px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr><td align="center" style="padding-bottom:8px;"><span style="font-size:32px;line-height:1;">🎁</span></td></tr>
        <tr><td align="center" style="padding-bottom:8px;"><h1 style="margin:0;font-family:Georgia,serif;font-size:24px;font-weight:700;color:#0A0A0A;letter-spacing:-0.02em;">Ton mois de découverte commence</h1></td></tr>
        <tr><td align="center" style="padding-bottom:24px;"><p style="margin:0;font-size:14px;color:#737373;">30 jours pour explorer la communauté et tester l'IA en français</p></td></tr>
        <tr><td style="font-size:15px;line-height:1.6;color:#0A0A0A;">
          <p style="margin:0 0 12px;">${greeting}</p>
          <p style="margin:0 0 16px;">Ton accès <strong>Plan Découverte</strong> est ouvert pour 1 mois. Voici ce que tu peux faire dès maintenant :</p>
          <ul style="margin:0 0 16px;padding-left:18px;color:#525252;line-height:1.8;">
            <li>Rejoindre la <strong>communauté privée</strong> et te présenter</li>
            <li>Discuter avec le <strong>Coach IA</strong> (30 messages / jour)</li>
            <li>Suivre les <strong>formations essentielles</strong> (débutant &amp; intermédiaire)</li>
            <li>Recevoir le <strong>récap d'actus IA</strong> chaque dimanche</li>
            <li>Télécharger les <strong>ressources</strong></li>
          </ul>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#FAFAF9;border:1px solid #E5E5E5;border-radius:12px;padding:14px;margin:16px 0;"><tr><td style="font-size:13px;color:#525252;line-height:1.7;">
            <strong style="color:#0A0A0A;">À noter :</strong> les <em>formations avancées</em> et le <em>coaching live mensuel</em> sont réservés aux abonnés <strong>Plan Progress</strong> (3 mois) et <strong>Plan Master</strong> (6 mois). Tu pourras les débloquer en passant à l'un de ces plans avant la fin de ton mois.
          </td></tr></table>
          ${periodEnd ? `<p style="margin:16px 0 0;font-size:13px;color:#737373;">Ton accès Plan Découverte est valable jusqu'au <strong>${escapeHtml(periodEnd)}</strong>.</p>` : ''}
        </td></tr>
        <tr><td align="center" style="padding:24px 0 0;"><a href="${dashUrl}" style="display:inline-block;background:#1E40AF;color:#ffffff;text-decoration:none;font-weight:600;font-size:16px;padding:14px 28px;border-radius:9999px;">Accéder au Club</a></td></tr>
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
    `Le Club IA — Plan Découverte`,
    ``,
    greeting,
    ``,
    `Ton accès Plan Découverte est ouvert pour 1 mois. Voici ce que tu peux faire :`,
    `- Communauté privée`,
    `- Coach IA (30 messages / jour)`,
    `- Formations essentielles (débutant & intermédiaire)`,
    `- Récap actus IA chaque dimanche`,
    `- Ressources téléchargeables`,
    ``,
    `À noter : les formations avancées et le coaching live mensuel sont réservés aux Plans Progress (3 mois) et Master (6 mois).`,
    ``,
    periodEnd ? `Accès valable jusqu'au ${periodEnd}.` : ``,
    ``,
    `Accède au Club : ${dashUrl}`,
    ``,
    `Pour revenir plus tard, connecte-toi : ${APP_URL}/auth`,
  ].join('\n')

  return { subject, html, text }
}
