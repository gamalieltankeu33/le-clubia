// Le Club IA — Edge Function "trial-nurture-cron"
//
// Séquence d'emails sur le mois d'essai (plan_id='trial'). Le welcome
// (stage 1) est envoyé par admin-activate-trial à l'activation. Ce cron
// s'occupe des 4 emails suivants :
//
//   stage 2 — J+7  : engagement check-in
//   stage 3 — J+21 (J-9) : upgrade nudge
//   stage 4 — J+27 (J-3) : final reminder
//   stage 5 — J+30 : expiration / réactive
//
// Appelée par pg_cron (quotidien). Auth interne par token
// `x-trial-nurture-token`.
//
// Envoi DIRECT via Resend (RESEND_API_KEY), throttlé (~2 req/s) avec
// retry sur 429/5xx. 1 email max par user par run (avance d'un stage).
// verify_jwt = false.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

const NURTURE_TOKEN = 'lcia_trial_5d8e9a2c1f7b34a690cf48ed25b78fa1'
const RESEND_API_URL = 'https://api.resend.com/emails'
const FROM = 'Le Club IA <noreply@leclub-ia.com>'
const REPLY_TO = 'betterzapp@gmail.com'
const APP_URL = 'https://leclub-ia.com'

// Palier → délai minimal (jours) depuis current_period_start
const STAGES: { n: number; days: number }[] = [
  { n: 2, days: 7 },
  { n: 3, days: 21 },
  { n: 4, days: 27 },
  { n: 5, days: 30 },
]

interface Candidate {
  user_id: string
  sub_id: string
  email: string
  first_name: string | null
  period_end: string
  stage: number
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return json({ ok: false, error: 'Method not allowed' }, 405)
  const token = (req.headers.get('x-trial-nurture-token') ?? '').trim()
  if (token !== NURTURE_TOKEN) return json({ ok: false, error: 'Token invalide.' }, 401)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const resendKey = Deno.env.get('RESEND_API_KEY') ?? ''
  if (!serviceKey || !resendKey) {
    return json({ ok: false, error: 'Service indisponible.' }, 503)
  }
  const sb = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })

  // 1. Trial subs encore dans la séquence (stage < 5).
  const { data: pending, error: pErr } = await sb
    .from('subscriptions')
    .select(
      'id, user_id, current_period_start, current_period_end, trial_nurture_stage',
    )
    .eq('plan_id', 'trial')
    .lt('trial_nurture_stage', 5)
  if (pErr) {
    console.error('[trial-nurture-cron] select subs KO', pErr)
    return json({ ok: false, error: 'DB error' }, 500)
  }
  if (!pending || pending.length === 0) {
    return json({ ok: true, sent: 0, candidates: 0 })
  }

  // 2. Charger les profils (email + first_name) pour les users concernés.
  const ids = pending.map((s) => s.user_id as string)
  const { data: profiles } = await sb
    .from('profiles')
    .select('id, email, first_name')
    .in('id', ids)
  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.id as string, p]),
  )

  // 3. Déterminer le palier dû pour chacun (1 email max par run et par user).
  const now = Date.now()
  const candidates: Candidate[] = []
  for (const s of pending) {
    const profile = profileMap.get(s.user_id as string)
    if (!profile?.email) continue
    if (!s.current_period_start) continue
    const stage = (s.trial_nurture_stage as number) ?? 0
    const next = stage + 1
    if (next > 5) continue
    const threshold = STAGES.find((x) => x.n === next)?.days
    if (threshold == null) continue
    const ageDays =
      (now - new Date(s.current_period_start as string).getTime()) / 86_400_000
    if (ageDays >= threshold) {
      candidates.push({
        user_id: s.user_id as string,
        sub_id: s.id as string,
        email: profile.email as string,
        first_name: (profile.first_name as string | null) ?? null,
        period_end: s.current_period_end as string,
        stage: next,
      })
    }
  }
  if (candidates.length === 0) {
    return json({ ok: true, sent: 0, candidates: 0 })
  }

  // 4. Envoi throttlé (~2 req/s) + retry, puis avancement du palier.
  const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms))

  async function processOne(c: Candidate): Promise<boolean> {
    const { subject, html, text } = renderTrialEmail(c.stage, {
      firstName: c.first_name ?? '',
      periodEndIso: c.period_end,
    })
    const payload = JSON.stringify({
      from: FROM,
      to: c.email,
      subject,
      html,
      text,
      reply_to: REPLY_TO,
    })
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch(RESEND_API_URL, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: payload,
        })
        if (res.ok) {
          await sb
            .from('subscriptions')
            .update({
              trial_nurture_stage: c.stage,
              trial_nurture_last_sent_at: new Date().toISOString(),
            })
            .eq('id', c.sub_id)
            .lt('trial_nurture_stage', c.stage)
          return true
        }
        const errTxt = await res.text()
        if ((res.status === 429 || res.status >= 500) && attempt === 0) {
          await sleep(1200)
          continue
        }
        console.error(`[trial-nurture-cron] Resend ${res.status} to=${c.email}: ${errTxt.slice(0, 200)}`)
        return false
      } catch (e) {
        if (attempt === 0) { await sleep(1200); continue }
        console.error(`[trial-nurture-cron] fetch KO to=${c.email}: ${String(e).slice(0, 150)}`)
        return false
      }
    }
    return false
  }

  let sent = 0
  let failed = 0
  const CHUNK = 2
  for (let i = 0; i < candidates.length; i += CHUNK) {
    const slice = candidates.slice(i, i + CHUNK)
    const results = await Promise.allSettled(slice.map(processOne))
    for (const res of results) {
      if (res.status === 'fulfilled' && res.value === true) sent++
      else failed++
    }
    if (i + CHUNK < candidates.length) await sleep(1100)
  }

  console.log(
    `[trial-nurture-cron] candidates=${candidates.length} sent=${sent} failed=${failed}`,
  )
  return json({ ok: true, sent, failed, candidates: candidates.length })
})

