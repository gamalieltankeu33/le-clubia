// Le Club IA — Edge Function "news-agent-manual"
//
// Lancement manuel admin de l'agent IA. Génère un article **récap
// multi-sujets** (3-4 actus marquantes des dernières 48h) au lieu d'un
// article mono-sujet. Avant ça, le manuel produisait UN seul focus
// article ce qui paraissait pauvre quand on publiait plusieurs fois
// par semaine (cf. retour user 2026-05-15).
//
// Différences avec le cron hebdo (`news-agent`) :
//   - Fenêtre : 48h (vs 7j pour le weekly-recap).
//   - Cible sections : 4 (min 3) vs 5 pour weekly.
//   - Catégorie : breaking-news (vs weekly-recap).
//   - Déclenchement : manuel admin (vs cron dimanche 9h UTC).
//
// Les deux pipelines coexistent et peuvent même se chevaucher (le
// manuel peut être lancé un dimanche après que le cron ait tourné).
// L'idempotence n'est PAS gérée côté manuel — l'admin contrôle.
//
// Pipeline :
//   1. Fetch RSS de 12 sources (idem cron, parallèle).
//   2. Filtre fraîcheur AGRESSIF : 48h (vs 7j pour le récap hebdo).
//   3. Cap à 30 candidats max.
//   4. UN appel OpenAI gpt-4o-mini, prompt multi-sujets 3-4 sections.
//   5. Assemblage déterministe du markdown côté serveur.
//   6. INSERT news_articles : category='breaking-news',
//      published_by_admin=true, slug timestampé pour éviter les conflits.
//   7. Email broadcast 'breaking-news' optionnel (body.send_email).
//
// Auth : JWT admin uniquement. Pas de service-role accepté ici (c'est
// un déclenchement manuel par un humain identifié).
//
// Body :
//   {
//     "send_email": boolean,    // Si true, broadcast email aux opt-in
//     "force": boolean          // Toujours true en pratique, conservé
//                                  pour compat future (pas de check 6j)
//   }

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'
import { XMLParser } from 'https://esm.sh/fast-xml-parser@4.4.1'
import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts'

// -----------------------------------------------------------------------------
// Config
// -----------------------------------------------------------------------------

const RSS_SOURCES: string[] = [
  // International EN
  'https://openai.com/blog/rss.xml',
  'https://www.anthropic.com/news/rss',
  'https://blog.google/technology/ai/rss/',
  'https://huggingface.co/blog/feed.xml',
  'https://techcrunch.com/category/artificial-intelligence/feed/',
  'https://www.technologyreview.com/topic/artificial-intelligence/feed',
  'https://mistral.ai/feed.xml',
  'https://www.reddit.com/r/LocalLLaMA/.rss',
  // Francophone (filtre pertinence renforcé : ces sources ne sont pas 100% IA)
  'https://www.numerama.com/feed/',
  'https://www.frandroid.com/feed',
  'https://www.lemonde.fr/pixels/rss_full.xml',
  'https://siecledigital.fr/feed/',
]

const MAX_ITEMS_PER_SOURCE = 8
const FETCH_TIMEOUT_MS = 12_000
const OPENAI_TIMEOUT_MS = 60_000
const FRESHNESS_HOURS = 48
const MAX_CANDIDATES = 30
const MIN_CANDIDATES = 5
const ARTICLE_MAX_TOKENS = 2200
const MODEL = 'gpt-4o-mini'

// Récap multi-sujets : cible 4 sections, minimum 3. Si on a moins de
// 3 actus IA fraîches dans la fenêtre 48h, on remonte une erreur claire
// à l'admin plutôt que de produire un article maigre.
const TARGET_SECTIONS = 4
const MIN_SECTIONS = 3

// CORS via helper partagé — voir _shared/cors.ts

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface FeedItem {
  title: string
  link: string
  description: string
  pubDate: string | null
  image: string | null
  source: string
}

interface RecapSection {
  title: string
  summary: string
  url: string
}

interface MultiTopicArticle {
  title: string
  intro: string
  sections: RecapSection[]
  conclusion: string
}

interface RunResult {
  ok: boolean
  article_id?: string
  article_slug?: string
  article_title?: string
  candidates_count?: number
  email_sent_count?: number
  email_failed_count?: number
  duration_ms?: number
  reason?: string
  suggestion?: string
  error?: string
}

class FatalOpenAIAuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'FatalOpenAIAuthError'
  }
}

// -----------------------------------------------------------------------------
// Entry
// -----------------------------------------------------------------------------

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

  const startedAt = Date.now()

  // ---- Config ----
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const openaiKey = Deno.env.get('OPENAI_API_KEY') ?? ''

  if (!supabaseUrl || !anonKey || !serviceKey) {
    return jsonResponse(500, {
      ok: false,
      error: 'Configuration Supabase manquante côté serveur.',
    })
  }
  if (!openaiKey) {
    return jsonResponse(500, {
      ok: false,
      error: "OPENAI_API_KEY n'est pas configurée côté serveur.",
    })
  }

  // ---- Auth admin (JWT only, pas de service-role accepté) ----
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return jsonResponse(401, { ok: false, error: 'Authorization manquante.' })
  }
  const token = authHeader.replace(/^Bearer\s+/i, '').trim()

  let adminEmail = '?'
  try {
    const sbAuth = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false },
    })
    const {
      data: { user },
      error: userErr,
    } = await sbAuth.auth.getUser(token)
    if (userErr || !user) {
      return jsonResponse(401, { ok: false, error: 'Session invalide.' })
    }
    const sbAdmin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    })
    const { data: profile } = await sbAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()
    if (!profile || profile.role !== 'admin') {
      return jsonResponse(403, {
        ok: false,
        error: 'Accès réservé aux administrateurs.',
      })
    }
    adminEmail = user.email ?? user.id
    console.log(`[news-agent-manual] Auth admin OK : ${adminEmail}`)
  } catch (err) {
    console.error('[news-agent-manual] Auth check failed:', err)
    return jsonResponse(401, {
      ok: false,
      error: "Impossible de vérifier l'authentification.",
    })
  }

  // ---- Body ----
  let body: { send_email?: boolean; force?: boolean } = {}
  try {
    body = await req.json()
  } catch {
    // body JSON optionnel — on tolère l'absence
  }
  const sendEmail = body.send_email === true
  // `force` est conservé pour compat — on ne fait pas de check d'idempotence
  // dans ce pipeline manuel (l'admin contrôle).

  const sb = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  })

  // ---- Rate limit : 5 lancements/jour par admin ----
  // La RPC check_rate_limit utilise auth.uid() côté DB, donc on doit
  // l'appeler avec un client construit sur le JWT user (pas service-role).
  // L'admin reste soumis au rate limit — il consomme OpenAI à chaque
  // lancement, on protège contre une boucle accidentelle ou un abus.
  try {
    const sbUser = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    })
    const { data: rlData, error: rlErr } = await sbUser.rpc(
      'check_rate_limit',
      {
        p_action_type: 'news_manual',
        p_max_count: 5,
        p_window_seconds: 86400,
      },
    )
    if (rlErr) {
      console.warn(
        `[news-agent-manual] rate_limit RPC error → fail open:`,
        rlErr,
      )
    } else {
      const row = (Array.isArray(rlData) ? rlData[0] : rlData) as
        | {
            allowed: boolean
            current_count: number
            retry_after_seconds: number
          }
        | undefined
      if (row && !row.allowed) {
        console.log(
          `[news-agent-manual] Rate limit BLOCKED admin=${adminEmail} count=${row.current_count} retry=${row.retry_after_seconds}s`,
        )
        return jsonResponse(200, {
          ok: false,
          reason: 'Limite quotidienne atteinte (5 lancements de l\'agent IA par jour).',
          suggestion: `Réessaie dans ${Math.ceil(row.retry_after_seconds / 3600)}h.`,
          retry_after_seconds: row.retry_after_seconds,
          duration_ms: Date.now() - startedAt,
        })
      }
    }
  } catch (err) {
    console.warn('[news-agent-manual] rate_limit check failed:', err)
    // fail open : on continue, on ne bloque pas l'admin si le check échoue
  }

  try {
    // ============== 1. Fetch RSS ==============
    console.log(
      `[news-agent-manual] Sources RSS : ${RSS_SOURCES.length} feeds en parallèle`,
    )
    const feedResults = await Promise.allSettled(
      RSS_SOURCES.map((url) => fetchAndParseFeed(url)),
    )

    const allItems: FeedItem[] = []
    let okSources = 0
    for (let i = 0; i < feedResults.length; i++) {
      const r = feedResults[i]
      if (r.status === 'fulfilled') {
        okSources++
        allItems.push(...r.value)
      } else {
        console.warn(
          `[news-agent-manual] Source ${RSS_SOURCES[i]} → ${normalizeError(r.reason)}`,
        )
      }
    }
    console.log(
      `[news-agent-manual] Sources RSS : ${okSources}/${RSS_SOURCES.length} OK, ${allItems.length} articles trouvés`,
    )

    // ============== 2. Filtre fraîcheur 48h ==============
    const cutoff = Date.now() - FRESHNESS_HOURS * 3600 * 1000
    const fresh = allItems.filter((it) => {
      if (!it.pubDate) return false
      const t = new Date(it.pubDate).getTime()
      return Number.isFinite(t) && t >= cutoff
    })
    fresh.sort((a, b) => {
      const ta = a.pubDate ? new Date(a.pubDate).getTime() : 0
      const tb = b.pubDate ? new Date(b.pubDate).getTime() : 0
      return tb - ta
    })
    const candidates = fresh.slice(0, MAX_CANDIDATES)
    console.log(
      `[news-agent-manual] Candidats 48h : ${candidates.length} (cap ${MAX_CANDIDATES})`,
    )

    if (candidates.length < MIN_CANDIDATES) {
      return jsonResponse(200, {
        ok: false,
        reason: `Pas assez d'actus IA récentes dans les ${FRESHNESS_HOURS} dernières heures (${candidates.length} trouvée${candidates.length > 1 ? 's' : ''}, minimum ${MIN_CANDIDATES}).`,
        suggestion:
          'Réessaie demain quand de nouvelles actus seront publiées, ou attends le récap automatique de dimanche.',
        candidates_count: candidates.length,
        duration_ms: Date.now() - startedAt,
      } satisfies RunResult)
    }

    // ============== 3. Génération article multi-sujets ==============
    const today = new Date()
    console.log(
      `[news-agent-manual] OpenAI call : ${candidates.length} candidats → article multi-sujets (cible ${TARGET_SECTIONS})`,
    )
    const article = await generateMultiTopicArticle(candidates, openaiKey, today)
    if (!article) {
      return jsonResponse(200, {
        ok: false,
        error: "L'agent IA n'a pas pu générer d'article (réponse OpenAI invalide ou moins de 3 sujets exploitables).",
        candidates_count: candidates.length,
        duration_ms: Date.now() - startedAt,
      } satisfies RunResult)
    }

    // Assemblage déterministe du markdown final côté serveur (même
    // structure que le récap weekly pour cohérence visuelle).
    const contentMd = assembleMarkdown(article)
    console.log(
      `[news-agent-manual] Article assemblé : ${article.sections.length} sections, ${contentMd.length} chars`,
    )

    // ============== 4. INSERT news_articles ==============
    // Slug timestampé : actu-ia-2026-05-07-14-32 — évite les conflits si
    // l'admin lance l'agent plusieurs fois dans la même journée.
    const slug = `actu-ia-${formatYmdHmUtc(today)}`
    const { data: inserted, error: insertErr } = await sb
      .from('news_articles')
      .insert({
        slug,
        title: article.title,
        content: contentMd,
        cover_image_url: null,
        category: 'breaking-news',
        source_url: null,
        author: 'Agent IA Le Club',
        is_published: true,
        published_at: today.toISOString(),
        published_by_admin: true,
      })
      .select('id, slug, title')
      .single()

    if (insertErr || !inserted) {
      console.error(
        `[news-agent-manual] Insert article → ${insertErr?.message ?? 'no row'}`,
      )
      return jsonResponse(200, {
        ok: false,
        error: `Insertion impossible : ${insertErr?.message ?? 'erreur inconnue'}`,
        duration_ms: Date.now() - startedAt,
      } satisfies RunResult)
    }
    console.log(
      `[news-agent-manual] Article publié : "${inserted.title}" (slug: ${inserted.slug})`,
    )

    // ============== 5. Email broadcast (optionnel) ==============
    let emailSent = 0
    let emailFailed = 0
    if (sendEmail) {
      const { sent, failed } = await broadcastBreakingNews(
        sb,
        supabaseUrl,
        serviceKey,
        {
          slug: inserted.slug as string,
          title: inserted.title as string,
          contentMarkdown: contentMd,
        },
      )
      emailSent = sent
      emailFailed = failed
      console.log(
        `[news-agent-manual] Email envoyé à ${emailSent} membres (échecs: ${emailFailed})`,
      )
    } else {
      console.log('[news-agent-manual] Email broadcast désactivé (send_email=false)')
    }

    const duration = Date.now() - startedAt
    console.log(`[news-agent-manual] Pipeline OK en ${duration}ms`)

    return jsonResponse(200, {
      ok: true,
      article_id: inserted.id as string,
      article_slug: inserted.slug as string,
      article_title: inserted.title as string,
      candidates_count: candidates.length,
      email_sent_count: emailSent,
      email_failed_count: emailFailed,
      duration_ms: duration,
    } satisfies RunResult)
  } catch (err) {
    if (err instanceof FatalOpenAIAuthError) {
      console.error(`[news-agent-manual] FATAL OpenAI 401 : ${err.message}`)
      return jsonResponse(200, {
        ok: false,
        error: `Clé OpenAI invalide ou expirée. ${err.message}`,
        duration_ms: Date.now() - startedAt,
      } satisfies RunResult)
    }
    console.error('[news-agent-manual] Pipeline error:', err)
    return jsonResponse(200, {
      ok: false,
      error: normalizeError(err),
      duration_ms: Date.now() - startedAt,
    } satisfies RunResult)
  }
})

