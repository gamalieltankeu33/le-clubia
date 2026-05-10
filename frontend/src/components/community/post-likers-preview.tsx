import { useQuery } from '@tanstack/react-query'
import { Heart } from 'lucide-react'
import { AvatarDisplay } from '@/components/avatar-display'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { haptic } from '@/lib/haptic'

interface PreviewLiker {
  post_id: string
  user_id: string
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
  rn: number
}

async function fetchPostLikersPreview(postId: string): Promise<PreviewLiker[]> {
  // @ts-expect-error - get_post_likers_preview est une RPC custom non typée dans Database['public']['Functions']
  const { data, error } = await supabase.rpc('get_post_likers_preview', {
    p_post_ids: [postId],
  })
  if (error) throw error
  return ((data ?? []) as PreviewLiker[]).sort((a, b) => a.rn - b.rn)
}

interface PostLikersPreviewProps {
  postId: string
  count: number
  liked: boolean
  onClick: () => void
  className?: string
}

/**
 * Aperçu façon LinkedIn : 3 petits avatars superposés + "X likes".
 * Caché si count === 0. Au clic, ouvre le modal de liste complète.
 *
 * La query est lazy : on ne fetch qu'au montage du composant. Si le
 * post n'a pas de like (count === 0), on ne fetch pas du tout (early
 * return + enabled=false).
 */
export function PostLikersPreview({
  postId,
  count,
  liked,
  onClick,
  className,
}: PostLikersPreviewProps) {
  const { data: likers } = useQuery({
    queryKey: ['post-likers-preview', postId],
    queryFn: () => fetchPostLikersPreview(postId),
    enabled: count > 0,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  })

  if (count === 0) return null

  const heartFilled = liked || count > 0
  const visible = (likers ?? []).slice(0, 3)

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        haptic('light')
        onClick()
      }}
      data-no-navigate
      aria-label={`Voir les ${count} personne${count > 1 ? 's' : ''} qui ${count > 1 ? 'ont' : 'a'} aimé ce post`}
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-2 py-1.5 text-xs sm:text-sm transition-all duration-150 touch-manipulation',
        'min-h-[36px] active:scale-95 active:bg-[var(--muted)]/40',
        'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)]/60',
        className,
      )}
    >
      {/* Cœur compact pour signaler le type de réaction */}
      <span
        aria-hidden
        className={cn(
          'inline-flex h-5 w-5 items-center justify-center rounded-full',
          heartFilled ? 'bg-red-500/10' : 'bg-[var(--secondary)]',
        )}
      >
        <Heart
          className={cn('h-3 w-3', heartFilled ? 'fill-red-500 text-red-500' : 'text-[var(--muted-foreground)]')}
        />
      </span>

      {/* Stack d'avatars */}
      {visible.length > 0 && (
        <span className="flex -space-x-2">
          {visible.map((liker, idx) => (
            <span
              key={liker.user_id}
              className="relative inline-block rounded-full ring-2 ring-[var(--card)]"
              style={{ zIndex: 3 - idx }}
            >
              <AvatarDisplay
                avatarUrl={liker.avatar_url}
                firstName={liker.first_name}
                lastName={liker.last_name}
                email={null}
                isVerified={false}
                size="sm"
              />
            </span>
          ))}
        </span>
      )}

      {/* Label compact */}
      <span className="font-medium tabular-nums">
        {count === 1 ? '1 like' : `${count} likes`}
      </span>
    </button>
  )
}
