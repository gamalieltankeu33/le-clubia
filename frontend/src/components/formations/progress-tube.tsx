import { cn } from '@/lib/utils'

type Size = 'sm' | 'md' | 'lg'

const SIZE_CLASSES: Record<Size, { container: string; text: string }> = {
  sm: { container: 'h-5', text: 'text-[10px]' },
  md: { container: 'h-7', text: 'text-xs' },
  lg: { container: 'h-9', text: 'text-sm' },
}

/**
 * Tube de progression style Skool : container épais, barre intérieure
 * colorée + label `%` lisible aussi bien à 5% qu'à 95% grâce à un
 * dégradé de fond et un text-shadow sur la zone de la barre.
 *
 * Couleurs :
 *  - 0%       → texte gris foncé sur fond gris clair
 *  - 1..99%   → barre primaire (bleu Le Club IA)
 *  - 100%     → barre verte (emerald-500) + ✅
 */
export function ProgressTube({
  value,
  size = 'md',
  className,
}: {
  value: number
  size?: Size
  className?: string
}) {
  const pct = Math.max(0, Math.min(100, Math.round(value)))
  const isComplete = pct === 100
  const isEmpty = pct === 0
  const sz = SIZE_CLASSES[size]

  const label = isComplete ? '100% ✅' : `${pct}%`

  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Progression : ${pct}%`}
      className={cn(
        'relative w-full overflow-hidden rounded-full bg-[var(--secondary)]',
        sz.container,
        className,
      )}
    >
      {/* Barre intérieure */}
      <div
        className={cn(
          'h-full rounded-full transition-[width] duration-700 ease-out',
          isComplete ? 'bg-[var(--bleu-ciel-deep)]' : 'bg-[var(--primary)]',
        )}
        style={{ width: `${pct}%` }}
      />

      {/* Label centré, lisible quel que soit le remplissage.
         À 0% on bascule sur du texte foncé visible sur fond gris clair ;
         sinon blanc + ombre douce qui reste lisible même quand seule
         5% de la largeur est colorée (le reste du texte sort sur le
         fond gris mais l'ombre maintient le contraste). */}
      <span
        className={cn(
          'pointer-events-none absolute inset-0 flex items-center justify-center font-bold tabular-nums',
          sz.text,
          isEmpty
            ? 'text-[var(--muted-foreground)]'
            : 'text-white [text-shadow:0_1px_2px_rgb(0_0_0_/_0.35)]',
        )}
      >
        {label}
      </span>
    </div>
  )
}
