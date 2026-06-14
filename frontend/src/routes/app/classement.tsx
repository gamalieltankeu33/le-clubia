import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Trophy, Medal, Flame, TrendingUp } from 'lucide-react'
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

  return (
    <div className="mx-auto max-w-4xl px-6 py-10 lg:py-14">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="flex flex-col items-center text-center"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--or)]/15 text-[var(--or-deep)] ring-1 ring-[var(--or)]/30">
          <Trophy className="h-6 w-6" />
        </span>
        <h1 className="mt-5 font-display text-3xl font-semibold tracking-tight md:text-4xl">
          Le Mur des Champions
        </h1>
        <p className="mt-3 max-w-xl text-lg text-[var(--muted-foreground)]">
          Découvre les membres les plus actifs de la communauté. Gagne des points en apprenant et en partageant.
        </p>
      </motion.div>

      <div className="mt-12">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-20 w-full animate-pulse rounded-2xl bg-[var(--secondary)]" />
            ))}
          </div>
        ) : isError ? (
          <div className="text-center py-10">
            <p className="text-[var(--muted-foreground)]">Impossible de charger le classement.</p>
            <button onClick={() => refetch()} className="mt-4 text-[var(--primary)] font-medium">Réessayer</button>
          </div>
        ) : (
          <div className="space-y-3">
            {(members ?? []).map((member, index) => (
              <LeaderboardRow
                key={member.id}
                member={member}
                rank={index + 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function LeaderboardRow({ member, rank }: { member: any; rank: number }) {
  const isTop3 = rank <= 3
  const isFirst = rank === 1
  const firstName = member.first_name || 'Membre'
  const lastName = member.last_name || ''
  const memberLabel = formatMemberNumber(member.member_number)

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.05 }}
      className={cn(
        'group flex items-center gap-4 rounded-2xl border p-4 transition-all hover:shadow-md',
        isFirst
          ? 'border-[var(--or)]/40 bg-gradient-to-r from-[var(--or)]/10 via-white to-white'
          : isTop3
            ? 'border-[var(--or)]/25 bg-[var(--or)]/[0.04]'
            : 'border-[var(--border)] bg-[var(--card)]',
      )}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center">
        {rank === 1 ? (
          <Trophy className="h-6 w-6 text-[var(--or)]" />
        ) : rank === 2 ? (
          <Medal className="h-6 w-6 text-[#9CA3AF]" />
        ) : rank === 3 ? (
          <Medal className="h-6 w-6 text-[#A97142]" />
        ) : (
          <span className="font-serif-number text-2xl text-[var(--muted-foreground)]">
            {rank}
          </span>
        )}
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
          <h3 className="truncate font-display font-semibold text-[var(--foreground)]">
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
            <Flame className="h-3 w-3 text-[var(--or-deep)]" />
            Niveau {Math.floor(member.points / 100) + 1}
          </span>
          {isFirst && (
            <span className="flex items-center gap-1 font-medium text-[var(--or-deep)]">
              <TrendingUp className="h-3 w-3" />
              Major de promo
            </span>
          )}
        </div>
      </div>

      <div className="shrink-0 text-right">
        <div className="font-serif-number text-2xl text-[var(--foreground)] sm:text-3xl">
          {member.points.toLocaleString('fr-FR')}
        </div>
        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
          Points
        </div>
      </div>
    </motion.div>
  )
}
