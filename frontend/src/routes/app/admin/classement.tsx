import { useMemo, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  ChevronLeft,
  ChevronRight,
  Crown,
  ExternalLink,
  Hash,
  Loader2,
  RotateCcw,
  Trophy,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { AvatarDisplay } from '@/components/avatar-display'
import { useAuthStore } from '@/stores/auth-store'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/app/admin/classement')({
  component: AdminLeaderboardPage,
})

// =============================================================================
// Types
// =============================================================================

interface LeaderboardRow {
  user_id: string
  first_name: string | null
  last_name: string | null
  full_name: string | null
  avatar_url: string | null
  is_verified: boolean
  raw_points: number
  posts_count: number
  comments_count: number
  likes_received: number
  chapters_completed: number
  active_days: number
  engagement_score: number
  regularity_score: number
  reciprocity_score: number
  final_score: number
  rank: number
}

interface GlobalStats {
  active_members: number
  total_posts: number
  total_comments: number
  total_likes_received: number
  formations_completed: number
  total_active_days: number
  top_hashtag: string
}

interface Winner {
  id: string
  user_id: string
  month_year: string
  prize_amount: number
  prize_currency: string
  notes: string | null
  selected_at: string
}

interface DailyActivity {
  day: string
  points: number
  actions: number
}

interface TopPost {
  id: string
  content: string
  likes_count: number
  comments_count: number
  created_at: string
}

// =============================================================================
// Helpers de date
// =============================================================================

