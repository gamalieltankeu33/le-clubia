import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Edit3,
  Loader2,
  Plus,
  Settings,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import type { Formation } from '@/lib/database.types'
import { LEVEL_LABELS } from '@/lib/formation-helpers'
import { cn } from '@/lib/utils'
import { useConfirm } from '@/hooks/use-confirm'

export const Route = createFileRoute('/app/admin/formations/')({
  component: AdminFormationsListPage,
})

interface AdminFormationRow extends Formation {
  chapter_count: number
}

async function fetchAllFormations(): Promise<AdminFormationRow[]> {
  const { data, error } = await supabase
    .from('formations')
    .select('*, formation_chapters(count)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((f) => {
    const withCount = f as unknown as Formation & {
      formation_chapters: { count: number }[]
    }
    return {
      ...(f as Formation),
      chapter_count: withCount.formation_chapters?.[0]?.count ?? 0,
    }
  })
}

function AdminFormationsListPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { confirm, ConfirmDialog } = useConfirm()

  const query = useQuery({
    queryKey: ['admin-formations'],
    queryFn: fetchAllFormations,
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('formations').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Formation supprimée.')
      queryClient.invalidateQueries({ queryKey: ['admin-formations'] })
      queryClient.invalidateQueries({ queryKey: ['formations', 'catalog'] })
    },
    onError: () => toast.error('Suppression impossible. Réessaie.'),
  })

  async function handleDelete(row: AdminFormationRow) {
    const ok = await confirm({
      title: 'Supprimer cette formation ?',
      contentPreview: row.title,
      description:
        'Tous les chapitres et la progression des membres sur cette formation seront définitivement supprimés.',
      confirmLabel: 'Supprimer',
      variant: 'destructive',
    })
    if (!ok) return
    deleteMutation.mutate(row.id)
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 lg:py-14">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-start justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/15 text-[var(--accent)]">
              <Settings className="h-5 w-5" />
            </span>
            <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
              Admin — Formations
            </h1>
          </div>
          <p className="mt-3 max-w-2xl text-[var(--muted-foreground)]">
            Crée, édite et publie les formations du Club. Les brouillons ne
            sont visibles que pour toi.
          </p>
        </div>
        <Button asChild>
          <Link to="/app/admin/formations/new">
            <Plus className="h-4 w-4" />
            Créer une formation
          </Link>
        </Button>
      </motion.div>

      <div className="mt-10">
        {query.isLoading ? (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 text-center text-sm text-[var(--muted-foreground)]">
            Chargement…
          </div>
        ) : query.isError ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-8 text-center text-sm">
            Impossible de charger les formations.
          </div>
        ) : query.data?.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-12 text-center">
            <h2 className="font-display text-lg font-semibold">
              Aucune formation pour l'instant
            </h2>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              Crée la première pour démarrer le catalogue.
            </p>
            <Button asChild className="mt-5">
              <Link to="/app/admin/formations/new">
                <Plus className="h-4 w-4" />
                Créer une formation
              </Link>
            </Button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
            <ul className="divide-y divide-[var(--border)]">
              {query.data?.map((row) => (
                <li
                  key={row.id}
                  className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:gap-6"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
                          row.is_published
                            ? 'bg-[var(--accent)]/15 text-[var(--accent)]'
                            : 'bg-[var(--secondary)] text-[var(--muted-foreground)]',
                        )}
                      >
                        {row.is_published ? 'Publié' : 'Brouillon'}
                      </span>
                      <span className="text-xs text-[var(--muted-foreground)]">
                        {row.category}
                      </span>
                      <span className="text-xs text-[var(--muted-foreground)]">
                        · {LEVEL_LABELS[row.level]}
                      </span>
                      <span className="text-xs text-[var(--muted-foreground)]">
                        · {row.chapter_count} chapitre
                        {row.chapter_count > 1 ? 's' : ''}
                      </span>
                    </div>
                    <p className="mt-1 truncate font-medium">{row.title}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      /{row.slug}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        navigate({
                          to: '/app/admin/formations/$id',
                          params: { id: row.id },
                        })
                      }
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      Éditer
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(row)}
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
              ))}
            </ul>
          </div>
        )}
      </div>

      <ConfirmDialog />
    </div>
  )
}
