import { useQuery } from '@tanstack/react-query'
import { supabase } from './supabase'

/** Format `YYYY-MM` du mois en cours en UTC. */
function currentMonthYear(): string {
  const d = new Date()
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

/**
 * Récupère l'ID du membre désigné "Membre du mois" pour le mois en cours.
 * Cache 1h via React Query (le winner change rarement, pas besoin de refetch
 * agressif).
 */
export function useMonthlyWinner() {
  const monthYear = currentMonthYear()
  const query = useQuery({
    queryKey: ['monthly-winner', monthYear],
    queryFn: async (): Promise<string | null> => {
      const { data, error } = await supabase
        .from('monthly_winners')
        .select('user_id')
        .eq('month_year', monthYear)
        .maybeSingle<{ user_id: string }>()
      if (error || !data) return null
      return data.user_id
    },
    staleTime: 60 * 60 * 1000, // 1h
    gcTime: 24 * 60 * 60 * 1000,
  })
  return {
    winnerId: query.data ?? null,
    isLoading: query.isLoading,
  }
}

/** Retourne true si le user passé est le membre du mois en cours. */
export function useIsMonthlyWinner(userId: string | null | undefined): boolean {
  const { winnerId } = useMonthlyWinner()
  if (!userId || !winnerId) return false
  return userId === winnerId
}
