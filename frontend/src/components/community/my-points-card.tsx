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
  const userId = useAuthStore((s) => s.user?.id ?? null)

  const query = useQuery({
    queryKey: ['my-monthly-points', userId],
    queryFn: fetchMyPoints,
    enabled: Boolean(userId),
    staleTime: 60_000,
  })

  if (!userId) return null

  const data = query.data
  const monthLabel = new Date().toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[var(--accent)]/5 via-[var(--card)] to-[var(--card)] p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)]/15 text-[var(--accent)]">
          <Trophy className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
            Mes points · {monthLabel}
          </p>

          {query.isLoading ? (
            <div className="mt-3 flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
              <Loader2 className="h-4 w-4 animate-spin" />
              Chargement…
            </div>
          ) : !data || data.total_points === 0 ? (
            <>
              <p className="mt-1 font-display text-2xl font-bold tracking-tight">
                Pas encore de points
              </p>
              <p className="mt-2 max-w-md text-sm text-[var(--muted-foreground)]">
                Publie un post (+10 pts), commente (+3 pts), reçois des likes
                (+2 pts) ou termine un chapitre de formation (+5 pts) pour
                grimper au classement et tenter de gagner la prime mensuelle
                de{' '}
                <span className="font-bold text-[var(--primary)]">
                  50&nbsp;000&nbsp;FCFA
                </span>
                .
              </p>
            </>
          ) : (
            <>
              <div className="mt-1 flex items-baseline gap-3">
                <p className="font-display text-3xl font-bold tracking-tight tabular-nums">
                  {data.total_points}
                </p>
                <p className="text-sm text-[var(--muted-foreground)]">
                  point{data.total_points > 1 ? 's' : ''}
                </p>
              </div>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                Rang{' '}
                <strong className="text-[var(--foreground)] tabular-nums">
                  #{data.rank}
                </strong>
                {data.total_members > 0 && (
                  <> sur {data.total_members} membres actifs ce mois</>
                )}
              </p>
            </>
          )}
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
