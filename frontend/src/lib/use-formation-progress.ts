import { useQuery } from '@tanstack/react-query'
import { supabase } from './supabase'
import { useAuthStore } from '@/stores/auth-store'

export type FormationProgressStatus =
  | 'not_started'
  | 'in_progress'
  | 'completed'

export interface FormationProgressInfo {
  status: FormationProgressStatus
  percent: number
  completed: number
  total: number
}

/**
 * Calcule l'état de progression d'un membre sur une formation à partir
 * de comptages partagés (utilisé par le catalogue qui fetch en batch).
 */
export function deriveProgressInfo(input: {
  completed: number
  total: number
}): FormationProgressInfo {
  const total = Math.max(0, input.total)
  const completed = Math.max(0, Math.min(input.completed, total))
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0
  let status: FormationProgressStatus
  if (completed === 0) status = 'not_started'
  else if (completed >= total) status = 'completed'
  else status = 'in_progress'
  return { status, percent, completed, total }
}

/**
 * Hook qui fetch la progression d'un membre sur une formation donnée.
 * À utiliser pour des écrans isolés ; pour le catalogue batch, utilise
 * directement `deriveProgressInfo`.
 */
export function useFormationProgress(
  formationId: string | null | undefined,
): FormationProgressInfo & { isLoading: boolean } {
  const userId = useAuthStore((s) => s.user?.id)

  const query = useQuery({
    queryKey: ['formation-progress-summary', userId, formationId],
    enabled: Boolean(userId && formationId),
    staleTime: 30_000,
    queryFn: async () => {
      const [chaptersRes, progressRes] = await Promise.all([
        supabase
          .from('formation_chapters')
          .select('*', { count: 'exact', head: true })
          .eq('formation_id', formationId!),
        supabase
          .from('user_formation_progress')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId!)
          .eq('formation_id', formationId!)
          .eq('completed', true),
      ])
      return {
        total: chaptersRes.count ?? 0,
        completed: progressRes.count ?? 0,
      }
    },
  })

  const info = deriveProgressInfo({
    completed: query.data?.completed ?? 0,
    total: query.data?.total ?? 0,
  })
  return { ...info, isLoading: query.isLoading }
}
