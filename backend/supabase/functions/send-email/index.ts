// Le Club IA — Edge Function "send-email"
// Envoi d'emails transactionnels via Resend (https://resend.com).
//
// Variables d'env requises :
//   - RESEND_API_KEY               (Dashboard → Edge Functions → Secrets)
//   - SUPABASE_SERVICE_ROLE_KEY    (auth interne)
//
// Sécurité : appelable uniquement avec la service_role_key (jamais depuis
// le frontend membre). Les autres edge functions (news-agent,
// events-reminder-cron) sont les seuls clients légitimes.
//
// Body attendu :
//   {
//     "type": "weekly-recap" | "event-announcement" | "event-reminder-1day" | "event-reminder-today" | "welcome",
//     "to": "user@example.com",
//     "data": { ... }   // dépend du type
//   }
//
// Retourne : { ok: boolean, id?: string, error?: string }

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts'

const RESEND_API_URL = 'https://api.resend.com/emails'
const FROM_DEFAULT = 'Le Club IA <noreply@leclub-ia.com>'
// Sandbox Resend (onboarding@resend.dev) — fallback si le domaine
// leclub-ia.com n'était pas encore vérifié au moment de l'envoi.
const FROM_SANDBOX = 'Le Club IA <onboarding@resend.dev>'
const REPLY_TO = 'betterzapp@gmail.com'
const APP_URL = 'https://leclub-ia.com'

// CORS via helper partagé — voir _shared/cors.ts

type EmailType =
  | 'weekly-recap'
  | 'breaking-news'
  | 'event-announcement'
  | 'event-reminder-1day'
  | 'event-reminder-today'
  | 'welcome'
  | 'subscription-expiring'
  | 'signup-pending-payment'

interface BaseRequest {
  type: EmailType
  to: string
  data: Record<string, unknown>
  /** Si true, utilise le from sandbox Resend (utile tant que le domaine n'est
   *  pas vérifié). Défaut : false (= utilise noreply@leclubia.com). */
  useSandbox?: boolean
}

interface SendResult {
  ok: boolean
  id?: string
  error?: string
}

// ---------------------------------------------------------------------------
// Entry
// ---------------------------------------------------------------------------

serve(async (req: Request) => {
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

  // Auth : service-role uniquement
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const auth = (req.headers.get('Authorization') ?? '')
    .replace(/^Bearer\s+/i, '')
    .trim()
  if (!serviceKey || auth !== serviceKey.trim()) {
    return jsonResponse(401, {
      ok: false,
      error: 'Service-role requis.',
    })
  }

  const resendKey = Deno.env.get('RESEND_API_KEY') ?? ''
  if (!resendKey) {
    console.error('[send-email] RESEND_API_KEY manquante')
    return jsonResponse(200, {
      ok: false,
      error: "RESEND_API_KEY n'est pas configurée.",
      hint: 'Dashboard → Edge Functions → Secrets → ajouter RESEND_API_KEY (format re_xxx).',
    })
  }

  let body: BaseRequest
  try {
    body = (await req.json()) as BaseRequest
  } catch {
    return jsonResponse(400, { ok: false, error: 'JSON invalide.' })
  }

  const { type, to, data, useSandbox } = body
  if (!type || !to || !data) {
    return jsonResponse(400, {
      ok: false,
      error: 'Champs requis : type, to, data.',
    })
  }

  // Validation email basique (rejet silencieux pour ne pas casser un batch)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    console.error('[send-email] Email invalide:', to)
    return jsonResponse(200, { ok: false, error: 'Email invalide.' })
  }

  let template: { subject: string; html: string; text: string }
  try {
    template = renderTemplate(type, data)
  } catch (err) {
    console.error('[send-email] Render template error:', err)
    return jsonResponse(200, {
      ok: false,
      error: `Erreur rendu template ${type}.`,
    })
  }

  const result = await sendViaResend(resendKey, {
    from: useSandbox ? FROM_SANDBOX : FROM_DEFAULT,
    to,
    subject: template.subject,
    html: template.html,
    text: template.text,
    reply_to: REPLY_TO,
  })

  console.log(
    `[send-email] type=${type}, to=${to}, status=${result.ok ? 'sent' : 'failed'}${result.id ? ' id=' + result.id : ''}${result.error ? ' err=' + result.error : ''}`,
  )
  return jsonResponse(200, result)
})

// ---------------------------------------------------------------------------
// Resend client (avec retry léger sur 429)
// ---------------------------------------------------------------------------

async function sendViaResend(
  apiKey: string,
  payload: {
    from: string
    to: string
    subject: string
    html: string
    text: string
    reply_to: string
  },
  attempt = 0,
): Promise<SendResult> {
  try {
    const res = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (res.status === 429 && attempt < 2) {
      await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)))
      return sendViaResend(apiKey, payload, attempt + 1)
    }

    if (res.status === 401) {
      return {
        ok: false,
        error: 'Clé Resend invalide ou expirée.',
      }
    }

    if (!res.ok) {
      const txt = await res.text()
      return {
        ok: false,
        error: `Resend ${res.status} : ${txt.slice(0, 200)}`,
      }
    }

    const data = (await res.json()) as { id?: string }
    return { ok: true, id: data.id }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Erreur réseau Resend.',
    }
  }
}

