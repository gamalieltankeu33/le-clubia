import { lazy, Suspense, useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  Bookmark,
  Image,
  Loader2,
  MessageSquare,
  Pencil,
  Sparkles,
  Video,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { AvatarDisplay } from '@/components/avatar-display'
import { useAuthStore } from '@/stores/auth-store'
import { supabase } from '@/lib/supabase'
import { fetchFeedPage } from '@/lib/community-queries'
import { PostCard, type FeedPost } from '@/components/community/post-card'
import { CommunityStatsPill } from '@/components/community/community-stats-pill'
import { FeedSkeleton } from '@/components/community/feed-skeleton'
import { EmptyState } from '@/components/shared/empty-state'
import { PullToRefresh } from '@/components/shared/pull-to-refresh'
import { htmlToPlainText } from '@/lib/sanitize-html'
import { useConfirm } from '@/hooks/use-confirm'

import { useIsChallengeUser, ChallengeLockedScreen } from '@/components/shared/premium-lock'

// PostComposerModal embarque Tiptap (~120 kB). On le lazy-load pour ne le
// télécharger qu'au moment où l'utilisateur clique "Créer un post".
const PostComposerModal = lazy(() =>
  import('@/components/community/post-composer-modal').then((m) => ({
    default: m.PostComposerModal,
  })),
)

export const Route = createFileRoute('/app/communaute/')({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      category: typeof search.category === 'string' ? search.category : undefined,
      filter: typeof search.filter === 'string' ? (search.filter as 'mine' | 'saved') : undefined,
    }
  },
  component: CommunityFeedPage,
})

