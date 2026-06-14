import { Crown } from 'lucide-react'
import { useIsMonthlyWinner } from '@/lib/use-monthly-winner'
import { cn } from '@/lib/utils'

/**
 * Badge "Membre du mois" — couronne dorée affichée en overlay quand le user
 * passé en prop est le gagnant du mois en cours.
 *
 * Performance : utilise le hook `useIsMonthlyWinner` qui partage UNE seule
 * query React Query (clé `['monthly-winner', YYYY-MM]`, cache 1h) entre tous
 * les avatars de la page. Donc afficher 50 avatars ne déclenche qu'1 requête.
 */
export function MonthlyWinnerBadge({
  userId,
  size = 'md',
  className,
}: {
  userId: string | null | undefined
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}) {
  const isWinner = useIsMonthlyWinner(userId)
  if (!isWinner) return null

  const monthLabel = new Date().toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  })

  const sizeClass = {
    sm: 'h-4 w-4 -top-1.5 -right-1',
    md: 'h-4 w-4 -top-1.5 -right-1',
    lg: 'h-5 w-5 -top-2 -right-1.5',
    xl: 'h-7 w-7 -top-2.5 -right-2',
  }[size]

  return (
    <span
      className={cn(
        'absolute flex items-center justify-center rounded-full bg-[#FCD34D] text-[#7C2D12] shadow-sm ring-2 ring-white',
        sizeClass,
        className,
      )}
      aria-label={`Membre du mois — ${monthLabel}`}
      title={`Membre du mois — ${monthLabel}`}
    >
      <Crown className="h-2.5 w-2.5 sm:h-3 sm:w-3" strokeWidth={2.5} />
    </span>
  )
}
