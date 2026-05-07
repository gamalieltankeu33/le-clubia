// Le Club IA — Edge Function "news-agent" (V2 — récap hebdomadaire)
//
// Génère UN SEUL article récap hebdomadaire publié chaque dimanche à 09h
// UTC par le cron pg_cron. Plus de déclenchement manuel.
//
// Pipeline V2 :
//   1. Fetch RSS de 12 sources (8 internationales + 4 françaises).
//   2. Garde uniquement les articles publiés dans les 7 derniers jours.
//   3. Idempotence : si un récap a déjà été publié dans les 6 derniers
//      jours, on skip (le cron retry ne dupliquera pas).
//   4. Un seul appel OpenAI (gpt-4o-mini) :
//        Input  : tous les articles candidats (titre, source, lien, extrait)
//        Output : JSON { intro, sections[5]={title,summary,url}, conclusion }
//   5. Assemblage déterministe du markdown final côté serveur.
//   6. INSERT dans news_articles : category='weekly-recap', source_url=null.
//
// Variable d'env requise : OPENAI_API_KEY
// Auth : admin via JWT, OU service-role (cron Supabase)

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'
import { XMLParser } from 'https://esm.sh/fast-xml-parser@4.4.1'

// -----------------------------------------------------------------------------
// Configuration
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
const SUMMARY_MAX_TOKENS = 2200
const RECAP_LOOKBACK_DAYS = 6 // idempotence : pas 2 récaps dans la même fenêtre
const FRESHNESS_DAYS = 7
const MIN_SECTIONS = 3 // si on a moins de 3 articles, on ne publie pas
const TARGET_SECTIONS = 5
const MODEL = 'gpt-4o-mini'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

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

interface RecapJson {
  intro: string
  sections: RecapSection[]
  conclusion: string
}

interface RunStats {
  ok: boolean
  started_at: string
  finished_at: string
  sources_checked: number
  candidates_count: number
  recap_published: boolean
  recap_slug: string | null
  recap_title: string | null
  reason?: string
  errors: string[]
}

class FatalOpenAIAuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'FatalOpenAIAuthError'
  }
}

