import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale/fr'
import { ArrowRight, Users } from 'lucide-react'
import { AvatarDisplay } from '@/components/avatar-display'
import { VerifiedBadge } from '@/components/verified-badge'
import { supabase } from '@/lib/supabase'
import { htmlToPlainText } from '@/lib/sanitize-html'
import { fetchPublicProfilesIn } from '@/lib/public-profile'

interface RecentPost {
  id: string
  user_id: string
  content: string
  created_at: string
  author: {
    first_name: string | null
    last_name: string | null
    avatar_url: string | null
    is_verified: boolean
  } | null
}

async function fetchRecentPosts(): Promise<RecentPost[]> {
  const { data: posts, error } = await supabase
    .from('posts')
    .select('id, user_id, content, created_at')
    .order('created_at', { ascending: false })
    .limit(3)
  if (error) throw error
  if (!posts || posts.length === 0) return []
  const userIds = Array.from(new Set(posts.map((p) => p.user_id as string)))
  const profiles = await fetchPublicProfilesIn(userIds)
  const byId = new Map<string, RecentPost['author']>()
  for (const p of profiles) {
    byId.set(p.id, {
      first_name: p.first_name,
      last_name: p.last_name,
      avatar_url: p.avatar_url,
      is_verified: p.is_verified,
    })
  }
  return posts.map((p) => ({
    id: p.id as string,
    user_id: p.user_id as string,
    content: p.content as string,
    created_at: p.created_at as string,
    author: byId.get(p.user_id as string) ?? null,
  }))
}

export function RecentPostsCard() {
  const query = useQuery({
    queryKey: ['recent-posts'],
    queryFn: fetchRecentPosts,
    staleTime: 60_000,
  })

  if (query.isLoading) {
    return (
      <div className="mt-4 space-y-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-20 animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--card)]"
          />
        ))}
      </div>
    )
  }

  if (query.isError || !query.data || query.data.length === 0) {
    return (
      <div className="mt-4 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-10 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--secondary)] text-[var(--muted-foreground)]">
          <Users className="h-5 w-5" />
        </span>
        <h3 className="mt-4 font-medium text-[var(--foreground)]">
          Personne n'a encore posté
        </h3>
        <p className="mx-auto mt-1 max-w-md text-sm text-[var(--muted-foreground)]">
          La communauté démarre. Sois le premier à partager une découverte ou
          une question.
        </p>
        <Link
          to="/app/communaute"
          className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-[var(--primary)] hover:underline"
        >
          Aller dans la communauté
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    )
  }

  return (
    <ul className="mt-4 space-y-3">
      {query.data.map((p) => {
        const fullName =
          [p.author?.first_name, p.author?.last_name]
            .filter(Boolean)
            .join(' ') || 'Membre'
        const preview = htmlToPlainText(p.content).slice(0, 120)
        return (
          <li key={p.id}>
            <Link
              to="/app/communaute/$postId"
              params={{ postId: p.id }}
              className="flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 transition-colors hover:border-[var(--primary)]/30 hover:shadow-sm"
            >
              <AvatarDisplay
                avatarUrl={p.author?.avatar_url}
                firstName={p.author?.first_name}
                lastName={p.author?.last_name}
                email={null}
                isVerified={p.author?.is_verified ?? false}
                size="sm"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-2">
                  <p className="inline-flex items-center gap-1 truncate text-sm font-medium">
                    {fullName}
                    {p.author?.is_verified && (
                      <VerifiedBadge className="h-3.5 w-3.5 shrink-0" />
                    )}
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {formatDistanceToNow(new Date(p.created_at), {
                      addSuffix: true,
                      locale: fr,
                    })}
                  </p>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-[var(--muted-foreground)]">
                  {preview || '(post sans texte)'}
                </p>
              </div>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
