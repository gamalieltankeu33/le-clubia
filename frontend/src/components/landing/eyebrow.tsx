import { cn } from '@/lib/utils'

/**
 * Eyebrow éditorial : uppercase tracked, sobre style izi.club.
 * Le `variant` change la couleur (muted par défaut, accent orange en option).
 */
export function Eyebrow({
  children,
  className,
  variant = 'muted',
}: {
  children: React.ReactNode
  className?: string
  variant?: 'muted' | 'accent' | 'primary'
}) {
  return (
    <span
      className={cn(
        'eyebrow',
        variant === 'accent' && 'text-[var(--accent)]',
        variant === 'primary' && 'text-[var(--primary)]',
        className,
      )}
    >
      {children}
    </span>
  )
}
