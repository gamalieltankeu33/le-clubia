import { useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale/fr'
import {
  Heart,
  Image as ImageIcon,
  Loader2,
  MessageSquare,
  Pin,
  PinOff,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { AvatarDisplay } from '@/components/avatar-display'
import { VerifiedBadge } from '@/components/verified-badge'
import { cn } from '@/lib/utils'
import { htmlToPlainText } from '@/lib/sanitize-html'
import { useConfirm } from '@/hooks/use-confirm'

export const Route = createFileRoute('/app/admin/community/')({
  component: AdminCommunityPage,
})

interface PostRow {
  id: string
  user_id: string
  content: string
  image_url: string | null
  link_url: string | null
  hashtags: string[]
  likes_count: number
  comments_count: number
  is_pinned: boolean
  created_at: string
  author: {
    first_name: string | null
    last_name: string | null
    email: string
    avatar_url: string | null
    is_verified: boolean
  } | null
}

async function fetchAllPosts(): Promise<PostRow[]> {
  // On fetch les posts puis on les hydrate avec l'auteur (pas de FK relationnelle
  // côté supabase-js explicite — on fait une 2e query simple).
  const { data: posts, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)
  if (error) throw error
  if (!posts || posts.length === 0) return []
  const userIds = Array.from(new Set(posts.map((p) => p.user_id as string)))
  const { data: authors } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, email, avatar_url, is_verified')
    .in('id', userIds)
  const byId = new Map<string, PostRow['author']>()
  for (const a of authors ?? []) {
    byId.set(a.id as string, {
      first_name: a.first_name as string | null,
      last_name: a.last_name as string | null,
      email: a.email as string,
      avatar_url: (a.avatar_url as string | null) ?? null,
      is_verified: Boolean(a.is_verified),
    })
  }
  return posts.map((p) => ({
    id: p.id as string,
    user_id: p.user_id as string,
    content: (p.content as string) ?? '',
    image_url: (p.image_url as string | null) ?? null,
    link_url: (p.link_url as string | null) ?? null,
    hashtags: ((p.hashtags as string[] | null) ?? []) as string[],
    likes_count: (p.likes_count as number) ?? 0,
    comments_count: (p.comments_count as number) ?? 0,
    is_pinned: Boolean(p.is_pinned),
    created_at: p.created_at as string,
    author: byId.get(p.user_id as string) ?? null,
  }))
}

type Filter = 'all' | 'with_image' | 'top_liked' | 'recent_24h'

function AdminCommunityPage() {
  const queryClient = useQueryClient()
  const { confirm, ConfirmDialog } = useConfirm()
  const [filter, setFilter] = useState<Filter>('all')

  const query = useQuery({
    queryKey: ['admin-community-posts'],
    queryFn: fetchAllPosts,
    staleTime: 30_000,
  })

  const filtered = useMemo(() => {
    const list = query.data ?? []
    if (filter === 'all') return list
    if (filter === 'with_image') return list.filter((p) => Boolean(p.image_url))
    if (filter === 'top_liked')
      return [...list].sort((a, b) => b.likes_count - a.likes_count)
    if (filter === 'recent_24h') {
      const cutoff = Date.now() - 24 * 60 * 60 * 1000
      return list.filter((p) => new Date(p.created_at).getTime() > cutoff)
    }
    return list
  }, [query.data, filter])

  const stats = useMemo(() => {
    const list = query.data ?? []
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const weekStart = new Date(Date.now() - 7 * 86400 * 1000)
    return {
      total: list.length,
      today: list.filter((p) => new Date(p.created_at) >= todayStart).length,
      week: list.filter((p) => new Date(p.created_at) >= weekStart).length,
    }
  }, [query.data])

  const deleteMutation = useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase.from('posts').delete().eq('id', postId)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Post supprimé.')
      queryClient.invalidateQueries({ queryKey: ['admin-community-posts'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
    },
    onError: () => toast.error('Suppression impossible.'),
  })

  const pinMutation = useMutation({
    mutationFn: async ({ postId, pinned }: { postId: string; pinned: boolean }) => {
      const { error } = await supabase
        .from('posts')
        .update({ is_pinned: pinned })
        .eq('id', postId)
      if (error) throw error
    },
    onSuccess: (_data, vars) => {
      toast.success(vars.pinned ? 'Post épinglé.' : 'Post désépinglé.')
      queryClient.invalidateQueries({ queryKey: ['admin-community-posts'] })
    },
    onError: () => toast.error('Action impossible.'),
  })

  async function handleDelete(post: PostRow) {
    const author =
      [post.author?.first_name, post.author?.last_name]
        .filter(Boolean)
        .join(' ') ||
      post.author?.email ||
      'ce membre'
    const ok = await confirm({
      title: `Supprimer ce post de ${author} ?`,
      contentPreview: htmlToPlainText(post.content).slice(0, 160),
      description:
        'Les likes et commentaires associés seront aussi supprimés. Action irréversible.',
      confirmLabel: 'Supprimer',
      variant: 'destructive',
    })
    if (!ok) return
    deleteMutation.mutate(post.id)
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10 lg:py-14">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/15 text-[var(--accent)]">
            <MessageSquare className="h-5 w-5" />
          </span>
          <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
            Modération de la communauté
          </h1>
        </div>
        <p className="mt-3 max-w-2xl text-[var(--muted-foreground)]">
          Vue d'ensemble des posts. Tu peux supprimer un post si nécessaire.
        </p>
      </motion.div>

      {/* Stats */}
      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <StatChip label="Posts au total" value={stats.total} />
        <StatChip label="Aujourd'hui" value={stats.today} />
        <StatChip label="Cette semaine" value={stats.week} />
      </div>

      {/* Filtres */}
      <div className="mt-6 flex flex-wrap gap-2">
        {(
          [
            ['all', 'Tous'],
            ['recent_24h', 'Récents (24h)'],
            ['with_image', 'Avec image'],
            ['top_liked', 'Plus likés'],
          ] as Array<[Filter, string]>
        ).map(([key, label]) => {
          const active = filter === key
          return (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
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

      <div className="mt-8 space-y-4">
        {query.isLoading ? (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 text-center text-sm text-[var(--muted-foreground)]">
            Chargement…
          </div>
        ) : query.isError ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-8 text-center">
            Impossible de charger les posts.
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-12 text-center">
            <MessageSquare className="mx-auto h-8 w-8 text-[var(--muted-foreground)]" />
            <h2 className="mt-4 font-display text-lg font-semibold">
              {(query.data?.length ?? 0) === 0
                ? "Pas encore de post"
                : 'Aucun résultat'}
            </h2>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              La fonctionnalité de publication côté membre arrivera dans une
              prochaine session.
            </p>
          </div>
        ) : (
          filtered.map((p) => {
            const fullName =
              [p.author?.first_name, p.author?.last_name]
                .filter(Boolean)
                .join(' ') ||
              p.author?.email ||
              'Membre'
            return (
              <article
                key={p.id}
                className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5"
              >
                <header className="flex items-start gap-3">
                  <AvatarDisplay
                    avatarUrl={p.author?.avatar_url}
                    firstName={p.author?.first_name}
                    lastName={p.author?.last_name}
                    email={p.author?.email}
                    isVerified={p.author?.is_verified ?? false}
                    size="md"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="inline-flex items-center gap-1 truncate font-medium">
                      {fullName}
                      {p.author?.is_verified && (
                        <VerifiedBadge className="h-3.5 w-3.5 shrink-0" />
                      )}
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {formatDistanceToNow(new Date(p.created_at), {
                        addSuffix: true,
                        locale: fr,
                      })}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(p)}
                    disabled={deleteMutation.isPending}
                  >
                    {deleteMutation.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                    Supprimer
                  </Button>
                  <Button
                    variant={p.is_pinned ? 'accent' : 'outline'}
                    size="sm"
                    onClick={() => pinMutation.mutate({ postId: p.id, pinned: !p.is_pinned })}
                    disabled={pinMutation.isPending}
                  >
                    {pinMutation.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : p.is_pinned ? (
                      <PinOff className="h-3.5 w-3.5" />
                    ) : (
                      <Pin className="h-3.5 w-3.5" />
                    )}
                    {p.is_pinned ? 'Désépingler' : 'Épingler'}
                  </Button>
                </header>
                {p.is_pinned && (
                  <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-[var(--accent)]">
                    <Pin className="h-3 w-3" />
                    Épinglé en haut du flux
                  </div>
                )}
                <div className="mt-3 whitespace-pre-wrap text-sm">
                  {p.content}
                </div>
                {p.image_url && (
                  <div className="mt-3 overflow-hidden rounded-xl border border-[var(--border)]">
                    <img
                      src={p.image_url}
                      alt=""
                      className="max-h-80 w-full object-cover"
                    />
                  </div>
                )}
                <footer className="mt-4 flex flex-wrap items-center gap-4 text-xs text-[var(--muted-foreground)]">
                  <span className="inline-flex items-center gap-1">
                    <Heart className="h-3.5 w-3.5" />
                    {p.likes_count} like{p.likes_count > 1 ? 's' : ''}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MessageSquare className="h-3.5 w-3.5" />
                    {p.comments_count} commentaire
                    {p.comments_count > 1 ? 's' : ''}
                  </span>
                  {p.image_url && (
                    <span className="inline-flex items-center gap-1">
                      <ImageIcon className="h-3.5 w-3.5" />
                      Image
                    </span>
                  )}
                  {p.hashtags.length > 0 && (
                    <span className="truncate">
                      {p.hashtags.map((h) => `#${h}`).join(' ')}
                    </span>
                  )}
                </footer>
              </article>
            )
          })
        )}
      </div>

      <ConfirmDialog />
    </div>
  )
}

function StatChip({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
        {label}
      </p>
      <p className="mt-2 font-display text-2xl font-semibold tabular-nums">
        {value.toLocaleString('fr-FR')}
      </p>
    </div>
  )
}
