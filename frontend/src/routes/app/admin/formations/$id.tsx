import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import type { Formation, FormationChapter } from '@/lib/database.types'
import { FormationForm } from '@/components/formations/formation-form'

export const Route = createFileRoute('/app/admin/formations/$id')({
  component: AdminFormationEditPage,
})

interface FormationData {
  formation: Formation
  chapters: FormationChapter[]
}

async function fetchFormationById(id: string): Promise<FormationData | null> {
  const { data: formation, error: fErr } = await supabase
    .from('formations')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (fErr) throw fErr
  if (!formation) return null

  const { data: chapters, error: cErr } = await supabase
    .from('formation_chapters')
    .select('*')
    .eq('formation_id', id)
    .order('order_index', { ascending: true })
  if (cErr) throw cErr

  return {
    formation: formation as Formation,
    chapters: (chapters ?? []) as FormationChapter[],
  }
}

function AdminFormationEditPage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['admin-formation', id],
    queryFn: () => fetchFormationById(id),
  })

  return (
    <div className="mx-auto max-w-4xl px-6 py-10 lg:py-14">
      <Button variant="outline" size="sm" asChild>
        <Link to="/app/admin/formations">
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
          <p className="text-sm">Formation introuvable.</p>
        </div>
      ) : (
        <>
          <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight md:text-4xl">
            Éditer : {query.data.formation.title}
          </h1>
          <p className="mt-2 text-[var(--muted-foreground)]">
            Modifie les informations, gère les chapitres ou bascule en
            brouillon.
          </p>

          <div className="mt-10">
            <FormationForm
              initial={query.data}
              onSaved={() => {
                queryClient.invalidateQueries({
                  queryKey: ['admin-formations'],
                })
                queryClient.invalidateQueries({
                  queryKey: ['formations', 'catalog'],
                })
                queryClient.invalidateQueries({
                  queryKey: ['admin-formation', id],
                })
                queryClient.invalidateQueries({
                  queryKey: ['formation', query.data?.formation.slug],
                })
                navigate({ to: '/app/admin/formations' })
              }}
            />
          </div>
        </>
      )}
    </div>
  )
}
