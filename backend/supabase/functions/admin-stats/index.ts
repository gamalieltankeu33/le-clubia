// Le Club IA — Edge Function "admin-stats"
// Retourne un agrégat statistique pour le dashboard admin.
// Vérifie l'auth + role admin, puis exécute les requêtes via service role.

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'
import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts'

// Conversion XOF → EUR pour l'affichage. ~656 XOF = 1 EUR (taux fixe
// de la zone CFA Ouest). Approximatif, suffisant pour le dashboard MRR.
const XOF_PER_EUR = 656

serve(async (req) => {
  const preflight = handleCorsPreflight(req)
  if (preflight) return preflight
  const headers = getCorsHeaders(req)

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    if (!supabaseUrl || !anonKey || !serviceKey) {
      return jsonResponse(500, {
        error: 'Configuration Supabase manquante côté serveur.',
      }, headers)
    }

    // 1. Auth via le JWT du caller
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return jsonResponse(401, { error: 'Non authentifié.' }, headers)
    }
    const sbUser = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    })
    const {
      data: { user },
      error: userErr,
    } = await sbUser.auth.getUser()
    if (userErr || !user) {
      return jsonResponse(401, { error: 'Session invalide.' }, headers)
    }

    // 2. Vérification du rôle admin
    const sb = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    })
    const { data: profile } = await sb
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()
    if (!profile || profile.role !== 'admin') {
      return jsonResponse(403, { error: 'Accès réservé aux administrateurs.' }, headers)
    }

    // 3. Requêtes en parallèle
    const todayStart = new Date()
    todayStart.setUTCHours(0, 0, 0, 0)
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400 * 1000)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400 * 1000)

    const todayIso = todayStart.toISOString()
    const sevenDaysAgoIso = sevenDaysAgo.toISOString()
    const thirtyDaysAgoIso = thirtyDaysAgo.toISOString()

    const [
      membersTotalRes,
      membersTodayRes,
      membersActive7dRes,
      subsActiveRes,
      postsTotalRes,
      postsTodayRes,
      formationsPubRes,
      formationsDraftRes,
      resourcesPubRes,
      newsPubRes,
      signups30dRes,
      profilesInterestsRes,
      completionsRes,
      formationsForCatRes,
      recentSignupsRes,
      recentPostsRes,
      activityPostsRes,
      activityCommentsRes,
      mrrRes,
      learningEngagementRes,
      inactiveMembersRes,
    ] = await Promise.all([
      sb.from('profiles').select('*', { count: 'exact', head: true }),
      sb
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', todayIso),
      sb
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('last_active_at', sevenDaysAgoIso),
      sb
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .in('status', ['active', 'trialing']),
      sb.from('posts').select('*', { count: 'exact', head: true }),
      sb
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', todayIso),
      sb
        .from('formations')
        .select('*', { count: 'exact', head: true })
        .eq('is_published', true),
      sb
        .from('formations')
        .select('*', { count: 'exact', head: true })
        .eq('is_published', false),
      sb
        .from('resources')
        .select('*', { count: 'exact', head: true })
        .eq('is_published', true),
      sb
        .from('news_articles')
        .select('*', { count: 'exact', head: true })
        .eq('is_published', true),
      // signups par jour (30j) — on agrège côté JS
      sb
        .from('profiles')
        .select('created_at')
        .gte('created_at', thirtyDaysAgoIso),
      // intérêts (on agrège côté JS sur les arrays text[])
      sb.from('profiles').select('interests'),
      // completions par formation_id
      sb
        .from('user_formation_progress')
        .select('formation_id')
        .eq('completed', true),
      // formations pour résolution catégorie
      sb.from('formations').select('id, category'),
      // 5 derniers inscrits
      sb
        .from('profiles')
        .select('id, first_name, last_name, email, created_at, avatar_url')
        .order('created_at', { ascending: false })
        .limit(5),
      // 3 derniers posts
      sb
        .from('posts')
        .select('id, content, created_at, user_id')
        .order('created_at', { ascending: false })
        .limit(3),
      // top contributeurs : on agrège côté JS posts.user_id
      sb.from('posts').select('user_id'),
      sb.from('post_comments').select('user_id'),
      // MRR exact basé sur le JOIN subscriptions × pricing_plans (cf. 0023).
      // La RPC compute_active_mrr_xof retourne {total_mrr_xof, breakdown}.
      sb.rpc('compute_active_mrr_xof'),
      // Engagement pédagogique (cf. 0029)
      sb.rpc('get_admin_learning_engagement'),
      // Membres inactifs (cf. 0031)
      sb.rpc('get_admin_inactive_members'),
    ])

    const membersTotal = membersTotalRes.count ?? 0
    const membersToday = membersTodayRes.count ?? 0
    const membersActive7d = membersActive7dRes.count ?? 0
    const subsActive = subsActiveRes.count ?? 0

    // MRR : la RPC retourne un set de 1 ligne (cf. migration 0023).
    interface MrrRow {
      total_mrr_xof: number
      active_count: number
      semestrial_count: number
      annual_count: number
      legacy_count: number
    }
    const mrrRow = (Array.isArray(mrrRes.data) ? mrrRes.data[0] : null) as
      | MrrRow
      | null
    const mrrXof = Number(mrrRow?.total_mrr_xof ?? 0)
    const mrrEur = Math.round(mrrXof / XOF_PER_EUR)
    const mrrBreakdown = {
      semestrial: Number(mrrRow?.semestrial_count ?? 0),
      annual: Number(mrrRow?.annual_count ?? 0),
      legacy_annual: Number(mrrRow?.legacy_count ?? 0),
    }
    const postsTotal = postsTotalRes.count ?? 0
    const postsToday = postsTodayRes.count ?? 0
    const formationsPub = formationsPubRes.count ?? 0
    const formationsDraft = formationsDraftRes.count ?? 0
    const resourcesPub = resourcesPubRes.count ?? 0
    const newsPub = newsPubRes.count ?? 0

    // signups_30d : 1 entrée par jour, count = 0 si rien
    const dayCounts = new Map<string, number>()
    for (let i = 0; i < 30; i++) {
      const d = new Date(thirtyDaysAgo.getTime() + i * 86400 * 1000)
      const key = ymd(d)
      dayCounts.set(key, 0)
    }
    for (const row of signups30dRes.data ?? []) {
      const key = ymd(new Date(row.created_at as string))
      if (dayCounts.has(key)) {
        dayCounts.set(key, (dayCounts.get(key) ?? 0) + 1)
      }
    }
    const signups_30d = Array.from(dayCounts.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // interests_distribution
    const interestCounts = new Map<string, number>()
    for (const p of profilesInterestsRes.data ?? []) {
      const list = (p.interests as string[] | null) ?? []
      for (const i of list) {
        interestCounts.set(i, (interestCounts.get(i) ?? 0) + 1)
      }
    }
    const interests_distribution = Array.from(interestCounts.entries())
      .map(([interest, count]) => ({ interest, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)

    // top_formations_categories
    const formationCategoryById = new Map<string, string>()
    for (const f of formationsForCatRes.data ?? []) {
      formationCategoryById.set(f.id as string, f.category as string)
    }
    const completionsByCategory = new Map<string, number>()
    for (const c of completionsRes.data ?? []) {
      const cat = formationCategoryById.get(c.formation_id as string)
      if (!cat) continue
      completionsByCategory.set(cat, (completionsByCategory.get(cat) ?? 0) + 1)
    }
    const top_formations_categories = Array.from(
      completionsByCategory.entries(),
    )
      .map(([category, completions]) => ({ category, completions }))
      .sort((a, b) => b.completions - a.completions)
      .slice(0, 8)

    // recent_signups : tel quel
    const recent_signups = recentSignupsRes.data ?? []

    // recent_posts : on enrichit avec le nom de l'auteur
    const recentPostsRaw = recentPostsRes.data ?? []
    const authorIds = recentPostsRaw.map((p) => p.user_id as string)
    const authorMap = new Map<string, { name: string }>()
    if (authorIds.length > 0) {
      const { data: authors } = await sb
        .from('profiles')
        .select('id, first_name, last_name, email')
        .in('id', authorIds)
      for (const a of authors ?? []) {
        const name =
          [a.first_name, a.last_name].filter(Boolean).join(' ').trim() ||
          (a.email as string)
        authorMap.set(a.id as string, { name })
      }
    }
    const recent_posts = recentPostsRaw.map((p) => ({
      id: p.id,
      content_preview:
        ((p.content as string) ?? '').slice(0, 140) +
        (((p.content as string) ?? '').length > 140 ? '…' : ''),
      author_name: authorMap.get(p.user_id as string)?.name ?? 'Membre',
      created_at: p.created_at,
    }))

    // top_active_members : agrégation posts + commentaires
    const activity = new Map<
      string,
      { posts: number; comments: number }
    >()
    for (const row of activityPostsRes.data ?? []) {
      const k = row.user_id as string
      const cur = activity.get(k) ?? { posts: 0, comments: 0 }
      cur.posts += 1
      activity.set(k, cur)
    }
    for (const row of activityCommentsRes.data ?? []) {
      const k = row.user_id as string
      const cur = activity.get(k) ?? { posts: 0, comments: 0 }
      cur.comments += 1
      activity.set(k, cur)
    }
    const sortedActivity = Array.from(activity.entries())
      .map(([id, v]) => ({ id, ...v, total: v.posts + v.comments }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)

    let top_active_members: Array<{
      id: string
      name: string
      posts_count: number
      comments_count: number
      total_activity: number
    }> = []
    if (sortedActivity.length > 0) {
      const ids = sortedActivity.map((a) => a.id)
      const { data: people } = await sb
        .from('profiles')
        .select('id, first_name, last_name, email')
        .in('id', ids)
      const peopleMap = new Map<string, string>()
      for (const p of people ?? []) {
        const name =
          [p.first_name, p.last_name].filter(Boolean).join(' ').trim() ||
          (p.email as string)
        peopleMap.set(p.id as string, name)
      }
      top_active_members = sortedActivity.map((a) => ({
        id: a.id,
        name: peopleMap.get(a.id) ?? 'Membre',
        posts_count: a.posts,
        comments_count: a.comments,
        total_activity: a.total,
      }))
    }

    // Réponse
    return jsonResponse(200, {
      overview: {
        members_total: membersTotal,
        members_today: membersToday,
        members_active_7d: membersActive7d,
        subscriptions_active: subsActive,
        mrr_estimate_eur: mrrEur,
        posts_total: postsTotal,
        posts_today: postsToday,
        formations_published: formationsPub,
        formations_drafts: formationsDraft,
        resources_published: resourcesPub,
        news_published: newsPub,
        // New Learning Engagement KPIs
        chapters_read_24h: learningEngagementRes.data?.chapters_read_24h ?? 0,
        average_completion_rate: learningEngagementRes.data?.average_completion_rate ?? 0,
      },
      learning_engagement: {
        top_formations: learningEngagementRes.data?.top_formations ?? [],
      },
      signups_30d,
      interests_distribution,
      top_formations_categories,
      recent_signups,
      recent_posts,
      top_active_members,
      inactive_members: inactiveMembersRes.data ?? [],
      generated_at: new Date().toISOString(),
    }, headers)
  } catch (err) {
    console.error('admin-stats error:', err)
    return jsonResponse(500, { error: 'Erreur interne.' }, headers)
  }
})

function ymd(d: Date): string {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function jsonResponse(status: number, body: unknown, headers: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' },
  })
}
