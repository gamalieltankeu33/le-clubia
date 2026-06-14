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
        // Sur fond clair, l'émeraude vive (--accent) tombe sous le seuil
        // de lisibilité pour du texte uppercase petit. On utilise sa
        // déclinaison plus profonde (--emerald-deep) pour la variante
        // accent — gardé "accent" pour ne pas casser les call sites.
        variant === 'accent' && 'text-[var(--emerald-deep)]',
        variant === 'primary' && 'text-[var(--primary)]',
        className,
      )}
    >
      {children}
    </span>
  )
}