function currentMonthYear(): string {
  const d = new Date()
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

function shiftMonth(monthYear: string, delta: -1 | 1): string {
  const [y, m] = monthYear.split('-').map(Number)
  const d = new Date(Date.UTC(y, m - 1 + delta, 1))
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

function monthLabel(monthYear: string): string {
  const [y, m] = monthYear.split('-').map(Number)
  const d = new Date(Date.UTC(y, m - 1, 1))
  return d.toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

// =============================================================================
// Fetchers
// =============================================================================

async function fetchLeaderboard(monthYear: string): Promise<LeaderboardRow[]> {
  // @ts-expect-error - RPC custom non typée
  const { data, error } = await supabase.rpc('get_monthly_leaderboard', {
    p_month_year: monthYear,
  })
  if (error) throw error
  return (data ?? []) as LeaderboardRow[]
}

async function fetchGlobalStats(monthYear: string): Promise<GlobalStats | null> {
  // @ts-expect-error - RPC custom non typée
  const { data, error } = await supabase.rpc('get_monthly_global_stats', {
    p_month_year: monthYear,
  })
  if (error) throw error
  const row = (Array.isArray(data) ? data[0] : data) as GlobalStats | undefined
  return row ?? null
}

async function fetchWinner(monthYear: string): Promise<Winner | null> {
  const { data, error } = await supabase
    .from('monthly_winners')
    .select('*')
    .eq('month_year', monthYear)
    .maybeSingle<Winner>()
  if (error) return null
  return data ?? null
}

async function fetchDailyActivity(
  userId: string,
  monthYear: string,
): Promise<DailyActivity[]> {
  // @ts-expect-error - RPC custom non typée
  const { data, error } = await supabase.rpc('get_member_daily_activity', {
    p_user_id: userId,
    p_month_year: monthYear,
  })
  if (error) throw error
  return (data ?? []) as DailyActivity[]
}

async function fetchTopPosts(
  userId: string,
  monthYear: string,
): Promise<TopPost[]> {
  const [y, m] = monthYear.split('-').map(Number)
  const start = new Date(Date.UTC(y, m - 1, 1)).toISOString()
  const end = new Date(Date.UTC(y, m, 1)).toISOString()
  const { data, error } = await supabase
    .from('posts')
    .select('id, content, likes_count, comments_count, created_at')
    .eq('user_id', userId)
    .gte('created_at', start)
    .lt('created_at', end)
    .order('likes_count', { ascending: false })
    .order('comments_count', { ascending: false })
    .limit(3)
    .returns<TopPost[]>()
  if (error) throw error
  return data ?? []
}

// =============================================================================
// Page
// =============================================================================

function AdminLeaderboardPage() {
  const queryClient = useQueryClient()
  const adminUser = useAuthStore((s) => s.user)
  const [monthYear, setMonthYear] = useState<string>(currentMonthYear())
  const [detailRow, setDetailRow] = useState<LeaderboardRow | null>(null)
  const [confirmRow, setConfirmRow] = useState<LeaderboardRow | null>(null)

  const isCurrentMonth = monthYear === currentMonthYear()

  const leaderboardQuery = useQuery({
    queryKey: ['admin-leaderboard', monthYear],
    queryFn: () => fetchLeaderboard(monthYear),
    staleTime: 30_000,
  })

  const statsQuery = useQuery({
    queryKey: ['admin-global-stats', monthYear],
    queryFn: () => fetchGlobalStats(monthYear),
    staleTime: 30_000,
  })

  const winnerQuery = useQuery({
    queryKey: ['admin-winner', monthYear],
    queryFn: () => fetchWinner(monthYear),
    staleTime: 30_000,
  })

  const selectMutation = useMutation({
    mutationFn: async ({
      userId,
      notes,
    }: {
      userId: string
      notes: string
    }) => {
      const { error } = await supabase
        .from('monthly_winners')
        .upsert(
          {
            user_id: userId,
            month_year: monthYear,
            notes: notes.trim() || null,
            selected_by: adminUser?.id ?? null,
            selected_at: new Date().toISOString(),
          },
          { onConflict: 'month_year' },
        )
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Gagnant sélectionné !')
      queryClient.invalidateQueries({ queryKey: ['admin-winner', monthYear] })
      queryClient.invalidateQueries({ queryKey: ['monthly-winner'] })
      setConfirmRow(null)
    },
    onError: (err) => {
      console.error(err)
      toast.error("Impossible d'enregistrer le gagnant.")
    },
  })

  const rows = leaderboardQuery.data ?? []
  const winnerId = winnerQuery.data?.user_id ?? null
  const stats = statsQuery.data

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:py-14">
      {/* Header avec sélecteur de mois */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-wrap items-start justify-between gap-4"
      >
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/15 text-[var(--accent)]">
            <Trophy className="h-5 w-5" />
          </span>
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl">
              Classement du mois
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-[var(--muted-foreground)] sm:text-base">
              Identifie le membre le plus impactant. Score = points × engagement
              × régularité × réciprocité.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] p-1">
            <button
              type="button"
              onClick={() => setMonthYear((m) => shiftMonth(m, -1))}
              aria-label="Mois précédent"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-[140px] text-center text-sm font-medium capitalize">
              {monthLabel(monthYear)}
            </span>
            <button
              type="button"
              onClick={() => setMonthYear((m) => shiftMonth(m, 1))}
              aria-label="Mois suivant"
              disabled={isCurrentMonth}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--secondary)] hover:text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          {!isCurrentMonth && (
            <button
              type="button"
              onClick={() => setMonthYear(currentMonthYear())}
              className="inline-flex items-center gap-1 text-xs text-[var(--primary)] transition-colors hover:underline"
            >
              <RotateCcw className="h-3 w-3" />
              Revenir au mois courant
            </button>
          )}
        </div>
      </motion.div>

      {/* Encart gagnant déjà sélectionné */}
      {winnerQuery.data && (
        <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/5 p-4">
          <Crown className="h-5 w-5 shrink-0 text-[var(--accent)]" />
          <p className="text-sm text-[var(--foreground)]">
            <strong>Gagnant sélectionné</strong> · prime{' '}
            {winnerQuery.data.prize_amount.toLocaleString('fr-FR')}{' '}
            {winnerQuery.data.prize_currency} ·{' '}
            {new Date(winnerQuery.data.selected_at).toLocaleDateString('fr-FR')}
            {winnerQuery.data.notes && (
              <>
                {' · '}
                <span className="italic">"{winnerQuery.data.notes}"</span>
              </>
            )}
          </p>
        </div>
      )}

      {/* KPIs globales */}
      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Membres actifs"
          value={stats?.active_members}
          loading={statsQuery.isLoading}
        />
        <KpiCard
          label="Posts publiés"
          value={stats?.total_posts}
          loading={statsQuery.isLoading}
        />
        <KpiCard
          label="Commentaires"
          value={stats?.total_comments}
          loading={statsQuery.isLoading}
        />
        <KpiCard
          label="Formations terminées"
          value={stats?.formations_completed}
          loading={statsQuery.isLoading}
        />
      </section>
      {stats && stats.top_hashtag !== 'aucun' && (
        <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-[var(--muted-foreground)]">
          <Hash className="h-3.5 w-3.5" />
          Top hashtag du mois :{' '}
          <span className="font-semibold text-[var(--primary)]">
            #{stats.top_hashtag}
          </span>
        </p>
      )}

      {/* Tableau classement */}
      <div className="mt-8">
        {leaderboardQuery.isLoading ? (
          <div className="flex items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--card)] p-12">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--muted-foreground)]" />
          </div>
        ) : leaderboardQuery.isError ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-12 text-center text-sm text-[var(--muted-foreground)]">
            Impossible de charger le classement.
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-12 text-center">
            <p className="text-sm text-[var(--muted-foreground)]">
              Aucune activité pour {monthLabel(monthYear)}.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
            <ul className="divide-y divide-[var(--border)]">
              {rows.map((row) => (
                <LeaderboardRowItem
                  key={row.user_id}
                  row={row}
                  isWinner={winnerId === row.user_id}
                  onSelect={() => setConfirmRow(row)}
                  onDetail={() => setDetailRow(row)}
                />
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Modale détail membre */}
      {detailRow && (
        <MemberDetailModal
          row={detailRow}
          monthYear={monthYear}
          onClose={() => setDetailRow(null)}
        />
      )}

      {/* Modale confirmation sélection gagnant */}
      {confirmRow && (
        <ConfirmWinnerModal
          row={confirmRow}
          monthYearLabel={monthLabel(monthYear)}
          existingWinner={winnerQuery.data}
          onCancel={() => setConfirmRow(null)}
          onConfirm={(notes) =>
            selectMutation.mutate({ userId: confirmRow.user_id, notes })
          }
          submitting={selectMutation.isPending}
        />
      )}
    </div>
  )
}

// =============================================================================
// Sub-components
// =============================================================================

function KpiCard({
  label,
  value,
  loading,
}: {
  label: string
  value: number | undefined
  loading: boolean
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
        {label}
      </p>
      <p className="mt-2 font-display text-3xl font-bold tabular-nums">
        {loading ? (
          <Loader2 className="h-6 w-6 animate-spin text-[var(--muted-foreground)]" />
        ) : (
          (value ?? 0).toLocaleString('fr-FR')
        )}
      </p>
    </div>
  )
}

function LeaderboardRowItem({
  row,
  isWinner,
  onSelect,
  onDetail,
}: {
  row: LeaderboardRow
  isWinner: boolean
  onSelect: () => void
  onDetail: () => void
}) {
  const fullName =
    row.full_name?.trim() ||
    [row.first_name, row.last_name].filter(Boolean).join(' ') ||
    'Membre'

  return (
    <li
      className={cn(
        'flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:gap-5 sm:px-5',
        isWinner && 'bg-[var(--accent)]/5',
      )}
    >
      <RankBadge rank={Number(row.rank)} />
      <AvatarDisplay
        avatarUrl={row.avatar_url}
        firstName={row.first_name}
        lastName={row.last_name}
        email={null}
        isVerified={row.is_verified}
        isMonthlyWinner={isWinner}
        size="md"
      />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium">{fullName}</p>
          {isWinner && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--or)]/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--or-deep)] ring-1 ring-[var(--or)]/30">
              <Crown className="h-3 w-3" />
              Gagnant
            </span>
          )}
        </div>

        {/* Détail compact */}
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
          📝 {row.posts_count} · 💬 {row.comments_count} · ❤️{' '}
          {row.likes_received} · 🎓 {row.chapters_completed}
        </p>

        {/* Multiplicateurs en chips */}
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Chip
            label="Engagement"
            value={`×${Number(row.engagement_score).toFixed(1)}`}
            tone="primary"
          />
          <Chip
            label="Régularité"
            value={`${row.active_days}/30j`}
            tone="emerald"
          />
          <Chip
            label="Réciprocité"
            value={`×${Number(row.reciprocity_score).toFixed(1)}`}
            tone="violet"
          />
        </div>
      </div>

      {/* Score final + actions */}
      <div className="flex shrink-0 items-center gap-3 sm:gap-5">
        <div className="text-right">
          <p className="font-display text-2xl font-bold tabular-nums">
            {Math.round(Number(row.final_score)).toLocaleString('fr-FR')}
          </p>
          <p className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">
            score final
          </p>
        </div>
        <div className="flex flex-col gap-1.5 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onDetail}
          >
            Détail
          </Button>
          <Button
            type="button"
            variant={isWinner ? 'outline' : 'default'}
            size="sm"
            onClick={onSelect}
          >
            {isWinner ? 'Re-sélectionner' : 'Sélectionner'}
          </Button>
        </div>
      </div>
    </li>
  )
}

