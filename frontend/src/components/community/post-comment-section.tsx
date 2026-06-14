import { useEffect, useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query'
import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { AnimatePresence, motion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale/fr'
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  MessageSquare,
  Send,
  Trash2,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { AvatarDisplay } from '@/components/avatar-display'
import { VerifiedBadge } from '@/components/verified-badge'
import { useAuthStore } from '@/stores/auth-store'
import { supabase } from '@/lib/supabase'
import { fetchPublicProfilesIn } from '@/lib/public-profile'
import { sanitizePostHtml, htmlToPlainText } from '@/lib/sanitize-html'
import {
  MentionExtension,
  extractMentionedUserIds,
} from './mention-extension'
import { useConfirm } from '@/hooks/use-confirm'
import { checkRateLimit, formatRateLimitToast } from '@/lib/use-rate-limit'

const MAX_CHARS = 1000
const REPLIES_FIRST_PAGE = 10

interface CommentRow {
  id: string
  user_id: string
  /** HTML (peut contenir <a class="mention">). Pour les commentaires
   *  legacy plaintext, le rendu via sanitizePostHtml fonctionne aussi
   *  (pas de tag → identité). */
  content: string
  created_at: string
  parent_comment_id: string | null
  replies_count: number
  isPending?: boolean
  author: {
    first_name: string | null
    last_name: string | null
    avatar_url: string | null
    is_verified: boolean
  } | null
}

// =============================================================================
// Data fetching
// =============================================================================

async function fetchRootComments(postId: string): Promise<CommentRow[]> {
  const { data: rows, error } = await supabase
    .from('post_comments')
    .select(
      'id, user_id, content, created_at, parent_comment_id, replies_count',
    )
    .eq('post_id', postId)
    .is('parent_comment_id', null)
    .order('created_at', { ascending: true })
  if (error) throw error
  return await hydrateAuthors((rows ?? []) as RawCommentRow[])
}

async function fetchReplies(parentId: string): Promise<CommentRow[]> {
  const { data: rows, error } = await supabase
    .from('post_comments')
    .select(
      'id, user_id, content, created_at, parent_comment_id, replies_count',
    )
    .eq('parent_comment_id', parentId)
    .order('created_at', { ascending: true })
    .limit(REPLIES_FIRST_PAGE)
  if (error) throw error
  return await hydrateAuthors((rows ?? []) as RawCommentRow[])
}

interface RawCommentRow {
  id: string
  user_id: string
  content: string
  created_at: string
  parent_comment_id: string | null
  replies_count: number
}

async function hydrateAuthors(rows: RawCommentRow[]): Promise<CommentRow[]> {
  if (rows.length === 0) return []
  const userIds = Array.from(new Set(rows.map((c) => c.user_id)))
  const profiles = await fetchPublicProfilesIn(userIds)
  const byId = new Map<string, CommentRow['author']>()
  for (const p of profiles) {
    byId.set(p.id, {
      first_name: p.first_name,
      last_name: p.last_name,
      avatar_url: p.avatar_url,
      is_verified: p.is_verified,
    })
  }
  return rows.map((c) => ({
    id: c.id,
    user_id: c.user_id,
    content: c.content,
    created_at: c.created_at,
    parent_comment_id: c.parent_comment_id,
    replies_count: c.replies_count ?? 0,
    author: byId.get(c.user_id) ?? null,
  }))
}

// =============================================================================
// Bump optimiste de comments_count sur les caches qui contiennent ce post
//
// Le trigger SQL bump_post_comments_count maintient déjà comments_count en
// base (cumule root + replies). Côté frontend on doit refléter ça
// IMMÉDIATEMENT dans les caches React Query pour que le compteur affiché
// dans la PostCard / la page détail bouge en même temps que le commentaire
// optimistic apparaît.
//
// On utilise setQueriesData avec un préfixe de clé pour patcher tous les
// caches concernés (peu importe l'utilisateur dans la clé) :
//   - ['community-feed', userId]   → infinite query, structure {pages,pageParams}
//   - ['community-post', postId, …] → single FeedPost | null
//   - ['user-posts', userId, …]    → liste FeedPost[] (page profil)
// =============================================================================

interface FeedLike {
  id: string
  comments_count: number
  [key: string]: unknown
}

interface InfiniteFeed {
  pages: Array<{ posts: FeedLike[]; nextCursor: number | null }>
  pageParams: unknown[]
}

function bumpCommentsCount(
  queryClient: QueryClient,
  postId: string,
  delta: number,
): void {
  // 1. community-feed (infinite query)
  queryClient.setQueriesData<InfiniteFeed>(
    { queryKey: ['community-feed'] },
    (data) => {
      if (!data?.pages) return data
      return {
        ...data,
        pages: data.pages.map((page) => ({
          ...page,
          posts: page.posts.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  comments_count: Math.max(0, (p.comments_count ?? 0) + delta),
                }
              : p,
          ),
        })),
      }
    },
  )

  // 2. community-post (single)
  queryClient.setQueriesData<FeedLike | null>(
    { queryKey: ['community-post', postId] },
    (post) => {
      if (!post) return post
      return {
        ...post,
        comments_count: Math.max(0, (post.comments_count ?? 0) + delta),
      }
    },
  )

  // 3. user-posts (page profil membre — utilisée dans /app/membres/$userId)
  queryClient.setQueriesData<FeedLike[]>(
    { queryKey: ['user-posts'] },
    (posts) => {
      if (!Array.isArray(posts)) return posts
      return posts.map((p) =>
        p.id === postId
          ? {
              ...p,
              comments_count: Math.max(0, (p.comments_count ?? 0) + delta),
            }
          : p,
      )
    },
  )
}