// -----------------------------------------------------------------------------
// Entry point
// -----------------------------------------------------------------------------

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return jsonResponse(405, { error: 'Méthode non autorisée.' })
  }

  // ============== Phase 1 : config + auth ==============
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const openaiKey = Deno.env.get('OPENAI_API_KEY') ?? ''

  if (!supabaseUrl || !anonKey || !serviceKey) {
    console.error('[news-agent] Config Supabase manquante')
    return jsonResponse(200, {
      ok: false,
      error: 'Configuration Supabase manquante côté serveur.',
      hint: 'Définis SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY.',
    })
  }
  if (!openaiKey) {
    console.error('[news-agent] OPENAI_API_KEY manquante')
    return jsonResponse(200, {
      ok: false,
      error: "OPENAI_API_KEY n'est pas configurée.",
      hint: 'Dashboard → Edge Functions → Secrets. Format attendu : sk-…',
    })
  }

  // ---- Auth : 2 modes acceptés ----
  // Mode A (service-role) : le cron pg_cron OU un curl avec la
  //   service_role_key (test admin). Bypass des checks user/admin.
  // Mode B (JWT user) : un admin connecté qui appelle la function
  //   depuis le frontend. On vérifie la session puis le rôle admin.
  //
  // Robustesse : on extrait le token de l'header (regex Bearer
  // case-insensitive + trim) et on compare aux env vars trimmées
  // pour éviter les pièges classiques (newline en fin de secret,
  // espaces parasites dans l'header).
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return jsonResponse(401, { error: 'Authorization manquante.' })
  }
  const token = authHeader.replace(/^Bearer\s+/i, '').trim()

  // Si la service_role_key n'est pas définie côté env, on désactive
  // silencieusement le mode service-role (sécurité — pas de match accidentel).
  const isServiceRole =
    serviceKey.length > 0 && token === serviceKey.trim()

  if (isServiceRole) {
    console.log('[news-agent] Auth : service-role (cron / système)')
  } else {
    try {
      const sbAuth = createClient(supabaseUrl, anonKey, {
        auth: { persistSession: false },
      })
      const {
        data: { user },
        error: userErr,
      } = await sbAuth.auth.getUser(token)
      if (userErr || !user) {
        console.error(
          '[news-agent] Auth : JWT user invalide.',
          userErr?.message ?? 'no user',
        )
        return jsonResponse(401, { error: 'Session invalide.' })
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
        return jsonResponse(403, { error: 'Accès admin requis.' })
      }
      console.log(
        `[news-agent] Auth : admin user ${user.email ?? user.id}`,
      )
    } catch (err) {
      console.error('[news-agent] Auth check failed:', err)
      return jsonResponse(401, {
        error: "Impossible de vérifier l'authentification.",
      })
    }
  }

  const sb = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  })

  // ============== Phase 2 : pipeline hebdo ==============
  const startedAt = new Date()
  const stats: RunStats = {
    ok: true,
    started_at: startedAt.toISOString(),
    finished_at: '',
    sources_checked: 0,
    candidates_count: 0,
    recap_published: false,
    recap_slug: null,
    recap_title: null,
    errors: [],
  }
  console.log(
    `[news-agent] Début pipeline hebdo — modèle ${MODEL}, ${RSS_SOURCES.length} sources`,
  )

  try {
    // 0. Idempotence : un récap hebdo a-t-il déjà été publié récemment ?
    const lookbackIso = new Date(
      Date.now() - RECAP_LOOKBACK_DAYS * 86400 * 1000,
    ).toISOString()
    const { data: existingRecap } = await sb
      .from('news_articles')
      .select('id, slug, published_at')
      .eq('category', 'weekly-recap')
      .gte('published_at', lookbackIso)
      .order('published_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (existingRecap) {
      stats.reason = `Récap déjà publié dans les ${RECAP_LOOKBACK_DAYS} derniers jours (slug ${existingRecap.slug}).`
      console.log(`[news-agent] ${stats.reason} — skip.`)
      stats.finished_at = new Date().toISOString()
      return jsonResponse(200, stats)
    }

    // 1. Fetch RSS sources en parallèle
    const feedResults = await Promise.allSettled(
      RSS_SOURCES.map((url) => fetchAndParseFeed(url)),
    )

    const allItems: FeedItem[] = []
    for (let i = 0; i < feedResults.length; i++) {
      stats.sources_checked++
      const r = feedResults[i]
      if (r.status === 'fulfilled') {
        console.log(
          `[news-agent] Source ${RSS_SOURCES[i]} : ${r.value.length} articles`,
        )
        allItems.push(...r.value)
      } else {
        const errMsg = normalizeError(r.reason)
        console.error(`[news-agent] Source ${RSS_SOURCES[i]} → ${errMsg}`)
        stats.errors.push(`RSS ${RSS_SOURCES[i]} → ${errMsg}`)
      }
    }

    // 2. Filtre fraîcheur (7 jours)
    const cutoff = Date.now() - FRESHNESS_DAYS * 86400 * 1000
    const fresh = allItems.filter((it) => {
      if (!it.pubDate) return false
      const t = new Date(it.pubDate).getTime()
      return Number.isFinite(t) && t >= cutoff
    })

    // Tri date desc + cap pour limiter la taille du prompt OpenAI
    fresh.sort((a, b) => {
      const ta = a.pubDate ? new Date(a.pubDate).getTime() : 0
      const tb = b.pubDate ? new Date(b.pubDate).getTime() : 0
      return tb - ta
    })
    const candidates = fresh.slice(0, 60)
    stats.candidates_count = candidates.length

    if (candidates.length < MIN_SECTIONS) {
      stats.reason = `Pas assez d'articles frais cette semaine (${candidates.length} < ${MIN_SECTIONS}).`
      console.log(`[news-agent] ${stats.reason}`)
      stats.finished_at = new Date().toISOString()
      return jsonResponse(200, stats)
    }

    // 3. Génération du récap (un seul call OpenAI)
    const today = new Date()
    const recap = await generateWeeklyRecap(candidates, openaiKey, today)
    if (!recap) {
      stats.reason = 'Échec de la génération du récap (réponse OpenAI invalide).'
      stats.errors.push(stats.reason)
      stats.finished_at = new Date().toISOString()
      return jsonResponse(200, stats)
    }

    // 4. Assemblage markdown + insert
    const titleFr = `Les ${recap.sections.length} actualités IA marquantes de la semaine — ${formatFrenchLongDate(today)}`
    const slugDate = formatYmdUtc(today)
    const slug = `actu-ia-semaine-${slugDate}`
    const contentMd = assembleMarkdown(recap)

    const { error: insertErr } = await sb.from('news_articles').insert({
      slug,
      title: titleFr.slice(0, 200),
      content: contentMd,
      cover_image_url: null,
      category: 'weekly-recap',
      source_url: null,
      author: 'Agent IA Le Club',
      is_published: true,
      published_at: today.toISOString(),
    })
    if (insertErr) {
      // Cas très rare : conflit slug si 2 runs simultanés
      console.error(`[news-agent] Insert recap → ${insertErr.message}`)
      stats.errors.push(`Insert recap → ${insertErr.message}`)
      stats.finished_at = new Date().toISOString()
      return jsonResponse(200, stats)
    }

    stats.recap_published = true
    stats.recap_slug = slug
    stats.recap_title = titleFr
    console.log(`[news-agent] Récap publié : "${titleFr}" (${slug})`)

    // 6. Envoi email à tous les membres actifs ayant l'opt-in weekly-recap.
    //    On bat les emails par lots de 10 pour respecter le rate-limit Resend
    //    (~10 req/sec). Un échec individuel n'arrête pas le batch.
    try {
      const { data: recipients, error: recipErr } = await sb
        .from('profiles')
        .select('id, email, first_name, email_pref_weekly_recap')
        .eq('email_pref_weekly_recap', true)
      if (recipErr) {
        console.error('[news-agent] Lookup recipients error:', recipErr)
        stats.errors.push(`Recipients lookup → ${recipErr.message}`)
      } else {
        // Filtre : uniquement les actifs (subscriptions.status active/trialing)
        const ids = (recipients ?? []).map((r) => r.id)
        let activeIds = new Set<string>()
        if (ids.length > 0) {
          const { data: subs } = await sb
            .from('subscriptions')
            .select('user_id, status')
            .in('user_id', ids)
            .in('status', ['active', 'trialing'])
          activeIds = new Set((subs ?? []).map((s) => s.user_id))
        }
        const targets = (recipients ?? []).filter(
          (r) => activeIds.has(r.id) && r.email,
        )

        const sendUrl = `${supabaseUrl}/functions/v1/send-email`
        const articlesSummary = recap.sections.map((s) => ({
          title: s.title,
          summary: s.summary,
        }))
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
                  type: 'weekly-recap',
                  to: r.email,
                  data: {
                    member_first_name: r.first_name ?? '',
                    article_slug: slug,
                    article_title: titleFr,
                    articles_summary: articlesSummary,
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

        console.log(
          `[news-agent] Récap envoyé à ${sent}/${targets.length} membres (échecs: ${failed})`,
        )
        if (failed > 0) {
          stats.errors.push(`${failed} email(s) en échec`)
        }
      }
    } catch (mailErr) {
      console.error('[news-agent] Email broadcast error:', mailErr)
      stats.errors.push(`Email broadcast → ${normalizeError(mailErr)}`)
    }
  } catch (err) {
    if (err instanceof FatalOpenAIAuthError) {
      console.error(`[news-agent] FATAL ${err.message}`)
      stats.errors.push(`Fatal OpenAI 401 : ${err.message}`)
      stats.ok = false
    } else {
      console.error('[news-agent] Pipeline error:', err)
      stats.errors.push(`Pipeline → ${normalizeError(err)}`)
    }
  }

  stats.finished_at = new Date().toISOString()
  console.log(
    `[news-agent] Fin pipeline — published=${stats.recap_published}, candidates=${stats.candidates_count}, errors=${stats.errors.length}`,
  )
  return jsonResponse(200, stats)
})

