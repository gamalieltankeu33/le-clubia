// Le Club IA — Edge Function "broadcast-news-email"
//
// Envoie par email un article d'actualité à tous les membres actifs
// (opt-in email_pref_weekly_recap). Appelée par le trigger DB
// `trg_broadcast_news_email` dès qu'un article passe en is_published=true.
//
// Auth : header `x-broadcast-token` (secret partagé avec le trigger).
// On n'utilise PAS la comparaison à SUPABASE_SERVICE_ROLE_KEY (depuis le
// passage de Supabase aux nouvelles clés API, la clé legacy ne matche
// plus selon le contexte).
//
// Envoi : DIRECTEMENT via Resend (RESEND_API_KEY), pas via la fonction
// send-email — car les appels service-role inter-fonctions vers
// send-email tombent en 401 (clé legacy/nouvelle). C'est le pattern
// éprouvé de send-signup-email.
//
// Idempotence : colonne news_articles.email_broadcast_at.
// verify_jwt = false (auth interne par token).

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

const BROADCAST_TOKEN = 'lcia_nb_f0e66daf64b0d58216920a7a1a51e0318ceb195c7391e9e5'
const RESEND_API_URL = 'https://api.resend.com/emails'
const FROM_DEFAULT = 'Le Club IA <noreply@leclub-ia.com>'
const REPLY_TO = 'betterzapp@gmail.com'
const APP_URL = 'https://leclub-ia.com'

