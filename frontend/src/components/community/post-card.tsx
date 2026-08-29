import { lazy, Suspense, useRef, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale/fr'
import {
  Heart,
  Loader2,
  MessageCircle,
  MoreHorizontal,
  Pin,
  Trash2,
} from 'lucide-react'
import { AvatarDisplay } from '@/components/avatar-display'
import { VerifiedBadge } from '@/components/verified-badge'
import { Button } from '@/components/ui/button'
import { LinkPreviewCard } from './link-preview-card'
import { PostLikersPreview } from './post-likers-preview'
import { sanitizePostHtml } from '@/lib/sanitize-html'
import { cn } from '@/lib/utils'
import { useToggleLike } from '@/hooks/use-toggle-like'
import { Badge } from '@/components/ui/badge'

// La PostCommentSection embarque Tiptap + extension mention (gros poids).
// Lazy-loadée → on ne la charge que lorsque l'utilisateur clique pour
// déployer la zone commentaires d'au moins un post du feed.
const PostCommentSection = lazy(() =>
  import('./post-comment-section').then((m) => ({
    default: m.PostCommentSection,
  })),
)

// Modal "X personnes ont aimé" — lazy car son fetch + sa liste ne sont
// utiles que si l'utilisateur clique sur le compteur de likes.
const PostLikersModal = lazy(() =>
  import('./post-likers-modal').then((m) => ({
    default: m.PostLikersModal,
  })),
)

export interface FeedPost {
  id: string
  user_id: string
  content: string
  image_url: string | null
  link_url: string | null
  hashtags: string[]
  likes_count: number
  comments_count: number
  is_pinned: boolean
  challenge_week_number: number | null
  challenge_project_name: string | null
  created_at: string
  author: {
    id: string
    first_name: string | null
    last_name: string | null
    avatar_url: string | null
    is_verified: boolean
  } | null
  /** L'utilisateur courant a-t-il liké ce post ? */
  liked_by_me: boolean
}

export function PostCard({
  post,
  currentUserId,
  isAdmin,
  expanded = false,
  onDelete,
  pendingDelete,
}: {
  post: FeedPost
  currentUserId: string | null
  isAdmin: boolean
  expanded?: boolean
  onDelete: (post: FeedPost) => void
  pendingDelete?: boolean
}) {
  const navigate = useNavigate()
  const { liked, count, toggle, isPending: pendingLike } = useToggleLike(
    post,
    currentUserId,
  )
  const [menuOpen, setMenuOpen] = useState(false)
  // Accordéon inline : visible uniquement quand on n'est pas déjà sur la
  // page détail (où le bloc commentaires est rendu séparément).
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [likersOpen, setLikersOpen] = useState(false)
  const [isTextExpanded, setIsTextExpanded] = useState(false)
  const cardRef = useRef<HTMLElement>(null)
  
  // Use a heuristic to show 'Voir plus' (assuming simple char count for now, proper way is ResizeObserver)
  const isLongText = post.content.length > 300 || post.content.split('</p>').length > 4

  const fullName =
    [post.author?.first_name, post.author?.last_name]
      .filter(Boolean)
      .join(' ') || 'Membre'

  const isOwner = currentUserId === post.user_id
  const canDelete = isOwner || isAdmin
  const safeHtml = sanitizePostHtml(post.content)

  function handleCardClick(e: React.MouseEvent) {
    if (expanded) return
    // Évite la navigation quand on clique sur un lien interne ou un bouton
    const target = e.target as HTMLElement
    if (
      target.closest('a, button, [data-no-navigate]') &&
      !target.dataset?.cardSurface
    ) {
      return
    }
    navigate({ to: '/app/communaute/$postId', params: { postId: post.id } })
  }

  function handleCommentClick(e: React.MouseEvent) {
    e.stopPropagation()
    if (expanded) {
      // Sur la page détail, le bloc commentaires est déjà rendu en dessous.
      // On scroll vers la section pour donner du feedback visuel.
      const section = document.getElementById(`post-${post.id}-comments`)
      section?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
    setCommentsOpen((v) => !v)
  }

  return (
    <article
      ref={cardRef}
      onClick={handleCardClick}
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] transition-all duration-150 touch-manipulation',
        !expanded &&
          !commentsOpen &&
          'cursor-pointer hover:border-[var(--primary)]/30 hover:shadow-sm active:scale-[0.99] active:bg-[var(--muted)]/30',
      )}
      data-card-surface="true"
    ><div className="p-5">
      {post.is_pinned && (
        <div className="mb-4 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--emerald-deep)]">
          <Pin className="h-3.5 w-3.5 fill-[var(--emerald)]/15" />
          Épinglé par Le Club
        </div>
      )}
      {post.challenge_week_number && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--primary)]/10 px-2.5 py-1 text-xs font-semibold text-[var(--primary)] ring-1 ring-[var(--primary)]/10">
            <span className="flex h-2 w-2 rounded-full bg-[var(--accent)] animate-pulse" />
            Challenge Semaine {post.challenge_week_number}
          </span>
          {post.challenge_project_name && (
            <span className="inline-flex items-center rounded-lg bg-[var(--accent)]/10 px-2.5 py-1 text-xs font-semibold text-[var(--bleu-ciel-deep)] ring-1 ring-[var(--accent)]/20">
              Projet : {post.challenge_project_name}
            </span>
          )}
        </div>
      )}
      <header className="flex items-start gap-3">
        <Link
          to="/app/membres/$userId"
          params={{ userId: post.user_id }}
          onClick={(e) => e.stopPropagation()}
        >
          <AvatarDisplay
            avatarUrl={post.author?.avatar_url}
            firstName={post.author?.first_name}
            lastName={post.author?.last_name}
            email={null}
            isVerified={post.author?.is_verified ?? false}
            size="md"
          />
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            to="/app/membres/$userId"
            params={{ userId: post.user_id }}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-sm font-medium hover:underline"
          >
            {fullName}
            {post.author?.is_verified && (
              <VerifiedBadge className="h-3.5 w-3.5 shrink-0" />
            )}
          </Link>
          <p className="text-xs text-[var(--muted-foreground)]">
            {formatDistanceToNow(new Date(post.created_at), {
              addSuffix: true,
              locale: fr,
            })}
          </p>
        </div>

        {canDelete && (
          <div className="relative">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation()
                setMenuOpen((v) => !v)
              }}
              aria-label="Actions"
              data-no-navigate
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={(e) => {
                    e.stopPropagation()
                    setMenuOpen(false)
                  }}
                  data-no-navigate
                />
                <div
                  className="absolute right-0 top-full z-40 mt-1 w-48 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--card)] shadow-lg"
                  onClick={(e) => e.stopPropagation()}
                  data-no-navigate
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setMenuOpen(false)
                      onDelete(post)
                    }}
                    disabled={pendingDelete}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                  >
                    {pendingDelete ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    Supprimer
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </header>

      {/* Contenu HTML sanitisé */}
      <div className="mt-3 relative">
        <div
          className={cn(
            "post-content text-[15px] leading-relaxed [&_a]:text-[var(--primary)] [&_a]:underline [&_p]:mb-2 [&_p]:last:mb-0 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1 [&_strong]:font-semibold [&_em]:italic [&_h3]:mt-3 [&_h3]:font-display [&_h3]:text-lg [&_h3]:font-semibold [&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:border-[var(--border)] [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-[var(--muted-foreground)] [&_code]:rounded [&_code]:bg-[var(--secondary)] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[0.85em]",
            !isTextExpanded && isLongText && "line-clamp-4 mask-bottom"
          )}
          dangerouslySetInnerHTML={{ __html: safeHtml }}
        />
        {!isTextExpanded && isLongText && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setIsTextExpanded(true)
            }}
            className="mt-1 text-sm font-semibold text-[var(--primary)] hover:underline"
            data-no-navigate
          >
            Voir plus
          </button>
        )}
      </div>

      {post.link_url && (
        <LinkPreviewCard url={post.link_url} className="mt-3" />
      )}

      {post.image_url && (
        <div className="mt-3 overflow-hidden rounded-xl border border-[var(--border)]">
          <a
            href={post.image_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={post.image_url}
              alt=""
              loading="lazy"
              className="max-h-96 w-full object-cover"
            />
          </a>
        </div>
      )}

      {post.hashtags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {post.hashtags.map((h, i) => (
            i === 0 ? (
              <Badge key={h} variant="secondary" className="font-medium text-xs">
                {h}
              </Badge>
            ) : (
              <span
                key={h}
                className="rounded-full bg-[var(--primary)]/5 px-2 py-0.5 text-xs font-medium text-[var(--primary)]"
              >
                #{h}
              </span>
            )
          ))}
        </div>
      )}

      {/* Barre de stats réactions & commentaires façon LinkedIn */}
      {(count > 0 || post.comments_count > 0) && (
        <div className="mt-3 flex items-center justify-between text-xs text-[var(--muted-foreground)]">
          <div>
            {count > 0 && (
              <PostLikersPreview
                postId={post.id}
                count={count}
                liked={liked}
                onClick={() => setLikersOpen(true)}
              />
            )}
          </div>
          {post.comments_count > 0 && (
            <button
              type="button"
              onClick={handleCommentClick}
              className="hover:text-[var(--primary)] hover:underline"
              data-no-navigate
            >
              {post.comments_count} {post.comments_count > 1 ? 'commentaires' : 'commentaire'}
            </button>
          )}
        </div>
      )}

      <footer className="mt-3 flex items-center gap-2 border-t border-[var(--border)] pt-2.5">
        {/* Bouton Like */}
        <button
          type="button"
          aria-label={liked ? 'Retirer mon like' : 'Liker'}
          aria-pressed={liked}
          data-no-navigate
          disabled={!currentUserId}
          onClick={(e) => {
            e.stopPropagation()
            toggle()
          }}
          className={cn(
            'flex-1 inline-flex items-center justify-center gap-2 rounded-xl py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
            liked
              ? 'text-red-500 hover:bg-red-50/50'
              : 'text-[var(--muted-foreground)] hover:bg-[var(--secondary)]/60 hover:text-[var(--foreground)]',
            pendingLike && 'opacity-90',
          )}
        >
          <motion.span
            key={String(liked)}
            initial={{ scale: 1 }}
            animate={{ scale: liked ? [1, 1.3, 1] : [1, 0.9, 1] }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="inline-flex"
          >
            <Heart
              className={cn(
                'h-4.5 w-4.5 transition-colors',
                liked && 'fill-red-500 text-red-500',
              )}
            />
          </motion.span>
          <span>J'aime</span>
        </button>

        {/* Bouton Commenter */}
        <button
          type="button"
          aria-label={commentsOpen ? 'Masquer les commentaires' : 'Voir les commentaires'}
          data-no-navigate
          onClick={handleCommentClick}
          className={cn(
            'flex-1 inline-flex items-center justify-center gap-2 rounded-xl py-2 text-sm font-medium transition-colors',
            commentsOpen
              ? 'text-[var(--primary)] bg-[var(--secondary)]/60'
              : 'text-[var(--muted-foreground)] hover:bg-[var(--secondary)]/60 hover:text-[var(--foreground)]',
          )}
        >
          <MessageCircle
            className={cn(
              'h-4.5 w-4.5',
              commentsOpen && 'fill-[var(--primary)]/15',
            )}
          />
          <span>Commenter</span>
        </button>
      </footer>
    </div>

      {/* Accordéon commentaires inline (uniquement sur le feed) */}
      {!expanded && (
        <AnimatePresence initial={false}>
          {commentsOpen && (
            <motion.div
              key="comments-accordion"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="overflow-hidden border-t border-[var(--border)] bg-[var(--secondary)]/45"
              data-no-navigate
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 sm:p-5">
                <Suspense
                  fallback={
                    <div className="flex items-center justify-center py-6 text-sm text-[var(--muted-foreground)]">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  }
                >
                  <PostCommentSection postId={post.id} variant="inline" />
                </Suspense>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Modal "X personnes ont aimé" — monté seulement au premier
          ouverture (lazy + Suspense). Reste monté ensuite pour profiter
          du cache React Query (30s) lors d'ouvertures rapprochées. */}
      {likersOpen && (
        <Suspense fallback={null}>
          <PostLikersModal
            postId={post.id}
            isOpen={likersOpen}
            onClose={() => setLikersOpen(false)}
            totalCount={count}
          />
        </Suspense>
      )}
    </article>
  )
}

function ActionButton({
  active = false,
  activeClass,
  disabled = false,
  ariaLabel,
  onClick,
  children,
}: {
  active?: boolean
  activeClass?: string
  disabled?: boolean
  ariaLabel: string
  onClick: (e: React.MouseEvent) => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      data-no-navigate
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors disabled:opacity-50',
        active
          ? cn('font-medium', activeClass)
          : 'text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]',
      )}
    >
      {children}
    </button>
  )
}
