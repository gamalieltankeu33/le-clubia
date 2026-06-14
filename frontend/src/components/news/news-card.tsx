import { Link } from '@tanstack/react-router'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale/fr'
import { ExternalLink, Newspaper, Sparkles } from 'lucide-react'
import type { NewsArticle } from '@/lib/database.types'
import {
  getCategoryLabel,
  getCategoryVisual,
  markdownExcerpt,
  sourceHostname,
} from '@/lib/news-helpers'
import { cn } from '@/lib/utils'

export function NewsCard({ article }: { article: NewsArticle }) {
  const visual = getCategoryVisual(article.category)
  const date = article.published_at ?? article.created_at
  const host = sourceHostname(article.source_url)
  const excerpt = markdownExcerpt(article.content, 150)

  return (
    <Link
      to="/app/actualites/$slug"
      params={{ slug: article.slug }}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] transition-all duration-150 touch-manipulation hover:border-[var(--primary)]/30 hover:shadow-md active:scale-[0.98] active:bg-[var(--muted)]/30"
    >
      {/* Cover */}
      {article.cover_image_url ? (
        <div className="aspect-[16/9] w-full overflow-hidden">
          <img
            src={article.cover_image_url}
            alt={article.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </div>
      ) : (
        <div
          className={cn(
            'flex aspect-[16/9] items-center justify-center',
            visual.bg,
          )}
        >
          {article.category === 'weekly-recap' ? (
            <Sparkles className={cn('h-10 w-10', visual.fg)} />
          ) : (
            <Newspaper className={cn('h-10 w-10', visual.fg)} />
          )}
        </div>
      )}

      <div className="flex flex-1 flex-col p-5">
        <span
          className={cn(
            'self-start rounded-full px-2.5 py-0.5 text-xs font-medium',
            visual.bg,
            visual.fg,
          )}
        >
          {getCategoryLabel(article.category)}
        </span>

        <h3 className="mt-3 line-clamp-2 font-display text-lg font-semibold leading-snug">
          {article.title}
        </h3>

        {excerpt && (
          <p className="mt-1.5 line-clamp-3 text-sm text-[var(--muted-foreground)]">
            {excerpt}
          </p>
        )}

        <div className="mt-auto pt-4">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--muted-foreground)]">
            <span className="truncate">
              {article.author || 'Agent IA Le Club'}
            </span>
            {host && (
              <span className="inline-flex items-center gap-1">
                <span className="text-[var(--muted-foreground)]">·</span>
                <ExternalLink className="h-3 w-3" />
                {host}
              </span>
            )}
            <span className="ml-auto">
              {formatDistanceToNow(new Date(date), {
                addSuffix: true,
                locale: fr,
              })}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
