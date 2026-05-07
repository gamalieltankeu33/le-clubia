import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import type { Resource } from '@/lib/database.types'
import { ResourceForm } from '@/components/resources/resource-form'

export const Route = createFileRoute('/app/admin/ressources/$id')({
  component: AdminResourceEditPage,
})

async function fetchResource(id: string): Promise<Resource | null> {
  const { data, error } = await supabase
    .from('resources')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return (data ?? null) as Resource | null
}

function AdminResourceEditPage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['admin-resource', id],
    queryFn: () => fetchResource(id),
  })

  return (
    <div className="mx-auto max-w-4xl px-6 py-10 lg:py-14">
      <Button variant="outline" size="sm" asChild>
        <Link to="/app/admin/ressources">
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
          <p className="text-sm">Ressource introuvable.</p>
        </div>
      ) : (
        <>
          <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight md:text-4xl">
            Éditer : {query.data.title}
          </h1>
          <p className="mt-2 text-[var(--muted-foreground)]">
            Modifie les informations ou bascule en brouillon.
          </p>

          <div className="mt-10">
            <ResourceForm
              initial={query.data}
              onSaved={() => {
                queryClient.invalidateQueries({ queryKey: ['admin-resources'] })
                queryClient.invalidateQueries({ queryKey: ['admin-resource', id] })
                queryClient.invalidateQueries({ queryKey: ['member-resources'] })
                queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
                navigate({ to: '/app/admin/ressources' })
              }}
            />
          </div>
        </>
      )}
    </div>
  )
}
