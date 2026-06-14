import { supabase } from './supabase'
import { fetchPublicProfilesIn } from './public-profile'
import type { FeedPost } from '@/components/community/post-card'

/**
 * Pour `liked_by_me`, on appelle la RPC SECURITY DEFINER
 * get_my_liked_post_ids (cf. migration 0021). Elle se base directement
 * sur `auth.uid()` côté Postgres, donc :
 *   - zéro mismatch entre l'utilisateur JS et le JWT,
 *   - aucun blocage RLS asymétrique (avant on lisait post_likes via la
 *     policy `likes select members` qui exige is_active_member, ce qui
 *     pouvait retourner 0 ligne après refresh dans des cas limites,
 *     faisant disparaître le coeur rouge).
 *
 * Si pas d'utilisateur connecté on saute l'appel — la RPC exigerait de
 * toute façon le grant authenticated.
 */
async function fetchMyLikedPostIds(
  currentUserId: string | null,
  postIds: string[],
): Promise<{ post_id: string }[]> {
  if (!currentUserId || postIds.length === 0) return []
  // @ts-expect-error - get_my_liked_post_ids est une RPC custom non typée dans Database['public']['Functions']
  const { data, error } = await supabase.rpc('get_my_liked_post_ids', {
    p_post_ids: postIds,
  })
  if (error) {
    console.warn('[community] get_my_liked_post_ids error:', error)
    return []
  }
  return (data ?? []) as { post_id: string }[]
}

interface RawPost {
  id: string
  user_id: string
  content: string
  image_url: string | null
  link_url: string | null
  hashtags: string[] | null
  likes_count: number
  comments_count: number
  is_pinned: boolean
  created_at: string
}

/**
 * Hydrate une liste brute de posts avec :
 * - les profils auteurs PUBLICS (sans email — RPC public_profiles_in)
 * - les likes du membre courant (1 query)
 */
export async function hydratePosts(
  rawPosts: RawPost[],
  currentUserId: string | null,
): Promise<FeedPost[]> {
  if (rawPosts.length === 0) return []

  const userIds = Array.from(new Set(rawPosts.map((p) => p.user_id)))
  const postIds = rawPosts.map((p) => p.id)

  const [authors, likedRows] = await Promise.all([
    fetchPublicProfilesIn(userIds),
    fetchMyLikedPostIds(currentUserId, postIds),
  ])

  const authorById = new Map(authors.map((a) => [a.id, a]))
  const likedSet = new Set<string>()
  for (const l of likedRows) {
    likedSet.add(l.post_id)
  }

  return rawPosts.map((p) => {
    const author = authorById.get(p.user_id) ?? null
    return {
      id: p.id,
      user_id: p.user_id,
      content: p.content,
      image_url: p.image_url,
      link_url: p.link_url,
      hashtags: p.hashtags ?? [],
      likes_count: p.likes_count,
      comments_count: p.comments_count,
      is_pinned: Boolean(p.is_pinned),
      created_at: p.created_at,
      author: author
        ? {
            id: author.id,
            first_name: author.first_name,
            last_name: author.last_name,
            avatar_url: author.avatar_url,
            is_verified: author.is_verified,
          }
        : null,
      liked_by_me: likedSet.has(p.id),
    } satisfies FeedPost
  })
}

export interface FeedPage {
  posts: FeedPost[]
  /** Offset à passer pour la prochaine page, ou null s'il n'y a plus rien. */
  nextCursor: number | null
}

const PAGE_SIZE = 20

/**
 * Récupère une page de posts du feed global, avec auteurs et liked_by_me hydratés.
 * @param page index de la page (0-based)
 */
export async function fetchFeedPage(
  page: number,
  currentUserId: string | null,
): Promise<FeedPage> {
  const from = page * PAGE_SIZE
  const to = from + PAGE_SIZE - 1
  const { data, error } = await supabase
    .from('posts')
    .select(
      'id, user_id, content, image_url, link_url, hashtags, likes_count, comments_count, is_pinned, created_at',
    )
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .range(from, to)
  if (error) throw error
  const rows = (data ?? []) as RawPost[]
  const hydrated = await hydratePosts(rows, currentUserId)
  return {
    posts: hydrated,
    nextCursor: rows.length === PAGE_SIZE ? page + 1 : null,
  }
}

/**
 * Récupère un seul post hydraté.
 */
export async function fetchPostById(
  postId: string,
  currentUserId: string | null,
): Promise<FeedPost | null> {
  const { data, error } = await supabase
    .from('posts')
    .select(
      'id, user_id, content, image_url, link_url, hashtags, likes_count, comments_count, is_pinned, created_at',
    )
    .eq('id', postId)
    .maybeSingle()
  if (error || !data) return null
  const [hydrated] = await hydratePosts([data as RawPost], currentUserId)
  return hydrated ?? null
}

/**
 * Récupère les posts d'un membre donné, avec auteur et liked_by_me hydratés.
 */
export async function fetchUserPosts(
  userId: string,
  currentUserId: string | null,
  limit = 50,
): Promise<FeedPost[]> {
  const { data, error } = await supabase
    .from('posts')
    .select(
      'id, user_id, content, image_url, link_url, hashtags, likes_count, comments_count, is_pinned, created_at',
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return hydratePosts((data ?? []) as RawPost[], currentUserId)
}
