import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Trophy, Flame, Sparkles } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { AvatarDisplay } from '@/components/avatar-display'
import { cn } from '@/lib/utils'
import { formatMemberNumber } from '@/lib/format-member-number'

export const Route = createFileRoute('/app/classement')({
  component: LeaderboardPage,
})

async function fetchLeaderboard() {
  const { data, error } = await supabase
    .from('profiles')
    .select(
      'id, first_name, last_name, avatar_url, points, is_verified, member_number',
    )
    .order('points', { ascending: false })
    .limit(50)

  if (error) throw error
  return data ?? []
}

function LeaderboardPage() {
  const { data: members, isLoading, isError, refetch } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: fetchLeaderboard,
    staleTime: 60 * 1000,
  })

  const top3 = (members ?? []).slice(0, 3)
  const rest = (members ?? []).slice(3)

  // Top 3 Olympic order: 2nd place (left), 1st place (center), 3rd place (right)
  const first = top3[0]
  const second = top3[1]
  const third = top3[2]

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 lg:py-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="flex flex-col items-center text-center"
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--or)]/25 via-[var(--or)]/15 to-transparent text-[var(--or-deep)] ring-1 ring-[var(--or)]/40 shadow-[0_4px_20px_rgba(212,175,55,0.2)]">
          <Trophy className="h-7 w-7" />
        </span>
        <h1 className="mt-5 font-display text-3xl font-bold tracking-tight md:text-5xl text-[var(--foreground)]">
          Le Mur des Champions
        </h1>
        <p className="mt-3 max-w-xl text-base md:text-lg text-[var(--muted-foreground)]">
          Découvre le classement officiel des membres les plus actifs de la communauté Le Club IA.
        </p>
      </motion.div>

      {/* Main Content */}
      <div className="mt-10">
        {isLoading ? (
          <div className="space-y-4">
            <div className="h-72 w-full animate-pulse rounded-3xl bg-[var(--secondary)]" />
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-20 w-full animate-pulse rounded-2xl bg-[var(--secondary)]" />
              ))}
            </div>
          </div>
        ) : isError ? (
          <div className="text-center py-12 bg-[var(--card)] rounded-3xl border border-[var(--border)] p-8">
            <p className="text-[var(--muted-foreground)] font-medium">Impossible de charger le classement.</p>
            <button
              onClick={() => refetch()}
              className="mt-4 rounded-xl bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--primary-light)]"
            >
              Réessayer
            </button>
          </div>
        ) : (
          <>
            {/* OLYMPIC PODIUM (Top 3) */}
            {top3.length > 0 && (
              <motion.section
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="mb-14"
              >
                <div className="relative rounded-3xl border border-[var(--border)] bg-gradient-to-b from-[var(--background-pure)] via-[var(--card)] to-[var(--background)] p-6 md:p-10 shadow-xl overflow-hidden">
                  {/* Subtle background glow */}
                  <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-64 w-96 rounded-full bg-[var(--or)]/10 blur-3xl" />

                  <div className="relative z-10 mb-8 text-center">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--or)]/15 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[var(--or-deep)] border border-[var(--or)]/30">
                      <Sparkles className="h-3.5 w-3.5" /> Podium Olympique Le Club IA
                    </span>
                  </div>

                  {/* 3-Column Olympic Podium Layout */}
                  <div className="grid grid-cols-3 items-end gap-3 sm:gap-6 md:gap-8 max-w-3xl mx-auto">
                    {/* 2ND PLACE (SILVER) - LEFT */}
                    {second ? (
                      <PodiumCard
                        member={second}
                        rank={2}
                        medalColor="silver"
                        pedestalHeight="h-32 sm:h-40"
                        delay={0.2}
                      />
                    ) : <div />}

                    {/* 1ST PLACE (GOLD) - CENTER (HIGHEST) */}
                    {first ? (
                      <PodiumCard
                        member={first}
                        rank={1}
                        medalColor="gold"
                        pedestalHeight="h-44 sm:h-56"
                        delay={0.1}
                      />
                    ) : <div />}

                    {/* 3RD PLACE (BRONZE) - RIGHT */}
                    {third ? (
                      <PodiumCard
                        member={third}
                        rank={3}
                        medalColor="bronze"
                        pedestalHeight="h-24 sm:h-32"
                        delay={0.3}
                      />
                    ) : <div />}
                  </div>
                </div>
              </motion.section>
            )}

            {/* REST OF LEADERBOARD (Rangs 4 et suivants) */}
            {rest.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center justify-between px-2 mb-4">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-[var(--muted-foreground)]" />
                    <h2 className="font-display text-xl font-bold text-[var(--foreground)]">
                      Suite du classement
                    </h2>
                  </div>
                  <span className="text-xs font-semibold text-[var(--muted-foreground)] bg-[var(--secondary)] px-3 py-1 rounded-full">
                    Rangs 4 à {members?.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {rest.map((member, index) => (
                    <LeaderboardRow
                      key={member.id}
                      member={member}
                      rank={index + 4}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  )
}

interface PodiumCardProps {
  member: any
  rank: 1 | 2 | 3
  medalColor: 'gold' | 'silver' | 'bronze'
  pedestalHeight: string
  delay: number
}

function PodiumCard({ member, rank, medalColor, pedestalHeight, delay }: PodiumCardProps) {
  const firstName = member.first_name || 'Membre'
  const lastName = member.last_name || ''
  const memberLabel = formatMemberNumber(member.member_number)

  const isGold = rank === 1

  const config = {
    gold: {
      badgeBg: 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-amber-950 shadow-lg shadow-amber-500/30',
      ringColor: 'ring-4 ring-amber-400/90 shadow-[0_0_25px_rgba(245,158,11,0.4)]',
      cardBg: 'bg-gradient-to-b from-amber-500/10 via-white to-white border-2 border-amber-400/60 shadow-xl shadow-amber-500/10',
      pedestalBg: 'bg-gradient-to-b from-amber-400 via-amber-500 to-amber-700 text-white shadow-lg border-t-2 border-amber-300',
      stepBadge: 'bg-amber-300/30 text-white border border-amber-200/40',
      label: '1ER PLACE',
      medalIcon: '🥇',
    },
    silver: {
      badgeBg: 'bg-gradient-to-r from-slate-300 via-slate-200 to-slate-400 text-slate-900 shadow-md',
      ringColor: 'ring-4 ring-slate-300 shadow-[0_0_20px_rgba(148,163,184,0.3)]',
      cardBg: 'bg-gradient-to-b from-slate-200/20 via-white to-white border border-slate-300 shadow-md',
      pedestalBg: 'bg-gradient-to-b from-slate-300 via-slate-400 to-slate-600 text-white shadow-md border-t-2 border-slate-200',
      stepBadge: 'bg-white/20 text-white border border-white/30',
      label: '2ÈME PLACE',
      medalIcon: '🥈',
    },
    bronze: {
      badgeBg: 'bg-gradient-to-r from-amber-700 via-amber-600 to-amber-800 text-amber-50 shadow-md',
      ringColor: 'ring-4 ring-amber-700/60 shadow-[0_0_20px_rgba(180,83,9,0.25)]',
      cardBg: 'bg-gradient-to-b from-amber-900/10 via-white to-white border border-amber-700/30 shadow-md',
      pedestalBg: 'bg-gradient-to-b from-amber-700 via-amber-800 to-amber-950 text-white shadow-md border-t-2 border-amber-500/40',
      stepBadge: 'bg-white/15 text-white border border-white/20',
      label: '3ÈEME PLACE',
      medalIcon: '🥉',
    },
  }[medalColor]

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="flex flex-col items-center group cursor-pointer"
    >
      <Link
        to="/app/membres/$userId"
        params={{ userId: member.id }}
        className="w-full flex flex-col items-center text-center"
      >
        {/* Avatar & Floating Crown Header */}
        <div className="relative mb-3 flex flex-col items-center">
          {/* Floating Crown for 1st Place */}
          {isGold && (
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
              className="absolute -top-7 z-20"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 text-amber-950 shadow-lg ring-2 ring-white">
                <Trophy className="h-5 w-5 fill-amber-950" />
              </div>
            </motion.div>
          )}

          {/* Avatar Container */}
          <div className={cn('relative rounded-full transition-transform duration-300 group-hover:scale-105', config.ringColor)}>
            <AvatarDisplay
              avatarUrl={member.avatar_url}
              firstName={firstName}
              lastName={lastName}
              size={isGold ? 'xl' : 'lg'}
              isVerified={member.is_verified}
            />
          </div>

          {/* Rank Pill Badge */}
          <div
            className={cn(
              'mt-2 inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-xs font-extrabold uppercase tracking-wide',
              config.badgeBg,
            )}
          >
            <span>{config.medalIcon}</span>
            <span>#{rank}</span>
          </div>
        </div>

        {/* Member Name & Points Info Box */}
        <div className={cn('w-full rounded-2xl p-3 sm:p-4 text-center transition-all group-hover:shadow-md', config.cardBg)}>
          <h3 className="truncate font-display text-sm sm:text-base font-bold text-[var(--foreground)]">
            {firstName} {lastName}
          </h3>
          {memberLabel && (
            <p className="font-serif-number text-[11px] text-[var(--muted-foreground)]">
              {memberLabel}
            </p>
          )}

          <div className="mt-2 pt-2 border-t border-[var(--border)]/50">
            <div className="font-serif-number text-lg sm:text-2xl font-bold text-[var(--foreground)]">
              {member.points.toLocaleString('fr-FR')}
            </div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
              Points
            </div>
          </div>

          {isGold && (
            <span className="mt-2 inline-block rounded-full bg-[var(--or)]/15 px-2.5 py-0.5 text-[10px] font-semibold text-[var(--or-deep)]">
              Major de promo
            </span>
          )}
        </div>

        {/* 3D Olympic Pedestal Step Block */}
        <motion.div
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 0.6, delay: delay + 0.1, ease: 'easeOut' }}
          className={cn(
            'w-full mt-2 rounded-t-2xl flex flex-col items-center justify-center p-3 text-center transition-transform origin-bottom',
            pedestalHeight,
            config.pedestalBg,
          )}
        >
          <div className={cn('flex h-9 w-9 items-center justify-center rounded-full text-lg font-black font-display shadow-inner', config.stepBadge)}>
            {rank}
          </div>
          <span className="mt-1 text-[10px] font-black uppercase tracking-widest opacity-90">
            {config.label}
          </span>
        </motion.div>
      </Link>
    </motion.div>
  )
}

