import { cn } from '@/lib/utils'

export function ProgressBar({
  value,
  className,
  barClassName,
  size = 'md',
}: {
  /** 0-100 */
  value: number
  className?: string
  /** Classe appliquée à la barre intérieure (ex: 'bg-[var(--accent)]'). */
  barClassName?: string
  size?: 'sm' | 'md'
}) {
  const pct = Math.max(0, Math.min(100, value))
  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        'w-full overflow-hidden rounded-full bg-[var(--secondary)]',
        size === 'sm' ? 'h-1' : 'h-1.5',
        className,
      )}
    >
      <div
        className={cn(
          'h-full rounded-full bg-[var(--primary)] transition-all duration-500',
          barClassName,
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
