import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/auth-store'
import { supabase } from '@/lib/supabase'
import { fetchPostById } from '@/lib/community-queries'
import { PostCard, type FeedPost } from '@/components/community/post-card'
import { PostCommentSection } from '@/components/community/post-comment-section'
import { FeedSkeleton } from '@/components/community/feed-skeleton'
import { htmlToPlainText } from '@/lib/sanitize-html'
import { useConfirm } from '@/hooks/use-confirm'
import { checkRateLimit } from '@/lib/use-rate-limit'

export const Route = createFileRoute('/app/communaute/$postId')({
  component: PostDetailPage,
})

function PostDetailPage() {
  const { postId } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const isAdmin = useAuthStore((s) => s.isAdmin)()
  const { confirm, ConfirmDialog } = useConfirm()

  const postQuery = useQuery({
    queryKey: ['community-post', postId, user?.id ?? null],
    queryFn: () => fetchPostById(postId, user?.id ?? null),
    staleTime: 15_000,
    // Bloque le fetch tant que user n'est pas hydraté pour garantir un
    // liked_by_me correct (cf. fix migration 0021).
    enabled: !!user,
  })

  const likeMutation = useMutation({
    mutationFn: async ({
      post,
      like,
    }: {
      post: FeedPost
      like: boolean
    }) => {
      if (!user) throw new Error('not-auth')
      const rl = await checkRateLimit('post_like')
      if (!rl.allowed) {
        const err = new Error('rate_limited')
        err.name = 'RateLimitError'
        throw err
      }
      if (like) {
        const { error } = await supabase
          .from('post_likes')
          .insert({ post_id: post.id, user_id: user.id })
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id)
        if (error) throw error
      }
    },
    onMutate: async ({ like }) => {
      const key = ['community-post', postId, user?.id ?? null]
      await queryClient.cancelQueries({ queryKey: key })
      const prev = queryClient.getQueryData<FeedPost | null>(key)
      if (prev) {
        queryClient.setQueryData<FeedPost | null>(key, {
          ...prev,
          liked_by_me: like,
          likes_count: Math.max(0, prev.likes_count + (like ? 1 : -1)),
        })
      }
      return { prev }
    },
    onError: (err, _vars, ctx) => {
      const key = ['community-post', postId, user?.id ?? null]
      if (ctx?.prev) queryClient.setQueryData(key, ctx.prev)
      if (err instanceof Error && err.name === 'RateLimitError') {
        toast.warning("Trop d'actions trop rapides. Détends-toi un peu 😊")
      } else {
        toast.error('Action impossible.')
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['community-feed'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (post: FeedPost) => {
      if (post.image_url) {
        const path = extractStoragePath(post.image_url, 'post-images')
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
    onSuccess: () => {
      toast.success('Post supprimé.')
      queryClient.invalidateQueries({ queryKey: ['community-feed'] })
      queryClient.invalidateQueries({ queryKey: ['recent-posts'] })
      navigate({ to: '/app/communaute' })
    },
    onError: () => toast.error('Suppression impossible.'),
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
      <Button variant="outline" size="sm" asChild>
        <Link to="/app/communaute">
          <ArrowLeft className="h-4 w-4" />
          Retour au fil
        </Link>
      </Button>

      <div className="mt-6">
        {postQuery.isLoading ? (
          <FeedSkeleton count={1} />
        ) : postQuery.isError || !postQuery.data ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-12 text-center">
            <h1 className="font-display text-2xl font-semibold">
              Post introuvable
            </h1>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              Il a peut-être été supprimé.
            </p>
            <Button asChild className="mt-5">
              <Link to="/app/communaute">
                <ArrowLeft className="h-4 w-4" />
                Retour au fil
              </Link>
            </Button>
          </div>
        ) : (
          <>
            <PostCard
              post={postQuery.data}
              currentUserId={user?.id ?? null}
              isAdmin={isAdmin}
              expanded
              onLikeToggle={(post) =>
                likeMutation.mutate({
                  post,
                  like: !post.liked_by_me,
                })
              }
              onDelete={handleDelete}
              pendingLike={likeMutation.isPending}
              pendingDelete={deleteMutation.isPending}
            />
            <PostCommentSection postId={postQuery.data.id} />
          </>
        )}
      </div>

      <ConfirmDialog />
    </div>
  )
}

function extractStoragePath(publicUrl: string, bucket: string): string | null {
  const marker = `/storage/v1/object/public/${bucket}/`
  const idx = publicUrl.indexOf(marker)
  if (idx === -1) return null
  return publicUrl.slice(idx + marker.length).split('?')[0]
}
