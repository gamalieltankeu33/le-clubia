import { useEffect } from 'react'
import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale/fr'
import { Heart, Loader2, X } from 'lucide-react'
import { AvatarDisplay } from '@/components/avatar-display'
import { VerifiedBadge } from '@/components/verified-badge'
import { supabase } from '@/lib/supabase'
import { fetchPublicProfilesIn } from '@/lib/public-profile'

interface LikerRow {
  user_id: string
  created_at: string
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
  is_verified: boolean
  bio: string | null
}

const PAGE_SIZE = 50

async function fetchPostLikers(postId: string): Promise<LikerRow[]> {
  // Étape 1 : on récupère les likes (table post_likes — RLS limite déjà
  // aux membres actifs, voir migration 0001 lignes 493-495).
  const { data: likes, error } = await supabase
    .from('post_likes')
    .select('user_id, created_at')
    .eq('post_id', postId)
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE)
  if (error) throw error
  if (!likes || likes.length === 0) return []

  // Étape 2 : on hydrate les profils via la RPC publique (la table
  // profiles a une RLS stricte "self or admin" donc on passe par la
  // RPC SECURITY DEFINER public_profiles_in déjà utilisée partout).
  const userIds = likes.map((l) => l.user_id as string)
  const profiles = await fetchPublicProfilesIn(userIds)
  const byId = new Map(profiles.map((p) => [p.id, p]))

  // On préserve l'ordre du tri DB (plus récents d'abord).
  return likes
    .map((l) => {
      const p = byId.get(l.user_id as string)
      if (!p) return null
      return {
        user_id: l.user_id as string,
        created_at: l.created_at as string,
        first_name: p.first_name,
        last_name: p.last_name,
        avatar_url: p.avatar_url,
        is_verified: p.is_verified,
        bio: p.bio,
      }
    })
    .filter((x): x is LikerRow => x !== null)
}

export function PostLikersModal({
  postId,
  isOpen,
  onClose,
  totalCount,
}: {
  postId: string
  isOpen: boolean
  onClose: () => void
  /** Compteur côté post (likes_count). Affiché dans le titre, et permet
   *  d'afficher un état vide précis quand la réalité est désynchronisée. */
  totalCount: number
}) {
  const { data: likers, isLoading, isError } = useQuery({
    queryKey: ['post-likers', postId],
    queryFn: () => fetchPostLikers(postId),
    enabled: isOpen,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  })

  // Échap pour fermer + body scroll lock pendant ouverture
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [isOpen, onClose])

  const headerCount = likers?.length ?? totalCount
  const titleLabel =
    headerCount === 0
      ? 'Aucun like pour l’instant'
      : headerCount === 1
        ? '1 personne a aimé'
        : `${headerCount} personnes ont aimé`

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Wrapper centrage : flex en bas sur mobile (sheet),
              centré sur desktop (modal). */}
          <div
            className="pointer-events-none fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-label="Personnes qui ont aimé ce post"
          >
            <motion.div
              key="dialog"
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.98 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="pointer-events-auto flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-[var(--border)] bg-[var(--card)] shadow-2xl sm:max-h-[80vh] sm:rounded-2xl"
            >
              {/* Header */}
              <div className="flex shrink-0 items-center justify-between border-b border-[var(--border)] px-5 py-4">
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 fill-[var(--accent)] text-[var(--accent)]" />
                  <h2 className="font-display text-base font-semibold tracking-tight">
                    {titleLabel}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Fermer"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Body — scrollable. min-h-0 pour libérer overflow dans flex. */}
              <div className="min-h-0 flex-1 overflow-y-auto">
                {isLoading ? (
                  <LikersSkeleton />
                ) : isError ? (
                  <p className="px-5 py-8 text-center text-sm text-[var(--muted-foreground)]">
                    Impossible de charger la liste. Réessaie.
                  </p>
                ) : (likers ?? []).length === 0 ? (
                  <div className="px-5 py-12 text-center">
                    <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[var(--secondary)] text-[var(--muted-foreground)]">
                      <Heart className="h-5 w-5" />
                    </span>
                    <p className="mt-3 text-sm text-[var(--muted-foreground)]">
                      Personne n’a encore aimé ce post.
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y divide-[var(--border)]">
                    {likers?.map((l) => (
                      <LikerRowItem key={l.user_id} liker={l} onClose={onClose} />
                    ))}
                  </ul>
                )}
              </div>

              {/* Footer note si on a tronqué à 50 */}
              {(likers?.length ?? 0) >= PAGE_SIZE && (
                <div className="shrink-0 border-t border-[var(--border)] bg-[var(--background)] px-5 py-2 text-center text-xs text-[var(--muted-foreground)]">
                  50 likes les plus récents affichés
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

function LikerRowItem({
  liker,
  onClose,
}: {
  liker: LikerRow
  onClose: () => void
}) {
  const fullName =
    [liker.first_name, liker.last_name].filter(Boolean).join(' ') || 'Membre'

  return (
    <li className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--secondary)]/40">
      <Link
        to="/app/membres/$userId"
        params={{ userId: liker.user_id }}
        onClick={onClose}
        className="shrink-0"
      >
        <AvatarDisplay
          avatarUrl={liker.avatar_url}
          firstName={liker.first_name}
          lastName={liker.last_name}
          email={null}
          isVerified={liker.is_verified}
          size="md"
        />
      </Link>
      <div className="min-w-0 flex-1">
        <Link
          to="/app/membres/$userId"
          params={{ userId: liker.user_id }}
          onClick={onClose}
          className="inline-flex items-center gap-1 text-sm font-medium hover:underline"
        >
          {fullName}
          {liker.is_verified && (
            <VerifiedBadge className="h-3.5 w-3.5 shrink-0" />
          )}
        </Link>
        {liker.bio && (
          <p className="line-clamp-1 text-xs text-[var(--muted-foreground)]">
            {liker.bio}
          </p>
        )}
        <p className="text-xs text-[var(--muted-foreground)]">
          A aimé{' '}
          {formatDistanceToNow(new Date(liker.created_at), {
            addSuffix: true,
            locale: fr,
          })}
        </p>
      </div>
      <Link
        to="/app/membres/$userId"
        params={{ userId: liker.user_id }}
        onClick={onClose}
        className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--primary)] hover:bg-[var(--primary)]/10"
      >
        Voir profil
      </Link>
    </li>
  )
}

function LikersSkeleton() {
  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-[var(--muted-foreground)]" />
      </div>
    </div>
  )
}
