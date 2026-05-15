import { useMemo } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale/fr'
import {
  Activity,
  ArrowRight,
  CreditCard,
  GraduationCap,
  LayoutDashboard,
  Library,
  MessageSquare,
  Newspaper,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Users,
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
import { InitialsAvatar } from '@/components/initials-avatar'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/app/admin/')({
  component: AdminDashboardPage,
})

interface OverviewStats {
  members_total: number
  members_today: number
  members_active_7d: number
  subscriptions_active: number
  mrr_estimate_eur: number
  posts_total: number
  posts_today: number
  formations_published: number
  formations_drafts: number
  resources_published: number
  news_published: number
  // New
  chapters_read_24h: number
  average_completion_rate: number
}

interface LearningEngagement {
  top_formations: { name: string; completions: number }[]
}

interface AdminStatsPayload {
  overview: OverviewStats
  learning_engagement: LearningEngagement
  signups_30d: { date: string; count: number }[]
  interests_distribution: { interest: string; count: number }[]
  top_formations_categories: { category: string; completions: number }[]
  recent_signups: {
    id: string
    first_name: string | null
    last_name: string | null
    email: string
    created_at: string
    avatar_url: string | null
  }[]
  recent_posts: {
    id: string
    content_preview: string
    author_name: string
    created_at: string
  }[]
  top_active_members: {
    id: string
    name: string
    posts_count: number
    comments_count: number
    total_activity: number
  }[]
  inactive_members: {
    id: string
    first_name: string | null
    last_name: string | null
    email: string
    last_active_at: string | null
    plan: string
  }[]
  generated_at: string
}

async function fetchAdminStats(): Promise<AdminStatsPayload> {
  const { data, error } = await supabase.functions.invoke('admin-stats', {
    body: {},
  })
  if (error) {
    const ctx = (error as { context?: Response }).context
    if (ctx && typeof ctx.json === 'function') {
      try {
        const j = await ctx.json()
        if (j?.error) throw new Error(j.error)
      } catch {
        // ignore
      }
    }
    throw new Error(error.message || 'Erreur lors du fetch des stats.')
  }
  if (!data) throw new Error('Réponse vide.')
  return data as AdminStatsPayload
}