// =============================================================================
// Composant principal
// =============================================================================

export function PostCommentSection({
  postId,
  variant = 'standalone',
}: {
  postId: string
  /** 'standalone' (défaut) : carte avec fond/bordure/titre, utilisée sur
   *  la page détail.
   *  'inline' : sans wrapper visuel (déjà fourni par le parent
   *  accordéon), titre allégé. */
  variant?: 'standalone' | 'inline'
}) {
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const profile = useAuthStore((s) => s.profile)
  const isAdmin = useAuthStore((s) => s.isAdmin)()

  const rootQueryKey = useMemo(
    () => ['post-comments-root', postId] as const,
    [postId],
  )

  const rootCommentsQuery = useQuery({
    queryKey: rootQueryKey,
    queryFn: () => fetchRootComments(postId),
    staleTime: 15_000,
  })

  // ---------------------------------------------------------------------------
  // Mutation : ajouter un commentaire (root ou réponse)
  // ---------------------------------------------------------------------------
  const addMutation = useMutation({
    mutationFn: async (input: {
      content: string
      mentionIds: string[]
      parent_comment_id: string | null
    }) => {
      if (!user) throw new Error('not-auth')

      // Rate limit avant l'INSERT. Si bloqué, on jette une erreur typée
      // que le onError captera pour afficher le toast adapté (au lieu
      // du toast générique "Envoi impossible").
      const rl = await checkRateLimit('comment_create')
      if (!rl.allowed) {
        const err = new Error(formatRateLimitToast('comment_create', rl))
        err.name = 'RateLimitError'
        throw err
      }

      const { data, error } = await supabase
        .from('post_comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: input.content,
          parent_comment_id: input.parent_comment_id,
        })
        .select('id')
        .single()
      if (error || !data) throw error ?? new Error('insert failed')

      // Attache les mentions (best-effort : si le bulk insert échoue
      // partiellement, on log mais on ne fait pas planter le commentaire).
      if (input.mentionIds.length > 0) {
        const rows = input.mentionIds.map((uid) => ({
          comment_id: data.id,
          mentioned_user_id: uid,
        }))
        const { error: mErr } = await supabase
          .from('comment_mentions')
          .insert(rows)
        if (mErr) {
          console.warn('[comments] mentions insert error:', mErr)
        }
      }
      return data.id as string
    },
    onMutate: async (input) => {
      // Bump optimiste du compteur — quel que soit le niveau du commentaire
      // (root ou réponse), le trigger SQL côté DB cumule tout dans
      // comments_count. On reflète immédiatement.
      bumpCommentsCount(queryClient, postId, +1)

      // Cas réponse : on incrémente optimistiquement le replies_count du
      // commentaire parent dans le cache rootQueryKey, pour que le bouton
      // "Voir N réponses" apparaisse / s'incrémente immédiatement. La
      // query 'post-comment-replies' du parent est invalidée au succès
      // pour récupérer la vraie réponse côté DB.
      if (input.parent_comment_id !== null) {
        const parentId = input.parent_comment_id
        queryClient.setQueryData<CommentRow[]>(rootQueryKey, (current) => {
          if (!current) return current
          return current.map((c) =>
            c.id === parentId
              ? { ...c, replies_count: (c.replies_count ?? 0) + 1 }
              : c,
          )
        })
        return { bumped: true, parentBumped: parentId }
      }
      await queryClient.cancelQueries({ queryKey: rootQueryKey })
      const previous =
        queryClient.getQueryData<CommentRow[]>(rootQueryKey) ?? []
      const tempComment: CommentRow = {
        id: `temp-${Date.now()}`,
        user_id: user?.id ?? '',
        content: input.content,
        created_at: new Date().toISOString(),
        parent_comment_id: null,
        replies_count: 0,
        isPending: true,
        author: profile
          ? {
              first_name: profile.first_name,
              last_name: profile.last_name,
              avatar_url: profile.avatar_url,
              is_verified: profile.is_verified ?? false,
            }
          : null,
      }
      queryClient.setQueryData<CommentRow[]>(rootQueryKey, [
        ...previous,
        tempComment,
      ])
      return { previous, bumped: true }
    },
    onError: (err, input, ctx) => {
      console.error('[comments] add error:', err)
      // Rollback du compteur posts.comments_count si le bump avait été
      // appliqué.
      if (ctx?.bumped) {
        bumpCommentsCount(queryClient, postId, -1)
      }
      // Rollback de l'optimistic replies_count sur le parent si on était
      // en train de répondre.
      if (ctx?.parentBumped) {
        const parentId = ctx.parentBumped
        queryClient.setQueryData<CommentRow[]>(rootQueryKey, (current) => {
          if (!current) return current
          return current.map((c) =>
            c.id === parentId
              ? {
                  ...c,
                  replies_count: Math.max(0, (c.replies_count ?? 0) - 1),
                }
              : c,
          )
        })
      }
      if (input.parent_comment_id === null && ctx?.previous) {
        queryClient.setQueryData(rootQueryKey, ctx.previous)
      }
      // Toast adapté : si c'est un blocage rate-limit, on affiche le
      // message précis ("Limite atteinte … Réessaie dans X minutes").
      // Sinon toast générique d'erreur réseau / DB.
      if (err instanceof Error && err.name === 'RateLimitError') {
        toast.error(`Trop de commentaires récents. ${err.message}`)
      } else {
        toast.error('Envoi impossible. Réessaie.')
      }
    },
    onSuccess: (_id, input) => {
      if (input.parent_comment_id) {
        // Invalide la sous-query "réponses" du parent ET la query racine
        // (pour mettre à jour le replies_count qu'on n'a pas mis à jour
        // optimistiquement en local pour rester simple).
        queryClient.invalidateQueries({
          queryKey: ['post-comment-replies', input.parent_comment_id],
        })
        queryClient.invalidateQueries({ queryKey: rootQueryKey })
      } else {
        queryClient.invalidateQueries({ queryKey: rootQueryKey })
      }
      queryClient.invalidateQueries({ queryKey: ['community-post', postId] })
      queryClient.invalidateQueries({ queryKey: ['community-feed'] })
    },
  })

  // ---------------------------------------------------------------------------
  // Mutation : supprimer un commentaire (root ou réponse)
  // ---------------------------------------------------------------------------
  const deleteMutation = useMutation({
    mutationFn: async (input: { id: string; parentId: string | null }) => {
      const { error } = await supabase
        .from('post_comments')
        .delete()
        .eq('id', input.id)
      if (error) throw error
    },
    onMutate: async (input) => {
      if (input.parentId === null) {
        await queryClient.cancelQueries({ queryKey: rootQueryKey })
        const previous =
          queryClient.getQueryData<CommentRow[]>(rootQueryKey) ?? []
        queryClient.setQueryData<CommentRow[]>(
          rootQueryKey,
          previous.filter((c) => c.id !== input.id),
        )
        return { previous }
      }
      const repliesKey = ['post-comment-replies', input.parentId] as const
      await queryClient.cancelQueries({ queryKey: repliesKey })
      const previous = queryClient.getQueryData<CommentRow[]>(repliesKey) ?? []
      queryClient.setQueryData<CommentRow[]>(
        repliesKey,
        previous.filter((c) => c.id !== input.id),
      )
      return { previous, repliesKey }
    },
    onError: (_err, input, ctx) => {
      if (!ctx) return
      if (input.parentId === null) {
        queryClient.setQueryData(rootQueryKey, ctx.previous)
      } else {
        queryClient.setQueryData(
          ['post-comment-replies', input.parentId],
          ctx.previous,
        )
      }
      toast.error('Suppression impossible. Réessaie.')
    },
    onSuccess: (_data, input) => {
      toast.success('Commentaire supprimé.')
      queryClient.invalidateQueries({ queryKey: rootQueryKey })
      if (input.parentId) {
        queryClient.invalidateQueries({
          queryKey: ['post-comment-replies', input.parentId],
        })
      }
      queryClient.invalidateQueries({ queryKey: ['community-post', postId] })
      queryClient.invalidateQueries({ queryKey: ['community-feed'] })
    },
  })

  const { confirm, ConfirmDialog } = useConfirm()

  async function handleDelete(comment: CommentRow, parentId: string | null) {
    const ok = await confirm({
      title: 'Supprimer ce commentaire ?',
      contentPreview: htmlToPlainText(comment.content).slice(0, 160),
      description:
        parentId === null
          ? "Cette action est irréversible. Les réponses associées seront aussi supprimées."
          : 'Cette action est irréversible.',
      confirmLabel: 'Supprimer',
      variant: 'destructive',
    })
    if (!ok) return
    deleteMutation.mutate({ id: comment.id, parentId })
  }

  const isInline = variant === 'inline'

  return (
    <section
      id={`post-${postId}-comments`}
      className={
        isInline
          ? ''
          : 'mt-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5'
      }
    >
      {!isInline && (
        <h2 className="font-display text-lg font-semibold tracking-tight">
          Commentaires
        </h2>
      )}

      {/* Composer principal (commentaire racine) */}
      <div
        className={
          isInline
            ? 'border-b border-[var(--border)] pb-4'
            : 'mt-4 border-b border-[var(--border)] pb-5'
        }
      >
        <CommentComposer
          mode="root"
          submitting={addMutation.isPending}
          onSubmit={({ html, mentionIds }) =>
            addMutation.mutate({
              content: html,
              mentionIds,
              parent_comment_id: null,
            })
          }
        />
      </div>

      {/* Liste des commentaires racine */}
      <div className="mt-5">
        {rootCommentsQuery.isLoading ? (
          <p className="py-4 text-sm text-[var(--muted-foreground)]">
            Chargement…
          </p>
        ) : rootCommentsQuery.isError ? (
          <p className="py-4 text-sm text-[var(--muted-foreground)]">
            Impossible de charger les commentaires.
          </p>
        ) : (rootCommentsQuery.data ?? []).length === 0 ? (
          <p className="py-4 text-center text-sm text-[var(--muted-foreground)]">
            Sois le premier à commenter.
          </p>
        ) : (
          <ul className="space-y-6">
            <AnimatePresence initial={false}>
              {rootCommentsQuery.data?.map((c) => (
                <motion.li
                  key={c.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: c.isPending ? 0.55 : 1, y: 0 }}
                  exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  id={`comment-${c.id}`}
                >
                  <CommentItem
                    comment={c}
                    canDelete={
                      !c.isPending && (c.user_id === user?.id || isAdmin)
                    }
                    onDelete={() => handleDelete(c, null)}
                    onSubmitReply={(payload) =>
                      addMutation.mutate({
                        content: payload.html,
                        mentionIds: payload.mentionIds,
                        parent_comment_id: c.id,
                      })
                    }
                    onDeleteReply={(reply) => handleDelete(reply, c.id)}
                    submittingReply={addMutation.isPending}
                    deletingReply={deleteMutation.isPending}
                    currentUserId={user?.id}
                    isAdmin={isAdmin}
                  />
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>

      <ConfirmDialog />
    </section>
  )
}

// =============================================================================
// CommentItem : un commentaire racine + sa zone de réponses dépliable
// =============================================================================

interface CommentItemProps {
  comment: CommentRow
  canDelete: boolean
  onDelete: () => void
  onSubmitReply: (payload: { html: string; mentionIds: string[] }) => void
  onDeleteReply: (reply: CommentRow) => void
  submittingReply: boolean
  deletingReply: boolean
  currentUserId: string | undefined
  isAdmin: boolean
}

function CommentItem({
  comment,
  canDelete,
  onDelete,
  onSubmitReply,
  onDeleteReply,
  submittingReply,
  deletingReply,
  currentUserId,
  isAdmin,
}: CommentItemProps) {
  const [showReplyComposer, setShowReplyComposer] = useState(false)
  const [showReplies, setShowReplies] = useState(false)

  const fullName =
    [comment.author?.first_name, comment.author?.last_name]
      .filter(Boolean)
      .join(' ') || 'Membre'

  const repliesQuery = useQuery({
    queryKey: ['post-comment-replies', comment.id],
    queryFn: () => fetchReplies(comment.id),
    enabled: showReplies,
    staleTime: 15_000,
  })

  // Si l'utilisateur ouvre le composer de réponse, on déplie aussi la
  // section des réponses pour qu'il voit le contexte.
  useEffect(() => {
    if (showReplyComposer && comment.replies_count > 0) {
      setShowReplies(true)
    }
  }, [showReplyComposer, comment.replies_count])

  return (
    <div className="group flex items-start gap-3">
      <Link
        to="/app/membres/$userId"
        params={{ userId: comment.user_id }}
        className="shrink-0"
      >
        <AvatarDisplay
          avatarUrl={comment.author?.avatar_url}
          firstName={comment.author?.first_name}
          lastName={comment.author?.last_name}
          email={null}
          isVerified={comment.author?.is_verified ?? false}
          size="md"
        />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="rounded-2xl bg-[var(--secondary)] px-4 py-2.5">
          <Link
            to="/app/membres/$userId"
            params={{ userId: comment.user_id }}
            className="inline-flex items-center gap-1 text-xs font-semibold hover:underline"
          >
            {fullName}
            {comment.author?.is_verified && (
              <VerifiedBadge className="h-3 w-3 shrink-0" />
            )}
          </Link>
          <CommentBody html={comment.content} />
        </div>
        <div className="mt-1 flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
          <span>
            {formatDistanceToNow(new Date(comment.created_at), {
              addSuffix: true,
              locale: fr,
            })}
          </span>
          {!comment.isPending && (
            <button
              type="button"
              onClick={() => setShowReplyComposer((s) => !s)}
              className="inline-flex items-center gap-1 hover:text-[var(--foreground)] hover:underline"
            >
              <MessageSquare className="h-3 w-3" />
              Répondre
            </button>
          )}
          {canDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="inline-flex items-center gap-1 text-red-600 opacity-0 transition-opacity hover:underline group-hover:opacity-100"
            >
              <Trash2 className="h-3 w-3" />
              Supprimer
            </button>
          )}
        </div>

        {/* Zone réponses : bouton "Voir N réponses" + liste */}
        {comment.replies_count > 0 && (
          <button
            type="button"
            onClick={() => setShowReplies((s) => !s)}
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[var(--primary)] hover:underline"
          >
            {showReplies ? (
              <>
                <ChevronUp className="h-3.5 w-3.5" />
                Masquer {comment.replies_count}{' '}
                {comment.replies_count > 1 ? 'réponses' : 'réponse'}
              </>
            ) : (
              <>
                <ChevronDown className="h-3.5 w-3.5" />
                Voir {comment.replies_count}{' '}
                {comment.replies_count > 1 ? 'réponses' : 'réponse'}
              </>
            )}
          </button>
        )}

        <AnimatePresence initial={false}>
          {showReplies && (
            <motion.div
              key="replies"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-3 space-y-4 border-l-2 border-[var(--border)] pl-3 sm:pl-5">
                {repliesQuery.isLoading ? (
                  <p className="py-2 text-xs text-[var(--muted-foreground)]">
                    Chargement…
                  </p>
                ) : (repliesQuery.data ?? []).length === 0 ? (
                  <p className="py-2 text-xs text-[var(--muted-foreground)]">
                    Aucune réponse pour l'instant.
                  </p>
                ) : (
                  <ul className="space-y-4">
                    <AnimatePresence initial={false}>
                      {repliesQuery.data?.map((reply) => {
                        const replyName =
                          [
                            reply.author?.first_name,
                            reply.author?.last_name,
                          ]
                            .filter(Boolean)
                            .join(' ') || 'Membre'
                        const canDeleteReply =
                          !reply.isPending &&
                          (reply.user_id === currentUserId || isAdmin)
                        return (
                          <motion.li
                            key={reply.id}
                            layout
                            initial={{ opacity: 0, x: -8 }}
                            animate={{
                              opacity: reply.isPending ? 0.55 : 1,
                              x: 0,
                            }}
                            exit={{
                              opacity: 0,
                              x: -8,
                              transition: { duration: 0.15 },
                            }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                            id={`comment-${reply.id}`}
                            className="group/reply flex items-start gap-2.5"
                          >
                            <Link
                              to="/app/membres/$userId"
                              params={{ userId: reply.user_id }}
                              className="shrink-0"
                            >
                              <AvatarDisplay
                                avatarUrl={reply.author?.avatar_url}
                                firstName={reply.author?.first_name}
                                lastName={reply.author?.last_name}
                                email={null}
                                isVerified={
                                  reply.author?.is_verified ?? false
                                }
                                size="sm"
                              />
                            </Link>
                            <div className="min-w-0 flex-1">
                              <div className="rounded-2xl bg-[var(--secondary)] px-3 py-2">
                                <Link
                                  to="/app/membres/$userId"
                                  params={{ userId: reply.user_id }}
                                  className="inline-flex items-center gap-1 text-xs font-semibold hover:underline"
                                >
                                  {replyName}
                                  {reply.author?.is_verified && (
                                    <VerifiedBadge className="h-3 w-3 shrink-0" />
                                  )}
                                </Link>
                                <CommentBody html={reply.content} />
                              </div>
                              <div className="mt-1 flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
                                <span>
                                  {formatDistanceToNow(
                                    new Date(reply.created_at),
                                    {
                                      addSuffix: true,
                                      locale: fr,
                                    },
                                  )}
                                </span>
                                {canDeleteReply && (
                                  <button
                                    type="button"
                                    onClick={() => onDeleteReply(reply)}
                                    disabled={deletingReply}
                                    className="inline-flex items-center gap-1 text-red-600 opacity-0 transition-opacity hover:underline group-hover/reply:opacity-100 disabled:opacity-50"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                    Supprimer
                                  </button>
                                )}
                              </div>
                            </div>
                          </motion.li>
                        )
                      })}
                    </AnimatePresence>
                  </ul>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Composer de réponse */}
        <AnimatePresence initial={false}>
          {showReplyComposer && (
            <motion.div
              key="reply-composer"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-3 border-l-2 border-[var(--border)] pl-3 sm:pl-5">
                <CommentComposer
                  mode="reply"
                  initialMention={{
                    id: comment.user_id,
                    label: fullName,
                  }}
                  submitting={submittingReply}
                  onCancel={() => setShowReplyComposer(false)}
                  onSubmit={(payload) => {
                    onSubmitReply(payload)
                    setShowReplyComposer(false)
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// =============================================================================
// CommentBody : rend le contenu HTML sanitisé d'un commentaire
// (mentions cliquables vers /app/membres/{id})
// =============================================================================

function CommentBody({ html }: { html: string }) {
  // Si le commentaire est en plaintext (legacy), on l'affiche tel quel
  // avec préservation des sauts de ligne. Sinon (HTML), on sanitise.
  const looksLikeHtml = /<[a-z][\s\S]*>/i.test(html)
  if (!looksLikeHtml) {
    return (
      <p className="mt-1 whitespace-pre-wrap text-sm">{html}</p>
    )
  }
  return (
    <div
      className="comment-body mt-1 text-sm leading-relaxed [&_p]:m-0 [&_p+p]:mt-2 [&_a]:underline-offset-2"
      // sanitizePostHtml gère déjà la classe mention + data-id et la
      // réécriture du href en /app/membres/{id}.
      dangerouslySetInnerHTML={{ __html: sanitizePostHtml(html) }}
    />
  )
}

// =============================================================================
// CommentComposer : Tiptap mini-éditeur avec mention @
// =============================================================================

interface CommentComposerProps {
  mode: 'root' | 'reply'
  submitting: boolean
  onSubmit: (payload: { html: string; mentionIds: string[] }) => void
  onCancel?: () => void
  /** Pré-remplit le composer avec une mention de l'auteur du commentaire
   *  parent (uniquement pour mode reply). */
  initialMention?: { id: string; label: string }
}

function CommentComposer({
  mode,
  submitting,
  onSubmit,
  onCancel,
  initialMention,
}: CommentComposerProps) {
  const user = useAuthStore((s) => s.user)
  const profile = useAuthStore((s) => s.profile)
  const [, setRev] = useState(0)
  const bumpRev = () => setRev((r) => r + 1)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
        link: false,
      }),
      Placeholder.configure({
        placeholder:
          mode === 'reply'
            ? 'Écris ta réponse… utilise @ pour mentionner un membre.'
            : 'Ajoute un commentaire… utilise @ pour mentionner un membre.',
      }),
      MentionExtension,
    ],
    content: '',
    onUpdate: bumpRev,
  })

  // Pré-remplit la mention quand on ouvre une réponse
  useEffect(() => {
    if (!editor || !initialMention) return
    // Insert le node mention puis un espace après — comme ça le user
    // peut continuer à taper directement.
    editor
      .chain()
      .focus()
      .insertContent([
        {
          type: 'mention',
          attrs: { id: initialMention.id, label: initialMention.label },
        },
        { type: 'text', text: ' ' },
      ])
      .run()
    // Le reset à la soumission se fait via clearContent — ici on remplit
    // une seule fois à l'ouverture.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor])

  if (!editor) {
    return (
      <div className="flex items-start gap-3">
        <AvatarDisplay
          avatarUrl={profile?.avatar_url}
          firstName={profile?.first_name}
          lastName={profile?.last_name}
          email={user?.email}
          isVerified={profile?.is_verified ?? false}
          size={mode === 'reply' ? 'sm' : 'md'}
        />
        <div className="flex-1">
          <div className="h-16 animate-pulse rounded-lg bg-[var(--secondary)]" />
        </div>
      </div>
    )
  }

  const plainText = htmlToPlainText(editor.getHTML())
  const charCount = plainText.length
  const overLimit = charCount > MAX_CHARS
  const isEmpty = charCount === 0

  function handleSubmit() {
    if (!editor || isEmpty || overLimit || submitting) return
    const html = editor.getHTML()
    const mentionIds = extractMentionedUserIds(html)
    onSubmit({ html, mentionIds })
    // Reset après soumission (l'optimistic UI affiche déjà le commentaire).
    editor.commands.clearContent()
  }

  return (
    <div className="flex items-start gap-3">
      <AvatarDisplay
        avatarUrl={profile?.avatar_url}
        firstName={profile?.first_name}
        lastName={profile?.last_name}
        email={user?.email}
        isVerified={profile?.is_verified ?? false}
        size={mode === 'reply' ? 'sm' : 'md'}
      />
      <div className="flex-1 space-y-2">
        <ComposerEditor editor={editor} disabled={submitting} />
        <div className="flex items-center justify-between gap-2">
          <span
            className={
              overLimit
                ? 'text-xs text-red-600'
                : 'text-xs text-[var(--muted-foreground)]'
            }
          >
            {charCount}/{MAX_CHARS}
          </span>
          <div className="flex items-center gap-2">
            {onCancel && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={onCancel}
                disabled={submitting}
              >
                <X className="h-3.5 w-3.5" />
                Annuler
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              onClick={handleSubmit}
              disabled={isEmpty || overLimit || submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Envoi…
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  {mode === 'reply' ? 'Répondre' : 'Commenter'}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ComposerEditor({
  editor,
  disabled,
}: {
  editor: Editor
  disabled: boolean
}) {
  // L'éditeur doit être désactivable pendant l'envoi.
  useEffect(() => {
    editor.setEditable(!disabled)
  }, [editor, disabled])

  return (
    <EditorContent
      editor={editor}
      className="comment-editor min-h-12 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm leading-relaxed focus-within:border-[var(--ring)] focus-within:ring-2 focus-within:ring-[var(--ring)]/40 [&_.ProseMirror]:min-h-9 [&_.ProseMirror]:outline-none [&_.ProseMirror_p]:m-0 [&_.ProseMirror_p+p]:mt-2 [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0 [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-[var(--muted-foreground)] [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]"
    />
  )
}
