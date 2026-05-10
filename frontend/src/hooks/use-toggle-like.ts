import { useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { checkRateLimit } from '@/lib/use-rate-limit'
import { haptic } from '@/lib/haptic'
import type { FeedPost } from '@/components/community/post-card'

type Action = 'like' | 'unlike'

/**
 * Source de vérité = le cache React Query. Le hook met à jour de
 * manière optimiste TOUTES les queries où ce post peut apparaître
 * (feed infini, page détail, posts d'un membre, recent-posts) puis
 * laisse la DB faire le reste — les triggers maintiennent likes_count
 * en cohérence côté serveur, donc on n'a pas besoin d'invalider après.
 *
 * Pas de loader visible : l'optimistic update est instantané. Si la
 * mutation échoue, on rollback via les snapshots et on toast.
 *
 * Anti race :
 *  - mutationKey unique par post → permet une introspection facile
 *  - cancelQueries avant chaque optimistic → bloque les refetch en
 *    arrière-plan qui écraseraient l'état optimiste
 *  - isPending bloque les doublons de clic (un seul clic actif)
 */
export function useToggleLike(post: FeedPost, currentUserId: string | null) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationKey: ['toggle-like', post.id],
    mutationFn: async ({ action }: { action: Action }) => {
      if (!currentUserId) throw new Error('not-auth')
      const rl = await checkRateLimit('post_like')
      if (!rl.allowed) {
        const err = new Error('rate_limited')
        err.name = 'RateLimitError'
        throw err
      }
      if (action === 'like') {
        const { error } = await supabase
          .from('post_likes')
          .insert({ post_id: post.id, user_id: currentUserId })
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', currentUserId)
        if (error) throw error
      }
    },
    onMutate: async ({ action }) => {
      // Bloque tout refetch en cours pour les caches concernés afin
      // qu'aucune réponse "stale" n'écrase l'état optimiste.
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['community-feed'] }),
        queryClient.cancelQueries({ queryKey: ['community-post', post.id] }),
        queryClient.cancelQueries({ queryKey: ['user-posts'] }),
      ])

      // Snapshots pour rollback en onError.
      const snapshots = takeSnapshots(queryClient, post.id)
      applyOptimistic(queryClient, post.id, action === 'like')
      // Feedback tactile : medium pour le like (action confirmée),
      // light pour l'unlike (action moins engageante).
      haptic(action === 'like' ? 'medium' : 'light')
      return { snapshots }
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.snapshots) restoreSnapshots(queryClient, ctx.snapshots)
      haptic('error')
      if (err instanceof Error && err.name === 'RateLimitError') {
        toast.warning("Trop d'actions trop rapides. Détends-toi un peu 😊")
      } else if (err instanceof Error && err.message === 'not-auth') {
        toast.error('Connecte-toi pour aimer.')
      } else {
        toast.error('Action impossible. Réessaie.')
      }
    },
    // Pas d'onSettled qui invalide : les triggers DB (trg_post_likes_count)
    // garantissent que likes_count est cohérent côté serveur. Un
    // invalidate ici provoquerait un refetch immédiat qui peut écraser
    // les clics rapides suivants — c'était le bug du "loader bloqué".
  })

  const toggle = useCallback(() => {
    if (!currentUserId) {
      toast.error('Connecte-toi pour aimer.')
      return
    }
    if (mutation.isPending) return // bloque le double-clic
    // L'état "actuel" vient du cache (déjà mis à jour par les optimistic
    // précédents). On regarde dans le post passé en prop, qui est lui-
    // même dérivé du cache — donc cohérent.
    const action: Action = post.liked_by_me ? 'unlike' : 'like'
    mutation.mutate({ action })
  }, [currentUserId, mutation, post.liked_by_me])

  return {
    liked: post.liked_by_me,
    count: post.likes_count,
    toggle,
    isPending: mutation.isPending,
  }
}

// ─── Helpers cache ────────────────────────────────────────────────────────

type FeedShape = {
  pages: { posts: FeedPost[]; nextCursor: number | null }[]
  pageParams: unknown[]
}

interface Snapshot {
  key: readonly unknown[]
  data: unknown
}

/**
 * Capture l'état des 4 familles de queries concernées, pour pouvoir
 * rollback en cas d'erreur serveur.
 */
function takeSnapshots(
  qc: ReturnType<typeof useQueryClient>,
  _postId: string,
): Snapshot[] {
  const snaps: Snapshot[] = []
  const families: readonly unknown[][] = [
    ['community-feed'],
    ['community-post'],
    ['user-posts'],
  ]
  for (const fam of families) {
    const all = qc.getQueriesData({ queryKey: fam })
    for (const [key, data] of all) {
      snaps.push({ key, data })
    }
  }
  return snaps
}

function restoreSnapshots(
  qc: ReturnType<typeof useQueryClient>,
  snapshots: Snapshot[],
): void {
  for (const snap of snapshots) {
    qc.setQueryData(snap.key, snap.data)
  }
}

/**
 * Applique l'update optimiste (like/unlike) sur toutes les queries où
 * ce post peut apparaître. Gère 3 shapes différents :
 *   - community-feed : { pages: [{ posts: [...] }] }    (useInfiniteQuery)
 *   - community-post : FeedPost | null                  (useQuery par id)
 *   - user-posts / recent-posts : FeedPost[]            (useQuery liste)
 */
function applyOptimistic(
  qc: ReturnType<typeof useQueryClient>,
  postId: string,
  liked: boolean,
): void {
  const tweak = (p: FeedPost): FeedPost =>
    p.id === postId
      ? {
          ...p,
          liked_by_me: liked,
          likes_count: Math.max(
            0,
            (Number(p.likes_count) || 0) + (liked ? 1 : -1),
          ),
        }
      : p

  // community-feed : forme infinite
  qc.setQueriesData<FeedShape>({ queryKey: ['community-feed'] }, (data) => {
    if (!data || !Array.isArray(data.pages)) return data
    return {
      ...data,
      pages: data.pages.map((page) => ({
        ...page,
        posts: page.posts.map(tweak),
      })),
    }
  })

  // community-post : un seul post
  qc.setQueriesData<FeedPost | null>(
    { queryKey: ['community-post', postId] },
    (data) => {
      if (!data) return data
      return tweak(data)
    },
  )

  // user-posts : tableau
  qc.setQueriesData<FeedPost[]>({ queryKey: ['user-posts'] }, (data) => {
    if (!data || !Array.isArray(data)) return data
    return data.map(tweak)
  })
}