function AdminDashboardPage() {
  const query = useQuery({
    queryKey: ['admin-stats'],
    queryFn: fetchAdminStats,
    staleTime: 60_000,
  })

  const { overview, inactive_members } =
    (query.data as AdminStatsPayload) || {}

  const today = useMemo(
    () =>
      new Date().toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
    [],
  )

  const generatedDistance = query.data
    ? formatDistanceToNow(new Date(query.data.generated_at), {
        addSuffix: true,
        locale: fr,
      })
    : null

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 lg:py-14">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-wrap items-start justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/15 text-[var(--accent)]">
              <LayoutDashboard className="h-5 w-5" />
            </span>
            <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
              Dashboard administrateur
            </h1>
          </div>
          <p className="mt-2 text-[var(--muted-foreground)] first-letter:capitalize">
            {today} — vue d'ensemble du Club.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {generatedDistance && (
            <span className="text-xs text-[var(--muted-foreground)]">
              Mis à jour {generatedDistance}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => query.refetch()}
            disabled={query.isFetching}
          >
            <RefreshCw
              className={cn('h-4 w-4', query.isFetching && 'animate-spin')}
            />
            Actualiser
          </Button>
        </div>
      </motion.div>

      {query.isError && (
        <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {(query.error as Error)?.message ?? 'Impossible de charger les stats.'}
        </div>
      )}

      {/* KPIs */}
      <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={Users}
          label="Membres totaux"
          value={overview?.members_total}
          delta={overview?.members_today}
          deltaLabel="aujourd'hui"
          loading={query.isLoading}
        />
        <KpiCard
          icon={Activity}
          label="Membres actifs (7j)"
          value={overview?.members_active_7d}
          loading={query.isLoading}
        />
        <KpiCard
          icon={CreditCard}
          label="Abonnements actifs"
          value={overview?.subscriptions_active}
          subtext={
            overview
              ? `MRR estimé : ${overview.mrr_estimate_eur} €`
              : undefined
          }
          loading={query.isLoading}
        />
        <KpiCard
          icon={MessageSquare}
          label="Posts publiés"
          value={overview?.posts_total}
          subtext={
            overview
              ? `${overview.posts_today} aujourd'hui`
              : undefined
          }
          loading={query.isLoading}
        />
        <KpiCard
          icon={GraduationCap}
          label="Taux de complétion"
          value={overview?.average_completion_rate}
          unit="%"
          subtext="Moyenne sur toutes les formations"
          loading={query.isLoading}
        />
        <KpiCard
          icon={Activity}
          label="Lecture (24h)"
          value={overview?.chapters_read_24h}
          subtext="Chapitres validés aujourd'hui"
          loading={query.isLoading}
        />
      </section>

      {/* Charts */}
      <section className="mt-10 grid gap-6 lg:grid-cols-2">
        <ChartCard title="Inscriptions sur 30 jours" loading={query.isLoading}>
          {query.data && (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart
                data={query.data.signups_30d}
                margin={{ top: 5, right: 10, bottom: 0, left: -20 }}
              >
                <CartesianGrid
                  vertical={false}
                  stroke="var(--border)"
                  strokeDasharray="3 3"
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                  tickFormatter={(d: string) => d.slice(5)}
                  interval="preserveStartEnd"
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                />
                <Tooltip content={<ChartTooltip />} />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard
          title="Centres d'intérêt des membres"
          loading={query.isLoading}
        >
          {query.data && query.data.interests_distribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={query.data.interests_distribution}
                layout="vertical"
                margin={{ top: 5, right: 10, bottom: 0, left: 60 }}
              >
                <CartesianGrid
                  horizontal={false}
                  stroke="var(--border)"
                  strokeDasharray="3 3"
                />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                />
                <YAxis
                  type="category"
                  dataKey="interest"
                  tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                  width={120}
                />
                <Tooltip content={<ChartTooltip />} />
                <Bar
                  dataKey="count"
                  fill="var(--accent)"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : query.data ? (
            <p className="py-12 text-center text-sm text-[var(--muted-foreground)]">
              Pas encore de données.
            </p>
          ) : null}
        </ChartCard>

        <ChartCard
          title="Top 5 Formations (Engagement)"
          loading={query.isLoading}
        >
          {query.data?.learning_engagement?.top_formations && query.data.learning_engagement.top_formations.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={query.data.learning_engagement.top_formations}
                layout="vertical"
                margin={{ top: 5, right: 10, bottom: 0, left: 60 }}
              >
                <CartesianGrid
                  horizontal={false}
                  stroke="var(--border)"
                  strokeDasharray="3 3"
                />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                  width={120}
                />
                <Tooltip content={<ChartTooltip />} />
                <Bar
                  dataKey="completions"
                  fill="var(--primary)"
                  radius={[0, 4, 4, 0]}
                  name="Chapitres lus"
                />
              </BarChart>
            </ResponsiveContainer>
          ) : query.data ? (
            <p className="py-12 text-center text-sm text-[var(--muted-foreground)]">
              Pas encore de données de lecture.
            </p>
          ) : null}
        </ChartCard>
      </section>

      {/* Activité récente */}
      <section className="mt-10 grid gap-6 lg:grid-cols-3">
        <ActivityCard
          title="Derniers inscrits"
          loading={query.isLoading}
          empty={!query.data?.recent_signups.length}
          emptyText="Pas encore d'inscriptions."
        >
          <ul className="space-y-3">
            {query.data?.recent_signups.map((s) => {
              const name =
                [s.first_name, s.last_name].filter(Boolean).join(' ').trim() ||
                s.email
              return (
                <li key={s.id} className="flex items-center gap-3">
                  <InitialsAvatar
                    firstName={s.first_name}
                    lastName={s.last_name}
                    email={s.email}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{name}</p>
                    <p className="truncate text-xs text-[var(--muted-foreground)]">
                      {formatDistanceToNow(new Date(s.created_at), {
                        addSuffix: true,
                        locale: fr,
                      })}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        </ActivityCard>

        <ActivityCard
          title="Posts récents"
          loading={query.isLoading}
          empty={!query.data?.recent_posts.length}
          emptyText="Aucun post pour l'instant."
        >
          <ul className="space-y-4">
            {query.data?.recent_posts.map((p) => (
              <li key={p.id} className="border-b border-[var(--border)] pb-3 last:border-0 last:pb-0">
                <p className="line-clamp-2 text-sm">{p.content_preview}</p>
                <p className="mt-1.5 text-xs text-[var(--muted-foreground)]">
                  {p.author_name} ·{' '}
                  {formatDistanceToNow(new Date(p.created_at), {
                    addSuffix: true,
                    locale: fr,
                  })}
                </p>
              </li>
            ))}
          </ul>
        </ActivityCard>

        <ActivityCard
          title="Top contributeurs"
          loading={query.isLoading}
          empty={!query.data?.top_active_members.length}
          emptyText="Pas encore d'activité."
        >
          <ul className="space-y-3">
            {query.data?.top_active_members.map((m, i) => (
              <li key={m.id} className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--secondary)] text-xs font-semibold text-[var(--muted-foreground)]">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{m.name}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {m.posts_count} post{m.posts_count > 1 ? 's' : ''} ·{' '}
                    {m.comments_count} commentaire
                    {m.comments_count > 1 ? 's' : ''}
                  </p>
                </div>
                <span className="text-xs font-semibold text-[var(--emerald-deep)]">
                  {m.total_activity}
                </span>
              </li>
            ))}
          </ul>
        </ActivityCard>
      </section>

      {/* Membres à réengager */}
      <section className="mt-10">
        <ActivityCard
          title="Membres inactifs (Risque de départ)"
          loading={query.isLoading}
          empty={!inactive_members?.length}
          emptyText="Tous tes membres sont actifs ! 🎉"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {inactive_members?.map((m) => {
              const name = [m.first_name, m.last_name].filter(Boolean).join(' ') || 'Membre'
              return (
                <div key={m.id} className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--secondary)]/10 p-3">
                  <InitialsAvatar
                    firstName={m.first_name}
                    lastName={m.last_name}
                    email={m.email}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{name}</p>
                    <p className="truncate text-[10px] text-[var(--muted-foreground)] uppercase font-semibold tracking-wider">
                      Plan {m.plan}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-[var(--muted-foreground)] uppercase font-bold">
                      Inactif depuis
                    </p>
                    <p className="text-xs font-semibold text-red-500">
                      {m.last_active_at 
                        ? formatDistanceToNow(new Date(m.last_active_at), { locale: fr })
                        : 'Jamais connecté'}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </ActivityCard>
      </section>

      {/* Raccourcis admin */}
      <section className="mt-12">
        <h2 className="font-display text-xl font-semibold tracking-tight">
          Raccourcis admin
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Shortcut
            to="/app/admin/formations"
            icon={GraduationCap}
            title="Formations"
            description={
              query.data
                ? `${query.data.overview.formations_published} publiées · ${query.data.overview.formations_drafts} brouillons`
                : 'Catalogue & chapitres'
            }
          />
          <Shortcut
            to="/app/admin/ressources"
            icon={Library}
            title="Ressources"
            description={
              query.data
                ? `${query.data.overview.resources_published} publiées`
                : 'Prompts, templates, guides'
            }
          />
          <Shortcut
            to="/app/admin/members"
            icon={Users}
            title="Membres"
            description={
              query.data
                ? `${query.data.overview.members_total} au total`
                : 'Gestion des comptes'
            }
          />
          <Shortcut
            to="/app/admin/community"
            icon={MessageSquare}
            title="Communauté"
            description={
              query.data
                ? `${query.data.overview.posts_total} posts`
                : 'Modération'
            }
          />
          <Shortcut
            to="/app/admin/actualites"
            icon={Newspaper}
            title="Actualités"
            description={
              query.data
                ? `${query.data.overview.news_published} publiées`
                : 'Gestion du flux IA'
            }
          />
          <Shortcut
            to="/app/admin/insights"
            icon={Activity}
            title="Insights engagement"
            description="Likes, avis & posts populaires"
          />
          <Shortcut
            to="/app/admin/audit-log"
            icon={ShieldCheck}
            title="Audit log"
            description="Trace des actions admin"
          />
          <ShortcutDisabled
            icon={Sparkles}
            title="Coach IA"
            description="Conversations & quotas"
          />
        </div>
      </section>
    </div>
  )
}

function KpiCard({
  icon: Icon,
  label,
  value,
  unit,
  delta,
  deltaLabel,
  subtext,
  loading,
}: {
  icon: LucideIcon
  label: string
  value?: number
  unit?: string
  delta?: number
  deltaLabel?: string
  subtext?: string
  loading?: boolean
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
          <Icon className="h-4 w-4" />
        </span>
        <span className="text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
          {label}
        </span>
      </div>
      <div className="mt-4">
        {loading ? (
          <div className="h-8 w-20 animate-pulse rounded bg-[var(--secondary)]" />
        ) : (
          <p className="font-display text-3xl font-semibold tabular-nums">
            {(value ?? 0).toLocaleString('fr-FR')}
            {unit && <span className="ml-1 text-xl text-[var(--muted-foreground)]">{unit}</span>}
          </p>
        )}
        {!loading && (delta !== undefined || subtext) && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
            {delta !== undefined && (
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                  delta > 0
                    ? 'bg-emerald-100 text-emerald-700'
                    : delta < 0
                      ? 'bg-red-100 text-red-700'
                      : 'bg-[var(--secondary)] text-[var(--muted-foreground)]',
                )}
              >
                {delta > 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : delta < 0 ? (
                  <TrendingDown className="h-3 w-3" />
                ) : null}
                {delta > 0 ? `+${delta}` : delta}
              </span>
            )}
            <span>{subtext || deltaLabel}</span>
          </p>
        )}
      </div>
    </div>
  )
}

