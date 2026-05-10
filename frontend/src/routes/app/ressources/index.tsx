import { useMemo, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Check,
  ExternalLink,
  Library,
  Search,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/shared/empty-state'
import { supabase } from '@/lib/supabase'
import {
  RESOURCE_CATEGORIES,
  RESOURCE_TYPES,
  RESOURCE_TYPE_LABELS,
  RESOURCE_TYPE_VISUAL,
  formatFileSize,
} from '@/lib/resource-helpers'
import type { Resource, ResourceType } from '@/lib/database.types'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/app/ressources/')({
  component: ResourcesLibraryPage,
})

async function fetchPublishedResources(): Promise<Resource[]> {
  const { data, error } = await supabase
    .from('resources')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Resource[]
}

function ResourcesLibraryPage() {
  const [search, setSearch] = useState('')
  const [selectedTypes, setSelectedTypes] = useState<ResourceType[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])

  const query = useQuery({
    queryKey: ['member-resources'],
    queryFn: fetchPublishedResources,
    staleTime: 5 * 60 * 1000,
  })

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (query.data ?? []).filter((r) => {
      if (q) {
        const hay = (r.title + ' ' + (r.description ?? '')).toLowerCase()
        if (!hay.includes(q)) return false
      }
      if (selectedTypes.length && !selectedTypes.includes(r.resource_type)) {
        return false
      }
      if (
        selectedCategories.length &&
        !selectedCategories.includes(r.category)
      ) {
        return false
      }
      return true
    })
  }, [query.data, search, selectedTypes, selectedCategories])

  function toggleType(t: ResourceType) {
    setSelectedTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    )
  }
  function toggleCategory(c: string) {
    setSelectedCategories((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
    )
  }
  function clearFilters() {
    setSearch('')
    setSelectedTypes([])
    setSelectedCategories([])
  }
  const hasActive =
    search.trim() !== '' ||
    selectedTypes.length > 0 ||
    selectedCategories.length > 0

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 lg:py-14">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
            <Library className="h-5 w-5" />
          </span>
          <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
            Bibliothèque de ressources
          </h1>
        </div>
        <p className="mt-3 max-w-2xl text-lg text-[var(--muted-foreground)]">
          Prompts, templates, guides PDF et liens vers les meilleurs outils.
          Cherchable, filtrable, téléchargeable.
        </p>
      </motion.div>

      {/* Search + filters */}
      <div className="mt-8 space-y-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <Input
            type="search"
            placeholder="Rechercher une ressource…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
            Type
          </span>
          {RESOURCE_TYPES.map((t) => {
            const selected = selectedTypes.includes(t)
            return (
              <button
                key={t}
                type="button"
                onClick={() => toggleType(t)}
                className={cn(
                  'flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors',
                  selected
                    ? 'border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]'
                    : 'border-[var(--border)] bg-[var(--card)] hover:border-[var(--muted-foreground)]',
                )}
              >
                {selected && <Check className="h-3 w-3" />}
                {RESOURCE_TYPE_LABELS[t]}
              </button>
            )
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
            Catégorie
          </span>
          {RESOURCE_CATEGORIES.map((c) => {
            const selected = selectedCategories.includes(c)
            return (
              <button
                key={c}
                type="button"
                onClick={() => toggleCategory(c)}
                className={cn(
                  'flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors',
                  selected
                    ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-foreground)]'
                    : 'border-[var(--border)] bg-[var(--card)] hover:border-[var(--muted-foreground)]',
                )}
              >
                {selected && <Check className="h-3 w-3" />}
                {c}
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

      {/* Results */}
      <div className="mt-10">
        {query.isLoading ? (
          <ResourcesSkeleton />
        ) : query.isError ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-10 text-center">
            <p className="text-sm text-[var(--muted-foreground)]">
              Impossible de charger la bibliothèque.
            </p>
          </div>
        ) : (query.data ?? []).length === 0 ? (
          <EmptyState
            icon={<Library className="h-7 w-7" />}
            title="Bibliothèque en construction"
            description="Les premières ressources arrivent bientôt."
          />
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
            {filtered.map((r) => (
              <ResourceCard key={r.id} resource={r} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ResourceCard({ resource }: { resource: Resource }) {
  const navigate = useNavigate()
  const visual = RESOURCE_TYPE_VISUAL[resource.resource_type]
  const TypeIcon = visual.icon
  const isTool = resource.resource_type === 'tool_link'

  // Pour un outil, on indique le domaine ; pour un PDF, la taille.
  let metaLine: string | null = null
  if (isTool && resource.external_url) {
    try {
      metaLine = new URL(resource.external_url).hostname.replace(/^www\./, '')
    } catch {
      metaLine = resource.external_url
    }
  } else if (resource.file_size_kb) {
    metaLine = `PDF · ${formatFileSize(resource.file_size_kb)}`
  } else if (resource.file_url || resource.download_url) {
    metaLine = 'PDF'
  }

  function handleOpen() {
    navigate({ to: '/app/ressources/$id', params: { id: resource.id } })
  }

  const actionLabel = isTool ? 'Visiter' : 'Voir'
  const ActionIcon = isTool ? ExternalLink : ArrowRight

  return (
    <article
      onClick={handleOpen}
      className="flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] transition-all duration-150 touch-manipulation hover:shadow-md active:scale-[0.98] active:bg-[var(--muted)]/30"
    >
      {resource.thumbnail_url ? (
        <div className="aspect-video w-full overflow-hidden">
          <img
            src={resource.thumbnail_url}
            alt={resource.title}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        </div>
      ) : (
        <div
          className={cn(
            'flex aspect-video w-full items-center justify-center',
            visual.chipBg,
          )}
        >
          <TypeIcon className={cn('h-10 w-10', visual.chipFg)} />
        </div>
      )}

      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
              visual.chipBg,
              visual.chipFg,
            )}
          >
            <TypeIcon className="h-3 w-3" />
            {RESOURCE_TYPE_LABELS[resource.resource_type]}
          </span>
          <span className="text-xs text-[var(--muted-foreground)]">
            {resource.category}
          </span>
        </div>

        <h3 className="mt-3 line-clamp-2 font-display text-lg font-semibold leading-snug">
          {resource.title}
        </h3>

        {resource.description && (
          <p className="mt-1.5 line-clamp-3 text-sm text-[var(--muted-foreground)]">
            {resource.description}
          </p>
        )}

        {metaLine && (
          <p className="mt-2 text-xs text-[var(--muted-foreground)]">
            {metaLine}
          </p>
        )}

        <div className="mt-auto pt-5">
          <Button
            type="button"
            variant="default"
            className="w-full"
            onClick={(e) => {
              e.stopPropagation()
              handleOpen()
            }}
          >
            <ActionIcon className="h-4 w-4" />
            {actionLabel}
          </Button>
        </div>
      </div>
    </article>
  )
}

function ResourcesSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]"
        >
          <div className="aspect-video animate-pulse bg-[var(--secondary)]" />
          <div className="space-y-3 p-5">
            <div className="h-4 w-24 animate-pulse rounded bg-[var(--secondary)]" />
            <div className="h-5 w-3/4 animate-pulse rounded bg-[var(--secondary)]" />
            <div className="h-4 w-full animate-pulse rounded bg-[var(--secondary)]" />
            <div className="h-9 w-full animate-pulse rounded bg-[var(--secondary)]" />
          </div>
        </div>
      ))}
    </div>
  )
}