// -----------------------------------------------------------------------------
// Génération de l'article multi-sujets (1 seul appel OpenAI)
// -----------------------------------------------------------------------------

async function generateMultiTopicArticle(
  candidates: FeedItem[],
  apiKey: string,
  today: Date,
): Promise<MultiTopicArticle | null> {
  const system = `Tu es l'agent éditorial du Club IA, communauté francophone d'experts en intelligence artificielle. Tu rédiges un brief multi-sujets en français qui couvre les ${TARGET_SECTIONS} actualités IA les plus marquantes des dernières 48h, dans un ton éducatif, accessible et engageant. Tu utilises le tutoiement systématique. Tu évites le jargon inutile. Tu insistes sur l'impact concret pour les entrepreneurs, créateurs et professionnels francophones.

Sont pertinents : nouveautés modèles IA, fonctionnalités, capacités, releases, levées de fonds, acquisitions, recherche scientifique, cas d'usage concrets, outils nouveaux ou mis à jour.
Ne sont PAS pertinents : actualités marketing pure, événements politiques sans rapport, clickbait, tech non-IA.

Tu réponds UNIQUEMENT en JSON strict avec ce schéma :
{
  "title": "string (titre accrocheur 80 chars max qui reflète qu'il y a plusieurs actus marquantes, ex: \\"4 actus IA à retenir : Gemini, Anthropic, Mistral, Hugging Face\\" ou \\"L'essentiel IA cette semaine\\")",
  "intro": "string (2-3 phrases, plante le décor : ce qui ressort de ces 48h en IA)",
  "sections": [
    {
      "title": "string (titre court accrocheur en français, max 80 caractères)",
      "summary": "string (résumé 3-5 phrases : ce qui se passe, pourquoi c'est important, ce que ça change concrètement pour le lecteur francophone)",
      "url": "string (lien direct vers l'article original)"
    }
  ],
  "conclusion": "string (3-4 phrases qui synthétisent les tendances et donnent UN takeaway actionnable)"
}

Contraintes sur "sections" :
- EXACTEMENT ${TARGET_SECTIONS} sections (ou ${MIN_SECTIONS} minimum si le pool est trop pauvre).
- Mixe les sources autant que possible (au plus 2 articles d'une même source).
- Privilégie les vraies actus IA. Si une source FR (numerama, frandroid, lemonde, siecledigital) propose un article non-IA, IGNORE-LE.
- Le champ "url" reprend EXACTEMENT le lien fourni dans la liste candidate (pas d'invention).`

  const candidatesBlock = candidates
    .map((c, i) => {
      const dateStr = c.pubDate
        ? new Date(c.pubDate).toISOString().slice(0, 16).replace('T', ' ')
        : '?'
      const host = sourceHostname(c.source)
      return `[${i + 1}] ${host} — ${dateStr} UTC
Titre : ${c.title}
URL : ${c.link}
Extrait : ${c.description.slice(0, 400)}`
    })
    .join('\n\n')

  const user = `Date du jour : ${formatFrenchLongDate(today)}

Voici les ${candidates.length} articles IA candidats publiés ces ${FRESHNESS_HOURS} dernières heures :

${candidatesBlock}

Sélectionne les ${TARGET_SECTIONS} actualités les plus marquantes en mixant les sources. Compose le brief au format JSON décrit dans le system prompt.`

  try {
    const res = await callOpenAI(apiKey, {
      max_tokens: ARTICLE_MAX_TOKENS,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      response_format: { type: 'json_object' },
    })
    const raw = res.choices?.[0]?.message?.content ?? ''
    if (!raw) {
      console.error('[news-agent-manual] OpenAI : réponse vide')
      return null
    }
    const parsed = JSON.parse(raw) as Partial<MultiTopicArticle>
    if (
      typeof parsed.title !== 'string' ||
      typeof parsed.intro !== 'string' ||
      typeof parsed.conclusion !== 'string' ||
      !Array.isArray(parsed.sections) ||
      parsed.title.length === 0
    ) {
      console.error(
        '[news-agent-manual] OpenAI : JSON incomplet',
        Object.keys(parsed),
      )
      return null
    }
    // Filtre les sections invalides + cap à TARGET_SECTIONS
    const cleanSections = parsed.sections
      .filter(
        (s): s is RecapSection =>
          !!s && typeof s.title === 'string' &&
          typeof s.summary === 'string' &&
          typeof s.url === 'string' &&
          s.url.length > 0,
      )
      .map((s) => ({
        title: s.title.trim().slice(0, 120),
        summary: s.summary.trim(),
        url: s.url.trim(),
      }))
    if (cleanSections.length < MIN_SECTIONS) {
      console.error(
        `[news-agent-manual] Seulement ${cleanSections.length} sections valides (< ${MIN_SECTIONS}).`,
      )
      return null
    }
    return {
      title: parsed.title.trim().slice(0, 200),
      intro: parsed.intro.trim(),
      sections: cleanSections.slice(0, TARGET_SECTIONS),
      conclusion: parsed.conclusion.trim(),
    }
  } catch (err) {
    if (err instanceof FatalOpenAIAuthError) throw err
    console.error('[news-agent-manual] generateMultiTopicArticle:', normalizeError(err))
    return null
  }
}

