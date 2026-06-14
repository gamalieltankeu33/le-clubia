import { useMemo } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Activity,
  ArrowLeft,
  Heart,
  MessageSquare,
  Star,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/app/admin/insights')({
  component: AdminInsightsPage,
})

interface PostLikeRow {
  post_id: string
  created_at: string
}

interface ReviewRow {
  formation_id: string
  rating: number
  created_at: string
  comment: string | null
}

interface TopPostRow {
  id: string
  content: string
  likes_count: number
  comments_count: number
  created_at: string
  user_id: string
}

interface FormationRow {
  id: string
  title: string
}

interface AuthorRow {
  id: string
  first_name: string | null
  last_name: string | null
}

async function fetchInsightsData() {
  const since = new Date()
  since.setDate(since.getDate() - 30)
  const sinceIso = since.toISOString()

  // En parallèle pour minimiser le TTFB.
  const [likesRes, reviewsRes, topPostsRes, formationsRes] = await Promise.all([
    supabase
      .from('post_likes')
      .select('post_id, created_at')
      .gte('created_at', sinceIso)
      .order('created_at', { ascending: true })
      .limit(5000),
    supabase
      .from('formation_reviews')
      .select('formation_id, rating, created_at, comment')
      .order('created_at', { ascending: false })
      .limit(2000),
    supabase
      .from('posts')
      .select('id, content, likes_count, comments_count, created_at, user_id')
      .order('likes_count', { ascending: false })
      .limit(5),
    supabase.from('formations').select('id, title').limit(500),
  ])

  if (likesRes.error) throw likesRes.error
  if (reviewsRes.error) throw reviewsRes.error
  if (topPostsRes.error) throw topPostsRes.error
  if (formationsRes.error) throw formationsRes.error

  const likes = (likesRes.data ?? []) as PostLikeRow[]
  const reviews = (reviewsRes.data ?? []) as ReviewRow[]
  const topPosts = (topPostsRes.data ?? []) as TopPostRow[]
  const formations = (formationsRes.data ?? []) as FormationRow[]

  // Auteurs des top posts (lazy fetch, max 5).
  let authors: AuthorRow[] = []
  if (topPosts.length > 0) {
    const ids = Array.from(new Set(topPosts.map((p) => p.user_id)))
    // @ts-expect-error - public_profiles_in est une RPC custom non typée
    const { data: authorsData, error: authorsErr } = await supabase.rpc(
      'public_profiles_in',
      { p_ids: ids },
    )
    if (!authorsErr && authorsData) authors = authorsData as AuthorRow[]
  }

  return { likes, reviews, topPosts, formations, authors }
}