interface Body {
  article_id?: string
}

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return json({ ok: false, error: 'Method not allowed' }, 405)
  }

  const token = (req.headers.get('x-broadcast-token') ?? '').trim()
  if (token !== BROADCAST_TOKEN) {
    return json({ ok: false, error: 'Token invalide.' }, 401)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const resendKey = Deno.env.get('RESEND_API_KEY') ?? ''
  if (!serviceKey || !resendKey) {
    console.error('[broadcast-news-email] env manquant', {
      hasService: !!serviceKey,
      hasResend: !!resendKey,
    })
    return json({ ok: false, error: 'Service indisponible.' }, 503)
  }

  const sb = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  })

  let body: Body = {}
  try {
    body = await req.json()
  } catch {
    /* ignore */
  }
  if (!body.article_id) {
    return json({ ok: false, error: 'article_id requis.' }, 400)
  }

  // 1. Article + idempotence.
  const { data: article, error: artErr } = await sb
    .from('news_articles')
    .select('id, slug, title, content, category, is_published, email_broadcast_at')
    .eq('id', body.article_id)
    .maybeSingle()
  if (artErr || !article) {
    console.error('[broadcast-news-email] article introuvable', artErr)
    return json({ ok: false, error: 'Article introuvable.' }, 404)
  }
  if (!article.is_published) return json({ ok: true, skipped: 'not_published' })
  if (article.email_broadcast_at) return json({ ok: true, skipped: 'already_sent' })

  // 2. Verrou idempotent immédiat.
  const { error: lockErr } = await sb
    .from('news_articles')
    .update({ email_broadcast_at: new Date().toISOString() })
    .eq('id', article.id)
    .is('email_broadcast_at', null)
  if (lockErr) {
    console.error('[broadcast-news-email] lock KO', lockErr)
    return json({ ok: false, error: 'Lock impossible.' }, 500)
  }

  // 3. Destinataires : membres actifs opt-in.
  const { data: recipients } = await sb
    .from('profiles')
    .select('id, email, first_name, email_pref_weekly_recap')
    .eq('email_pref_weekly_recap', true)
  const ids = (recipients ?? []).map((r) => r.id as string)
  let activeIds = new Set<string>()
  if (ids.length > 0) {
    const { data: subs } = await sb
      .from('subscriptions')
      .select('user_id, status')
      .in('user_id', ids)
      .in('status', ['active', 'trialing'])
    activeIds = new Set((subs ?? []).map((s) => s.user_id as string))
  }
  const targets = (recipients ?? []).filter(
    (r) => activeIds.has(r.id as string) && r.email,
  )

  // 4. Envoi direct Resend, en respectant la limite de débit de Resend
  // (~2 requêtes/seconde sur le plan par défaut). On envoie par paquets
  // de 2 espacés d'une pause, avec UNE nouvelle tentative en cas de 429
  // (rate limit) ou d'erreur serveur 5xx — sinon un gros envoi perdrait
  // des destinataires (cause du "1 failed" observé).
  const excerpt = stripMarkdownToText(String(article.content ?? '')).slice(0, 220)
  const articleUrl = `${APP_URL}/app/actualites/${article.slug}`
  const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms))

  async function sendOne(r: (typeof targets)[number]): Promise<boolean> {
    const { subject, html, text } = renderNewsEmail({
      firstName: (r.first_name as string | null) ?? '',
      title: article.title as string,
      excerpt,
      url: articleUrl,
    })
    const payload = JSON.stringify({
      from: FROM_DEFAULT,
      to: r.email,
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
        if (res.ok) return true
        const errTxt = await res.text()
        if ((res.status === 429 || res.status >= 500) && attempt === 0) {
          await sleep(1200) // backoff puis on réessaie une fois
          continue
        }
        console.error(
          `[broadcast-news-email] Resend ${res.status} to=${r.email}: ${errTxt.slice(0, 300)}`,
        )
        return false
      } catch (e) {
        if (attempt === 0) {
          await sleep(1200)
          continue
        }
        console.error(`[broadcast-news-email] fetch KO to=${r.email}: ${String(e).slice(0, 150)}`)
        return false
      }
    }
    return false
  }

  let sent = 0
  let failed = 0
  const CHUNK = 2
  for (let i = 0; i < targets.length; i += CHUNK) {
    const slice = targets.slice(i, i + CHUNK)
    const results = await Promise.allSettled(slice.map(sendOne))
    for (const res of results) {
      if (res.status === 'fulfilled' && res.value === true) sent++
      else failed++
    }
    if (i + CHUNK < targets.length) await sleep(1100) // ~2 envois/seconde
  }

  console.log(
    `[broadcast-news-email] article=${article.id} sent=${sent} failed=${failed} targets=${targets.length}`,
  )
  return json({ ok: true, sent, failed, targets: targets.length })
})

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function stripMarkdownToText(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`~-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function renderNewsEmail(d: {
  firstName: string
  title: string
  excerpt: string
  url: string
}) {
  const greeting = d.firstName ? `Salut ${escapeHtml(d.firstName)},` : 'Salut,'
  const subject = `🔥 Actu IA — ${d.title}`
  const preheader = d.excerpt.slice(0, 110)
  const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/></head>
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
        <tr><td style="padding-bottom:8px;"><span style="display:inline-block;background:#F97316;color:#fff;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;padding:4px 10px;border-radius:9999px;">🔥 Actu IA</span></td></tr>
        <tr><td style="padding-bottom:8px;"><h1 style="margin:0;font-family:Georgia,serif;font-size:22px;font-weight:700;color:#0A0A0A;letter-spacing:-0.02em;line-height:1.25;">${escapeHtml(d.title)}</h1></td></tr>
        <tr><td style="font-size:15px;line-height:1.6;color:#0A0A0A;padding-top:8px;">
          <p style="margin:0 0 12px;">${greeting}</p>
          <p style="margin:0 0 16px;color:#525252;">${escapeHtml(d.excerpt)}…</p>
        </td></tr>
        <tr><td align="center" style="padding:16px 0 0;">
          <a href="${escapeHtml(d.url)}" style="display:inline-block;background:#1E40AF;color:#ffffff;text-decoration:none;font-weight:600;font-size:16px;padding:14px 28px;border-radius:9999px;">Lire l'actu complète</a>
        </td></tr>
      </table>
    </td></tr>
    <tr><td align="center" style="padding:24px 16px 0;">
      <p style="margin:0;font-size:11px;color:#737373;line-height:1.6;">Tu reçois cet email car tu es membre du Club IA.<br>
        <a href="${APP_URL}/app/profil" style="color:#737373;text-decoration:underline;">Gérer mes préférences email</a></p>
      <p style="margin:12px 0 0;font-size:11px;color:#A3A3A3;">Le Club IA — Édité par BetterZapp LLC</p>
    </td></tr>
  </table>
</td></tr></table></body></html>`
  const text = [
    `Le Club IA — 🔥 Actu IA`,
    ``,
    d.title,
    ``,
    greeting,
    ``,
    `${d.excerpt}…`,
    ``,
    `Lire l'actu complète : ${d.url}`,
    ``,
    `— Gérer mes préférences email : ${APP_URL}/app/profil`,
  ].join('\n')
  return { subject, html, text }
}
