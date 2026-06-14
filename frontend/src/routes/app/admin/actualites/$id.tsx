import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { fetchNewsById } from '@/lib/news-queries'
import { NewsForm } from '@/components/news/news-form'

export const Route = createFileRoute('/app/admin/actualites/$id')({
  component: AdminNewsEditPage,
})

function AdminNewsEditPage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['admin-news', id],
    queryFn: () => fetchNewsById(id),
  })

  return (
    <div className="mx-auto max-w-4xl px-6 py-10 lg:py-14">
      <Button variant="outline" size="sm" asChild>
        <Link to="/app/admin/actualites">
          <ArrowLeft className="h-4 w-4" />
          Retour à la liste
        </Link>
      </Button>

      {query.isLoading ? (
        <p className="mt-10 text-sm text-[var(--muted-foreground)]">
          Chargement…
        </p>
      ) : query.isError || !query.data ? (
        <div className="mt-10 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-8 text-center">
          <p className="text-sm">Article introuvable.</p>
        </div>
      ) : (
        <>
          <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight md:text-4xl">
            Éditer : {query.data.title}
          </h1>
          <p className="mt-2 text-[var(--muted-foreground)]">
            Modifie le contenu, change le statut, ajuste la date de
            publication.
          </p>

          <div className="mt-10">
            <NewsForm
              initial={query.data}
              onSaved={() => {
                queryClient.invalidateQueries({ queryKey: ['admin-news'] })
                queryClient.invalidateQueries({
                  queryKey: ['admin-news', id],
                })
                queryClient.invalidateQueries({
                  queryKey: ['news-published'],
                })
                queryClient.invalidateQueries({
                  queryKey: ['news-article', query.data?.slug],
                })
                navigate({ to: '/app/admin/actualites' })
              }}
            />
          </div>
        </>
      )}
    </div>
  )
}
