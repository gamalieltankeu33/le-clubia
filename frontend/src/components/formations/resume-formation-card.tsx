import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, PlayCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth-store'
import { CoverImage } from './cover-image'
import { ProgressBar } from './progress-bar'

interface ResumeData {
  formation: {
    id: string
    slug: string
    title: string
    cover_image_url: string | null
    category: string
  }
  totalChapters: number
  completedChapters: number
}

async function fetchResumeData(userId: string): Promise<ResumeData | null> {
  // Cherche la dernière progression. La table user_formation_progress
  // n'a pas de colonne updated_at — on utilise completed_at (timestamp
  // posé à la complétion d'un chapitre). nullsFirst:false pour que les
  // chapitres "en cours" (completed_at = null) ne polluent pas la tête
  // du tri ; on veut prioritairement les formations récemment touchées
  // par une complétion.
  const { data: progressRows, error: pErr } = await supabase
    .from('user_formation_progress')
    .select('formation_id, completed, completed_at')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false, nullsFirst: false })
    .limit(50)
  if (pErr || !progressRows?.length) return null

  // Pour chaque formation, on garde la dernière interaction
  const seen = new Set<string>()
  const formationsTouched: string[] = []
  for (const row of progressRows) {
    if (!seen.has(row.formation_id)) {
      seen.add(row.formation_id)
      formationsTouched.push(row.formation_id)
    }
  }

  // Pour chaque formation touchée, vérifie si elle est complétée à 100%
  for (const formationId of formationsTouched) {
    const { data: formation } = await supabase
      .from('formations')
      .select('id, slug, title, cover_image_url, category')
      .eq('id', formationId)
      .eq('is_published', true)
      .maybeSingle()
    if (!formation) continue

    const [{ count: total }, { count: done }] = await Promise.all([
      supabase
        .from('formation_chapters')
        .select('*', { count: 'exact', head: true })
        .eq('formation_id', formationId),
      supabase
        .from('user_formation_progress')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('formation_id', formationId)
        .eq('completed', true),
    ])

    const totalChapters = total ?? 0
    const completedChapters = done ?? 0
    if (totalChapters === 0 || completedChapters >= totalChapters) {
      // formation sans chapitre OU déjà 100% : on passe à la suivante
      continue
    }

    return {
      formation,
      totalChapters,
      completedChapters,
    }
  }

  return null
}

export function ResumeFormationCard() {
  const userId = useAuthStore((s) => s.user?.id)

  const query = useQuery({
    queryKey: ['resume-formation', userId],
    queryFn: () => fetchResumeData(userId!),
    enabled: Boolean(userId),
    staleTime: 60 * 1000,
  })

  if (query.isLoading) {
    return (
      <div className="mt-4 h-32 animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--card)]" />
    )
  }

  if (!query.data) {
    return (
      <div className="mt-4 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-10 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--secondary)] text-[var(--muted-foreground)]">
          <PlayCircle className="h-5 w-5" />
        </span>
        <h3 className="mt-4 font-medium">
          Tu n'as pas encore commencé de formation
        </h3>
        <p className="mx-auto mt-1 max-w-md text-sm text-[var(--muted-foreground)]">
          Explore le catalogue pour démarrer ton apprentissage.
        </p>
        <Link
          to="/app/formations"
          className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-[var(--primary)] hover:underline"
        >
          Explorer le catalogue
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    )
  }

  const { formation, totalChapters, completedChapters } = query.data
  const pct = Math.round((completedChapters / totalChapters) * 100)

  return (
    <Link
      to="/app/formations/$slug"
      params={{ slug: formation.slug }}
      className="mt-4 group flex items-stretch gap-0 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] transition-all hover:border-[var(--primary)]/30 hover:shadow-md"
    >
      <div className="hidden w-44 shrink-0 sm:block">
        <CoverImage
          src={formation.cover_image_url}
          alt={formation.title}
          ratio="aspect-square"
          className="h-full"
        />
      </div>
      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          <span className="rounded-full bg-[var(--primary)]/10 px-2.5 py-0.5 text-xs font-medium text-[var(--primary)]">
            {formation.category}
          </span>
          <h3 className="mt-2 font-display text-lg font-semibold leading-snug">
            {formation.title}
          </h3>
        </div>
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--muted-foreground)]">
              {completedChapters}/{totalChapters} chapitres
            </span>
            <span className="font-medium">{pct}%</span>
          </div>
          <ProgressBar value={pct} className="mt-1.5" />
          <div className="mt-4 flex items-center gap-1 text-sm font-medium text-[var(--primary)]">
            Continuer
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>
      </div>
    </Link>
  )
}