// ---------------------------------------------------------------------------
// Templates HTML branded Le Club IA
// ---------------------------------------------------------------------------

function renderTemplate(
  type: EmailType,
  data: Record<string, unknown>,
): { subject: string; html: string; text: string } {
  switch (type) {
    case 'weekly-recap':
      return tplWeeklyRecap(data)
    case 'breaking-news':
      return tplBreakingNews(data)
    case 'event-announcement':
      return tplEventAnnouncement(data)
    case 'event-reminder-1day':
      return tplEventReminder1Day(data)
    case 'event-reminder-today':
      return tplEventReminderToday(data)
    case 'welcome':
      return tplWelcome(data)
    case 'subscription-expiring':
      return tplSubscriptionExpiring(data)
    case 'signup-pending-payment':
      return tplSignupPendingPayment(data)
    default:
      throw new Error(`Type inconnu : ${type}`)
  }
}

// =============================================================================
// Layout commun (header + footer) inline-CSS, table-based, mobile-friendly
// =============================================================================

interface LayoutOptions {
  preheader: string
  heroEmoji: string
  heroTitle: string
  heroSubtitle: string
  body: string
  ctaUrl?: string
  ctaLabel?: string
  ctaSecondaryUrl?: string
  ctaSecondaryLabel?: string
  /** Si présent, image affichée en grand au-dessus du contenu (1200x630
   *  recommandé). Utilisé pour les events. */
  heroImageUrl?: string
  /** Couleur du CTA principal. Défaut #1E40AF (bleu). Pour le rappel
   *  jour J on passe en orange/vert. */
  ctaColor?: string
}

