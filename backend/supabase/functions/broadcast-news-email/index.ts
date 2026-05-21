// Le Club IA — Edge Function "broadcast-news-email"
//
// Envoie par email un article d'actualité à tous les membres actifs
// (opt-in email_pref_weekly_recap). Appelée par un trigger DB sur
// news_articles dès qu'un article passe en is_published=true (quelle
// que soit la façon de publier : formulaire admin, toggle, ou agent).
//
// Idempotente : on ne broadcaste qu'une seule fois par article grâce à
// la colonne news_articles.email_broadcast_at. Si elle est déjà
// renseignée, on ne renvoie rien (évite tout double-email).
//
// verify_jwt = false : appelée par pg_net avec le service_role en Bearer,
// vérifié en interne. Jamais exposée utilement au navigateur.

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

interface Body {
  article_id?: string
}

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return json({ ok: false, error: 'Method not allowed' }, 405)
  }

  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const auth = (req.headers.get('Authorization') ?? '')
    .replace(/^Bearer\s+/i, '')
    .trim()
  if (!serviceKey || auth !== serviceKey.trim()) {
    return json({ ok: false, error: 'Service-role requis.' }, 401)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
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

  // 1. Récupère l'article + garde idempotence.
  const { data: article, error: artErr } = await sb
    .from('news_articles')
    .select('id, slug, title, content, category, is_published, email_broadcast_at')
    .eq('id', body.article_id)
    .maybeSingle()

  if (artErr || !article) {
    console.error('[broadcast-news-email] article introuvable', artErr)
    return json({ ok: false, error: 'Article introuvable.' }, 404)
  }
  if (!article.is_published) {
    return json({ ok: true, skipped: 'not_published' })
  }
  if (article.email_broadcast_at) {
    return json({ ok: true, skipped: 'already_sent' })
  }

  // 2. Marque IMMÉDIATEMENT comme broadcasté (anti double-envoi en cas
  //    de double déclenchement du trigger / retries pg_net).
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

  // 4. Envoi par lots de 10 (rate-limit Resend), template breaking-news.
  const excerpt = stripMarkdownToText(String(article.content ?? '')).slice(0, 220)
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
      if (res.status === 'fulfilled' && (res.value as { ok?: boolean }).ok) sent++
      else failed++
    }
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

/** Markdown → texte brut grossier (pour l'extrait email). */
function stripMarkdownToText(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`~-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
