import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ArrowLeft, Clock, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { fetchNewsBySlug } from '@/lib/news-queries'
import {
  estimateReadMinutes,
  formatLongFrenchDate,
  getCategoryLabel,
  getCategoryVisual,
  sourceHostname,
} from '@/lib/news-helpers'
import { MarkdownRenderer } from '@/components/coach/markdown-renderer'
import { NewsCommentSection } from '@/components/news/news-comment-section'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/app/actualites/$slug')({
  component: NewsDetailPage,
})

function NewsDetailPage() {
  const { slug } = Route.useParams()

  const query = useQuery({
    queryKey: ['news-article', slug],
    queryFn: () => fetchNewsBySlug(slug),
    staleTime: 5 * 60 * 1000,
  })

  if (query.isLoading) {
    return <DetailSkeleton />
  }

  const article = query.data
  if (query.isError || !article) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Actualité introuvable
        </h1>
        <p className="mt-3 text-[var(--muted-foreground)]">
          Elle a peut-être été dépubliée ou son lien a changé.
        </p>
        <Button asChild className="mt-6">
          <Link to="/app/actualites">
            <ArrowLeft className="h-4 w-4" />
            Toutes les actualités
          </Link>
        </Button>
      </div>
    )
  }

  const visual = getCategoryVisual(article.category)
  const date = article.published_at ?? article.created_at
  const host = sourceHostname(article.source_url)
  const readMin = estimateReadMinutes(article.content)

  return (
    <div className="pb-16">
      {/* Cover hero (si présente) */}
      {article.cover_image_url && (
        <div className="relative">
          <div className="aspect-[16/6] max-h-[320px] w-full overflow-hidden">
            <img
              src={article.cover_image_url}
              alt={article.title}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="absolute inset-x-0 top-0 mx-auto max-w-3xl px-6 pt-5">
            <Button variant="outline" size="sm" asChild>
              <Link to="/app/actualites">
                <ArrowLeft className="h-4 w-4" />
                Toutes les actualités
              </Link>
            </Button>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-3xl px-6">
        {!article.cover_image_url && (
          <Button variant="outline" size="sm" asChild className="mt-10">
            <Link to="/app/actualites">
              <ArrowLeft className="h-4 w-4" />
              Toutes les actualités
            </Link>
          </Button>
        )}

        <motion.article
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={cn(
            article.cover_image_url
              ? '-mt-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm sm:p-6 md:p-10'
              : 'mt-8',
          )}
        >
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                'rounded-full px-2.5 py-0.5 text-xs font-medium',
                visual.bg,
                visual.fg,
              )}
            >
              {getCategoryLabel(article.category)}
            </span>
          </div>

          <h1 className="mt-3 font-display text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
            {article.title}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--muted-foreground)]">
            <span>{article.author || 'Agent IA Le Club'}</span>
            <span>·</span>
            <span className="first-letter:capitalize">
              {formatLongFrenchDate(date)}
            </span>
            <span>·</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {readMin} min de lecture
            </span>
            {host && article.source_url && (
              <>
                <span>·</span>
                <a
                  href={article.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[var(--primary)] hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  {host}
                </a>
              </>
            )}
          </div>

          {/* Contenu markdown */}
          <div className="prose mt-8 max-w-none text-base">
            <MarkdownRenderer content={article.content} />
          </div>

          {/* Source originale */}
          {article.source_url && (
            <div className="mt-10 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5 text-center">
              <p className="text-sm text-[var(--muted-foreground)]">
                Cette actualité a été résumée par l'Agent IA du Club.
              </p>
              <Button variant="outline" className="mt-4" asChild>
                <a
                  href={article.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4" />
                  Lire l'article original sur {host}
                </a>
              </Button>
            </div>
          )}
        </motion.article>

        {/* Commentaires */}
        <NewsCommentSection newsArticleId={article.id} />
      </div>
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="aspect-[16/6] max-h-[320px] animate-pulse rounded-2xl bg-[var(--secondary)]" />
      <div className="mt-8 space-y-4">
        <div className="h-4 w-24 animate-pulse rounded bg-[var(--secondary)]" />
        <div className="h-10 w-3/4 animate-pulse rounded bg-[var(--secondary)]" />
        <div className="h-4 w-full animate-pulse rounded bg-[var(--secondary)]" />
        <div className="h-4 w-full animate-pulse rounded bg-[var(--secondary)]" />
        <div className="h-4 w-5/6 animate-pulse rounded bg-[var(--secondary)]" />
      </div>
    </div>
  )
}
