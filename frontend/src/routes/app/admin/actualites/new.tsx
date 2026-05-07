import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NewsForm } from '@/components/news/news-form'

export const Route = createFileRoute('/app/admin/actualites/new')({
  component: AdminNewsNewPage,
})

function AdminNewsNewPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  return (
    <div className="mx-auto max-w-4xl px-6 py-10 lg:py-14">
      <Button variant="outline" size="sm" asChild>
        <Link to="/app/admin/actualites">
          <ArrowLeft className="h-4 w-4" />
          Retour à la liste
        </Link>
      </Button>

      <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight md:text-4xl">
        Nouvelle actualité
      </h1>
      <p className="mt-2 text-[var(--muted-foreground)]">
        Crée un article manuellement (l'agent IA est aussi disponible depuis
        la liste).
      </p>

      <div className="mt-10">
        <NewsForm
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ['admin-news'] })
            queryClient.invalidateQueries({ queryKey: ['news-published'] })
            navigate({ to: '/app/admin/actualites' })
          }}
        />
      </div>
    </div>
  )
}
