import { useState } from 'react'
import { cn } from '@/lib/utils'

/**
 * <img> qui essaie de charger `src` (depuis /public/landing/...).
 * Si l'image est absente / 404, affiche le `fallback` à la place.
 *
 * Permet à l'utilisatrice non-technique de DROP ses propres images dans
 * /public/landing/* sans avoir à toucher au code : la landing les détecte
 * automatiquement à la prochaine recharge.
 */
export function ImageWithFallback({
  src,
  alt,
  className,
  fallback,
}: {
  src: string
  alt: string
  className?: string
  fallback: React.ReactNode
}) {
  const [errored, setErrored] = useState(false)
  if (errored) {
    return <>{fallback}</>
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setErrored(true)}
      className={cn('h-full w-full object-cover', className)}
    />
  )
}

/** Gradient placeholder réutilisable. */
export function GradientPlaceholder({
  className,
  variant = 'blue',
}: {
  className?: string
  variant?: 'blue' | 'orange' | 'green' | 'violet' | 'rose'
}) {
  const styles: Record<string, string> = {
    blue: 'from-[#1E40AF] to-[#3858d8]',
    orange: 'from-[#2563EB] to-[#60A5FA]',
    green: 'from-[#0F1E4D] to-[#60A5FA]',
    violet: 'from-violet-500 to-violet-700',
    rose: 'from-rose-400 to-rose-600',
  }
  return (
    <div
      aria-hidden="true"
      className={cn(
        'relative h-full w-full overflow-hidden bg-gradient-to-br',
        styles[variant],
        className,
      )}
    >
      <span className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-white/15 blur-xl" />
    </div>
  )
}