function layoutHtml(opts: LayoutOptions): string {
  const ctaBg = opts.ctaColor ?? '#1E40AF'
  const cta = opts.ctaUrl
    ? `
    <tr>
      <td align="center" style="padding: 8px 0 0;">
        <a href="${escapeAttr(opts.ctaUrl)}" style="display:inline-block;background:${ctaBg};color:#ffffff;text-decoration:none;font-weight:600;font-size:16px;padding:14px 28px;border-radius:9999px;font-family:Inter,Arial,sans-serif;">${escapeHtml(opts.ctaLabel ?? 'En savoir plus')}</a>
      </td>
    </tr>
    `
    : ''
  const ctaSecondary = opts.ctaSecondaryUrl
    ? `
    <tr>
      <td align="center" style="padding: 12px 0 0;">
        <a href="${escapeAttr(opts.ctaSecondaryUrl)}" style="display:inline-block;color:#1E40AF;text-decoration:underline;font-size:13px;font-family:Inter,Arial,sans-serif;">${escapeHtml(opts.ctaSecondaryLabel ?? '')}</a>
      </td>
    </tr>
    `
    : ''
  const heroImage = opts.heroImageUrl
    ? `
            <tr>
              <td style="padding-bottom:16px;">
                <img src="${escapeAttr(opts.heroImageUrl)}" alt="${escapeAttr(opts.heroTitle)}" width="600" style="display:block;width:100%;max-width:600px;height:auto;border-radius:12px;border:0;outline:none;" />
              </td>
            </tr>
    `
    : ''
  return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="x-apple-disable-message-reformatting" />
    <title>${escapeHtml(opts.heroTitle)}</title>
  </head>
  <body style="margin:0;padding:0;background:#FAFAF9;font-family:Inter,Arial,sans-serif;color:#0A0A0A;">
    <!-- Preheader caché (texte aperçu boîte mail) -->
    <div style="display:none;font-size:1px;color:#FAFAF9;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
      ${escapeHtml(opts.preheader)}
    </div>

    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background:#FAFAF9;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" border="0" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;">

            <!-- Header logo -->
            <tr>
              <td align="center" style="padding-bottom:24px;">
                <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td align="center" style="padding:0;">
                      <img src="https://leclub-ia.com/brand/wordmark.png" alt="Leclub.ia" width="150" height="34" style="display:block;border:0;outline:none;" />
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            ${heroImage}

            <!-- Card principale -->
            <tr>
              <td style="background:#FFFFFF;border-radius:20px;border:1px solid #E5E5E5;padding:32px;">
                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td align="center" style="padding-bottom:8px;">
                      <span style="font-size:32px;line-height:1;">${escapeHtml(opts.heroEmoji)}</span>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding-bottom:8px;">
                      <h1 style="margin:0;font-family:Georgia,serif;font-size:24px;font-weight:700;color:#0A0A0A;letter-spacing:-0.02em;">${escapeHtml(opts.heroTitle)}</h1>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding-bottom:24px;">
                      <p style="margin:0;font-size:14px;color:#737373;">${escapeHtml(opts.heroSubtitle)}</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="font-size:15px;line-height:1.6;color:#0A0A0A;">
                      ${opts.body}
                    </td>
                  </tr>
                  ${cta}
                  ${ctaSecondary}
                </table>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td align="center" style="padding:24px 16px 0;">
                <p style="margin:0;font-size:12px;color:#737373;line-height:1.6;">
                  Tu reçois cet email car tu es membre du Club IA.<br>
                  <a href="${APP_URL}/app/profil" style="color:#737373;text-decoration:underline;">Gérer mes préférences email</a>
                  &nbsp;·&nbsp;
                  <a href="${APP_URL}" style="color:#737373;text-decoration:underline;">Site</a>
                  &nbsp;·&nbsp;
                  <a href="${APP_URL}/confidentialite" style="color:#737373;text-decoration:underline;">Confidentialité</a>
                </p>
                <p style="margin:12px 0 0;font-size:11px;color:#A3A3A3;">
                  Le Club IA — Édité par BetterZapp LLC<br>
                  Communauté francophone d'experts en IA
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

// Texte plain équivalent — fallback pour lecteurs en clair / accessibilité.
function plainText(opts: {
  title: string
  subtitle: string
  body: string
  ctaUrl?: string
  ctaLabel?: string
}): string {
  const lines: string[] = [
    `Le Club IA`,
    ``,
    opts.title,
    opts.subtitle,
    ``,
    opts.body,
    ``,
  ]
  if (opts.ctaUrl) {
    lines.push(`${opts.ctaLabel ?? 'Lien'} : ${opts.ctaUrl}`)
    lines.push('')
  }
  lines.push(
    `—`,
    `Tu reçois cet email car tu es membre du Club IA.`,
    `Gérer tes préférences email : ${APP_URL}/app/profil`,
    `Politique de confidentialité : ${APP_URL}/confidentialite`,
  )
  return lines.join('\n')
}

// =============================================================================
// Template 1 — Récap hebdomadaire IA
// =============================================================================

interface WeeklyRecapData {
  member_first_name?: string
  article_slug: string
  article_title: string
  /** Liste des 5 actu en bullets : [{title, summary}] */
  articles_summary?: Array<{ title: string; summary: string }>
}

function tplWeeklyRecap(raw: Record<string, unknown>) {
  const d = raw as unknown as WeeklyRecapData
  const firstName = (d.member_first_name ?? '').trim() || ''
  const greeting = firstName ? `Salut ${escapeHtml(firstName)},` : 'Salut,'
  const items = (d.articles_summary ?? [])
    .slice(0, 5)
    .map(
      (item) => `
    <tr>
      <td style="padding:14px 16px;border-bottom:1px solid #E5E5E5;">
        <p style="margin:0 0 6px;font-weight:600;font-size:15px;color:#0A0A0A;">${escapeHtml(item.title)}</p>
        <p style="margin:0;font-size:14px;color:#525252;line-height:1.5;">${escapeHtml(item.summary).slice(0, 220)}${item.summary.length > 220 ? '…' : ''}</p>
      </td>
    </tr>
    `,
    )
    .join('')

  const dateLabel = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const ctaUrl = `${APP_URL}/app/actualites/${encodeURIComponent(d.article_slug)}`

  const body = `
    <p style="margin:0 0 12px;">${greeting}</p>
    <p style="margin:0 0 16px;">Voici les actualités IA marquantes de cette semaine, sélectionnées et résumées par notre agent éditorial.</p>
    ${
      items
        ? `<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background:#FAFAF9;border-radius:12px;margin:16px 0;">${items}</table>`
        : `<p style="margin:0 0 16px;color:#525252;">Le récap complet t'attend dans l'app.</p>`
    }
    <p style="margin:16px 0 0;font-size:14px;color:#525252;">Bonne lecture, et à dimanche prochain !</p>
  `

  return {
    subject: `📰 Le récap IA de la semaine — ${dateLabel}`,
    html: layoutHtml({
      preheader: `Récap IA de la semaine — ${dateLabel}`,
      heroEmoji: '📰',
      heroTitle: 'Le récap IA de la semaine',
      heroSubtitle: dateLabel,
      body,
      ctaUrl,
      ctaLabel: 'Lire le récap complet',
    }),
    text: plainText({
      title: 'Le récap IA de la semaine',
      subtitle: dateLabel,
      body: `${greeting}\n\nVoici les actualités IA marquantes de cette semaine.${
        d.articles_summary
          ? '\n\n' +
            d.articles_summary
              .slice(0, 5)
              .map((a, i) => `${i + 1}. ${a.title}\n   ${a.summary.slice(0, 200)}`)
              .join('\n\n')
          : ''
      }`,
      ctaUrl,
      ctaLabel: 'Lire le récap complet',
    }),
  }
}

// =============================================================================
// Template — Actu IA chaude (breaking-news, déclenchement manuel admin)
// =============================================================================

interface BreakingNewsData {
  member_first_name?: string
  article_slug: string
  article_title: string
  /** Extrait plain-text 200-220 caractères du content_markdown. */
  article_excerpt?: string
}

function tplBreakingNews(raw: Record<string, unknown>) {
  const d = raw as unknown as BreakingNewsData
  const firstName = (d.member_first_name ?? '').trim() || ''
  const greeting = firstName ? `Salut ${escapeHtml(firstName)},` : 'Salut,'
  const ctaUrl = `${APP_URL}/app/actualites/${encodeURIComponent(d.article_slug)}`
  const excerpt = (d.article_excerpt ?? '').trim()
  const excerptBlock = excerpt
    ? `<p style="margin:0 0 16px;font-size:14px;color:#525252;line-height:1.6;">${escapeHtml(excerpt)}…</p>`
    : ''

  // Bandeau orange "ACTUALITÉ IA CHAUDE" — placé en haut du body comme
  // signal visuel fort. Couleur Le Club IA accent (#F97316).
  const body = `
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin:0 0 16px;">
      <tr>
        <td align="center" style="background:#F97316;color:#FFFFFF;padding:8px 16px;border-radius:9999px;font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;font-family:Inter,Arial,sans-serif;">
          🔥 Actualité IA chaude
        </td>
      </tr>
    </table>
    <p style="margin:0 0 12px;">${greeting}</p>
    <p style="margin:0 0 16px;">Une actu IA importante vient d'être publiée par l'agent éditorial du Club. On a pensé que tu voudrais la lire en priorité.</p>
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background:#FAFAF9;border-radius:12px;padding:16px;margin:16px 0;">
      <tr>
        <td>
          <p style="margin:0;font-size:18px;font-weight:600;color:#0A0A0A;line-height:1.4;">${escapeHtml(d.article_title)}</p>
          ${excerptBlock ? `<div style="margin-top:12px;">${excerptBlock}</div>` : ''}
        </td>
      </tr>
    </table>
    <p style="margin:16px 0 0;font-size:14px;color:#525252;">À très vite&nbsp;dans l'app !</p>
  `

  return {
    subject: `🔥 Actu IA — ${d.article_title}`,
    html: layoutHtml({
      preheader: `Actu IA chaude : ${d.article_title}`,
      heroEmoji: '🔥',
      heroTitle: 'Actu IA du moment',
      heroSubtitle: d.article_title,
      body,
      ctaUrl,
      ctaLabel: "Lire l'article complet",
      ctaColor: '#F97316',
    }),
    text: plainText({
      title: 'Actu IA du moment',
      subtitle: d.article_title,
      body: `${greeting}\n\nUne actu IA importante vient d'être publiée.${
        excerpt ? `\n\n${excerpt}…` : ''
      }`,
      ctaUrl,
      ctaLabel: "Lire l'article complet",
    }),
  }
}

// =============================================================================
// Template 2 — Annonce nouvel événement
// =============================================================================

interface EventData {
  event_title: string
  event_starts_at: string // ISO
  event_description?: string
  event_speaker_name?: string
  event_meet_url?: string
  event_cover_image_url?: string
  event_id?: string
  member_first_name?: string
}

// Tronque la description à 200 chars sans casser un mot.
function truncateDesc(s: string | undefined, max = 200): string {
  if (!s) return ''
  const trimmed = s.trim()
  if (trimmed.length <= max) return trimmed
  const cut = trimmed.slice(0, max)
  const lastSpace = cut.lastIndexOf(' ')
  return (lastSpace > 80 ? cut.slice(0, lastSpace) : cut) + '…'
}

function tplEventAnnouncement(raw: Record<string, unknown>) {
  const d = raw as unknown as EventData
  const firstName = (d.member_first_name ?? '').trim() || ''
  const greeting = firstName ? `Salut ${escapeHtml(firstName)},` : 'Salut,'
  const dateLabel = formatFrenchDateTime(d.event_starts_at)
  const speaker = d.event_speaker_name
    ? `<p style="margin:8px 0 0;font-size:14px;color:#525252;"><strong>Animé par&nbsp;:</strong> ${escapeHtml(d.event_speaker_name)}</p>`
    : ''
  const shortDesc = truncateDesc(d.event_description, 200)
  const desc = shortDesc
    ? `<p style="margin:12px 0 0;font-size:14px;color:#525252;line-height:1.6;">${escapeHtml(shortDesc)}</p>`
    : ''

  const body = `
    <p style="margin:0 0 12px;">${greeting}</p>
    <p style="margin:0 0 16px;">Un nouveau coaching live vient d'être programmé. Bloque cette date dans ton agenda&nbsp;!</p>
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background:#FAFAF9;border-radius:12px;padding:16px;margin:16px 0;">
      <tr>
        <td>
          <p style="margin:0;font-size:18px;font-weight:600;color:#0A0A0A;">${escapeHtml(d.event_title)}</p>
          <p style="margin:6px 0 0;font-size:14px;color:#1E40AF;font-weight:500;">📅 ${dateLabel}</p>
          ${speaker}
          ${desc}
        </td>
      </tr>
    </table>
    <p style="margin:16px 0 0;font-size:14px;color:#525252;">À très vite&nbsp;!</p>
  `

  return {
    subject: `🎯 Nouveau coaching live — ${d.event_title}`,
    html: layoutHtml({
      preheader: `Coaching live le ${dateLabel}`,
      heroEmoji: '🎯',
      heroTitle: 'Nouveau coaching live programmé',
      heroSubtitle: dateLabel,
      heroImageUrl: d.event_cover_image_url,
      body,
      ctaUrl: `${APP_URL}/app/events`,
      ctaLabel: 'Voir les détails',
    }),
    text: plainText({
      title: 'Nouveau coaching live programmé',
      subtitle: dateLabel,
      body: `${greeting}\n\n${d.event_title}\nDate : ${dateLabel}${
        d.event_speaker_name ? `\nAnimé par : ${d.event_speaker_name}` : ''
      }${shortDesc ? `\n\n${shortDesc}` : ''}`,
      ctaUrl: `${APP_URL}/app/events`,
      ctaLabel: 'Voir les détails',
    }),
  }
}

// =============================================================================
// Template 3 — Rappel J-1
// =============================================================================

function tplEventReminder1Day(raw: Record<string, unknown>) {
  const d = raw as unknown as EventData
  const firstName = (d.member_first_name ?? '').trim() || ''
  const greeting = firstName ? `Salut ${escapeHtml(firstName)},` : 'Salut,'
  const dateLabel = formatFrenchDateTime(d.event_starts_at)
  const shortDesc = truncateDesc(d.event_description, 200)
  const descBlock = shortDesc
    ? `<p style="margin:0 0 16px;font-size:14px;color:#525252;line-height:1.6;">${escapeHtml(shortDesc)}</p>`
    : ''

  const body = `
    <p style="margin:0 0 12px;">${greeting}</p>
    <p style="margin:0 0 16px;">Petit rappel&nbsp;: le coaching live <strong>${escapeHtml(d.event_title)}</strong> a lieu demain.</p>
    ${descBlock}
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background:#FAFAF9;border-radius:12px;padding:16px;margin:16px 0;">
      <tr>
        <td align="center">
          <p style="margin:0;font-size:14px;color:#737373;text-transform:uppercase;letter-spacing:0.1em;">📅 Demain</p>
          <p style="margin:6px 0 0;font-size:18px;font-weight:600;color:#1E40AF;">${dateLabel}</p>
        </td>
      </tr>
    </table>
    <p style="margin:16px 0 0;font-size:14px;color:#525252;">Pense à préparer tes questions à l'avance et à bloquer 90 minutes dans ton agenda.</p>
  `

  return {
    subject: `⏰ C'est demain ! — ${d.event_title}`,
    html: layoutHtml({
      preheader: `Rappel : ${d.event_title} a lieu demain à ${dateLabel}`,
      heroEmoji: '⏰',
      heroTitle: "C'est demain !",
      heroSubtitle: d.event_title,
      heroImageUrl: d.event_cover_image_url,
      body,
      ctaUrl: `${APP_URL}/app/events`,
      ctaLabel: 'Mettre dans mon agenda',
      ctaSecondaryUrl: `${APP_URL}/app/events`,
      ctaSecondaryLabel: "Voir l'événement",
    }),
    text: plainText({
      title: "C'est demain !",
      subtitle: d.event_title,
      body: `${greeting}\n\nPetit rappel : le coaching live "${d.event_title}" a lieu demain.\n📅 ${dateLabel}${shortDesc ? `\n\n${shortDesc}` : ''}\n\nPense à préparer tes questions à l'avance.`,
      ctaUrl: `${APP_URL}/app/events`,
      ctaLabel: 'Mettre dans mon agenda',
    }),
  }
}

