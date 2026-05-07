import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FormationForm } from '@/components/formations/formation-form'

export const Route = createFileRoute('/app/admin/formations/new')({
  component: AdminFormationNewPage,
})

function AdminFormationNewPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  return (
    <div className="mx-auto max-w-4xl px-6 py-10 lg:py-14">
      <Button variant="outline" size="sm" asChild>
        <Link to="/app/admin/formations">
          <ArrowLeft className="h-4 w-4" />
          Retour à la liste
        </Link>
      </Button>

      <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight md:text-4xl">
        Nouvelle formation
      </h1>
      <p className="mt-2 text-[var(--muted-foreground)]">
        Renseigne les informations, ajoute les chapitres et publie quand c'est
        prêt.
      </p>

      <div className="mt-10">
        <FormationForm
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ['admin-formations'] })
            queryClient.invalidateQueries({
              queryKey: ['formations', 'catalog'],
            })
            navigate({ to: '/app/admin/formations' })
          }}
        />
      </div>
    </div>
  )
}