// -----------------------------------------------------------------------------
// RSS fetch + parse
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
// Génération du récap (un seul call OpenAI)
// -----------------------------------------------------------------------------

async function generateWeeklyRecap(
  candidates: FeedItem[],
  apiKey: string,
  today: Date,
): Promise<RecapJson | null> {
  const system = `Tu es l'agent éditorial du Club IA, communauté francophone d'experts en intelligence artificielle. Tu rédiges UN article récap hebdomadaire en français qui présente les actualités IA les plus marquantes de la semaine, dans un ton éducatif, accessible et engageant. Tu utilises le tutoiement systématique. Tu évites le jargon inutile. Tu insistes sur l'impact concret pour les entrepreneurs, créateurs et professionnels francophones.

Sont pertinents : nouveautés modèles IA, fonctionnalités, capacités, releases, levées de fonds, acquisitions, recherche scientifique, cas d'usage concrets, outils nouveaux ou mis à jour.
Ne sont PAS pertinents : actualités marketing pure, événements politiques sans rapport, clickbait, tech non-IA.

Tu réponds UNIQUEMENT en JSON strict avec ce schéma :
{
  "intro": "string (2-3 phrases, plante le décor de la semaine en termes d'évolution IA)",
  "sections": [
    {
      "title": "string (titre court accrocheur en français, max 80 caractères)",
      "summary": "string (résumé 3-5 phrases en français : ce qui se passe, pourquoi c'est important, ce que ça change concrètement)",
      "url": "string (lien direct vers l'article original)"
    }
  ],
  "conclusion": "string (3-4 phrases qui synthétisent les tendances de la semaine et donnent un takeaway concret pour la communauté)"
}

Contraintes sur "sections" :
- EXACTEMENT ${TARGET_SECTIONS} sections (ou ${MIN_SECTIONS} minimum si le pool est trop pauvre).
- Mixe les sources autant que possible (au plus 2 articles d'une même source).
- Privilégie les vraies actus IA. Si une source FR (numerama, frandroid, lemonde, siecledigital) propose un article non-IA, IGNORE-LE.
- Le champ "url" reprend EXACTEMENT le lien fourni dans la liste candidate (pas d'invention).`

  const candidatesBlock = candidates
    .map((c, i) => {
      const dateStr = c.pubDate
        ? new Date(c.pubDate).toISOString().slice(0, 10)
        : '?'
      const host = sourceHostname(c.source)
      return `[${i + 1}] ${host} — ${dateStr}
Titre : ${c.title}
URL : ${c.link}
Extrait : ${c.description.slice(0, 400)}`
    })
    .join('\n\n')

  const user = `Date du récap : ${formatFrenchLongDate(today)}

Voici les ${candidates.length} articles candidats publiés ces 7 derniers jours :

${candidatesBlock}

Sélectionne les ${TARGET_SECTIONS} actualités les plus marquantes en mixant les sources. Compose le récap au format JSON décrit dans le system prompt.`

  try {
    const res = await callOpenAI(apiKey, {
      max_tokens: SUMMARY_MAX_TOKENS,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      response_format: { type: 'json_object' },
    })
    const raw = res.choices?.[0]?.message?.content ?? ''
    if (!raw) {
      console.error('[news-agent] Recap — réponse OpenAI vide')
      return null
    }
    const parsed = JSON.parse(raw) as Partial<RecapJson>
    if (
      !parsed.intro ||
      !parsed.conclusion ||
      !Array.isArray(parsed.sections)
    ) {
      console.error('[news-agent] Recap JSON incomplet:', parsed)
      return null
    }
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
        `[news-agent] Recap : seulement ${cleanSections.length} sections valides (< ${MIN_SECTIONS}).`,
      )
      return null
    }
    return {
      intro: parsed.intro.trim(),
      sections: cleanSections.slice(0, TARGET_SECTIONS),
      conclusion: parsed.conclusion.trim(),
    }
  } catch (err) {
    if (err instanceof FatalOpenAIAuthError) throw err
    console.error('[news-agent] generateWeeklyRecap error:', normalizeError(err))
    return null
  }
}

function assembleMarkdown(recap: RecapJson): string {
  const parts: string[] = []
  parts.push('## Cette semaine dans l\'IA')
  parts.push('')
  parts.push(recap.intro)
  parts.push('')

  recap.sections.forEach((section, idx) => {
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
  parts.push('## À retenir cette semaine')
  parts.push('')
  parts.push(recap.conclusion)
  parts.push('')
  parts.push('---')
  parts.push('')
  parts.push(
    "*Ce récap est généré automatiquement chaque dimanche par l'agent IA du Club. Suis Le Club IA pour rester à jour des actualités IA en français.*",
  )

  return parts.join('\n')
}

// -----------------------------------------------------------------------------
// Appel OpenAI
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
// Helpers
// -----------------------------------------------------------------------------

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

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

function sourceHostname(url: string): string {
  try {
    const u = new URL(url)
    return u.hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

function formatFrenchLongDate(d: Date): string {
  // "11 mai 2026" — utilise Intl en français
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatYmdUtc(d: Date): string {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
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