function Chip({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: 'primary' | 'emerald' | 'violet'
}) {
  const toneClass = {
    primary: 'bg-[var(--primary)]/10 text-[var(--primary)]',
    emerald: 'bg-emerald-100 text-emerald-700',
    violet: 'bg-violet-100 text-violet-700',
  }[tone]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium',
        toneClass,
      )}
    >
      <span className="opacity-70">{label}</span>
      <span className="font-semibold tabular-nums">{value}</span>
    </span>
  )
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FCD34D] text-base">
        🏆
      </span>
    )
  if (rank === 2)
    return (
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#D1D5DB] text-base">
        🥈
      </span>
    )
  if (rank === 3)
    return (
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FDBA74] text-base">
        🥉
      </span>
    )
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--secondary)] text-sm font-semibold tabular-nums text-[var(--muted-foreground)]">
      #{rank}
    </span>
  )
}

// =============================================================================
// Modale détail membre
// =============================================================================

function MemberDetailModal({
  row,
  monthYear,
  onClose,
}: {
  row: LeaderboardRow
  monthYear: string
  onClose: () => void
}) {
  const dailyQuery = useQuery({
    queryKey: ['admin-daily-activity', row.user_id, monthYear],
    queryFn: () => fetchDailyActivity(row.user_id, monthYear),
  })
  const topPostsQuery = useQuery({
    queryKey: ['admin-top-posts', row.user_id, monthYear],
    queryFn: () => fetchTopPosts(row.user_id, monthYear),
  })

  const chartData = useMemo(
    () =>
      (dailyQuery.data ?? []).map((d) => ({
        day: d.day.slice(8, 10),
        points: Number(d.points),
      })),
    [dailyQuery.data],
  )

  const fullName =
    row.full_name?.trim() ||
    [row.first_name, row.last_name].filter(Boolean).join(' ') ||
    'Membre'

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 12 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="fixed inset-x-4 top-[5vh] bottom-[5vh] z-50 mx-auto max-w-3xl overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-2xl sm:inset-x-auto sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:w-[640px] sm:-translate-x-1/2 sm:-translate-y-1/2"
        role="dialog"
        aria-modal="true"
        aria-label={`Détail de ${fullName}`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
            <div className="flex items-center gap-3">
              <AvatarDisplay
                avatarUrl={row.avatar_url}
                firstName={row.first_name}
                lastName={row.last_name}
                email={null}
                isVerified={row.is_verified}
                size="md"
              />
              <div>
                <h2 className="font-display text-lg font-semibold tracking-tight">
                  {fullName}
                </h2>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Rang #{row.rank} ·{' '}
                  {Math.round(Number(row.final_score)).toLocaleString('fr-FR')} pts
                  finaux ({row.raw_points} bruts)
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <MultiplierBox
                label="Engagement"
                value={`×${Number(row.engagement_score).toFixed(2)}`}
                hint="(likes + comments) / posts"
              />
              <MultiplierBox
                label="Régularité"
                value={`×${Number(row.regularity_score).toFixed(2)}`}
                hint={`${row.active_days} jours actifs / 30`}
              />
              <MultiplierBox
                label="Réciprocité"
                value={`×${Number(row.reciprocity_score).toFixed(2)}`}
                hint="commentaires / likes reçus"
              />
            </div>

            <h3 className="mt-6 font-display text-sm font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
              Activité par jour ({monthLabel(monthYear)})
            </h3>
            <div className="mt-3 h-48 rounded-xl border border-[var(--border)] bg-[var(--background)] p-3">
              {dailyQuery.isLoading ? (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-[var(--muted-foreground)]" />
                </div>
              ) : chartData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-[var(--muted-foreground)]">
                  Pas d'activité ce mois.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border)"
                    />
                    <XAxis
                      dataKey="day"
                      stroke="var(--muted-foreground)"
                      fontSize={11}
                    />
                    <YAxis
                      stroke="var(--muted-foreground)"
                      fontSize={11}
                      allowDecimals={false}
                    />
                    <Tooltip
                      cursor={{ fill: 'var(--secondary)' }}
                      contentStyle={{
                        background: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: 8,
                      }}
                      formatter={(value) => [`${Number(value)} pts`, 'Points']}
                      labelFormatter={(label) => `Jour ${String(label)}`}
                    />
                    <Bar
                      dataKey="points"
                      fill="var(--primary)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <h3 className="mt-6 font-display text-sm font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
              Meilleurs posts du mois
            </h3>
            <div className="mt-3 space-y-2">
              {topPostsQuery.isLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-[var(--muted-foreground)]" />
                </div>
              ) : (topPostsQuery.data ?? []).length === 0 ? (
                <p className="text-sm text-[var(--muted-foreground)]">
                  Aucun post publié ce mois.
                </p>
              ) : (
                topPostsQuery.data?.map((post) => (
                  <Link
                    key={post.id}
                    to="/app/communaute/$postId"
                    params={{ postId: post.id }}
                    onClick={onClose}
                    className="block rounded-xl border border-[var(--border)] bg-[var(--background)] p-3 transition-colors hover:border-[var(--primary)]/30"
                  >
                    <p className="line-clamp-2 text-sm">
                      {stripHtml(post.content)}
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                      ❤️ {post.likes_count} · 💬 {post.comments_count} ·{' '}
                      {new Date(post.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="border-t border-[var(--border)] px-5 py-3">
            <Button asChild variant="outline" size="sm">
              <Link
                to="/app/membres/$userId"
                params={{ userId: row.user_id }}
                onClick={onClose}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Visiter le profil public
              </Link>
            </Button>
          </div>
        </div>
      </motion.div>
    </>
  )
}

function MultiplierBox({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint: string
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-3 text-center">
      <p className="text-xs uppercase tracking-wider text-[var(--muted-foreground)]">
        {label}
      </p>
      <p className="mt-1 font-display text-xl font-bold tabular-nums">
        {value}
      </p>
      <p className="mt-1 text-[10px] text-[var(--muted-foreground)]">{hint}</p>
    </div>
  )
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// =============================================================================
// Modale confirmation sélection gagnant
// =============================================================================

function ConfirmWinnerModal({
  row,
  monthYearLabel,
  existingWinner,
  onCancel,
  onConfirm,
  submitting,
}: {
  row: LeaderboardRow
  monthYearLabel: string
  existingWinner: Winner | null | undefined
  onCancel: () => void
  onConfirm: (notes: string) => void
  submitting: boolean
}) {
  const [notes, setNotes] = useState('')
  const isReplacement =
    existingWinner !== null &&
    existingWinner !== undefined &&
    existingWinner.user_id !== row.user_id
  const fullName =
    row.full_name?.trim() ||
    [row.first_name, row.last_name].filter(Boolean).join(' ') ||
    'Membre'

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={submitting ? undefined : onCancel}
        aria-hidden="true"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 12 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="fixed inset-x-4 top-1/2 z-50 mx-auto max-w-md -translate-y-1/2 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-2xl sm:left-1/2 sm:-translate-x-1/2"
        role="dialog"
        aria-modal="true"
      >
        <div className="px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/15 text-[var(--accent)]">
              <Trophy className="h-5 w-5" />
            </span>
            <h2 className="font-display text-lg font-semibold tracking-tight">
              {isReplacement ? 'Remplacer le gagnant ?' : 'Sélectionner ce membre ?'}
            </h2>
          </div>
          <p className="mt-4 text-sm text-[var(--muted-foreground)]">
            {isReplacement ? (
              <>
                Un autre membre est déjà désigné gagnant pour{' '}
                {monthYearLabel}. En confirmant, tu remplaces la sélection
                précédente.
              </>
            ) : (
              <>
                Tu désignes <strong>{fullName}</strong> comme membre du mois{' '}
                <strong>{monthYearLabel}</strong>. La prime de{' '}
                <strong className="text-[var(--primary)]">
                  50&nbsp;000&nbsp;FCFA
                </strong>{' '}
                lui sera versée par mobile money.
              </>
            )}
          </p>

          <div className="mt-4 space-y-2">
            <label
              htmlFor="winner-notes"
              className="text-xs font-medium text-[var(--foreground)]"
            >
              Notes (optionnel) — raison du choix
            </label>
            <Textarea
              id="winner-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: 5 posts très commentés, présence quotidienne, mentor de 3 membres…"
              disabled={submitting}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-[var(--border)] bg-[var(--background)] px-6 py-3">
          <Button variant="ghost" onClick={onCancel} disabled={submitting}>
            Annuler
          </Button>
          <Button
            type="button"
            onClick={() => onConfirm(notes)}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enregistrement…
              </>
            ) : (
              <>
                <Trophy className="h-4 w-4" />
                {isReplacement ? 'Remplacer' : 'Confirmer'}
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </>
  )
}