// =============================================================================
// Template 4 — Rappel jour J (1h avant)
// =============================================================================

function tplEventReminderToday(raw: Record<string, unknown>) {
  const d = raw as unknown as EventData
  const firstName = (d.member_first_name ?? '').trim() || ''
  const greeting = firstName ? `Salut ${escapeHtml(firstName)},` : 'Salut,'
  const timeLabel = formatFrenchTime(d.event_starts_at)

  const body = `
    <p style="margin:0 0 12px;">${greeting}</p>
    <p style="margin:0 0 16px;">Le coaching live <strong>${escapeHtml(d.event_title)}</strong> commence aujourd'hui à <strong>${timeLabel}</strong>.</p>
    <p style="margin:0 0 16px;">Clique sur le bouton ci-dessous au moment de l'horaire pour rejoindre directement la visio Google Meet.</p>
  `

  const cta = d.event_meet_url
    ? d.event_meet_url
    : `${APP_URL}/app/events`

  return {
    subject: `🔴 LIVE aujourd'hui — ${d.event_title}`,
    html: layoutHtml({
      preheader: `Live aujourd'hui à ${timeLabel}`,
      heroEmoji: '🔴',
      heroTitle: "C'est aujourd'hui !",
      heroSubtitle: `${d.event_title} · ${timeLabel}`,
      heroImageUrl: d.event_cover_image_url,
      body,
      ctaUrl: cta,
      ctaLabel: 'Rejoindre maintenant',
      ctaColor: '#F97316',
      ctaSecondaryUrl: `${APP_URL}/app/events`,
      ctaSecondaryLabel: 'Voir tous les événements',
    }),
    text: plainText({
      title: "C'est aujourd'hui !",
      subtitle: `${d.event_title} · ${timeLabel}`,
      body: `${greeting}\n\nLe coaching live "${d.event_title}" commence aujourd'hui à ${timeLabel}.`,
      ctaUrl: cta,
      ctaLabel: 'Rejoindre maintenant',
    }),
  }
}