function json(b: unknown, status = 200): Response {
  return new Response(JSON.stringify(b), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// ---------------------------------------------------------------------------
// Templates pour les 4 emails du cron (stages 2-5)
// ---------------------------------------------------------------------------

interface Copy {
  pill: string
  subject: string
  heading: string
  body: string
  cta: string
  ctaUrl: string
}

function copyForStage(stage: number, name: string, daysLeft: number): Copy {
  const hi = name ? `Salut ${escapeHtml(name)},` : 'Salut,'
  const abo = `${APP_URL}/abonnement`
  const dash = `${APP_URL}/app/dashboard`

  switch (stage) {
    case 2:
      return {
        pill: 'Première semaine',
        subject: '1 semaine dans Le Club — tu as bien démarré ?',
        heading: 'Tu as bien démarré ?',
        body: `<p style="margin:0 0 12px;">${hi}</p>
<p style="margin:0 0 16px;">Ça fait 1 semaine que tu es entré·e dans le Club IA. Au cas où, voici 3 choses à faire maintenant si tu n'as pas encore :</p>
<ol style="margin:0 0 16px;padding-left:18px;color:#525252;line-height:1.8;">
  <li><strong>Te présenter</strong> dans la communauté (les autres membres adorent rencontrer les nouveaux).</li>
  <li><strong>Lancer un échange avec le Coach IA</strong> sur un projet en cours — il te donne 30 messages / jour.</li>
  <li><strong>Suivre une formation essentielle</strong> — 20 minutes suffisent pour repartir avec un truc concret.</li>
</ol>
<p style="margin:0;color:#525252;">Le but du Plan Découverte, c'est exactement ça : prendre le temps de tester avant de t'engager plus longtemps.</p>`,
        cta: 'Reprendre où je m\'étais arrêté·e',
        ctaUrl: dash,
      }

    case 3:
      return {
        pill: `Plus que ${daysLeft} jours`,
        subject: `Plus que ${daysLeft} jours d'essai — voici ce que tu débloques en passant Plan Progress`,
        heading: 'Tu sens que ça matche ?',
        body: `<p style="margin:0 0 12px;">${hi}</p>
<p style="margin:0 0 16px;">Plus que <strong>${daysLeft} jours</strong> sur ton Plan Découverte. Si tu sens que le Club t'apporte quelque chose, voici ce que tu débloques en passant à un plan plus long :</p>
<ul style="margin:0 0 16px;padding-left:18px;color:#525252;line-height:1.8;">
  <li><strong>Toutes les formations avancées</strong> (celles avec le cadenas aujourd'hui).</li>
  <li><strong>Le coaching live mensuel</strong> avec des experts IA.</li>
  <li>Et bien sûr, ton accès continue sans coupure.</li>
</ul>
<p style="margin:0;color:#525252;">Plan Progress : <strong>100 €/3 mois</strong>. Plan Master : <strong>150 €/6 mois</strong> (le plus avantageux).</p>`,
        cta: 'Voir les plans',
        ctaUrl: abo,
      }

    case 4:
      return {
        pill: `Plus que ${daysLeft} jours`,
        subject: `Plus que ${daysLeft} jours — continue sans interruption`,
        heading: 'Ne perds pas ton élan',
        body: `<p style="margin:0 0 12px;">${hi}</p>
<p style="margin:0 0 16px;">Ton accès Plan Découverte se termine dans <strong>${daysLeft} jours</strong>. Pour ne pas couper ton élan, tu peux dès maintenant choisir ton plan suivant :</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#FAFAF9;border:1px solid #E5E5E5;border-radius:12px;padding:14px;margin:16px 0;"><tr><td style="font-size:14px;color:#525252;line-height:1.8;">
  • <strong>Plan Progress</strong> — 100 €/3 mois — accès complet sans engagement long.<br>
  • <strong>Plan Master</strong> — 150 €/6 mois — la formule la plus avantageuse (économise 50 €).
</td></tr></table>
<p style="margin:0;color:#525252;">Une fois ton mois écoulé, l'accès est coupé. Pour repartir, il faudra repasser par un de ces deux plans.</p>`,
        cta: 'Activer mon plan',
        ctaUrl: abo,
      }

    default: // 5 (expiration jour J)
      return {
        pill: 'Accès terminé',
        subject: 'Ton mois de découverte est terminé — réactive ton accès',
        heading: 'Et maintenant ?',
        body: `<p style="margin:0 0 12px;">${hi}</p>
<p style="margin:0 0 16px;">Ton Plan Découverte se termine aujourd'hui. Tu as exploré le Club pendant 30 jours — merci de la confiance.</p>
<p style="margin:0 0 16px;">Pour continuer (et débloquer en plus les <strong>formations avancées</strong> et le <strong>coaching live mensuel</strong>), passe à l'un de nos deux plans :</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#FAFAF9;border:1px solid #E5E5E5;border-radius:12px;padding:14px;margin:16px 0;"><tr><td style="font-size:14px;color:#525252;line-height:1.8;">
  • <strong>Plan Progress</strong> — 100 €/3 mois<br>
  • <strong>Plan Master</strong> — 150 €/6 mois (<em>économise 50 €</em>)
</td></tr></table>
<p style="margin:0;color:#525252;">Pas de pression. Si ce n'est pas le bon moment, on se retrouvera plus tard.</p>`,
        cta: 'Reprendre mon accès',
        ctaUrl: abo,
      }
  }
}

function renderTrialEmail(
  stage: number,
  d: { firstName: string; periodEndIso: string },
) {
  // Jours restants avant l'expiration (positif = il en reste, 0 = aujourd'hui).
  let daysLeft = 0
  try {
    const ms = new Date(d.periodEndIso).getTime() - Date.now()
    daysLeft = Math.max(0, Math.round(ms / 86_400_000))
  } catch {
    /* noop */
  }

  const c = copyForStage(stage, d.firstName, daysLeft)
  const subject = c.subject

  const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:#FAFAF9;font-family:Inter,Arial,sans-serif;color:#0A0A0A;">
<div style="display:none;font-size:1px;color:#FAFAF9;max-height:0;overflow:hidden;">${escapeHtml(c.heading)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAFAF9;padding:32px 16px;"><tr><td align="center">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
    <tr><td align="center" style="padding-bottom:24px;">
      <table role="presentation" cellpadding="0" cellspacing="0"><tr>
        <td style="background:#1E40AF;color:#FFFFFF;font-family:Georgia,serif;font-weight:700;font-size:22px;padding:10px 24px;border-radius:9999px;letter-spacing:-0.02em;">leclub<span style="color:#F97316;font-weight:800;">.</span>ia</td>
      </tr></table>
    </td></tr>
    <tr><td style="background:#FFFFFF;border-radius:20px;border:1px solid #E5E5E5;padding:32px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding-bottom:8px;"><span style="display:inline-block;background:#F97316;color:#fff;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;padding:4px 10px;border-radius:9999px;">${escapeHtml(c.pill)}</span></td></tr>
        <tr><td style="padding-bottom:8px;"><h1 style="margin:0;font-family:Georgia,serif;font-size:22px;font-weight:700;color:#0A0A0A;letter-spacing:-0.02em;line-height:1.25;">${escapeHtml(c.heading)}</h1></td></tr>
        <tr><td style="font-size:15px;line-height:1.6;color:#0A0A0A;padding-top:8px;">${c.body}</td></tr>
        <tr><td align="center" style="padding:24px 0 0;">
          <a href="${c.ctaUrl}" style="display:inline-block;background:#1E40AF;color:#ffffff;text-decoration:none;font-weight:600;font-size:16px;padding:14px 28px;border-radius:9999px;">${escapeHtml(c.cta)}</a>
        </td></tr>
      </table>
    </td></tr>
    <tr><td align="center" style="padding:24px 16px 0;">
      <p style="margin:0;font-size:12px;color:#737373;line-height:1.6;">
        Pour revenir plus tard : <a href="${APP_URL}/auth" style="color:#737373;text-decoration:underline;">se connecter à ton espace</a>
      </p>
      <p style="margin:10px 0 0;font-size:11px;color:#A3A3A3;">Le Club IA — Édité par BetterZapp LLC</p>
    </td></tr>
  </table>
</td></tr></table></body></html>`

  const text = [
    `Le Club IA — ${c.pill}`,
    ``,
    c.heading,
    ``,
    d.firstName ? `Salut ${d.firstName},` : 'Salut,',
    ``,
    c.cta,
    `→ ${c.ctaUrl}`,
    ``,
    `— Le Club IA`,
  ].join('\n')

  return { subject, html, text }
}
