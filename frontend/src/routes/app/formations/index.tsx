import { useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Check, GraduationCap, Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/empty-state'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth-store'
import { useLoadingTimeout } from '@/hooks/use-loading-timeout'
import {
  FORMATION_CATEGORIES,
  LEVELS,
  LEVEL_LABELS,
} from '@/lib/formation-helpers'
import type { Formation, FormationLevel } from '@/lib/database.types'
import {
  FormationCard,
  type FormationCardData,
} from '@/components/formations/formation-card'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/app/formations/')({
  component: FormationsCatalogPage,
})

interface FormationWithProgressRow extends Formation {
  total_chapters: number
  completed_chapters: number
  progress_percent: number
  has_started: boolean
}

async function fetchFormationsWithProgress(): Promise<FormationCardData[]> {
  // RPC créée en migration 0036 : 1 round-trip, calcul DB-side, scope user
  // automatique via auth.uid() (SECURITY DEFINER + filtre WHERE user_id).
  // @ts-expect-error - RPC custom non typée dans Database['public']['Functions']
  const { data, error } = await supabase.rpc('get_formations_with_progress')
  if (error) throw error
  return ((data ?? []) as FormationWithProgressRow[]).map((row) => ({
    ...row,
    chapter_count: row.total_chapters,
    completed_count: row.completed_chapters,
    progress_percent: row.progress_percent,
    has_started: row.has_started,
  }))
}

function FormationsCatalogPage() {
  const userId = useAuthStore((s) => s.user?.id)
  const [search, setSearch] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedLevel, setSelectedLevel] = useState<FormationLevel | null>(
    null,
  )

  const formationsQuery = useQuery({
    queryKey: ['formations', 'catalog', userId ?? 'anon'],
    queryFn: fetchFormationsWithProgress,
    staleTime: 5 * 60 * 1000,
  })

  const formations = formationsQuery.data ?? []

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return formations.filter((f) => {
      if (q && !f.title.toLowerCase().includes(q) &&
          !(f.description?.toLowerCase().includes(q))) {
        return false
      }
      if (selectedCategories.length > 0 &&
          !selectedCategories.includes(f.category)) {
        return false
      }
      if (selectedLevel && f.level !== selectedLevel) return false
      return true
    })
  }, [formations, search, selectedCategories, selectedLevel])

  function toggleCategory(cat: string) {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    )
  }

  function clearFilters() {
    setSearch('')
    setSelectedCategories([])
    setSelectedLevel(null)
  }

  const hasActiveFilters =
    search.trim() !== '' ||
    selectedCategories.length > 0 ||
    selectedLevel !== null

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 lg:py-14">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
            <GraduationCap className="h-5 w-5" />
          </span>
          <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
            Catalogue de formations
          </h1>
        </div>
        <p className="mt-3 max-w-2xl text-lg text-[var(--muted-foreground)]">
          Explore toutes les formations IA et choisis ta prochaine compétence.
        </p>
      </motion.div>

      {/* Search + filters */}
      <div className="mt-8 space-y-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <Input
            type="search"
            placeholder="Rechercher une formation…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
              Catégories
            </span>
            {FORMATION_CATEGORIES.map((cat) => {
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
                      : 'border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:border-[var(--muted-foreground)]',
                  )}
                >
                  {selected && <Check className="h-3 w-3" />}
                  {cat}
                </button>
              )
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
              Niveau
            </span>
            {LEVELS.map((lvl) => {
              const selected = selectedLevel === lvl
              return (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setSelectedLevel(selected ? null : lvl)}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs transition-colors',
                    selected
                      ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-foreground)]'
                      : 'border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:border-[var(--muted-foreground)]',
                  )}
                >
                  {LEVEL_LABELS[lvl]}
                </button>
              )
            })}

            {hasActiveFilters && (
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
      </div>

      {/* Results */}
      <div className="mt-10">
        {formationsQuery.isLoading ? (
          <CatalogSkeleton />
        ) : formationsQuery.isError ? (
          <ErrorState
            message="Impossible de charger le catalogue. Réessaie."
            onRetry={() => formationsQuery.refetch()}
          />
        ) : formations.length === 0 ? (
          <EmptyCatalog />
        ) : filtered.length === 0 ? (
          <NoResults onClear={clearFilters} />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((f) => (
              <FormationCard key={f.id} formation={f} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function CatalogSkeleton() {
  const timedOut = useLoadingTimeout(12_000)

  if (timedOut) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-10 text-center">
        <p className="text-sm text-[var(--muted-foreground)]">
          Le chargement prend plus de temps que prévu…
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="text-sm font-semibold text-[var(--primary)] underline-offset-4 hover:underline"
        >
          Recharger la page
        </button>
      </div>
    )
  }

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
            <div className="h-3 w-1/2 animate-pulse rounded bg-[var(--secondary)]" />
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyCatalog() {
  return (
    <EmptyState
      icon={<GraduationCap className="h-7 w-7" />}
      title="Bientôt disponibles"
      description="Le catalogue se prépare. Reviens dans quelques jours."
    />
  )
}

function NoResults({ onClear }: { onClear: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-12 text-center">
      <h2 className="font-display text-lg font-semibold">
        Aucune formation ne correspond
      </h2>
      <p className="mt-2 text-sm text-[var(--muted-foreground)]">
        Essaie d'élargir ta recherche ou de retirer des filtres.
      </p>
      <Button variant="outline" className="mt-5" onClick={onClear}>
        Réinitialiser les filtres
      </Button>
    </div>
  )
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string
  onRetry: () => void
}) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-12 text-center">
      <p className="text-sm text-[var(--muted-foreground)]">{message}</p>
      <Button variant="outline" className="mt-4" onClick={onRetry}>
        Réessayer
      </Button>
    </div>
  )
}