// =============================================================================
// Template 5 — Bienvenue + reçu de paiement (envoyé après activation Maketou)
// =============================================================================

interface WelcomeData {
  member_first_name?: string
  /** Nom lisible du plan (ex : "Plan Master", "Plan Progress"). */
  plan_display_name?: string
  /** Prix mensuel calculé en FCFA (ex : 8250 → "8 250 FCFA / mois"). */
  monthly_price_xof?: number
  /** Montant TOTAL effectivement payé pour cette période (ex : 99000). */
  amount_paid_xof?: number
  /** Durée souscrite en mois (6 ou 12). */
  duration_months?: number
  /** Date de fin d'accès au format ISO (current_period_end). */
  period_end_iso?: string
  /** Référence Maketou (cart_id) — utile en cas de litige. */
  reference?: string
}

function tplWelcome(raw: Record<string, unknown>) {
  const d = raw as unknown as WelcomeData
  const firstName = (d.member_first_name ?? '').trim() || ''
  const greeting = firstName ? `Bienvenue ${escapeHtml(firstName)} !` : 'Bienvenue !'

  // ── Récap du paiement (affiché uniquement si on a les infos) ───────
  const periodEndLabel = d.period_end_iso ? formatFrenchDate(d.period_end_iso) : ''
  const recapRows: string[] = []
  if (d.plan_display_name) {
    recapRows.push(
      `<tr><td style="padding:6px 0;color:#737373;font-size:13px;">Plan</td><td align="right" style="padding:6px 0;color:#0A0A0A;font-size:13px;font-weight:600;">${escapeHtml(d.plan_display_name)}</td></tr>`,
    )
  }
  if (d.duration_months) {
    recapRows.push(
      `<tr><td style="padding:6px 0;color:#737373;font-size:13px;">Durée d'accès</td><td align="right" style="padding:6px 0;color:#0A0A0A;font-size:13px;font-weight:600;">${d.duration_months} mois</td></tr>`,
    )
  }
  if (periodEndLabel) {
    recapRows.push(
      `<tr><td style="padding:6px 0;color:#737373;font-size:13px;">Accès valable jusqu'au</td><td align="right" style="padding:6px 0;color:#0A0A0A;font-size:13px;font-weight:600;">${escapeHtml(periodEndLabel)}</td></tr>`,
    )
  }
  if (d.amount_paid_xof) {
    recapRows.push(
      `<tr><td style="padding:10px 0 6px;color:#0A0A0A;font-size:14px;font-weight:600;border-top:1px solid #E5E5E5;">Montant payé</td><td align="right" style="padding:10px 0 6px;color:#1E40AF;font-size:16px;font-weight:700;border-top:1px solid #E5E5E5;">${formatXofForEmail(d.amount_paid_xof)}</td></tr>`,
    )
  }
  if (d.reference) {
    recapRows.push(
      `<tr><td style="padding:6px 0;color:#737373;font-size:11px;">Réf. paiement</td><td align="right" style="padding:6px 0;color:#737373;font-size:11px;font-family:monospace;">${escapeHtml(d.reference)}</td></tr>`,
    )
  }
  const recapBlock = recapRows.length
    ? `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:20px 0;background:#FAFAF9;border:1px solid #E5E5E5;border-radius:12px;padding:16px;">
        ${recapRows.join('\n')}
      </table>
    `
    : ''

  const body = `
    <p style="margin:0 0 12px;">${greeting}</p>
    <p style="margin:0 0 16px;">Ton paiement a bien été reçu et ton accès au Club IA est <strong>activé</strong>.</p>
    ${recapBlock}
    <p style="margin:16px 0 8px;font-weight:600;">Tes premiers pas dans le Club :</p>
    <ul style="margin:0 0 16px;padding-left:18px;color:#525252;font-size:14px;line-height:1.7;">
      <li>Présente-toi dans la communauté pour dire bonjour</li>
      <li>Pose une première question au Coach IA pour tester</li>
      <li>Lance la formation qui correspond le mieux à ton objectif</li>
    </ul>
    <p style="margin:16px 0 0;font-size:13px;color:#737373;">Une question, un souci ? Réponds simplement à cet email — quelqu'un te répondra rapidement.</p>
  `

  const textLines: string[] = [greeting, '', 'Ton paiement a bien été reçu et ton accès au Club IA est activé.']
  if (d.plan_display_name) textLines.push(`Plan : ${d.plan_display_name}`)
  if (d.duration_months) textLines.push(`Durée d'accès : ${d.duration_months} mois`)
  if (periodEndLabel) textLines.push(`Accès valable jusqu'au ${periodEndLabel}`)
  if (d.amount_paid_xof) textLines.push(`Montant payé : ${formatXofForEmail(d.amount_paid_xof)}`)
  if (d.reference) textLines.push(`Réf. paiement : ${d.reference}`)
  textLines.push('', "Premiers pas : présente-toi dans la communauté, teste le Coach IA, lance ta première formation.")

  return {
    subject: '✅ Paiement confirmé — Bienvenue dans Le Club IA',
    html: layoutHtml({
      preheader: 'Ton accès au Club IA est activé. Voici le récap de ton paiement.',
      heroEmoji: '✅',
      heroTitle: 'Paiement confirmé',
      heroSubtitle: 'Ton accès au Club IA est activé',
      body,
      ctaUrl: `${APP_URL}/app/dashboard`,
      ctaLabel: 'Accéder au Club',
    }),
    text: plainText({
      title: 'Paiement confirmé',
      subtitle: 'Ton accès au Club IA est activé',
      body: textLines.join('\n'),
      ctaUrl: `${APP_URL}/app/dashboard`,
      ctaLabel: 'Accéder au Club',
    }),
  }
}

