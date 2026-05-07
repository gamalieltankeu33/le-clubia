import { useMemo, useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  CalendarClock,
  Edit3,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Newspaper,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'
import { fetchAllNews } from '@/lib/news-queries'
import {
  NEWS_CATEGORIES,
  getCategoryLabel,
  getCategoryVisual,
} from '@/lib/news-helpers'
import type { NewsArticle } from '@/lib/database.types'
import { cn } from '@/lib/utils'
import { useConfirm } from '@/hooks/use-confirm'
import { LaunchNewsAgentDialog } from '@/components/news/launch-news-agent-dialog'

export const Route = createFileRoute('/app/admin/actualites/')({
  component: AdminNewsListPage,
})

type StatusFilter = 'all' | 'published' | 'drafts'

function AdminNewsListPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { confirm, ConfirmDialog } = useConfirm()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [launchDialogOpen, setLaunchDialogOpen] = useState(false)

  // Appel manuel de l'edge function news-agent-manual. Le bouton lance
  // une recherche RSS 48h + génère 1 article focus via OpenAI. Durée
  // typique : 30-60s.
  async function handleLaunchAgent({ sendEmail }: { sendEmail: boolean }) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
    const session = (await supabase.auth.getSession()).data.session
    if (!session?.access_token) {
      toast.error('Session expirée. Reconnecte-toi.')
      return
    }
    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/news-agent-manual`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ send_email: sendEmail, force: true }),
      })
      const json = (await res.json()) as {
        ok?: boolean
        article_title?: string
        email_sent_count?: number
        reason?: string
        suggestion?: string
        error?: string
      }
      if (!res.ok) {
        toast.error(json.error ?? `Erreur HTTP ${res.status}`)
        return
      }
      if (json.ok) {
        const emailNote =
          sendEmail && (json.email_sent_count ?? 0) > 0
            ? ` Email envoyé à ${json.email_sent_count} membre${(json.email_sent_count ?? 0) > 1 ? 's' : ''}.`
            : ''
        toast.success(
          `✓ Article publié — "${(json.article_title ?? '').slice(0, 60)}${(json.article_title ?? '').length > 60 ? '…' : ''}"${emailNote}`,
        )
        queryClient.invalidateQueries({ queryKey: ['admin-news'] })
        queryClient.invalidateQueries({ queryKey: ['news-published'] })
      } else if (json.reason) {
        // Cas "pas assez d'actus" ou autre raison métier — toast info
        // (sonner.warning au lieu de error).
        toast.warning(
          `ℹ️ ${json.reason}${json.suggestion ? ` ${json.suggestion}` : ''}`,
        )
      } else {
        toast.error(json.error ?? 'La recherche a échoué.')
      }
    } catch (err) {
      console.error('[admin-news] launch agent error:', err)
      toast.error(
        err instanceof Error
          ? `Lancement impossible : ${err.message}`
          : 'Lancement impossible.',
      )
    }
  }

  const query = useQuery({
    queryKey: ['admin-news'],
    queryFn: fetchAllNews,
  })

  const deleteMutation = useMutation({
    mutationFn: async (article: NewsArticle) => {
      const { error } = await supabase
        .from('news_articles')
        .delete()
        .eq('id', article.id)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Article supprimé.')
      queryClient.invalidateQueries({ queryKey: ['admin-news'] })
      queryClient.invalidateQueries({ queryKey: ['news-published'] })
    },
    onError: () => toast.error('Suppression impossible.'),
  })

  const togglePublishMutation = useMutation({
    mutationFn: async (article: NewsArticle) => {
      const next = !article.is_published
      const { error } = await supabase
        .from('news_articles')
        .update({
          is_published: next,
          published_at: next
            ? article.published_at ?? new Date().toISOString()
            : article.published_at,
        })
        .eq('id', article.id)
      if (error) throw error
    },
    onSuccess: (_data, article) => {
      toast.success(article.is_published ? 'Article dépublié.' : 'Article publié.')
      queryClient.invalidateQueries({ queryKey: ['admin-news'] })
      queryClient.invalidateQueries({ queryKey: ['news-published'] })
    },
    onError: () => toast.error('Modification impossible.'),
  })

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (query.data ?? []).filter((a) => {
      if (statusFilter === 'published' && !a.is_published) return false
      if (statusFilter === 'drafts' && a.is_published) return false
      if (categoryFilter && a.category !== categoryFilter) return false
      if (q && !(a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q))) {
        return false
      }
      return true
    })
  }, [query.data, search, statusFilter, categoryFilter])

  async function handleDelete(article: NewsArticle) {
    const ok = await confirm({
      title: 'Supprimer cet article ?',
      contentPreview: article.title,
      description:
        "L'article et son image de couverture seront supprimés. Les commentaires associés resteront archivés en base mais ne seront plus accessibles.",
      confirmLabel: 'Supprimer',
      variant: 'destructive',
    })
    if (!ok) return
    deleteMutation.mutate(article)
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
              <Newspaper className="h-5 w-5" />
            </span>
            <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
              Admin — Actualités
            </h1>
          </div>
          <p className="mt-3 max-w-2xl text-[var(--muted-foreground)]">
            Gère le flux d'actualités IA. Le récap hebdo est publié
            automatiquement par l'agent IA, et tu peux créer/éditer
            manuellement quand tu veux entre deux récaps.
          </p>
        </div>
        <Button asChild>
          <Link to="/app/admin/actualites/new">
            <Plus className="h-4 w-4" />
            Créer manuellement
          </Link>
        </Button>
      </motion.div>

      {/* Bandeau info récap hebdo + bouton lancement manuel */}
      <div className="mt-8 flex flex-wrap items-start gap-4 rounded-xl border border-[var(--primary)]/20 bg-[var(--primary)]/5 p-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
          <CalendarClock className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1 text-sm">
          <p className="font-medium text-[var(--foreground)]">
            Récap hebdomadaire automatique
          </p>
          <p className="mt-0.5 text-[var(--muted-foreground)]">
            Le récap des actualités IA marquantes de la semaine est publié
            chaque <strong>dimanche à 9h UTC</strong> par notre agent IA, à
            partir de 12 sources internationales et francophones. Tu peux
            aussi <strong>déclencher manuellement</strong> la recherche
            d'une actu chaude des dernières 48h.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => setLaunchDialogOpen(true)}
          className="shrink-0"
        >
          <Sparkles className="h-4 w-4" />
          Lancer l'agent IA maintenant
        </Button>
      </div>

      {/* Toolbar */}
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <Input
            type="search"
            placeholder="Rechercher par titre ou contenu…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ['all', 'Tous'],
              ['published', 'Publiés'],
              ['drafts', 'Brouillons'],
            ] as Array<[StatusFilter, string]>
          ).map(([key, label]) => {
            const active = statusFilter === key
            return (
              <button
                key={key}
                type="button"
                onClick={() => setStatusFilter(key)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-xs transition-colors',
                  active
                    ? 'border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]'
                    : 'border-[var(--border)] bg-[var(--card)] hover:border-[var(--muted-foreground)]',
                )}
              >
                {label}
              </button>
            )
          })}
        </div>
        <select
          value={categoryFilter ?? ''}
          onChange={(e) =>
            setCategoryFilter(e.target.value ? e.target.value : null)
          }
          className="h-9 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 text-xs"
        >
          <option value="">Toutes catégories</option>
          {NEWS_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {getCategoryLabel(c)}
            </option>
          ))}
        </select>
        {(search || statusFilter !== 'all' || categoryFilter) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch('')
              setStatusFilter('all')
              setCategoryFilter(null)
            }}
          >
            <X className="h-3.5 w-3.5" />
            Réinitialiser
          </Button>
        )}
      </div>

      {/* Liste */}
      <div className="mt-8">
        {query.isLoading ? (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 text-center text-sm text-[var(--muted-foreground)]">
            Chargement…
          </div>
        ) : query.isError ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-8 text-center">
            Impossible de charger les actualités.
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-12 text-center">
            <p className="text-sm text-[var(--muted-foreground)]">
              {(query.data?.length ?? 0) === 0
                ? "Pas encore d'article. Le récap hebdo arrive dimanche, ou crée-en un manuellement."
                : 'Aucun résultat.'}
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
            <ul className="divide-y divide-[var(--border)]">
              {filtered.map((a) => {
                const visual = getCategoryVisual(a.category)
                return (
                  <li
                    key={a.id}
                    className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:gap-5"
                  >
                    <div className="h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-[var(--secondary)]">
                      {a.cover_image_url ? (
                        <img
                          src={a.cover_image_url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[var(--muted-foreground)]">
                          <ImageIcon className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
                            a.is_published
                              ? 'bg-[var(--accent)]/15 text-[var(--accent)]'
                              : 'bg-[var(--secondary)] text-[var(--muted-foreground)]',
                          )}
                        >
                          {a.is_published ? 'Publié' : 'Brouillon'}
                        </span>
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-[10px] font-medium',
                            visual.bg,
                            visual.fg,
                          )}
                        >
                          {getCategoryLabel(a.category)}
                        </span>
                        {a.author && (
                          <span className="text-[10px] text-[var(--muted-foreground)]">
                            {a.author}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 truncate font-medium">{a.title}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        /{a.slug}
                        {a.published_at && (
                          <>
                            {' · '}
                            {new Date(a.published_at).toLocaleDateString(
                              'fr-FR',
                              {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              },
                            )}
                          </>
                        )}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => togglePublishMutation.mutate(a)}
                        disabled={togglePublishMutation.isPending}
                      >
                        {a.is_published ? (
                          <EyeOff className="h-3.5 w-3.5" />
                        ) : (
                          <Eye className="h-3.5 w-3.5" />
                        )}
                        {a.is_published ? 'Dépublier' : 'Publier'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          navigate({
                            to: '/app/admin/actualites/$id',
                            params: { id: a.id },
                          })
                        }
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        Éditer
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(a)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
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

      <LaunchNewsAgentDialog
        isOpen={launchDialogOpen}
        onClose={() => setLaunchDialogOpen(false)}
        onConfirm={handleLaunchAgent}
      />
      <ConfirmDialog />
    </div>
  )
}
