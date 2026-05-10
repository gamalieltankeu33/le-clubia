import { lazy, Suspense, useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Loader2,
  MessageSquare,
  Pencil,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { AvatarDisplay } from '@/components/avatar-display'
import { useAuthStore } from '@/stores/auth-store'
import { supabase } from '@/lib/supabase'
import { fetchFeedPage } from '@/lib/community-queries'
import { PostCard, type FeedPost } from '@/components/community/post-card'
import { FeedSkeleton } from '@/components/community/feed-skeleton'
import { EmptyState } from '@/components/shared/empty-state'
import { PullToRefresh } from '@/components/shared/pull-to-refresh'
import { htmlToPlainText } from '@/lib/sanitize-html'
import { useConfirm } from '@/hooks/use-confirm'

// PostComposerModal embarque Tiptap (~120 kB). On le lazy-load pour ne le
// télécharger qu'au moment où l'utilisateur clique "Créer un post".
const PostComposerModal = lazy(() =>
  import('@/components/community/post-composer-modal').then((m) => ({
    default: m.PostComposerModal,
  })),
)

export const Route = createFileRoute('/app/communaute/')({
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

  const feed = useInfiniteQuery({
    queryKey: ['community-feed', user?.id ?? null],
    queryFn: ({ pageParam = 0 }) =>
      fetchFeedPage(pageParam as number, user?.id ?? null),
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
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:py-14">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
            <MessageSquare className="h-5 w-5" />
          </span>
          <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl">
            Communauté
          </h1>
        </div>
        <p className="mt-3 text-lg text-[var(--muted-foreground)]">
          Le fil de tous les membres du Club IA.
        </p>
      </motion.div>

      {/* Composer entrypoint */}
      <button
        type="button"
        onClick={() => setComposerOpen(true)}
        className="mt-8 flex w-full items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 text-left transition-colors hover:border-[var(--primary)]/30 hover:shadow-sm"
      >
        <AvatarDisplay
          avatarUrl={profile?.avatar_url}
          firstName={profile?.first_name}
          lastName={profile?.last_name}
          email={user?.email}
          isVerified={profile?.is_verified ?? false}
          size="md"
        />
        <span className="flex-1 text-sm text-[var(--muted-foreground)]">
          Quoi de neuf, {firstName}&nbsp;?
        </span>
        <span className="hidden items-center gap-1.5 rounded-lg bg-[var(--primary)] px-3 py-1.5 text-xs font-medium text-[var(--primary-foreground)] sm:inline-flex">
          <Pencil className="h-3.5 w-3.5" />
          Publier
        </span>
      </button>

      <PullToRefresh
        onRefresh={async () => {
          await feed.refetch()
        }}
        className="mt-8"
      >
        {feed.isLoading ? (
          <FeedSkeleton count={3} />
        ) : feed.isError ? (
          <ErrorBox onRetry={() => feed.refetch()} />
        ) : allPosts.length === 0 ? (
          <EmptyFeed onOpen={() => setComposerOpen(true)} />
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

function EmptyFeed({ onOpen }: { onOpen: () => void }) {
  return (
    <EmptyState
      icon={<Sparkles className="h-7 w-7" />}
      title="La communauté t'attend"
      description="Sois la première personne à briser la glace. Publie ton premier post."
      cta={{ label: 'Publier maintenant', onClick: onOpen }}
    />
  )
}

function ErrorBox({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-10 text-center">
      <p className="text-sm text-[var(--muted-foreground)]">
        Impossible de charger le fil. Réessaie.
      </p>
      <Button variant="outline" className="mt-4" onClick={onRetry}>
        Réessayer
      </Button>
    </div>
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
