import { Link } from '@tanstack/react-router'
import {
  CheckCircle2,
  Clock,
  GraduationCap,
  PlayCircle,
} from 'lucide-react'
import type { Formation } from '@/lib/database.types'
import {
  formatDuration,
  LEVEL_LABELS,
} from '@/lib/formation-helpers'
import { deriveProgressInfo } from '@/lib/use-formation-progress'
import { cn } from '@/lib/utils'
import { CoverImage } from './cover-image'
import { ProgressBar } from './progress-bar'

export interface FormationCardData extends Formation {
  chapter_count: number
  completed_count: number
  /** L'utilisateur a-t-il au moins une row dans user_formation_progress ? */
  has_started?: boolean
}

export function FormationCard({ formation }: { formation: FormationCardData }) {
  const { percent } = deriveProgressInfo({
    completed: formation.completed_count,
    total: formation.chapter_count,
  })
  // Statut effectif (intègre `has_started` au-delà du seul completed_count)
  let status: 'not_started' | 'in_progress' | 'completed'
  if (formation.chapter_count > 0 && formation.completed_count >= formation.chapter_count) {
    status = 'completed'
  } else if (formation.has_started || formation.completed_count > 0) {
    status = 'in_progress'
  } else {
    status = 'not_started'
  }

  const tooltip =
    status === 'not_started'
      ? undefined
      : `${formation.completed_count}/${formation.chapter_count} chapitre${formation.chapter_count > 1 ? 's' : ''} terminé${formation.completed_count > 1 ? 's' : ''}`

  return (
    <Link
      to="/app/formations/$slug"
      params={{ slug: formation.slug }}
      title={tooltip}
      className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-[var(--card)] transition-all hover:shadow-md',
        status === 'completed'
          ? 'border-[var(--accent)]/30 hover:border-[var(--accent)]/60'
          : 'border-[var(--border)] hover:border-[var(--primary)]/30',
      )}
    >
      {status === 'completed' && <CompletedRibbon />}

      <CoverImage src={formation.cover_image_url} alt={formation.title} />

      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[var(--primary)]/10 px-2.5 py-0.5 text-xs font-medium text-[var(--primary)]">
            {formation.category}
          </span>
          <StatusBadge status={status} />
        </div>

        <h3 className="mt-3 line-clamp-2 font-display text-lg font-semibold leading-snug">
          {formation.title}
        </h3>

        {formation.description && (
          <p className="mt-1.5 line-clamp-2 text-sm text-[var(--muted-foreground)]">
            {formation.description}
          </p>
        )}

        <div className="mt-auto pt-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[var(--muted-foreground)]">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {formatDuration(formation.duration_minutes)}
            </span>
            <span className="inline-flex items-center gap-1">
              <GraduationCap className="h-3.5 w-3.5" />
              {LEVEL_LABELS[formation.level]}
            </span>
            <span className="inline-flex items-center gap-1">
              <PlayCircle className="h-3.5 w-3.5" />
              {formation.chapter_count} chapitre
              {formation.chapter_count > 1 ? 's' : ''}
            </span>
          </div>

          {status !== 'not_started' && (
            <div className="mt-3 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--muted-foreground)]">
                  {status === 'completed' ? 'Terminé' : 'Progression'}
                </span>
                <span
                  className={cn(
                    'font-medium',
                    status === 'completed'
                      ? 'text-[var(--accent)]'
                      : 'text-[var(--foreground)]',
                  )}
                >
                  {percent}%
                </span>
              </div>
              <ProgressBar
                value={percent}
                size="sm"
                className={status === 'completed' ? 'bg-[var(--accent)]/10' : undefined}
                barClassName={
                  status === 'completed' ? 'bg-[var(--accent)]' : undefined
                }
              />
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

function StatusBadge({
  status,
}: {
  status: 'not_started' | 'in_progress' | 'completed'
}) {
  if (status === 'not_started') return null
  if (status === 'completed') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--accent)]/15 px-2.5 py-0.5 text-xs font-medium text-[var(--accent)]">
        <CheckCircle2 className="h-3 w-3" />
        Terminé
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--primary)]/10 px-2.5 py-0.5 text-xs font-medium text-[var(--primary)]">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--primary)]" />
      En cours
    </span>
  )
}

function CompletedRibbon() {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute right-[-32px] top-3 z-10 rotate-45 bg-[var(--accent)] px-10 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--accent-foreground)] shadow"
    >
      Terminé
    </span>
  )
}