function AdminInsightsPage() {
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['admin-insights'],
    queryFn: fetchInsightsData,
    staleTime: 60_000,
  })

  const totals = useMemo(() => {
    if (!data) return null
    const ratings = data.reviews.map((r) => r.rating)
    const avgRating =
      ratings.length === 0
        ? 0
        : ratings.reduce((s, r) => s + r, 0) / ratings.length
    return {
      totalLikes30d: data.likes.length,
      totalReviews: data.reviews.length,
      avgRating: Math.round(avgRating * 10) / 10,
      reviewsWithComment: data.reviews.filter(
        (r) => r.comment && r.comment.trim().length > 0,
      ).length,
    }
  }, [data])

  const likesPerDay = useMemo(() => {
    if (!data) return []
    const m = new Map<string, number>()
    // 30 derniers jours initialisés à 0 (graphe propre même si jours vides).
    for (let i = 29; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      m.set(d.toISOString().slice(0, 10), 0)
    }
    for (const l of data.likes) {
      const day = l.created_at.slice(0, 10)
      if (m.has(day)) m.set(day, (m.get(day) ?? 0) + 1)
    }
    return Array.from(m.entries()).map(([date, count]) => ({
      date,
      count,
      label: formatShortDate(date),
    }))
  }, [data])

  const topPostsChart = useMemo(() => {
    if (!data) return []
    const byId = new Map(data.authors.map((a) => [a.id, a]))
    return data.topPosts.map((p) => {
      const author = byId.get(p.user_id)
      const name =
        [author?.first_name, author?.last_name].filter(Boolean).join(' ') ||
        'Membre'
      return {
        id: p.id,
        author: name,
        likes: p.likes_count,
        preview: htmlToShort(p.content),
      }
    })
  }, [data])

  const topFormationsByRating = useMemo(() => {
    if (!data) return []
    const titleById = new Map(data.formations.map((f) => [f.id, f.title]))
    const acc = new Map<string, { sum: number; count: number }>()
    for (const r of data.reviews) {
      const cur = acc.get(r.formation_id) ?? { sum: 0, count: 0 }
      cur.sum += r.rating
      cur.count += 1
      acc.set(r.formation_id, cur)
    }
    return Array.from(acc.entries())
      .map(([id, { sum, count }]) => ({
        id,
        title: titleById.get(id) ?? '— Inconnue —',
        avg: Math.round((sum / count) * 10) / 10,
        count,
      }))
      .filter((row) => row.count >= 1)
      .sort((a, b) => b.avg - a.avg || b.count - a.count)
      .slice(0, 8)
  }, [data])

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex items-center justify-between gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link to="/app/admin">
            <ArrowLeft className="h-4 w-4" />
            Retour admin
          </Link>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <Activity
            className={cn('h-4 w-4', isFetching && 'animate-spin')}
          />
          Rafraîchir
        </Button>
      </div>

      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mt-6"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
            <Activity className="h-5 w-5" />
          </span>
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Insights engagement
          </h1>
        </div>
        <p className="mt-2 text-base text-[var(--muted-foreground)]">
          Suivre les likes, avis et posts les plus aimés sur les 30 derniers
          jours.
        </p>
      </motion.section>

      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <>
          {/* KPIs */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              icon={Heart}
              label="Likes (30j)"
              value={totals?.totalLikes30d}
              loading={isLoading}
              tone="primary"
            />
            <KpiCard
              icon={Star}
              label="Avis formations"
              value={totals?.totalReviews}
              loading={isLoading}
              tone="warning"
            />
            <KpiCard
              icon={TrendingUp}
              label="Note moyenne"
              value={totals?.avgRating}
              suffix="/5"
              loading={isLoading}
              tone="success"
            />
            <KpiCard
              icon={MessageSquare}
              label="Avis avec commentaire"
              value={totals?.reviewsWithComment}
              loading={isLoading}
              tone="muted"
            />
          </div>

          {/* Likes par jour */}
          <section className="mt-10 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
            <header className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-semibold tracking-tight sm:text-xl">
                  Likes par jour
                </h2>
                <p className="text-sm text-[var(--muted-foreground)]">
                  30 derniers jours.
                </p>
              </div>
            </header>
            <div className="mt-4 h-64 w-full">
              {isLoading ? (
                <ChartSkeleton />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={likesPerDay}
                    margin={{ top: 8, right: 12, left: -12, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border)"
                    />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                      stroke="var(--border)"
                      interval="preserveStartEnd"
                      minTickGap={20}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                      stroke="var(--border)"
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: 12,
                        fontSize: 12,
                      }}
                      labelStyle={{ color: 'var(--foreground)' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="var(--primary)"
                      strokeWidth={2.2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>

          {/* Top posts likés + Top formations par note */}
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
              <h2 className="font-display text-lg font-semibold tracking-tight sm:text-xl">
                Top 5 posts les plus aimés
              </h2>
              <p className="text-sm text-[var(--muted-foreground)]">
                Tout temps confondu.
              </p>
              <div className="mt-4 h-64 w-full">
                {isLoading ? (
                  <ChartSkeleton />
                ) : topPostsChart.length === 0 ? (
                  <EmptyChart label="Aucun post liké pour le moment." />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={topPostsChart}
                      layout="vertical"
                      margin={{ top: 4, right: 12, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--border)"
                      />
                      <XAxis
                        type="number"
                        tick={{
                          fontSize: 11,
                          fill: 'var(--muted-foreground)',
                        }}
                        stroke="var(--border)"
                        allowDecimals={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="author"
                        width={100}
                        tick={{
                          fontSize: 11,
                          fill: 'var(--muted-foreground)',
                        }}
                        stroke="var(--border)"
                      />
                      <Tooltip
                        contentStyle={{
                          background: 'var(--card)',
                          border: '1px solid var(--border)',
                          borderRadius: 12,
                          fontSize: 12,
                        }}
                      />
                      <Bar
                        dataKey="likes"
                        fill="var(--accent)"
                        radius={[0, 6, 6, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Liste textuelle des posts pour contexte */}
              {!isLoading && topPostsChart.length > 0 && (
                <ul className="mt-5 space-y-3 text-sm">
                  {topPostsChart.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-start justify-between gap-3 border-t border-[var(--border)] pt-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-[var(--foreground)]">
                          {p.author}
                        </p>
                        <p className="line-clamp-1 text-xs text-[var(--muted-foreground)]">
                          {p.preview || '(post sans texte)'}
                        </p>
                      </div>
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[var(--emerald)]/12 px-2 py-0.5 text-xs font-semibold text-[var(--emerald-deep)] tabular-nums">
                        <Heart className="h-3 w-3 fill-[var(--emerald)]" />
                        {p.likes}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
              <h2 className="font-display text-lg font-semibold tracking-tight sm:text-xl">
                Formations les mieux notées
              </h2>
              <p className="text-sm text-[var(--muted-foreground)]">
                Top 8 par note moyenne.
              </p>
              <div className="mt-4">
                {isLoading ? (
                  <ChartSkeleton />
                ) : topFormationsByRating.length === 0 ? (
                  <EmptyChart label="Aucun avis enregistré." />
                ) : (
                  <ul className="divide-y divide-[var(--border)]">
                    {topFormationsByRating.map((row) => (
                      <li
                        key={row.id}
                        className="flex items-center justify-between gap-3 py-3"
                      >
                        <span className="line-clamp-1 text-sm font-medium text-[var(--foreground)]">
                          {row.title}
                        </span>
                        <span className="inline-flex shrink-0 items-center gap-2 text-sm">
                          <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/10 px-2 py-0.5 font-semibold text-yellow-700 tabular-nums">
                            <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                            {row.avg.toFixed(1)}
                          </span>
                          <span className="text-xs text-[var(--muted-foreground)] tabular-nums">
                            ({row.count} avis)
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  )
}

interface KpiCardProps {
  icon: LucideIcon
  label: string
  value?: number
  suffix?: string
  loading?: boolean
  tone?: 'primary' | 'warning' | 'success' | 'muted'
}

function KpiCard({ icon: Icon, label, value, suffix, loading, tone = 'primary' }: KpiCardProps) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
      <div className="flex items-center gap-3">
        <span
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-lg',
            tone === 'primary' && 'bg-[var(--primary)]/10 text-[var(--primary)]',
            tone === 'warning' && 'bg-yellow-500/10 text-yellow-700',
            tone === 'success' && 'bg-emerald-500/10 text-emerald-700',
            tone === 'muted' && 'bg-[var(--secondary)] text-[var(--muted-foreground)]',
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
          {label}
        </p>
      </div>
      <p className="mt-3 font-display text-2xl font-bold tracking-tight tabular-nums sm:text-3xl">
        {loading ? (
          <span className="inline-block h-8 w-16 animate-pulse rounded bg-[var(--secondary)]" />
        ) : (
          <>
            {value ?? 0}
            {suffix && (
              <span className="ml-1 text-base font-medium text-[var(--muted-foreground)]">
                {suffix}
              </span>
            )}
          </>
        )}
      </p>
    </div>
  )
}

function ChartSkeleton() {
  return (
    <div className="flex h-full w-full items-end gap-1.5 px-2 pb-2">
      {[40, 65, 50, 80, 30, 60, 45, 90, 35, 70, 55, 75, 40, 65].map((h, i) => (
        <div
          key={i}
          className="flex-1 animate-pulse rounded-t bg-[var(--secondary)]"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  )
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center rounded-xl bg-[var(--secondary)]/30 text-sm text-[var(--muted-foreground)]">
      {label}
    </div>
  )
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="mt-10 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-10 text-center">
      <p className="text-sm text-[var(--muted-foreground)]">
        Impossible de charger les insights. Réessaie.
      </p>
      <Button variant="outline" className="mt-4" onClick={onRetry}>
        Réessayer
      </Button>
    </div>
  )
}

function htmlToShort(html: string): string {
  // Strip ultra-light, juste pour l'aperçu (les insights n'affichent
  // pas le contenu intégral des posts → pas besoin de DOMPurify ici).
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80)
}

function formatShortDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}
