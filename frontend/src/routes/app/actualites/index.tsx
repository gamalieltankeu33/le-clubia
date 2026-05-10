import { useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Check, Newspaper, Search, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/shared/empty-state'
import { PullToRefresh } from '@/components/shared/pull-to-refresh'
import { fetchPublishedNews } from '@/lib/news-queries'
import { NEWS_CATEGORIES, getCategoryLabel } from '@/lib/news-helpers'
import { NewsCard } from '@/components/news/news-card'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/app/actualites/')({
  component: NewsFeedPage,
})

function NewsFeedPage() {
  const [search, setSearch] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])

  const query = useQuery({
    queryKey: ['news-published'],
    queryFn: fetchPublishedNews,
    staleTime: 5 * 60 * 1000,
  })

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (query.data ?? []).filter((a) => {
      if (selectedCategories.length && !selectedCategories.includes(a.category)) {
        return false
      }
      if (q) {
        const hay = (a.title + ' ' + a.content).toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [query.data, search, selectedCategories])

  function toggleCategory(c: string) {
    setSelectedCategories((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
    )
  }
  function clearFilters() {
    setSearch('')
    setSelectedCategories([])
  }
  const hasActive = search.trim() !== '' || selectedCategories.length > 0

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 lg:py-14">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
            <Newspaper className="h-5 w-5" />
          </span>
          <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
            Actualités IA
          </h1>
        </div>
        <p className="mt-3 max-w-2xl text-lg text-[var(--muted-foreground)]">
          Toute l'actu IA résumée en français, mise à jour automatiquement
          plusieurs fois par jour.
        </p>
      </motion.div>

      {/* Toolbar */}
      <div className="mt-8 space-y-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <Input
            type="search"
            placeholder="Rechercher dans les actualités…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
            Catégories
          </span>
          {NEWS_CATEGORIES.map((cat) => {
            const selected = selectedCategories.includes(cat)
            return (
              <button
                key={cat}
                type="button"
                onClick={() => toggleCategory(cat)}
                className={cn(
                  'flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors',
                  selected
                    ? 'border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]'
                    : 'border-[var(--border)] bg-[var(--card)] hover:border-[var(--muted-foreground)]',
                )}
              >
                {selected && <Check className="h-3 w-3" />}
                {getCategoryLabel(cat)}
              </button>
            )
          })}
          {hasActive && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="ml-auto"
            >
              <X className="h-3.5 w-3.5" />
              Réinitialiser
            </Button>
          )}
        </div>
      </div>

      <PullToRefresh
        onRefresh={async () => {
          await query.refetch()
        }}
        className="mt-10"
      >
        {query.isLoading ? (
          <NewsSkeleton />
        ) : query.isError ? (
          <ErrorState onRetry={() => query.refetch()} />
        ) : (query.data ?? []).length === 0 ? (
          <EmptyAgent />
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-12 text-center">
            <h2 className="font-display text-lg font-semibold">
              Aucun résultat
            </h2>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              Essaie d'élargir ta recherche ou de retirer des filtres.
            </p>
            <Button variant="outline" className="mt-5" onClick={clearFilters}>
              Réinitialiser les filtres
            </Button>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((a) => (
              <NewsCard key={a.id} article={a} />
            ))}
          </div>
        )}
      </PullToRefresh>
    </div>
  )
}

function NewsSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]"
        >
          <div className="aspect-[16/9] animate-pulse bg-[var(--secondary)]" />
          <div className="space-y-3 p-5">
            <div className="h-4 w-24 animate-pulse rounded bg-[var(--secondary)]" />
            <div className="h-5 w-3/4 animate-pulse rounded bg-[var(--secondary)]" />
            <div className="h-4 w-full animate-pulse rounded bg-[var(--secondary)]" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-[var(--secondary)]" />
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyAgent() {
  return (
    <EmptyState
      icon={<Sparkles className="h-7 w-7" />}
      title="Les premières actualités arrivent"
      description="L'agent IA est en train de les chercher. Reviens d'ici quelques heures."
    />
  )
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-12 text-center">
      <p className="text-sm text-[var(--muted-foreground)]">
        Impossible de charger les actualités.
      </p>
      <Button variant="outline" className="mt-4" onClick={onRetry}>
        Réessayer
      </Button>
    </div>
  )
}
