// Le Club IA — Edge Function "signup-nurture-cron"
//
// Séquence de relance des inscrits qui n'ont PAS pris d'abonnement.
// Paliers (après création du compte) : 10h, 24h, 48h, J+5, J+7.
// La séquence s'arrête dès qu'un abonnement actif existe (filtré ici)
// ou après le 5ᵉ envoi (profiles.nurture_stage = 5).
//
// Appelée par un cron horaire (pg_cron). Auth interne par token
// `x-nurture-token` (la clé service_role legacy ne matche plus selon le
// contexte → on évite Authorization bearer).
//
// Envoi DIRECT via Resend (RESEND_API_KEY), throttlé (~2 req/s) avec une
// nouvelle tentative sur 429/5xx. Lien de désinscription signé + en-tête
// List-Unsubscribe (délivrabilité). verify_jwt = false.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

const NURTURE_TOKEN = 'lcia_nurt_a7d21f6b09e84c3d5f1908b2a6c4e7d3'
const UNSUB_SECRET = 'lcia_unsub_3f9a1c7e8b2d4a6f90c5e1b8d72a4f63'
const RESEND_API_URL = 'https://api.resend.com/emails'
const FROM_DEFAULT = 'Le Club IA <noreply@leclub-ia.com>'
const REPLY_TO = 'betterzapp@gmail.com'
const APP_URL = 'https://leclub-ia.com'
const FUNCTIONS_BASE = 'https://uzsohjzrwgqmwiorzrky.supabase.co/functions/v1'

// Palier → délai minimal (heures) après la création du compte.
const STAGES: { n: number; hours: number }[] = [
  { n: 1, hours: 10 },
  { n: 2, hours: 24 },
  { n: 3, hours: 48 },
  { n: 4, hours: 120 },
  { n: 5, hours: 168 },
]

