import { cn } from '@/lib/utils'
import type { PasswordValidation } from '@/lib/password-validator'

const LABELS = [
  'Trop court',
  'Faible',
  'Moyen',
  'Bon',
  'Solide',
  'Excellent',
] as const

// Couleur de la barre selon le score (toutes les segments remplis prennent
// la même teinte, c'est le pattern jauge classique).
const FILL_BG: Record<number, string> = {
  0: 'bg-red-500',
  1: 'bg-red-500',
  2: 'bg-orange-500',
  3: 'bg-amber-400',
  4: 'bg-emerald-400',
  5: 'bg-emerald-600',
}

const FILL_TEXT: Record<number, string> = {
  0: 'text-red-600',
  1: 'text-red-600',
  2: 'text-orange-600',
  3: 'text-amber-600',
  4: 'text-emerald-600',
  5: 'text-emerald-700',
}

export function PasswordStrengthMeter({
  validation,
  className,
}: {
  validation: PasswordValidation
  className?: string
}) {
  const { score, errors } = validation
  const label = LABELS[score]

  return (
    <div className={cn('space-y-1.5', className)}>
      {/* 5 segments */}
      <div className="flex items-center gap-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-colors duration-200',
              i < score ? FILL_BG[score] : 'bg-[var(--border)]',
            )}
          />
        ))}
      </div>

      {/* Label + score numérique */}
      <div className="flex items-center justify-between text-xs">
        <span className={cn('font-medium', FILL_TEXT[score])}>{label}</span>
        <span className="tabular-nums text-[var(--muted-foreground)]">
          {score}/5
        </span>
      </div>

      {/* Liste des règles à respecter (visible quand au moins une manque) */}
      {errors.length > 0 && (
        <ul className="space-y-0.5 pt-1 text-[11px] leading-relaxed text-[var(--muted-foreground)]">
          {errors.map((e) => (
            <li key={e} className="flex items-start gap-1.5">
              <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-[var(--muted-foreground)]/40" />
              {e}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
