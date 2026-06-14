import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale/fr'
import { Loader2, Send, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { AvatarDisplay } from '@/components/avatar-display'
import { VerifiedBadge } from '@/components/verified-badge'
import { useAuthStore } from '@/stores/auth-store'
import { supabase } from '@/lib/supabase'
import { fetchPublicProfilesIn } from '@/lib/public-profile'
import { useConfirm } from '@/hooks/use-confirm'

const MAX_CHARS = 1000

interface CommentRow {
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

async function fetchNewsComments(
  newsArticleId: string,
): Promise<CommentRow[]> {
  const { data: rows, error } = await supabase
    .from('news_comments')
    .select('id, user_id, content, created_at')
    .eq('news_article_id', newsArticleId)
    .order('created_at', { ascending: true })
  if (error) throw error
  if (!rows || rows.length === 0) return []
  const userIds = Array.from(new Set(rows.map((c) => c.user_id as string)))
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
    id: c.id as string,
    user_id: c.user_id as string,
    content: c.content as string,
    created_at: c.created_at as string,
    author: byId.get(c.user_id as string) ?? null,
  }))
}

export function NewsCommentSection({
  newsArticleId,
}: {
  newsArticleId: string
}) {
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const profile = useAuthStore((s) => s.profile)
  const isAdmin = useAuthStore((s) => s.isAdmin)()
  const { confirm, ConfirmDialog } = useConfirm()

  const [content, setContent] = useState('')

  const commentsQuery = useQuery({
    queryKey: ['news-comments', newsArticleId],
    queryFn: () => fetchNewsComments(newsArticleId),
    staleTime: 15_000,
  })

  const addMutation = useMutation({
    mutationFn: async (text: string) => {
      if (!user) throw new Error('not-auth')
      const { error } = await supabase
        .from('news_comments')
        .insert({
          news_article_id: newsArticleId,
          user_id: user.id,
          content: text,
        })
      if (error) throw error
    },
    onSuccess: () => {
      setContent('')
      queryClient.invalidateQueries({
        queryKey: ['news-comments', newsArticleId],
      })
    },
    onError: () => toast.error('Commentaire impossible. Réessaie.'),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('news_comments')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Commentaire supprimé.')
      queryClient.invalidateQueries({
        queryKey: ['news-comments', newsArticleId],
      })
    },
    onError: () => toast.error('Suppression impossible.'),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = content.trim()
    if (!trimmed) return
    if (trimmed.length > MAX_CHARS) {
      toast.error(`Commentaire trop long (${MAX_CHARS} max).`)
      return
    }
    addMutation.mutate(trimmed)
  }

  async function handleDelete(comment: CommentRow) {
    const ok = await confirm({
      title: 'Supprimer ce commentaire ?',
      contentPreview: comment.content.slice(0, 160),
      description: 'Cette action est irréversible.',
      confirmLabel: 'Supprimer',
      variant: 'destructive',
    })
    if (!ok) return
    deleteMutation.mutate(comment.id)
  }

  const overLimit = content.length > MAX_CHARS

  return (
    <section className="mt-10 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
      <h2 className="font-display text-lg font-semibold tracking-tight">
        Commentaires
      </h2>

      {/* Composer */}
      <form
        onSubmit={handleSubmit}
        className="mt-4 flex items-start gap-3 border-b border-[var(--border)] pb-5"
      >
        <AvatarDisplay
          avatarUrl={profile?.avatar_url}
          firstName={profile?.first_name}
          lastName={profile?.last_name}
          email={user?.email}
          isVerified={profile?.is_verified ?? false}
          size="md"
        />
        <div className="flex-1 space-y-2">
          <Textarea
            rows={2}
            placeholder="Réagis à cette actualité…"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={addMutation.isPending}
            maxLength={MAX_CHARS + 200}
            className="min-h-16"
          />
          <div className="flex items-center justify-between">
            <span
              className={
                overLimit
                  ? 'text-xs text-red-600'
                  : 'text-xs text-[var(--muted-foreground)]'
              }
            >
              {content.length}/{MAX_CHARS}
            </span>
            <Button
              type="submit"
              size="sm"
              disabled={
                !content.trim() || overLimit || addMutation.isPending
              }
            >
              {addMutation.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Envoi…
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  Commenter
                </>
              )}
            </Button>
          </div>
        </div>
      </form>

      {/* Liste */}
      <div className="mt-5">
        {commentsQuery.isLoading ? (
          <p className="py-4 text-sm text-[var(--muted-foreground)]">
            Chargement…
          </p>
        ) : commentsQuery.isError ? (
          <p className="py-4 text-sm text-[var(--muted-foreground)]">
            Impossible de charger les commentaires.
          </p>
        ) : (commentsQuery.data ?? []).length === 0 ? (
          <p className="py-4 text-center text-sm text-[var(--muted-foreground)]">
            Sois le premier à commenter.
          </p>
        ) : (
          <ul className="space-y-5">
            {commentsQuery.data?.map((c) => {
              const fullName =
                [c.author?.first_name, c.author?.last_name]
                  .filter(Boolean)
                  .join(' ') || 'Membre'
              const canDelete = c.user_id === user?.id || isAdmin
              return (
                <li key={c.id} className="group flex items-start gap-3">
                  <Link
                    to="/app/membres/$userId"
                    params={{ userId: c.user_id }}
                  >
                    <AvatarDisplay
                      avatarUrl={c.author?.avatar_url}
                      firstName={c.author?.first_name}
                      lastName={c.author?.last_name}
                      email={null}
                      isVerified={c.author?.is_verified ?? false}
                      size="sm"
                    />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="rounded-2xl bg-[var(--secondary)] px-4 py-2.5">
                      <Link
                        to="/app/membres/$userId"
                        params={{ userId: c.user_id }}
                        className="inline-flex items-center gap-1 text-xs font-semibold hover:underline"
                      >
                        {fullName}
                        {c.author?.is_verified && (
                          <VerifiedBadge className="h-3 w-3 shrink-0" />
                        )}
                      </Link>
                      <p className="mt-1 whitespace-pre-wrap text-sm">
                        {c.content}
                      </p>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
                      <span>
                        {formatDistanceToNow(new Date(c.created_at), {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </span>
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => handleDelete(c)}
                          disabled={deleteMutation.isPending}
                          className="inline-flex items-center gap-1 text-red-600 opacity-0 transition-opacity hover:underline group-hover:opacity-100 disabled:opacity-50"
                        >
                          <Trash2 className="h-3 w-3" />
                          Supprimer
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <ConfirmDialog />
    </section>
  )
}