function LeaderboardRow({ member, rank }: { member: any; rank: number }) {
  const firstName = member.first_name || 'Membre'
  const lastName = member.last_name || ''
  const memberLabel = formatMemberNumber(member.member_number)

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: (rank - 3) * 0.03 }}
    >
      <Link
        to="/app/membres/$userId"
        params={{ userId: member.id }}
        className="group flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 transition-all hover:border-[var(--primary)]/30 hover:shadow-md"
      >
        {/* Rank Number Badge */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--secondary)] font-serif-number text-lg font-bold text-[var(--muted-foreground)] group-hover:bg-[var(--primary)] group-hover:text-white transition-colors">
          #{rank}
        </div>

        <AvatarDisplay
          avatarUrl={member.avatar_url}
          firstName={firstName}
          lastName={lastName}
          size="lg"
          isVerified={member.is_verified}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-display font-semibold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">
              {firstName} {lastName}
            </h3>
            {memberLabel && (
              <span className="font-serif-number text-xs text-[var(--muted-foreground)]">
                {memberLabel}
              </span>
            )}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--muted-foreground)]">
            <span className="flex items-center gap-1">
              <Flame className="h-3.5 w-3.5 text-[var(--or-deep)]" />
              Niveau {Math.floor(member.points / 100) + 1}
            </span>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <div className="font-serif-number text-xl sm:text-2xl font-bold text-[var(--foreground)]">
            {member.points.toLocaleString('fr-FR')}
          </div>
          <div className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">
            Points
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

