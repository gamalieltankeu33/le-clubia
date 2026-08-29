import { useState } from 'react'
import { createFileRoute, Link, useNavigate, useRouter } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale/fr'
import { ArrowLeft, Pencil, MessageSquare } from 'lucide-react'
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
import { getOrCreateConversation } from '@/lib/direct-messages'

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
  const [isStartingChat, setIsStartingChat] = useState(false)

  const handleSendMessage = async () => {
    if (!currentUser) {
      toast.error('Connectez-vous pour envoyer un message.')
      return
    }
    try {
      setIsStartingChat(true)
      const convId = await getOrCreateConversation(currentUser.id, userId)
      navigate({ to: '/app/messages', search: { conv: convId } })
    } catch (err) {
      toast.error('Impossible d’ouvrir la discussion.')
      console.error(err)
    } finally {
      setIsStartingChat(false)
    }
  }

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

  const [activeTab, setActiveTab] = useState<'posts' | 'activite' | 'badges'>('posts')

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:py-10">
      <Button variant="ghost" size="sm" onClick={handleBack} className="mb-4 text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Retour
      </Button>

      {/* Header public avec Cover */}
      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm">
        {/* Cover Image (Dégradé premium temporaire) */}
        <div className="h-32 sm:h-48 w-full bg-gradient-to-r from-blue-900 via-[#0F1E4D] to-indigo-900" />
        
        <div className="relative px-6 pb-8 sm:px-8">
          <div className="-mt-12 sm:-mt-16 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div className="relative inline-block rounded-full p-1 bg-[var(--card)]">
              <AvatarDisplay
                avatarUrl={p.avatar_url}
                firstName={p.first_name}
                lastName={p.last_name}
                email={null}
                isVerified={p.is_verified}
                isMonthlyWinner={isMonthlyWinner}
                size="xl"
                className="ring-4 ring-[var(--card)]"
              />
            </div>
            
            <div className="flex items-center gap-3 mt-4 sm:mt-0">
              {isMe ? (
                <Button asChild variant="outline" size="sm" className="rounded-full font-medium">
                  <Link to="/app/profil">
                    <Pencil className="mr-2 h-3.5 w-3.5" />
                    Modifier mon profil
                  </Link>
                </Button>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full font-medium"
                  >
                    Suivre
                  </Button>
                  <Button
                    size="sm"
                    className="rounded-full bg-[var(--primary)] text-white hover:bg-[var(--primary-light)] shadow-sm font-medium"
                    onClick={handleSendMessage}
                    disabled={isStartingChat}
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    {isStartingChat ? 'Ouverture...' : 'Message'}
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="mt-4">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--foreground)] sm:text-3xl">
                {fullName}
              </h1>
              {p.role === 'admin' && (
                <span className="inline-flex rounded-full bg-[var(--primary)]/10 px-2.5 py-0.5 text-xs font-semibold text-[var(--primary)]">
                  Admin
                </span>
              )}
            </div>
            
            {p.bio && (
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--foreground)]">
                {p.bio}
              </p>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-[var(--muted-foreground)]">
              <div className="flex items-center gap-1.5 cursor-pointer hover:text-[var(--foreground)] transition-colors">
                <span className="font-semibold text-[var(--foreground)]">{posts_count}</span>
                <span>Publications</span>
              </div>
              <div className="flex items-center gap-1.5 cursor-pointer hover:text-[var(--foreground)] transition-colors">
                <span className="font-semibold text-[var(--foreground)]">{comments_count}</span>
                <span>Commentaires</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span>Membre depuis {format(new Date(p.created_at), 'MMMM yyyy', { locale: fr })}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <div className="border-t border-[var(--border)] px-6 sm:px-8">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {[
              { id: 'posts', label: 'Publications' },
              { id: 'activite', label: 'Activité' },
              { id: 'badges', label: 'Badges' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors
                  ${activeTab === tab.id
                    ? 'border-[var(--primary)] text-[var(--primary)]'
                    : 'border-transparent text-[var(--muted-foreground)] hover:border-[var(--border)] hover:text-[var(--foreground)]'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'posts' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {postsQuery.isLoading ? (
              <FeedSkeleton count={2} />
            ) : postsQuery.isError ? (
              <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-10 text-center">
                <p className="text-sm text-[var(--muted-foreground)]">
                  Impossible de charger les publications.
                </p>
              </div>
            ) : (postsQuery.data ?? []).length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-10 text-center">
                <p className="text-sm text-[var(--muted-foreground)]">
                  {isMe
                    ? "Tu n'as pas encore publié sur le Club."
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
          </motion.div>
        )}

        {activeTab === 'activite' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-10 text-center"
          >
            <p className="text-sm text-[var(--muted-foreground)]">
              L'historique d'activité complète sera bientôt disponible.
            </p>
          </motion.div>
        )}

        {activeTab === 'badges' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-10 text-center"
          >
            <p className="text-sm text-[var(--muted-foreground)]">
              Les badges et hauts faits du membre apparaîtront ici.
            </p>
          </motion.div>
        )}
      </div>

      <ConfirmDialog />
    </div>
  )
}
