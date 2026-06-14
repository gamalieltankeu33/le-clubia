import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ResourceForm } from '@/components/resources/resource-form'

export const Route = createFileRoute('/app/admin/ressources/new')({
  component: AdminResourceNewPage,
})

function AdminResourceNewPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  return (
    <div className="mx-auto max-w-4xl px-6 py-10 lg:py-14">
      <Button variant="outline" size="sm" asChild>
        <Link to="/app/admin/ressources">
          <ArrowLeft className="h-4 w-4" />
          Retour à la liste
        </Link>
      </Button>

      <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight md:text-4xl">
        Nouvelle ressource
      </h1>
      <p className="mt-2 text-[var(--muted-foreground)]">
        Choisis le type, ajoute le contenu, publie quand c'est prêt.
      </p>

      <div className="mt-10">
        <ResourceForm
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ['admin-resources'] })
            queryClient.invalidateQueries({ queryKey: ['member-resources'] })
            queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
            navigate({ to: '/app/admin/ressources' })
          }}
        />
      </div>
    </div>
  )
}