// -----------------------------------------------------------------------------
// Assemblage markdown — même structure que le récap weekly pour cohérence
// visuelle (intro, sections numérotées avec source, conclusion, signature).
// -----------------------------------------------------------------------------

function assembleMarkdown(article: MultiTopicArticle): string {
  const parts: string[] = []
  parts.push("## L'essentiel des dernières 48h")
  parts.push('')
  parts.push(article.intro)
  parts.push('')

  article.sections.forEach((section, idx) => {
    parts.push('---')
    parts.push('')
    parts.push(`### ${idx + 1}. ${section.title}`)
    parts.push('')
    parts.push(section.summary)
    parts.push('')
    parts.push(`👉 [Source originale](${section.url})`)
    parts.push('')
  })

  parts.push('---')
  parts.push('')
  parts.push('## À retenir')
  parts.push('')
  parts.push(article.conclusion)
  parts.push('')
  parts.push('---')
  parts.push('')
  parts.push(
    "*Ce brief multi-sujets est généré par l'agent IA du Club à partir des actus IA des dernières 48 h.*",
  )

  return parts.join('\n')
}

// -----------------------------------------------------------------------------
// Email broadcast (template 'breaking-news')
// -----------------------------------------------------------------------------

async function broadcastBreakingNews(
  sb: ReturnType<typeof createClient>,
  supabaseUrl: string,
  serviceKey: string,
  article: { slug: string; title: string; contentMarkdown: string },
): Promise<{ sent: number; failed: number }> {
  // 1. Liste des destinataires : opt-in weekly-recap (= "actus poussées",
  //    le brief utilise volontairement le même opt-in).
  const { data: recipients, error: recipErr } = await sb
    .from('profiles')
    .select('id, email, first_name, email_pref_weekly_recap')
    .eq('email_pref_weekly_recap', true)
  if (recipErr) {
    console.error('[news-agent-manual] Recipients lookup error:', recipErr)
    return { sent: 0, failed: 0 }
  }

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

  // 2. Extrait plain-text 200c pour le preheader / preview.
  const excerpt = stripMarkdownToText(article.contentMarkdown).slice(0, 220)

  const sendUrl = `${supabaseUrl}/functions/v1/send-email`
  let sent = 0
  let failed = 0
  const BATCH = 10

  for (let i = 0; i < targets.length; i += BATCH) {
    const slice = targets.slice(i, i + BATCH)
    const results = await Promise.allSettled(
      slice.map((r) =>
        fetch(sendUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${serviceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'breaking-news',
            to: r.email,
            data: {
              member_first_name: r.first_name ?? '',
              article_slug: article.slug,
              article_title: article.title,
              article_excerpt: excerpt,
            },
          }),
        }).then((res) => res.json()),
      ),
    )
    for (const res of results) {
      if (res.status === 'fulfilled' && (res.value as { ok?: boolean }).ok) {
        sent++
      } else {
        failed++
      }
    }
  }
  return { sent, failed }
}

