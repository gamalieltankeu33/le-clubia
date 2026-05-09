import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ArrowRight, Loader2, Trophy } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth-store'

interface MyPoints {
  total_points: number
  rank: number
  total_members: number
}

async function fetchMyPoints(): Promise<MyPoints | null> {
  // @ts-expect-error - RPC custom non typée dans Database['public']['Functions']
  const { data, error } = await supabase.rpc('get_my_monthly_points')
  if (error || !data) return null
  // La RPC renvoie un set de 1 ligne — on prend la première
  const row = (Array.isArray(data) ? data[0] : data) as MyPoints | undefined
  return row ?? null
}

/**
 * Mini widget "Mes points ce mois-ci" pour le dashboard membre.
 * Affiche les points + rang du mois en cours + lien d'incitation.
 */
export function MyPointsCard() {
  const profile = useAuthStore((s) => s.profile)
  const points = profile?.points ?? 0
  const level = Math.floor(points / 100) + 1

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[var(--accent)]/5 via-[var(--card)] to-[var(--card)] p-5">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent)]/15 text-[var(--accent)] shadow-inner">
          <Trophy className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted-foreground)] opacity-70">
              Ma Force Actuelle
            </p>
            <span className="rounded-full bg-[var(--accent)]/10 px-2 py-0.5 text-[10px] font-bold text-[var(--accent)] border border-[var(--accent)]/20">
              Niveau {level}
            </span>
          </div>

          <div className="mt-2 flex items-baseline gap-2">
            <p className="font-display text-3xl font-bold tracking-tight text-[var(--foreground)] tabular-nums">
              {points.toLocaleString()}
            </p>
            <p className="text-sm font-medium text-[var(--muted-foreground)]">
              point{points > 1 ? 's' : ''}
            </p>
          </div>

          <p className="mt-2 text-xs leading-relaxed text-[var(--muted-foreground)]">
            Gagne des points en terminant des cours (+10), en publiant (+10), en commentant (+5) ou en likant (+1).
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end">
        <Link
          to="/app/communaute"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--primary)] transition-colors hover:text-[#1c3a9e]"
        >
          Aller à la communauté
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  )
}