// =============================================================================
// Template 6 — Rappel d'expiration d'abonnement (J-7 / J-1)
// =============================================================================

interface SubscriptionExpiringData {
  member_first_name?: string
  /** "j7" ou "j1" — détermine l'urgence du wording. */
  stage: 'j7' | 'j1'
  /** Nom lisible du plan en cours. */
  plan_display_name?: string
  /** Date de fin d'accès au format ISO. */
  period_end_iso: string
  /** ID du plan recommandé pour la reconduction (semestrial par défaut). */
  renewal_plan_id?: 'semestrial' | 'trimestrial'
}

function tplSubscriptionExpiring(raw: Record<string, unknown>) {
  const d = raw as unknown as SubscriptionExpiringData
  const firstName = (d.member_first_name ?? '').trim() || ''
  const stage = d.stage === 'j1' ? 'j1' : 'j7'
  const endLabel = formatFrenchDate(d.period_end_iso)
  const renewalPlan = d.renewal_plan_id === 'trimestrial' ? 'trimestrial' : 'semestrial'
  const renewalUrl = `${APP_URL}/checkout?plan=${renewalPlan}`

  const isUrgent = stage === 'j1'

  const greeting = firstName ? `Salut ${escapeHtml(firstName)},` : 'Salut,'
  const intro = isUrgent
    ? `<strong>Demain, ton accès au Club s'arrête.</strong>`
    : `Ton accès au Club expire dans <strong>7 jours</strong>.`

  const body = `
    <p style="margin:0 0 12px;">${greeting}</p>
    <p style="margin:0 0 16px;">${intro} Ton abonnement <strong>${escapeHtml(d.plan_display_name ?? 'Le Club IA')}</strong> est valable jusqu'au <strong>${escapeHtml(endLabel)}</strong>.</p>
    <p style="margin:0 0 16px;">Pas de reconduction automatique : si tu veux continuer à profiter des formations, du Coach IA et de la communauté, il faut reconduire manuellement. Ça prend 30 secondes.</p>
    <p style="margin:16px 0 8px;font-weight:600;">Ce que tu perdras si tu ne reconduis pas :</p>
    <ul style="margin:0 0 16px;padding-left:18px;color:#525252;font-size:14px;line-height:1.7;">
      <li>L'accès à toutes les formations IA en français</li>
      <li>Ton Coach IA personnel (30 messages/jour)</li>
      <li>La communauté privée des membres</li>
      <li>La veille IA hebdomadaire et les ressources téléchargeables</li>
    </ul>
    <p style="margin:16px 0 0;font-size:13px;color:#737373;">Une question, un souci ? Réponds simplement à cet email — on regarde ça rapidement.</p>
  `

  const textBody = [
    greeting,
    '',
    isUrgent
      ? `Demain, ton accès au Club s'arrête.`
      : `Ton accès au Club expire dans 7 jours.`,
    `Ton abonnement (${d.plan_display_name ?? 'Le Club IA'}) est valable jusqu'au ${endLabel}.`,
    '',
    "Pas de reconduction automatique : reconduis manuellement en 30 secondes pour ne rien perdre.",
    '',
    `Reconduire : ${renewalUrl}`,
  ].join('\n')

  const subject = isUrgent
    ? '⏰ Demain, tu perds ton accès au Club IA'
    : '⏰ Plus que 7 jours d\'accès au Club IA'

  return {
    subject,
    html: layoutHtml({
      preheader: isUrgent
        ? 'Demain, ton accès au Club s\'arrête. Reconduis maintenant.'
        : 'Ton abonnement expire dans 7 jours. Reconduis sans interruption.',
      heroEmoji: '⏰',
      heroTitle: isUrgent ? 'Demain, c\'est terminé' : 'Plus que 7 jours',
      heroSubtitle: `Accès valable jusqu'au ${endLabel}`,
      body,
      ctaUrl: renewalUrl,
      ctaLabel: isUrgent ? 'Reconduire maintenant' : 'Reconduire mon abonnement',
      ctaColor: isUrgent ? '#F97316' : '#1E40AF',
    }),
    text: plainText({
      title: isUrgent ? 'Demain, c\'est terminé' : 'Plus que 7 jours',
      subtitle: `Accès valable jusqu'au ${endLabel}`,
      body: textBody,
      ctaUrl: renewalUrl,
      ctaLabel: isUrgent ? 'Reconduire maintenant' : 'Reconduire mon abonnement',
    }),
  }
}