// -----------------------------------------------------------------------------
// RSS fetch + parse (helpers copiés du news-agent — même comportement)
// -----------------------------------------------------------------------------

async function fetchAndParseFeed(url: string): Promise<FeedItem[]> {
  const ctrl = new AbortController()
  const timeout = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; LeClubIABot/1.0; +https://leclubia.com)',
        Accept: 'application/rss+xml, application/xml, text/xml, */*',
      },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const xml = await res.text()
    return parseFeedXml(xml, url).slice(0, MAX_ITEMS_PER_SOURCE)
  } finally {
    clearTimeout(timeout)
  }
}

function parseFeedXml(xml: string, sourceUrl: string): FeedItem[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    cdataPropName: '#cdata',
    parseTagValue: false,
  })
  const tree = parser.parse(xml)
  if (tree?.rss?.channel) {
    const items = ensureArray<RawRssItem>(tree.rss.channel.item)
    return items.map((it) => normalizeRssItem(it, sourceUrl))
  }
  if (tree?.feed) {
    const items = ensureArray<RawAtomEntry>(tree.feed.entry)
    return items.map((it) => normalizeAtomEntry(it, sourceUrl))
  }
  return []
}

interface RawRssItem {
  title?: string | { '#cdata'?: string }
  link?: string | { '#text'?: string; '@_href'?: string }
  description?: string | { '#cdata'?: string }
  'content:encoded'?: string | { '#cdata'?: string }
  pubDate?: string
  enclosure?: { '@_url'?: string; '@_type'?: string }
  'media:content'?: { '@_url'?: string } | Array<{ '@_url'?: string }>
  'media:thumbnail'?: { '@_url'?: string }
}

