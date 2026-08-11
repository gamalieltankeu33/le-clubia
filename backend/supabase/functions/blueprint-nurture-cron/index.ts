// Le Club IA — Edge Function "blueprint-nurture-cron"
// Séquence de relance par email pour le Blueprint Business IA.
// Paliers : Stage 1 (Immédiat / Accueil), Stage 2 (J+1 / 24h), Stage 3 (J+3 / 72h).
// La séquence s'arrête si le candidat est marqué joined_vip_group = true ou après stage 3.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

const RESEND_API_URL = 'https://api.resend.com/emails'
const FROM_DEFAULT = 'Gamaliel - Le Club IA <noreply@leclub-ia.com>'
const REPLY_TO = 'betterzapp@gmail.com'
const WHATSAPP_GROUP_URL = 'https://chat.whatsapp.com/LtTDYyQ2YZVERhAEsGTaJX?mode=gi_t'
const FOUNDER_WA_LINK = 'https://wa.me/33744125798'

const STAGES = [
  { n: 1, hours: 0 },
  { n: 2, hours: 24 },
  { n: 3, hours: 72 },
]

interface Candidature {
  id: string
  email: string
  prenom: string
  nurture_stage: number
  created_at: string
}

Deno.serve(async (req: Request) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const resendKey = Deno.env.get('RESEND_API_KEY') ?? ''

  if (!serviceKey || !resendKey) {
    return new Response(JSON.stringify({ ok: false, error: 'Service indisponible' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const sb = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })

  // 1. Sélectionner les candidats éligibles
  const { data: candidates, error } = await sb
    .from('accompagnement_candidatures')
    .select('id, email, prenom, nurture_stage, created_at')
    .eq('joined_vip_group', false)
    .lt('nurture_stage', 3)

  if (error) {
    return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500 })
  }

  if (!candidates || candidates.length === 0) {
    return new Response(JSON.stringify({ ok: true, sent: 0 }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const now = Date.now()
  let sentCount = 0

  for (const c of candidates as Candidature[]) {
    const stage = c.nurture_stage ?? 0
    const nextStage = stage + 1
    if (nextStage > 3) continue

    const thresholdHours = STAGES[nextStage - 1].hours
    const ageHours = (now - new Date(c.created_at).getTime()) / 3_600_000

    if (ageHours >= thresholdHours) {
      const emailContent = renderBlueprintEmail(c.prenom || 'Participant', nextStage)
      
      const resendResp = await fetch(RESEND_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: FROM_DEFAULT,
          reply_to: REPLY_TO,
          to: [c.email],
          subject: emailContent.subject,
          html: emailContent.html,
        }),
      })

      if (resendResp.ok) {
        sentCount++
        await sb
          .from('accompagnement_candidatures')
          .update({
            nurture_stage: nextStage,
            last_nurture_at: new Date().toISOString(),
          })
          .eq('id', c.id)
      }
    }
  }

  return new Response(JSON.stringify({ ok: true, sent: sentCount }), {
    headers: { 'Content-Type': 'application/json' },
  })
})

function renderBlueprintEmail(prenom: string, stage: number): { subject: string; html: string } {
  if (stage === 1) {
    return {
      subject: `⚠️ IMPORTANT: Confirme ton accès au Groupe VIP WhatsApp Blueprint IA`,
      html: `
        <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc; border-radius: 16px;">
          <div style="background-color: #0F1E4D; padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: #ffffff; font-size: 22px; margin: 0;">Félicitations ${prenom} !</h1>
            <p style="color: #D4AF37; font-size: 14px; font-weight: bold; margin-top: 8px;">Ton inscription au Blueprint IA est enregistrée</p>
          </div>
          <div style="background-color: #ffffff; padding: 24px; border-radius: 0 0 12px 12px; color: #334155; line-height: 1.6;">
            <p>Bonjour <strong>${prenom}</strong>,</p>
            <p>Ton inscription au <strong>Blueprint Business IA 7 Jours</strong> a bien été prise en compte !</p>
            <p style="background-color: #f1f5f9; padding: 12px; border-left: 4px solid #25D366; font-size: 14px;">
              📌 <strong>Attention :</strong> Toutes les annonces en direct, les lives du bootcamp et l'accompagnement se passent dans notre <strong>Groupe VIP WhatsApp</strong>.
            </p>
            <div style="text-align: center; margin: 28px 0;">
              <a href="${WHATSAPP_GROUP_URL}" style="background-color: #25D366; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 50px; font-weight: bold; display: inline-block; font-size: 15px;">
                👉 Rejoindre le Groupe VIP WhatsApp Maintenant
              </a>
            </div>
            <p style="font-size: 13px; color: #64748b;">
              Tu veux vérifier directement avec moi si tu as bien rejoint ? <a href="${FOUNDER_WA_LINK}" style="color: #2563EB;">Envoie-moi un message direct sur WhatsApp ici</a>.
            </p>
            <p style="margin-top: 24px;">À très vite dans le groupe,<br><strong>Gamaliel</strong> — Fondateur Le Club IA</p>
          </div>
        </div>
      `,
    }
  }

  if (stage === 2) {
    return {
      subject: `Rappel: As-tu bien rejoint le Groupe VIP WhatsApp pour le Blueprint IA ?`,
      html: `
        <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc; border-radius: 16px;">
          <div style="background-color: #0F1E4D; padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: #ffffff; font-size: 20px; margin: 0;">Le démarrage approche ${prenom} !</h1>
          </div>
          <div style="background-color: #ffffff; padding: 24px; border-radius: 0 0 12px 12px; color: #334155; line-height: 1.6;">
            <p>Bonjour <strong>${prenom}</strong>,</p>
            <p>Je fais suite à ton inscription d'hier pour le Blueprint Business IA.</p>
            <p>J'ai remarqué que tu n'as peut-être pas encore rejoint notre groupe VIP WhatsApp. Ne manque pas les consignes de pré-lancement !</p>
            <div style="text-align: center; margin: 28px 0;">
              <a href="${WHATSAPP_GROUP_URL}" style="background-color: #0F1E4D; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 50px; font-weight: bold; display: inline-block; font-size: 15px;">
                🚀 Accéder au Groupe VIP WhatsApp
              </a>
            </div>
            <p style="margin-top: 24px;">Gamaliel</p>
          </div>
        </div>
      `,
    }
  }

  return {
    subject: `Dernière chance avant le lancement de la session Blueprint IA`,
    html: `
      <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc; border-radius: 16px;">
        <div style="background-color: #0F1E4D; padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: #D4AF37; font-size: 20px; margin: 0;">Dernier rappel pour ${prenom}</h1>
        </div>
        <div style="background-color: #ffffff; padding: 24px; border-radius: 0 0 12px 12px; color: #334155; line-height: 1.6;">
          <p>Bonjour <strong>${prenom}</strong>,</p>
          <p>La session du Blueprint IA démarre incessamment sous peu. C'est mon tout dernier rappel par email pour nous rejoindre dans le groupe WhatsApp VIP.</p>
          <div style="text-align: center; margin: 28px 0;">
            <a href="${WHATSAPP_GROUP_URL}" style="background-color: #25D366; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 50px; font-weight: bold; display: inline-block; font-size: 15px;">
              🟢 Rejoindre avant la fermeture des portes
            </a>
          </div>
          <p>À tout de suite,<br>Gamaliel</p>
        </div>
      </div>
    `,
  }
}