// =============================================================================
// Template 7 — Inscription créée, paiement à finaliser
// =============================================================================
//
// Envoyé immédiatement après que l'utilisateur a créé son compte
// (email + mot de passe). Le compte existe mais l'abonnement n'est pas
// encore payé → on l'invite à choisir un plan et payer pour activer
// l'accès au Club.

interface SignupPendingPaymentData {
  member_first_name?: string
}

function tplSignupPendingPayment(raw: Record<string, unknown>) {
  const d = raw as unknown as SignupPendingPaymentData
  const firstName = (d.member_first_name ?? '').trim() || ''
  const greeting = firstName
    ? `Bienvenue ${escapeHtml(firstName)} !`
    : 'Bienvenue !'

  const body = `
    <p style="margin:0 0 12px;">${greeting}</p>
    <p style="margin:0 0 16px;">Ton compte vient d'être créé sur Le Club IA. Il ne te reste qu'une dernière étape : <strong>choisir ton plan et finaliser ton paiement</strong> pour débloquer l'accès complet à la communauté.</p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#FAFAF9;border:1px solid #E5E5E5;border-radius:12px;padding:16px;margin:16px 0;">
      <tr>
        <td>
          <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#0A0A0A;">Ce que tu vas débloquer :</p>
          <ul style="margin:0;padding-left:18px;color:#525252;font-size:14px;line-height:1.7;">
            <li>Toutes les formations IA en français (illimitées)</li>
            <li>Coach IA personnel (30 messages / jour)</li>
            <li>Communauté privée des membres</li>
            <li>Veille IA hebdomadaire et bibliothèque de ressources</li>
            <li>Coaching live mensuel avec experts IA</li>
          </ul>
        </td>
      </tr>
    </table>
    <p style="margin:16px 0 0;font-size:14px;color:#525252;">Deux formules sans reconduction automatique : <strong>100 €</strong> pour 3 mois ou <strong>150 €</strong> pour 6 mois (la plus avantageuse).</p>
    <p style="margin:16px 0 0;font-size:13px;color:#737373;">Une question ? Réponds simplement à cet email — on te répondra rapidement.</p>
  `

  return {
    subject: '🎯 Finalise ton inscription au Club IA',
    html: layoutHtml({
      preheader: 'Ton compte est créé. Choisis ton plan pour débloquer le Club.',
      heroEmoji: '🎯',
      heroTitle: 'Finalise ton inscription',
      heroSubtitle: 'Encore une étape avant de rejoindre le Club',
      body,
      ctaUrl: `${APP_URL}/abonnement`,
      ctaLabel: 'Choisir mon plan',
    }),
    text: plainText({
      title: 'Finalise ton inscription',
      subtitle: 'Encore une étape avant de rejoindre le Club',
      body: `${firstName ? `Bienvenue ${firstName} !` : 'Bienvenue !'}\n\nTon compte vient d'être créé sur Le Club IA. Il ne te reste qu'une dernière étape : choisir ton plan et finaliser ton paiement pour débloquer l'accès complet à la communauté.\n\nFormules : 100 € pour 3 mois ou 150 € pour 6 mois (la plus avantageuse).`,
      ctaUrl: `${APP_URL}/abonnement`,
      ctaLabel: 'Choisir mon plan',
    }),
  }
}

/** Format date FR sans l'heure, pour affichage "valable jusqu'au …" */
function formatFrenchDate(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

/** Format XOF lisible pour les emails ("8 250 FCFA"). */
function formatXofForEmail(amount: number): string {
  return `${amount.toLocaleString('fr-FR').replace(/ | /g, ' ')} FCFA`
}

// =============================================================================
// Helpers
// =============================================================================


function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function escapeAttr(s: string): string {
  return escapeHtml(s)
}

function formatFrenchDateTime(iso: string): string {
  try {
    const d = new Date(iso)
    const date = d.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    const time = d.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    })
    return `${date} à ${time}`
  } catch {
    return iso
  }
}

function formatFrenchTime(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}