interface RawAtomEntry {
  title?: string | { '#text'?: string; '#cdata'?: string }
  link?:
    | string
    | { '@_href'?: string; '@_rel'?: string }
    | Array<{ '@_href'?: string; '@_rel'?: string }>
  summary?: string | { '#text'?: string; '#cdata'?: string }
  content?: string | { '#text'?: string; '#cdata'?: string }
  published?: string
  updated?: string
}

function normalizeRssItem(it: RawRssItem, sourceUrl: string): FeedItem {
  const title = stripHtml(extractText(it.title))
  const link =
    typeof it.link === 'string'
      ? it.link
      : (it.link?.['#text'] ?? it.link?.['@_href'] ?? '')
  const descriptionRaw =
    extractText(it['content:encoded']) || extractText(it.description)
  const description = stripHtml(descriptionRaw).slice(0, 600)
  const pubDate = it.pubDate ?? null

  let image: string | null = null
  if (it.enclosure?.['@_url']) image = it.enclosure['@_url']
  else if (Array.isArray(it['media:content']))
    image = it['media:content'][0]?.['@_url'] ?? null
  else if (it['media:content']?.['@_url']) image = it['media:content']['@_url']
  else if (it['media:thumbnail']?.['@_url'])
    image = it['media:thumbnail']['@_url']

  return { title, link, description, pubDate, image, source: sourceUrl }
}