function CommunityFeedPage() {
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const profile = useAuthStore((s) => s.profile)
  const isAdmin = useAuthStore((s) => s.isAdmin)()

  const [composerOpen, setComposerOpen] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const { confirm, ConfirmDialog } = useConfirm()

  const { category, filter } = Route.useSearch()

  const feed = useInfiniteQuery({
    queryKey: ['community-feed', user?.id ?? null, category, filter],
    queryFn: ({ pageParam = 0 }) =>
      fetchFeedPage(pageParam as number, user?.id ?? null, category, filter),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 30_000,
    // Évite tout fetch initial avec user=null (cas exceptionnel : si le
    // store auth n'est pas encore hydraté). Sinon on récupère les posts
    // avec liked_by_me=false partout, et l'utilisateur voit ses likes
    // disparaître après refresh.
    enabled: !!user,
  })

  const allPosts = useMemo<FeedPost[]>(
    () => feed.data?.pages.flatMap((p) => p.posts) ?? [],
    [feed.data],
  )

  const firstName =
    profile?.first_name?.trim() ||
    user?.email?.split('@')[0] ||
    'membre'

  const deleteMutation = useMutation({
    mutationFn: async (post: FeedPost) => {
      // Supprime l'image attachée si présente (best-effort).
      if (post.image_url) {
        const path = extractStoragePath(
          post.image_url,
          'post-images',
        )
        if (path) {
          await supabase.storage.from('post-images').remove([path])
        }
      }
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', post.id)
      if (error) throw error
    },
    // Optimistic delete : on retire le post du cache infini IMMÉDIATEMENT.
    // Si la requête échoue, on rollback la liste précédente.
    onMutate: async (post) => {
      setPendingDeleteId(post.id)
      const key = ['community-feed', user?.id ?? null]
      await queryClient.cancelQueries({ queryKey: key })
      const prev = queryClient.getQueryData(key)
      queryClient.setQueryData<{
        pages: { posts: FeedPost[]; nextCursor: number | null }[]
        pageParams: number[]
      }>(key, (data) => {
        if (!data) return data
        return {
          ...data,
          pages: data.pages.map((page) => ({
            ...page,
            posts: page.posts.filter((p) => p.id !== post.id),
          })),
        }
      })
      return { prev }
    },
    onSuccess: () => {
      toast.success('Post supprimé.')
      queryClient.invalidateQueries({
        queryKey: ['community-feed'],
      })
      queryClient.invalidateQueries({ queryKey: ['user-posts'] })
      queryClient.invalidateQueries({ queryKey: ['recent-posts'] })
    },
    onError: (_err, _vars, ctx) => {
      const key = ['community-feed', user?.id ?? null]
      if (ctx?.prev) queryClient.setQueryData(key, ctx.prev)
      toast.error('Suppression impossible. Réessaie.')
    },
    onSettled: () => setPendingDeleteId(null),
  })

  async function handleDelete(post: FeedPost) {
    const ok = await confirm({
      title: 'Supprimer cette publication ?',
      contentPreview: htmlToPlainText(post.content).slice(0, 160),
      description:
        'Le post, ses commentaires et ses likes seront définitivement supprimés.',
      confirmLabel: 'Supprimer',
      variant: 'destructive',
    })
    if (!ok) return
    deleteMutation.mutate(post)
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:py-12">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
        {/* COLONNE PRINCIPALE (FEED) */}
        <div className="space-y-6">
          
          {/* HEADER COMMUNAUTÉ */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col gap-4"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)]">
                <MessageSquare className="h-6 w-6" />
              </span>
              <div>
                <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl capitalize">
                  {filter === 'saved' ? 'Enregistrés' : filter === 'mine' ? 'Mes publications' : category ? category.replace('-', ' ') : 'Communauté'}
                </h1>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  {filter === 'saved' 
                    ? 'Retrouve ici les posts que tu as sauvegardés.' 
                    : filter === 'mine' 
                    ? 'Historique de tes contributions.' 
                    : category 
                    ? `Filtré par la catégorie ${category}.`
                    : 'Échange, partage et avance avec les membres du Club IA.'}
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center justify-between gap-4">
              <CommunityStatsPill className="mt-0" />
            </div>
          </motion.div>

          {/* COMPOSER ENTRYPOINT */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm transition-shadow hover:shadow-md">
            <button
              type="button"
              onClick={() => setComposerOpen(true)}
              className="group flex w-full items-center gap-3 text-left focus:outline-none"
            >
              <AvatarDisplay
                avatarUrl={profile?.avatar_url}
                firstName={profile?.first_name}
                lastName={profile?.last_name}
                email={user?.email}
                isVerified={profile?.is_verified ?? false}
                size="md"
              />
              <div className="flex-1 rounded-full bg-[var(--secondary)]/50 px-4 py-2.5 text-sm text-[var(--muted-foreground)] transition-colors group-hover:bg-[var(--secondary)]">
                Partage une idée, une question ou une victoire...
              </div>
            </button>
            <div className="mt-3.5 flex items-center gap-2 border-t border-[var(--border)]/60 pt-3 px-1">
              <button
                type="button"
                onClick={() => setComposerOpen(true)}
                className="flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold text-[var(--muted-foreground)] transition-colors hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
              >
                <Image className="h-4 w-4 text-sky-500" />
                <span className="hidden sm:inline">Photo</span>
              </button>
              <button
                type="button"
                onClick={() => setComposerOpen(true)}
                className="flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold text-[var(--muted-foreground)] transition-colors hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
              >
                <Video className="h-4 w-4 text-rose-500" />
                <span className="hidden sm:inline">Vidéo</span>
              </button>
            </div>
          </div>

          {/* NAVIGATION DU FEED */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide border-b border-[var(--border)]">
            <button className="whitespace-nowrap border-b-2 border-[var(--primary)] px-3 py-2 text-sm font-semibold text-[var(--foreground)]">
              Pour vous
            </button>
            <button className="whitespace-nowrap border-b-2 border-transparent px-3 py-2 text-sm font-medium text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]">
              Récent
            </button>
            <button className="whitespace-nowrap border-b-2 border-transparent px-3 py-2 text-sm font-medium text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]">
              Populaire
            </button>
            <button className="whitespace-nowrap border-b-2 border-transparent px-3 py-2 text-sm font-medium text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]">
              Sans réponse
            </button>
          </div>



      <PullToRefresh
        onRefresh={async () => {
          await feed.refetch()
        }}
        className="mt-4"
      >
        {feed.isLoading ? (
          <FeedSkeleton count={3} />
        ) : feed.isError ? (
          <ErrorBox onRetry={() => feed.refetch()} />
        ) : allPosts.length === 0 ? (
          <EmptyFeed onOpen={() => setComposerOpen(true)} filter={filter} category={category} />
        ) : (
          <div className="space-y-4">
            {allPosts.map((p) => (
              <PostCard
                key={p.id}
                post={p}
                currentUserId={user?.id ?? null}
                isAdmin={isAdmin}
                onDelete={handleDelete}
                pendingDelete={pendingDeleteId === p.id}
              />
            ))}

            {feed.hasNextPage && (
              <div className="flex justify-center pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => feed.fetchNextPage()}
                  disabled={feed.isFetchingNextPage}
                >
                  {feed.isFetchingNextPage ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Chargement…
                    </>
                  ) : (
                    'Charger plus'
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </PullToRefresh>
      
      </div> {/* Fin Colonne Principale */}

      </div> {/* Fin Grid */}

      {/* Suspense fallback rendu via null : le modal n'a pas besoin de
          fallback visible — il s'ouvre quand l'utilisateur clique le bouton.
          Le délai de chargement initial (~50-100ms) est imperceptible. */}
      <Suspense fallback={null}>
        <PostComposerModal
          open={composerOpen}
          onClose={() => setComposerOpen(false)}
          onPosted={() => {
            queryClient.invalidateQueries({ queryKey: ['community-feed'] })
            queryClient.invalidateQueries({ queryKey: ['recent-posts'] })
          }}
        />
      </Suspense>

      <ConfirmDialog />
    </div>
  )
}

function EmptyFeed({
  onOpen,
  filter,
  category,
}: {
  onOpen: () => void
  filter?: 'mine' | 'saved'
  category?: string
}) {
  if (filter === 'saved') {
    return (
      <EmptyState
        icon={<Bookmark className="h-8 w-8 text-amber-500" />}
        title="Aucun post enregistré"
        description="Tu n'as pas encore ajouté de publication à tes favoris."
      />
    )
  }

  if (filter === 'mine') {
    return (
      <EmptyState
        icon={<MessageSquare className="h-8 w-8" />}
        title="Aucune publication"
        description="Tu n'as pas encore partagé de post avec la communauté."
        cta={{ label: 'Publier maintenant', onClick: onOpen }}
      />
    )
  }

  if (category) {
    return (
      <EmptyState
        icon={<MessageSquare className="h-8 w-8" />}
        title={`Aucun post dans "${category.replace('-', ' ')}"`}
        description="Sois la première personne à publier dans cette catégorie."
        cta={{ label: 'Publier maintenant', onClick: onOpen }}
      />
    )
  }

  return (
    <EmptyState
      icon={<Sparkles className="h-8 w-8 text-[var(--primary)]" />}
      title="La communauté t'attend"
      description="Sois la première personne à briser la glace. Publie ton premier post."
      cta={{ label: 'Publier maintenant', onClick: onOpen }}
    />
  )
}

function ErrorBox({ onRetry }: { onRetry: () => void }) {
  return (
    <EmptyState
      icon={<AlertTriangle className="h-8 w-8 text-red-500" />}
      title="Oups, problème de connexion"
      description="Impossible de charger le fil d'actualité pour le moment."
      cta={{ label: 'Réessayer', onClick: onRetry }}
    />
  )
}

/** Extrait le path Supabase d'une URL publique du type ".../storage/v1/object/public/<bucket>/<path>". */
function extractStoragePath(publicUrl: string, bucket: string): string | null {
  const marker = `/storage/v1/object/public/${bucket}/`
  const idx = publicUrl.indexOf(marker)
  if (idx === -1) return null
  // Supprime un éventuel cache-buster `?v=...`
  return publicUrl.slice(idx + marker.length).split('?')[0]
}
