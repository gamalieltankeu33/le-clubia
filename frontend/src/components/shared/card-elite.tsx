import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface CardEliteProps {
  children: ReactNode
  className?: string
  /**
   * - `noir` : fond noir pur, texte blanc cassé. Pour le profil, les
   *   moments de prestige sobres.
   * - `or` : gradient or sur or-deep, texte noir. À RÉSERVER aux
   *   moments rarissimes (achievement unlocked, palier).
   * - `gradient` : gradient noir → noir-warm → noir, texture cuir.
   *   Le défaut pour le welcome card et les blocs élite récurrents.
   */
  variant?: 'noir' | 'or' | 'gradient'
}

/**
 * Surface "élite" du Club. Coin arrondi 3xl, padding généreux, grain
 * texture en overlay (~4% opacity) pour la matière. À utiliser avec
 * parcimonie — pour les moments forts uniquement.
 */
export function CardElite({
  children,
  className,
  variant = 'gradient',
}: CardEliteProps) {
  return (
    <div
      className={cn(
        'grain-overlay relative overflow-hidden rounded-3xl',
        variant === 'noir' && 'bg-[var(--noir)] text-[#FAFAF9]',
        variant === 'or' &&
          'bg-gradient-to-br from-[var(--or-soft)] via-[var(--or)] to-[var(--or-deep)] text-[var(--noir)]',
        variant === 'gradient' &&
          'bg-gradient-to-br from-[var(--noir)] via-[var(--noir-warm)] to-[var(--noir)] text-[#FAFAF9]',
        className,
      )}
    >
      {children}
    </div>
  )
}