function normalizeAtomEntry(e: RawAtomEntry, sourceUrl: string): FeedItem {
  const title = stripHtml(extractText(e.title))
  let link = ''
  if (typeof e.link === 'string') link = e.link
  else if (Array.isArray(e.link)) {
    const alt = e.link.find((l) => l['@_rel'] === 'alternate') ?? e.link[0]
    link = alt?.['@_href'] ?? ''
  } else if (e.link?.['@_href']) link = e.link['@_href']

  const descRaw = extractText(e.content) || extractText(e.summary)
  const description = stripHtml(descRaw).slice(0, 600)

  return {
    title,
    link,
    description,
    pubDate: e.published ?? e.updated ?? null,
    image: null,
    source: sourceUrl,
  }
}

// -----------------------------------------------------------------------------
// OpenAI client
// -----------------------------------------------------------------------------

interface OpenAIRequestBody {
  max_tokens: number
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
  response_format?: { type: 'json_object' }
}

interface OpenAIResponse {
  choices?: Array<{ message?: { content?: string } }>
  usage?: { prompt_tokens?: number; completion_tokens?: number }
}

async function callOpenAI(
  apiKey: string,
  body: OpenAIRequestBody,
): Promise<OpenAIResponse> {
  const ctrl = new AbortController()
  const timeout = setTimeout(() => ctrl.abort(), OPENAI_TIMEOUT_MS)
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      signal: ctrl.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: MODEL, ...body }),
    })

    if (res.status === 401) {
      const t = await res.text()
      throw new FatalOpenAIAuthError(
        `Clé OpenAI invalide ou expirée. ${t.slice(0, 200)}`,
      )
    }
    if (res.status === 429) {
      const t = await res.text()
      throw new Error(`OpenAI 429 (rate limit) : ${t.slice(0, 200)}`)
    }
    if (!res.ok) {
      const t = await res.text()
      throw new Error(`OpenAI ${res.status} : ${t.slice(0, 200)}`)
    }
    return (await res.json()) as OpenAIResponse
  } finally {
    clearTimeout(timeout)
  }
}

// -----------------------------------------------------------------------------
// Helpers utilitaires
// -----------------------------------------------------------------------------


function ensureArray<T>(v: T | T[] | undefined): T[] {
  if (v === undefined || v === null) return []
  return Array.isArray(v) ? v : [v]
}

function extractText(v: unknown): string {
  if (!v) return ''
  if (typeof v === 'string') return v
  if (typeof v === 'object' && v !== null) {
    const o = v as Record<string, unknown>
    if (typeof o['#cdata'] === 'string') return o['#cdata']
    if (typeof o['#text'] === 'string') return o['#text']
  }
  return ''
}

function stripHtml(html: string): string {
  if (!html) return ''
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

function stripMarkdownToText(md: string): string {
  if (!md) return ''
  return md
    .replace(/^#{1,6}\s+/gm, '') // headers
    .replace(/\*\*(.+?)\*\*/g, '$1') // bold
    .replace(/\*(.+?)\*/g, '$1') // italic
    .replace(/`([^`]+)`/g, '$1') // inline code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // [text](url) → text
    .replace(/^[-*_]{3,}$/gm, '') // hr
    .replace(/^\s*[-*+]\s+/gm, '') // bullets
    .replace(/\s+/g, ' ')
    .trim()
}

function sourceHostname(url: string): string {
  try {
    const u = new URL(url)
    return u.hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

function formatFrenchLongDate(d: Date): string {
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatYmdHmUtc(d: Date): string {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  const hh = String(d.getUTCHours()).padStart(2, '0')
  const mm = String(d.getUTCMinutes()).padStart(2, '0')
  return `${y}-${m}-${day}-${hh}-${mm}`
}

function normalizeError(e: unknown): string {
  if (e instanceof Error) return e.message
  if (typeof e === 'string') return e
  try {
    return JSON.stringify(e)
  } catch {
    return 'unknown error'
  }
}
