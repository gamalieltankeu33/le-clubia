import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { haptic } from '@/lib/haptic'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description: string
  cta?: { label: string; onClick: () => void }
  /** Sous-blocs additionnels (ex: suggestions de prompts pour le coach). */
  children?: ReactNode
  className?: string
}

/**
 * État vide premium : icône généreuse, copie chaleureuse, CTA optionnel
 * pleine largeur sur mobile. Pas de bordure agressive — c'est un moment
 * d'invitation, pas une erreur.
 */
export function EmptyState({
  icon,
  title,
  description,
  cta,
  children,
  className,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'flex flex-col items-center text-center px-6 py-14 sm:py-16',
        className,
      )}
    >
      {icon && (
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--secondary)] text-[var(--muted-foreground)]">
          {icon}
        </span>
      )}
      <h3 className="mt-5 font-display text-lg font-semibold tracking-tight text-[var(--foreground)] sm:text-xl">
        {title}
      </h3>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-[var(--muted-foreground)] sm:text-base">
        {description}
      </p>
      {children && <div className="mt-6 w-full max-w-sm">{children}</div>}
      {cta && (
        <button
          type="button"
          onClick={() => {
            haptic('light')
            cta.onClick()
          }}
          className="mt-6 inline-flex w-full max-w-xs items-center justify-center rounded-full bg-[var(--primary)] px-6 py-3 text-base font-semibold text-[var(--primary-foreground)] transition-all duration-150 active:scale-95 hover:bg-[var(--primary)]/90 sm:w-auto sm:text-sm touch-manipulation min-h-[44px]"
        >
          {cta.label}
        </button>
      )}
    </motion.div>
  )
}