function ChartCard({
  title,
  loading,
  children,
}: {
  title: string
  loading?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
      <h3 className="font-display text-base font-semibold tracking-tight">
        {title}
      </h3>
      <div className="mt-4">
        {loading ? (
          <div className="h-[240px] animate-pulse rounded-xl bg-[var(--secondary)]" />
        ) : (
          children
        )}
      </div>
    </div>
  )
}

function ActivityCard({
  title,
  loading,
  empty,
  emptyText,
  children,
}: {
  title: string
  loading?: boolean
  empty?: boolean
  emptyText: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
      <h3 className="font-display text-base font-semibold tracking-tight">
        {title}
      </h3>
      <div className="mt-4">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-10 w-full animate-pulse rounded bg-[var(--secondary)]"
              />
            ))}
          </div>
        ) : empty ? (
          <p className="py-4 text-sm text-[var(--muted-foreground)]">
            {emptyText}
          </p>
        ) : (
          children
        )}
      </div>
    </div>
  )
}

function Shortcut({
  to,
  icon: Icon,
  title,
  description,
}: {
  to: string
  icon: LucideIcon
  title: string
  description: string
}) {
  return (
    <Link
      to={to}
      className="group flex items-start gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 transition-all hover:border-[var(--primary)]/30 hover:shadow-md"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-base font-semibold">{title}</h3>
          <ArrowRight className="h-4 w-4 -translate-x-1 text-[var(--muted-foreground)] opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
        </div>
        <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
          {description}
        </p>
      </div>
    </Link>
  )
}

function ShortcutDisabled({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon
  title: string
  description: string
}) {
  return (
    <div className="flex cursor-not-allowed items-start gap-4 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-5 opacity-60">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--secondary)] text-[var(--muted-foreground)]">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-display text-base font-semibold">{title}</h3>
          <span className="rounded-full bg-[var(--secondary)] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
            Bientôt
          </span>
        </div>
        <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
          {description}
        </p>
      </div>
    </div>
  )
}

function ChartTooltip(props: {
  active?: boolean
  payload?: Array<{ value: number; name?: string; payload?: unknown }>
  label?: string | number
}) {
  if (!props.active || !props.payload?.length) return null
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-xs shadow-lg">
      <p className="font-medium">{props.label}</p>
      <p className="text-[var(--muted-foreground)]">
        {props.payload[0].value}
      </p>
    </div>
  )
}