interface Candidate {
  id: string
  email: string
  first_name: string | null
  stage: number // palier à envoyer (1..5)
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return json({ ok: false, error: 'Method not allowed' }, 405)
  }
  const token = (req.headers.get('x-nurture-token') ?? '').trim()
  if (token !== NURTURE_TOKEN) {
    return json({ ok: false, error: 'Token invalide.' }, 401)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const resendKey = Deno.env.get('RESEND_API_KEY') ?? ''
  if (!serviceKey || !resendKey) {
    return json({ ok: false, error: 'Service indisponible.' }, 503)
  }
  const sb = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })

  // 1. Inscrits encore dans la séquence + opt-in.
  const { data: pending, error: pErr } = await sb
    .from('profiles')
    .select('id, email, first_name, created_at, nurture_stage')
    .lt('nurture_stage', 5)
    .eq('email_pref_nurture', true)
    .not('email', 'is', null)
  if (pErr) {
    console.error('[signup-nurture-cron] select profiles KO', pErr)
    return json({ ok: false, error: 'DB error' }, 500)
  }
  if (!pending || pending.length === 0) {
    return json({ ok: true, sent: 0, candidates: 0 })
  }

  // 2. Retirer ceux qui ont déjà un abonnement actif/trialing.
  const ids = pending.map((p) => p.id as string)
  const { data: subs } = await sb
    .from('subscriptions')
    .select('user_id, status')
    .in('user_id', ids)
    .in('status', ['active', 'trialing'])
  const paidIds = new Set((subs ?? []).map((s) => s.user_id as string))

  // 3. Déterminer le palier dû pour chacun (1 mail max par run et par user).
  const now = Date.now()
  const candidates: Candidate[] = []
  for (const p of pending) {
    if (paidIds.has(p.id as string)) continue
    if (!p.email) continue
    const stage = (p.nurture_stage as number) ?? 0
    const next = stage + 1
    if (next > 5) continue
    const threshold = STAGES[next - 1].hours
    const ageHours = (now - new Date(p.created_at as string).getTime()) / 3_600_000
    if (ageHours >= threshold) {
      candidates.push({
        id: p.id as string,
        email: p.email as string,
        first_name: (p.first_name as string | null) ?? null,
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
    const unsubUrl = `${FUNCTIONS_BASE}/email-unsubscribe?u=${c.id}&t=${await sign(c.id)}`
    const { subject, html, text } = renderRelance(c.stage, c.first_name ?? '', unsubUrl)
    const payload = JSON.stringify({
      from: FROM_DEFAULT,
      to: c.email,
      subject,
      html,
      text,
      reply_to: REPLY_TO,
      headers: {
        'List-Unsubscribe': `<${unsubUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
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
            .from('profiles')
            .update({ nurture_stage: c.stage, nurture_last_sent_at: new Date().toISOString() })
            .eq('id', c.id)
            .lt('nurture_stage', c.stage)
          return true
        }
        const errTxt = await res.text()
        if ((res.status === 429 || res.status >= 500) && attempt === 0) {
          await sleep(1200)
          continue
        }
        console.error(`[signup-nurture-cron] Resend ${res.status} to=${c.email}: ${errTxt.slice(0, 200)}`)
        return false
      } catch (e) {
        if (attempt === 0) {
          await sleep(1200)
          continue
        }
        console.error(`[signup-nurture-cron] fetch KO to=${c.email}: ${String(e).slice(0, 150)}`)
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

  console.log(`[signup-nurture-cron] candidates=${candidates.length} sent=${sent} failed=${failed}`)
  return json({ ok: true, sent, failed, candidates: candidates.length })
})

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

async function sign(userId: string): Promise<string> {
  const data = new TextEncoder().encode(`${userId}:${UNSUB_SECRET}`)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('')
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
// Contenu des 5 relances (motivation croissante)
// ---------------------------------------------------------------------------

interface Copy {
  pill: string
  subject: string
  heading: string
  body: string // HTML autorisé (paragraphes <p>)
  cta: string
}

function relanceCopy(stage: number, name: string): Copy {
  const hi = name ? `Salut ${escapeHtml(name)},` : 'Salut,'
  switch (stage) {
    case 1:
      return {
        pill: 'Inscription à finaliser',
        subject: '🎯 Tu y es presque — choisis ta formule',
        heading: 'Ton compte est créé, il reste une étape',
        body: `<p style="margin:0 0 12px;">${hi}</p>
<p style="margin:0 0 16px;">Tu as créé ton compte sur Le Club IA — bravo ! Il ne te reste qu'<strong>une seule étape</strong> : choisir ta formule pour débloquer l'accès complet (formations, Coach IA, communauté, veille…).</p>
<p style="margin:0;color:#525252;">Ça prend moins de 2 minutes.</p>`,
        cta: 'Choisir ma formule',
      }
    case 2:
      return {
        pill: 'Ce que tu débloques',
        subject: 'Voici ce qui t’attend dans Le Club IA',
        heading: 'Tout ça t’attend, dès ton activation',
        body: `<p style="margin:0 0 12px;">${hi}</p>
<p style="margin:0 0 12px;">Tu hésites encore ? Voici ce que les membres utilisent <strong>chaque jour</strong> :</p>
<ul style="margin:0 0 16px;padding-left:18px;color:#525252;line-height:1.7;">
  <li>Toutes les formations IA en français (illimitées)</li>
  <li>Un Coach IA personnel, dispo 24/7</li>
  <li>La communauté privée des membres</li>
  <li>La veille IA hebdomadaire</li>
  <li>Le coaching live mensuel avec des experts</li>
</ul>
<p style="margin:0;color:#525252;">Ta place t'attend — il suffit de l'activer.</p>`,
        cta: 'Activer mon accès',
      }
    case 3:
      return {
        pill: 'On garde ta place',
        subject: 'On garde ta place encore un peu 👀',
        heading: 'Ta place est toujours là',
        body: `<p style="margin:0 0 12px;">${hi}</p>
<p style="margin:0 0 16px;">Pendant que tu hésites, l'IA, elle, n'attend pas. Chaque semaine, les membres du Club prennent une longueur d'avance — sur leur métier, leurs projets, leurs revenus.</p>
<p style="margin:0;color:#525252;">Deux formules sans reconduction automatique : <strong>100 € / 6 mois</strong> ou <strong>150 € / 12 mois</strong> (la plus avantageuse).</p>`,
        cta: 'Rejoindre le Club',
      }
    case 4:
      return {
        pill: 'Tu avances ?',
        subject: 'Tu avances, ou tu restes spectateur ?',
        heading: 'Le bon moment, c’est maintenant',
        body: `<p style="margin:0 0 12px;">${hi}</p>
<p style="margin:0 0 16px;">Ça fait quelques jours que ton compte est créé sans être activé. La différence entre ceux qui maîtrisent l'IA et les autres ? Ils ont <strong>commencé</strong>.</p>
<p style="margin:0;color:#525252;">Rejoins-les pendant que c'est encore frais.</p>`,
        cta: 'Je finalise mon inscription',
      }
    default:
      return {
        pill: 'Dernière relance',
        subject: 'Dernière relance — on n’insiste plus après ✋',
        heading: 'Dernier rappel (promis)',
        body: `<p style="margin:0 0 12px;">${hi}</p>
<p style="margin:0 0 16px;">C'est notre <strong>dernier message</strong> à propos de ton inscription — on ne veut pas t'encombrer la boîte mail. Ta place au Club IA t'attend toujours, mais c'est à toi de jouer.</p>
<p style="margin:0;color:#525252;">Si c'est le bon moment, c'est par ici 👇</p>`,
        cta: 'Activer mon accès maintenant',
      }
  }
}

function renderRelance(stage: number, name: string, unsubUrl: string) {
  const c = relanceCopy(stage, name)
  const ctaUrl = `${APP_URL}/abonnement`
  const subject = c.subject
  const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:#FAFAF9;font-family:Inter,Arial,sans-serif;color:#0A0A0A;">
<div style="display:none;font-size:1px;color:#FAFAF9;max-height:0;overflow:hidden;">${escapeHtml(c.heading)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAFAF9;padding:32px 16px;"><tr><td align="center">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
    <tr><td align="center" style="padding-bottom:24px;">
      <table role="presentation" cellpadding="0" cellspacing="0"><tr>
        <td align="center" style="padding:0;"><img src="https://leclub-ia.com/brand/wordmark.png" alt="Leclub.ia" width="150" height="34" style="display:block;border:0;outline:none;" /></td>
      </tr></table>
    </td></tr>
    <tr><td style="background:#FFFFFF;border-radius:20px;border:1px solid #E5E5E5;padding:32px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding-bottom:8px;"><span style="display:inline-block;background:#F97316;color:#fff;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;padding:4px 10px;border-radius:9999px;">${escapeHtml(c.pill)}</span></td></tr>
        <tr><td style="padding-bottom:8px;"><h1 style="margin:0;font-family:Georgia,serif;font-size:22px;font-weight:700;color:#0A0A0A;letter-spacing:-0.02em;line-height:1.25;">${escapeHtml(c.heading)}</h1></td></tr>
        <tr><td style="font-size:15px;line-height:1.6;color:#0A0A0A;padding-top:8px;">${c.body}</td></tr>
        <tr><td align="center" style="padding:24px 0 0;">
          <a href="${ctaUrl}" style="display:inline-block;background:#1E40AF;color:#ffffff;text-decoration:none;font-weight:600;font-size:16px;padding:14px 28px;border-radius:9999px;">${escapeHtml(c.cta)}</a>
        </td></tr>
      </table>
    </td></tr>
    <tr><td align="center" style="padding:24px 16px 0;">
      <p style="margin:0;font-size:11px;color:#737373;line-height:1.6;">Tu reçois cet email car tu as créé un compte sur Le Club IA.<br>
        <a href="${unsubUrl}" style="color:#737373;text-decoration:underline;">Ne plus recevoir ces rappels</a></p>
      <p style="margin:12px 0 0;font-size:11px;color:#A3A3A3;">Le Club IA — Édité par BetterZapp LLC</p>
    </td></tr>
  </table>
</td></tr></table></body></html>`
  const text = [
    `Le Club IA — ${c.pill}`,
    ``,
    c.heading,
    ``,
    name ? `Salut ${name},` : 'Salut,',
    ``,
    `Finalise ton inscription et choisis ta formule : ${ctaUrl}`,
    ``,
    `— Ne plus recevoir ces rappels : ${unsubUrl}`,
  ].join('\n')
  return { subject, html, text }
}
