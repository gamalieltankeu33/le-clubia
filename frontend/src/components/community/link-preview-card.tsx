import { ExternalLink, Link2 } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Carte cliquable affichée dans un post quand `link_url` est présent.
 * Style : fond muted léger, icône Link à gauche, host + path tronqué.
 */
export function LinkPreviewCard({
  url,
  className,
  onClick,
}: {
  url: string
  className?: string
  /** Permet au parent (PostCard) de stopper la propagation du clic. */
  onClick?: (e: React.MouseEvent) => void
}) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => {
        e.stopPropagation()
        onClick?.(e)
      }}
      className={cn(
        'group flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--secondary)]/40 p-3 transition-colors hover:border-[var(--primary)]/30 hover:bg-[var(--secondary)]',
        className,
      )}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
        <Link2 className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--foreground)]">
        {formatLinkPreview(url)}
      </span>
      <ExternalLink className="h-3.5 w-3.5 shrink-0 text-[var(--muted-foreground)] transition-colors group-hover:text-[var(--foreground)]" />
    </a>
  )
}

/**
 * Renvoie "host{path tronqué}" pour affichage, sans le protocole.
 * Ex: "https://meet.google.com/abc-defg-hij?foo=1" → "meet.google.com/abc-defg-hij"
 */
export function formatLinkPreview(url: string): string {
  if (!url) return ''
  try {
    const u = new URL(url)
    const host = u.hostname.replace(/^www\./, '')
    const tail = (u.pathname + u.search + u.hash).replace(/\/$/, '')
    if (!tail || tail === '/') return host
    const truncated = tail.length > 30 ? tail.slice(0, 30) + '…' : tail
    return host + truncated
  } catch {
    return url.length > 60 ? url.slice(0, 60) + '…' : url
  }
}
