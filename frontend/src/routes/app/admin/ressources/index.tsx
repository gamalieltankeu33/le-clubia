import { useMemo, useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Edit3,
  Library,
  Loader2,
  Plus,
  Search,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'
import {
  RESOURCE_TYPES,
  RESOURCE_TYPE_LABELS,
  RESOURCE_TYPE_VISUAL,
} from '@/lib/resource-helpers'
import type { Resource, ResourceType } from '@/lib/database.types'
import { cn } from '@/lib/utils'
import { useConfirm } from '@/hooks/use-confirm'

export const Route = createFileRoute('/app/admin/ressources/')({
  component: AdminResourcesListPage,
})

async function fetchAllResources(): Promise<Resource[]> {
  const { data, error } = await supabase
    .from('resources')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Resource[]
}

function AdminResourcesListPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { confirm, ConfirmDialog } = useConfirm()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<ResourceType | null>(null)

  const query = useQuery({
    queryKey: ['admin-resources'],
    queryFn: fetchAllResources,
  })

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (query.data ?? []).filter((r) => {
      if (typeFilter && r.resource_type !== typeFilter) return false
      if (q && !r.title.toLowerCase().includes(q)) return false
      return true
    })
  }, [query.data, search, typeFilter])

  const deleteMutation = useMutation({
    mutationFn: async (resource: Resource) => {
      // Supprime les fichiers privés associés (nouveau file_url + legacy download_url)
      const paths = [resource.file_url, resource.download_url].filter(
        (p): p is string => Boolean(p),
      )
      if (paths.length > 0) {
        await supabase.storage.from('resource-files').remove(paths)
      }
      const { error } = await supabase
        .from('resources')
        .delete()
        .eq('id', resource.id)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Ressource supprimée.')
      queryClient.invalidateQueries({ queryKey: ['admin-resources'] })
      queryClient.invalidateQueries({ queryKey: ['member-resources'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
    },
    onError: () => toast.error('Suppression impossible.'),
  })

  async function handleDelete(resource: Resource) {
    const ok = await confirm({
      title: 'Supprimer cette ressource ?',
      contentPreview: resource.title,
      description:
        'La ressource ne sera plus visible par les membres. Si un fichier est attaché, il sera aussi supprimé du stockage.',
      confirmLabel: 'Supprimer',
      variant: 'destructive',
    })
    if (!ok) return
    deleteMutation.mutate(resource)
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 lg:py-14">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-wrap items-start justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/15 text-[var(--accent)]">
              <Library className="h-5 w-5" />
            </span>
            <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
              Admin — Ressources
            </h1>
          </div>
          <p className="mt-3 max-w-2xl text-[var(--muted-foreground)]">
            Crée et gère prompts, templates, guides PDF et liens vers les
            outils de ta bibliothèque.
          </p>
        </div>
        <Button asChild>
          <Link to="/app/admin/ressources/new">
            <Plus className="h-4 w-4" />
            Créer une ressource
          </Link>
        </Button>
      </motion.div>

      {/* Toolbar */}
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <Input
            type="search"
            placeholder="Rechercher par titre…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTypeFilter(null)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-xs transition-colors',
              !typeFilter
                ? 'border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]'
                : 'border-[var(--border)] bg-[var(--card)] hover:border-[var(--muted-foreground)]',
            )}
          >
            Tous
          </button>
          {RESOURCE_TYPES.map((t) => {
            const selected = typeFilter === t
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTypeFilter(selected ? null : t)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-xs transition-colors',
                  selected
                    ? 'border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]'
                    : 'border-[var(--border)] bg-[var(--card)] hover:border-[var(--muted-foreground)]',
                )}
              >
                {RESOURCE_TYPE_LABELS[t]}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-8">
        {query.isLoading ? (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 text-center text-sm text-[var(--muted-foreground)]">
            Chargement…
          </div>
        ) : query.isError ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-8 text-center">
            Impossible de charger les ressources.
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-12 text-center">
            <h2 className="font-display text-lg font-semibold">
              {query.data?.length === 0
                ? 'Aucune ressource'
                : 'Aucun résultat'}
            </h2>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              {query.data?.length === 0
                ? 'Crée la première ressource pour démarrer la bibliothèque.'
                : "Essaie d'élargir tes filtres."}
            </p>
            {query.data?.length === 0 && (
              <Button asChild className="mt-5">
                <Link to="/app/admin/ressources/new">
                  <Plus className="h-4 w-4" />
                  Créer une ressource
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
            <ul className="divide-y divide-[var(--border)]">
              {filtered.map((r) => {
                const visual = RESOURCE_TYPE_VISUAL[r.resource_type]
                const TypeIcon = visual.icon
                const isPdfType = r.resource_type !== 'tool_link'
                const needsMigration = isPdfType && !r.file_url
                return (
                  <li
                    key={r.id}
                    className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:gap-6"
                  >
                    <span
                      className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                        visual.chipBg,
                        visual.chipFg,
                      )}
                    >
                      <TypeIcon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
                            r.is_published
                              ? 'bg-[var(--accent)]/15 text-[var(--accent)]'
                              : 'bg-[var(--secondary)] text-[var(--muted-foreground)]',
                          )}
                        >
                          {r.is_published ? 'Publiée' : 'Brouillon'}
                        </span>
                        {needsMigration && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-800">
                            À migrer en PDF
                          </span>
                        )}
                        <span className="text-xs text-[var(--muted-foreground)]">
                          {RESOURCE_TYPE_LABELS[r.resource_type]} · {r.category}
                        </span>
                      </div>
                      <p className="mt-1 truncate font-medium">{r.title}</p>
                      {r.description && (
                        <p className="truncate text-xs text-[var(--muted-foreground)]">
                          {r.description}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          navigate({
                            to: '/app/admin/ressources/$id',
                            params: { id: r.id },
                          })
                        }
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        Éditer
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(r)}
                        disabled={deleteMutation.isPending}
                      >
                        {deleteMutation.isPending ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                        Supprimer
                      </Button>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </div>

      <ConfirmDialog />
    </div>
  )
}
