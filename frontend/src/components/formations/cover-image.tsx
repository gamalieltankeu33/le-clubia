import { GraduationCap } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Cover image avec fallback gradient si null. */
export function CoverImage({
  src,
  alt,
  className,
  ratio = 'aspect-video',
}: {
  src?: string | null
  alt: string
  className?: string
  ratio?: string
}) {
  if (src) {
    return (
      <div className={cn('relative overflow-hidden', ratio, className)}>
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
    )
  }
  return (
    <div
      className={cn(
        'relative overflow-hidden bg-gradient-to-br from-[var(--primary)] to-[#3858d8]',
        ratio,
        className,
      )}
      aria-label={alt}
    >
      <span
        aria-hidden="true"
        className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[var(--accent)]/40 blur-2xl"
      />
      <GraduationCap className="absolute right-4 top-4 h-6 w-6 text-white/40" />
    </div>
  )
}
