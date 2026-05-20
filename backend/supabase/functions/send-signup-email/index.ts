// Le Club IA — Edge Function "send-signup-email"
//
// Déclenchée par le frontend juste après qu'un nouvel utilisateur a
// créé son compte (email + mot de passe). Envoie un email "finalise
// ton inscription" qui pointe vers /abonnement.
//
// Sécurité : verify_jwt = true. L'email est lu depuis le token JWT,
// jamais depuis le body — impossible d'usurper le destinataire.
// Best-effort : si l'envoi échoue, on log mais on retourne 200 pour
// ne pas bloquer le flow d'inscription.
//
// Implémentation autonome : on n'appelle pas send-email pour ne pas
// dépendre d'une version particulière (template inline ci-dessous).

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'
import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts'

const RESEND_API_URL = 'https://api.resend.com/emails'
const FROM_DEFAULT = 'Le Club IA <noreply@leclub-ia.com>'
const REPLY_TO = 'betterzapp@gmail.com'
const APP_URL = 'https://leclub-ia.com'

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
    return json({ ok: false, error: 'Method not allowed' }, 405)
  }

  const authHeader = req.headers.get('Authorization') || ''
  if (!authHeader.toLowerCase().startsWith('bearer ')) {
    return json({ ok: false, error: 'Authentification requise.' }, 401)
  }

  const resendKey = Deno.env.get('RESEND_API_KEY') ?? ''
  if (!resendKey) {
    console.error('[send-signup-email] RESEND_API_KEY manquante')
    return json({ ok: false, error: 'Service email non configuré.' })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  })
  const { data: userData, error: userError } = await userClient.auth.getUser()
  if (userError || !userData.user || !userData.user.email) {
    return json({ ok: false, error: 'Session invalide.' }, 401)
  }
  const user = userData.user

  const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  })

  let firstName = ''
  try {
    const { data: profile } = await adminClient
      .from('profiles')
      .select('first_name')
      .eq('id', user.id)
      .maybeSingle()
    firstName = profile?.first_name ?? ''
  } catch {
    /* best-effort */
  }

  const { subject, html, text } = renderTemplate(firstName)

  try {
    const res = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_DEFAULT,
        to: user.email,
        subject,
        html,
        text,
        reply_to: REPLY_TO,
      }),
    })
    if (!res.ok) {
      const txt = await res.text()
      console.warn(`[send-signup-email] Resend ${res.status}: ${txt.slice(0, 200)}`)
      return json({ ok: false, error: `Resend ${res.status}` })
    }
    const data = (await res.json()) as { id?: string }
    console.log(`[send-signup-email] sent to=${user.email} id=${data.id}`)
    return json({ ok: true, id: data.id })
  } catch (e) {
    console.error('[send-signup-email] fetch Resend KO', e)
    return json({ ok: false, error: 'Service email injoignable.' })
  }
})

// ---------------------------------------------------------------------------
// Template HTML inline (autonome, pas de dépendance à send-email)
// ---------------------------------------------------------------------------

