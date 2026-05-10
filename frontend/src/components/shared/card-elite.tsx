import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface CardEliteProps {
  children: ReactNode
  className?: string
  /**
   * Variante visuelle de la surface "élite" du Club.
   *
   * - `bleu` (défaut) : fond bleu Bloomberg profond, texte blanc cassé.
   *   La surface premium par défaut — vivante mais noble. À privilégier
   *   pour le welcome dashboard, le header profil, les CTAs landing.
   * - `gradient` : gradient bleu Bloomberg → noir warm → bleu. Variante
   *   plus cinématographique, sensation de profondeur. À utiliser quand
   *   on veut accentuer le moment (achievement, palier).
   * - `noir` : fond noir pur (legacy). Réservé aux modals très rares où
   *   on veut maximiser le contraste — déprécié au profit de `bleu`.
   * - `or` : gradient or → or-deep, texte noir. À RÉSERVER aux moments
   *   rarissimes (achievement unlocked, palier atteint).
   */
  variant?: 'bleu' | 'gradient' | 'noir' | 'or'
}

/**
 * Surface "élite" du Club. Coin arrondi 3xl, grain texture en overlay
 * (~4 % opacity) pour la matière. À utiliser avec parcimonie — pour les
 * moments forts uniquement.
 *
 * Le défaut est `bleu` (bleu Bloomberg) depuis la refonte palette :
 * remplace le `noir` historique, jugé trop austère.
 */
export function CardElite({
  children,
  className,
  variant = 'bleu',
}: CardEliteProps) {
  return (
    <div
      className={cn(
        'grain-overlay relative overflow-hidden rounded-3xl',
        variant === 'bleu' && 'bg-[var(--primary)] text-[#FAFAF9]',
        variant === 'gradient' &&
          'bg-gradient-to-br from-[var(--primary)] via-[#0A1530] to-[var(--primary)] text-[#FAFAF9]',
        variant === 'noir' && 'bg-[var(--noir)] text-[#FAFAF9]',
        variant === 'or' &&
          'bg-gradient-to-br from-[var(--or-soft)] via-[var(--or)] to-[var(--or-deep)] text-[var(--noir)]',
        className,
      )}
    >
      {children}
    </div>
  )
}
