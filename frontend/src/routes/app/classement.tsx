import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Trophy, Medal, Flame, TrendingUp } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { AvatarDisplay } from '@/components/avatar-display'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/app/classement')({
  component: LeaderboardPage,
})

async function fetchLeaderboard() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, avatar_url, points, is_verified')
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
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent)]/15 text-[var(--accent)]">
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

function LeaderboardRow({ member, rank }: { member: any, rank: number }) {
  const isTop3 = rank <= 3
  const firstName = member.first_name || 'Membre'
  const lastName = member.last_name || ''
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.05 }}
      className={cn(
        "group flex items-center gap-4 rounded-2xl border p-4 transition-all hover:shadow-md",
        isTop3 
          ? "border-[var(--accent)]/30 bg-[var(--accent)]/5" 
          : "border-[var(--border)] bg-[var(--card)]"
      )}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center font-display text-xl font-bold italic">
        {rank === 1 ? (
          <Trophy className="h-6 w-6 text-yellow-500" />
        ) : rank === 2 ? (
          <Medal className="h-6 w-6 text-slate-400" />
        ) : rank === 3 ? (
          <Medal className="h-6 w-6 text-amber-600" />
        ) : (
          <span className="text-[var(--muted-foreground)]">{rank}</span>
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
        <h3 className="font-display font-semibold truncate text-[var(--foreground)]">
          {firstName} {lastName}
        </h3>
        <div className="flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
          <span className="flex items-center gap-1">
            <Flame className="h-3 w-3 text-orange-500" />
            Niveau {Math.floor(member.points / 100) + 1}
          </span>
          {rank === 1 && (
            <span className="flex items-center gap-1 text-[var(--accent)] font-medium">
              <TrendingUp className="h-3 w-3" />
              Major de promo
            </span>
          )}
        </div>
      </div>

      <div className="text-right shrink-0">
        <div className="font-display text-xl font-bold text-[var(--foreground)]">
          {member.points.toLocaleString()}
        </div>
        <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
          Points de Force
        </div>
      </div>
    </motion.div>
  )
}