function renderTemplate(firstName: string) {
  const safeName = escapeHtml(firstName.trim())
  const greeting = safeName ? `Bienvenue ${safeName} !` : 'Bienvenue !'
  const ctaUrl = `${APP_URL}/abonnement`

  const subject = '🎯 Finalise ton inscription au Club IA'
  const preheader =
    'Ton compte est créé. Choisis ton plan pour débloquer le Club.'

  const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:#FAFAF9;font-family:Inter,Arial,sans-serif;color:#0A0A0A;">
<div style="display:none;font-size:1px;color:#FAFAF9;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background:#FAFAF9;padding:32px 16px;"><tr><td align="center">
  <table role="presentation" width="600" border="0" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;">
    <tr><td align="center" style="padding-bottom:24px;">
      <table role="presentation" border="0" cellspacing="0" cellpadding="0"><tr>
        <td style="background:#1E40AF;color:#FFFFFF;font-family:Georgia,serif;font-weight:700;font-size:22px;padding:10px 24px;border-radius:9999px;letter-spacing:-0.02em;">leclub<span style="color:#F97316;font-weight:800;">.</span>ia</td>
      </tr></table>
    </td></tr>
    <tr><td style="background:#FFFFFF;border-radius:20px;border:1px solid #E5E5E5;padding:32px;">
      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
        <tr><td align="center" style="padding-bottom:8px;"><span style="font-size:32px;line-height:1;">🎯</span></td></tr>
        <tr><td align="center" style="padding-bottom:8px;"><h1 style="margin:0;font-family:Georgia,serif;font-size:24px;font-weight:700;color:#0A0A0A;letter-spacing:-0.02em;">Finalise ton inscription</h1></td></tr>
        <tr><td align="center" style="padding-bottom:24px;"><p style="margin:0;font-size:14px;color:#737373;">Encore une étape avant de rejoindre le Club</p></td></tr>
        <tr><td style="font-size:15px;line-height:1.6;color:#0A0A0A;">
          <p style="margin:0 0 12px;">${greeting}</p>
          <p style="margin:0 0 16px;">Ton compte vient d'être créé sur Le Club IA. Il ne te reste qu'une dernière étape : <strong>choisir ton plan et finaliser ton paiement</strong> pour débloquer l'accès complet à la communauté.</p>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#FAFAF9;border:1px solid #E5E5E5;border-radius:12px;padding:16px;margin:16px 0;"><tr><td>
            <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#0A0A0A;">Ce que tu vas débloquer :</p>
            <ul style="margin:0;padding-left:18px;color:#525252;font-size:14px;line-height:1.7;">
              <li>Toutes les formations IA en français (illimitées)</li>
              <li>Coach IA personnel (30 messages / jour)</li>
              <li>Communauté privée des membres</li>
              <li>Veille IA hebdomadaire et bibliothèque de ressources</li>
              <li>Coaching live mensuel avec experts IA</li>
            </ul>
          </td></tr></table>
          <p style="margin:16px 0 0;font-size:14px;color:#525252;">Deux formules sans reconduction automatique : <strong>100 €</strong> pour 6 mois ou <strong>150 €</strong> pour 12 mois (la plus avantageuse).</p>
          <p style="margin:16px 0 0;font-size:13px;color:#737373;">Une question ? Réponds simplement à cet email — on te répondra rapidement.</p>
        </td></tr>
        <tr><td align="center" style="padding:24px 0 0;"><a href="${ctaUrl}" style="display:inline-block;background:#1E40AF;color:#ffffff;text-decoration:none;font-weight:600;font-size:16px;padding:14px 28px;border-radius:9999px;font-family:Inter,Arial,sans-serif;">Choisir mon plan</a></td></tr>
      </table>
    </td></tr>
    <tr><td align="center" style="padding:24px 16px 0;">
      <p style="margin:0;font-size:12px;color:#737373;line-height:1.6;">
        Tu reçois cet email car tu viens de créer un compte sur Le Club IA.<br>
        <a href="${APP_URL}" style="color:#737373;text-decoration:underline;">Site</a> &middot;
        <a href="${APP_URL}/confidentialite" style="color:#737373;text-decoration:underline;">Confidentialité</a>
      </p>
      <p style="margin:12px 0 0;font-size:11px;color:#A3A3A3;">Le Club IA — Édité par BetterZapp LLC</p>
    </td></tr>
  </table>
</td></tr></table></body></html>`

  const text = [
    `Le Club IA`,
    ``,
    `Finalise ton inscription`,
    `Encore une étape avant de rejoindre le Club`,
    ``,
    greeting,
    ``,
    `Ton compte vient d'être créé sur Le Club IA. Il ne te reste qu'une dernière étape : choisir ton plan et finaliser ton paiement pour débloquer l'accès complet à la communauté.`,
    ``,
    `Formules : 100 € pour 6 mois ou 150 € pour 12 mois (la plus avantageuse).`,
    ``,
    `Choisir mon plan : ${ctaUrl}`,
    ``,
    `—`,
    `Une question ? Réponds simplement à cet email.`,
  ].join('\n')

  return { subject, html, text }
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
