// Le Club IA — Edge Function "notify-admin-challenge"
//
// Envoie un email de notification à l'administrateur (ghislaintankeu6@gmail.com)
// lorsqu'un membre soumet son travail pour un challenge hebdomadaire.
//
// Variables d'env requises :
//   - RESEND_API_KEY
//   - SUPABASE_URL
//   - SUPABASE_SERVICE_ROLE_KEY
//
// Appelable directement depuis le client frontend authentifié.

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'
import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts'

const ADMIN_EMAIL = 'ghislaintankeu6@gmail.com'
const RESEND_API_URL = 'https://api.resend.com/emails'
const FROM_DEFAULT = 'Le Club IA <noreply@leclub-ia.com>'
const FROM_SANDBOX = 'Le Club IA <onboarding@resend.dev>'

interface RequestBody {
  submission_id: string
}

serve(async (req: Request) => {
  // Gestion CORS pour les requêtes Preflight
  const preflight = handleCorsPreflight(req)
  if (preflight) return preflight
  const corsHeaders = getCorsHeaders(req)

  const jsonResponse = (status: number, body: unknown): Response =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  if (req.method !== 'POST') {
    return jsonResponse(405, { ok: false, error: 'Méthode non autorisée.' })
  }

  // 1. Authentification du membre appelant
  const authHeader = req.headers.get('Authorization') ?? ''
  if (!authHeader.startsWith('Bearer ')) {
    return jsonResponse(401, { ok: false, error: 'Non authentifié.' })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const resendKey = Deno.env.get('RESEND_API_KEY') ?? ''

  if (!supabaseUrl || !serviceKey || !resendKey) {
    console.error('[notify-admin-challenge] env manquant')
    return jsonResponse(500, { ok: false, error: 'Configuration serveur incomplète.' })
  }

  // Client Supabase avec la clé service_role pour lire les détails de la soumission
  const sb = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  })

  // 2. Parser le corps de la requête
  let body: RequestBody
  try {
    body = (await req.json()) as RequestBody
  } catch {
    return jsonResponse(400, { ok: false, error: 'JSON invalide.' })
  }

  const { submission_id } = body
  if (!submission_id) {
    return jsonResponse(400, { ok: false, error: 'submission_id requis.' })
  }

  // 3. Récupérer les détails de la soumission, du membre et du défi
  const { data: sub, error: subErr } = await sb
    .from('challenge_submissions')
    .select(`
      id,
      project_name,
      deliverable_url,
      deliverable_description,
      created_at,
      profiles (
        first_name,
        last_name,
        email
      ),
      challenge_weeks (
        week_number,
        title,
        challenge_tracks (
          title
        )
      )
    `)
    .eq('id', submission_id)
    .maybeSingle()

  if (subErr || !sub) {
    console.error('[notify-admin-challenge] soumission introuvable:', subErr)
    return jsonResponse(404, { ok: false, error: 'Soumission introuvable.' })
  }

  const member = sub.profiles as any
  const week = sub.challenge_weeks as any
  const trackTitle = week?.challenge_tracks?.title ?? 'Parcours Inconnu'
  const weekNum = week?.week_number ?? '?'
  const challengeTitle = week?.title ?? ''
  const memberName = [member?.first_name, member?.last_name].filter(Boolean).join(' ') || 'Membre'
  const memberEmail = member?.email ?? 'Pas d\'email'

  // 4. Rendu de l'email HTML simple et élégant
  const subject = `🎯 Nouveau challenge relevé par ${memberName} !`
  const html = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: sans-serif; background-color: #FAFAF9; color: #0A0A0A; padding: 20px; }
          .card { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #E5E5E5; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
          .header { font-size: 18px; font-weight: bold; color: #1E40AF; margin-bottom: 16px; border-bottom: 2px solid #F3F4F6; padding-bottom: 12px; }
          .field { margin-bottom: 16px; }
          .label { font-size: 11px; font-weight: bold; text-transform: uppercase; color: #737373; letter-spacing: 0.05em; }
          .val { font-size: 14px; font-weight: 500; margin-top: 4px; }
          .desc { font-size: 14px; line-height: 1.5; color: #374151; white-space: pre-wrap; margin-top: 8px; background: #F9FAFB; padding: 12px; border-radius: 8px; border: 1px solid #E5E7EB; }
          .btn { display: inline-block; background: #1E40AF; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-size: 14px; font-weight: 600; margin-top: 16px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">🎯 Nouveau challenge soumis !</div>
          
          <div class="field">
            <div class="label">Membre</div>
            <div class="val"><strong>${memberName}</strong> (${memberEmail})</div>
          </div>

          <div class="field">
            <div class="label">Parcours / Défi</div>
            <div class="val">${trackTitle} — Semaine ${weekNum} : ${challengeTitle}</div>
          </div>

          <div class="field">
            <div class="label">Nom du projet</div>
            <div class="val"><strong>${sub.project_name}</strong></div>
          </div>

          ${sub.deliverable_url ? `
          <div class="field">
            <div class="label">Lien du livrable</div>
            <div class="val"><a href="${sub.deliverable_url}" target="_blank" style="color: #1E40AF; font-weight: 600;">${sub.deliverable_url}</a></div>
          </div>
          ` : ''}

          <div class="field">
            <div class="label">Ce qui a été fait cette semaine</div>
            <div class="desc">${sub.deliverable_description}</div>
          </div>
          
          <div style="text-align: center;">
            <a href="https://leclub-ia.com/app/admin/challenges" class="btn" style="color: #ffffff;">Ouvrir le Cockpit Admin</a>
          </div>
        </div>
      </body>
    </html>
  `

  const text = `
    Nouveau challenge soumis par ${memberName} (${memberEmail}).
    Parcours : ${trackTitle} — Semaine ${weekNum} : ${challengeTitle}
    Projet : ${sub.project_name}
    Lien : ${sub.deliverable_url ?? 'Aucun'}
    Description :
    ${sub.deliverable_description}
  `

  // 5. Envoyer l'email via Resend
  let useSandbox = false
  const res = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_DEFAULT,
      to: ADMIN_EMAIL,
      subject,
      html,
      text,
    }),
  })

  // Fallback sandbox si le domaine n'est pas vérifié
  if (!res.ok) {
    const errText = await res.text()
    console.warn('[notify-admin-challenge] Échec envoi email avec domaine principal, tentative avec sandbox. Erreur:', errText)
    useSandbox = true
  }

  if (useSandbox) {
    const resSandbox = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_SANDBOX,
        to: ADMIN_EMAIL,
        subject,
        html,
        text,
      }),
    })
    
    if (!resSandbox.ok) {
      const errText = await resSandbox.text()
      console.error('[notify-admin-challenge] Échec complet d\'envoi email:', errText)
      return jsonResponse(500, { ok: false, error: 'Échec d\'envoi de la notification.' })
    }
  }

  console.log(`[notify-admin-challenge] Email de notification envoyé à ${ADMIN_EMAIL} pour la soumission de ${memberName}.`)
  return jsonResponse(200, { ok: true })
})
