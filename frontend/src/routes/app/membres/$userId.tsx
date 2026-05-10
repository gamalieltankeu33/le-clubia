import { createFileRoute, Link, useNavigate, useRouter } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale/fr'
import { ArrowLeft, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { AvatarDisplay } from '@/components/avatar-display'
import { VerifiedBadge } from '@/components/verified-badge'
import { useAuthStore } from '@/stores/auth-store'
import { supabase } from '@/lib/supabase'
import { fetchPublicProfile, type PublicProfile } from '@/lib/public-profile'
import { useIsMonthlyWinner } from '@/lib/use-monthly-winner'
import { fetchUserPosts } from '@/lib/community-queries'
import { PostCard, type FeedPost } from '@/components/community/post-card'
import { FeedSkeleton } from '@/components/community/feed-skeleton'
import { htmlToPlainText } from '@/lib/sanitize-html'
import { useConfirm } from '@/hooks/use-confirm'

export const Route = createFileRoute('/app/membres/$userId')({
  component: MemberPublicProfilePage,
})

interface MemberPublicData {
  profile: PublicProfile
  posts_count: number
  comments_count: number
}

async function fetchMemberPublic(
  userId: string,
): Promise<MemberPublicData | null> {
  const [profile, postsCount, commentsCount] = await Promise.all([
    fetchPublicProfile(userId),
    supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId),
    supabase
      .from('post_comments')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId),
  ])
  if (!profile) return null
  return {
    profile,
    posts_count: postsCount.count ?? 0,
    comments_count: commentsCount.count ?? 0,
  }
}

function MemberPublicProfilePage() {
  const { userId } = Route.useParams()
  const navigate = useNavigate()
  const router = useRouter()
  const queryClient = useQueryClient()

  // Back contextuel : revient sur la page d'origine (feed, classement,
  // mention, notification…). Fallback sur /app/communaute si l'utilisateur
  // a ouvert le profil via un lien direct (pas d'historique).
  const handleBack = () => {
    if (window.history.length > 1) {
      router.history.back()
    } else {
      navigate({ to: '/app/communaute' })
    }
  }
  const currentUser = useAuthStore((s) => s.user)
  const isAdmin = useAuthStore((s) => s.isAdmin)()
  const isMe = currentUser?.id === userId
  const isMonthlyWinner = useIsMonthlyWinner(userId)
  const { confirm, ConfirmDialog } = useConfirm()

  const memberQuery = useQuery({
    queryKey: ['member-public', userId],
    queryFn: () => fetchMemberPublic(userId),
    staleTime: 60_000,
  })

  const postsQuery = useQuery({
    queryKey: ['user-posts', userId, currentUser?.id ?? null],
    queryFn: () => fetchUserPosts(userId, currentUser?.id ?? null, 50),
    staleTime: 30_000,
    // Bloque tant que currentUser n'est pas hydraté (cf. fix migration 0021)
    // pour calculer correctement liked_by_me sur les posts du membre.
    enabled: !!currentUser,
  })

  const deleteMutation = useMutation({
    mutationFn: async (post: FeedPost) => {
      if (post.image_url) {
        const marker = `/storage/v1/object/public/post-images/`
        const idx = post.image_url.indexOf(marker)
        if (idx !== -1) {
          const path = post.image_url
            .slice(idx + marker.length)
            .split('?')[0]
          await supabase.storage.from('post-images').remove([path])
        }
      }
      const { error } = await supabase.from('posts').delete().eq('id', post.id)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Post supprimé.')
      queryClient.invalidateQueries({ queryKey: ['user-posts', userId] })
      queryClient.invalidateQueries({ queryKey: ['member-public', userId] })
      queryClient.invalidateQueries({ queryKey: ['community-feed'] })
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

  if (memberQuery.isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-10">
        <div className="h-32 animate-pulse rounded-2xl bg-[var(--secondary)]" />
        <div className="mt-6">
          <FeedSkeleton count={2} />
        </div>
      </div>
    )
  }

  if (memberQuery.isError || !memberQuery.data) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Membre introuvable
        </h1>
        <p className="mt-3 text-[var(--muted-foreground)]">
          Ce profil n'existe plus ou n'est pas accessible.
        </p>
        <Button asChild className="mt-6">
          <Link to="/app/communaute">
            <ArrowLeft className="h-4 w-4" />
            Retour à la communauté
          </Link>
        </Button>
      </div>
    )
  }

  const { profile: p, posts_count, comments_count } = memberQuery.data
  const fullName =
    [p.first_name, p.last_name].filter(Boolean).join(' ').trim() ||
    'Sans nom'

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:py-14">
      <Button variant="outline" size="sm" onClick={handleBack}>
        <ArrowLeft className="h-4 w-4" />
        Retour
      </Button>

      {/* Header public */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 md:p-8"
      >
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <AvatarDisplay
            avatarUrl={p.avatar_url}
            firstName={p.first_name}
            lastName={p.last_name}
            email={null}
            isVerified={p.is_verified}
            isMonthlyWinner={isMonthlyWinner}
            size="xl"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="inline-flex items-center gap-1.5 font-display text-2xl font-semibold tracking-tight md:text-3xl">
                {fullName}
                {p.is_verified && (
                  <VerifiedBadge className="h-5 w-5 md:h-6 md:w-6" />
                )}
              </h1>
              {p.role === 'admin' && (
                <span className="inline-flex rounded-full bg-[var(--primary)]/10 px-2 py-0.5 text-xs font-medium text-[var(--primary)]">
                  Admin
                </span>
              )}
            </div>
            {p.bio && (
              <p className="mt-2 max-w-prose whitespace-pre-wrap text-[var(--muted-foreground)]">
                {p.bio}
              </p>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-[var(--muted-foreground)]">
              <span>
                <strong className="text-[var(--foreground)]">
                  {posts_count}
                </strong>{' '}
                post{posts_count > 1 ? 's' : ''}
              </span>
              <span>
                <strong className="text-[var(--foreground)]">
                  {comments_count}
                </strong>{' '}
                commentaire{comments_count > 1 ? 's' : ''}
              </span>
              <span>
                Membre depuis{' '}
                {format(new Date(p.created_at), 'MMMM yyyy', { locale: fr })}
              </span>
            </div>
            {isMe && (
              <Button asChild variant="outline" size="sm" className="mt-4">
                <Link to="/app/profil">
                  <Pencil className="h-3.5 w-3.5" />
                  Modifier mon profil
                </Link>
              </Button>
            )}
          </div>
        </div>
      </motion.section>

      {/* Posts */}
      <h2 className="mt-10 font-display text-xl font-semibold tracking-tight">
        Posts
      </h2>
      <div className="mt-4">
        {postsQuery.isLoading ? (
          <FeedSkeleton count={2} />
        ) : postsQuery.isError ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-10 text-center">
            <p className="text-sm text-[var(--muted-foreground)]">
              Impossible de charger les posts.
            </p>
          </div>
        ) : (postsQuery.data ?? []).length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-10 text-center">
            <p className="text-sm text-[var(--muted-foreground)]">
              {isMe
                ? "Tu n'as pas encore publié."
                : "Ce membre n'a pas encore publié."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {postsQuery.data?.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUserId={currentUser?.id ?? null}
                isAdmin={isAdmin}
                onDelete={handleDelete}
                pendingDelete={deleteMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog />
    </div>
  )
}
