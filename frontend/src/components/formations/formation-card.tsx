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
import { ProgressTube } from './progress-tube'

export interface FormationCardData extends Formation {
  chapter_count: number
  completed_count: number
  /** Pré-calculé en SQL par get_formations_with_progress(). */
  progress_percent?: number
  /** L'utilisateur a-t-il au moins une row dans user_formation_progress ? */
  has_started?: boolean
}

export function FormationCard({ formation }: { formation: FormationCardData }) {
  const derived = deriveProgressInfo({
    completed: formation.completed_count,
    total: formation.chapter_count,
  })
  // On préfère le pourcentage déjà calculé par la RPC (évite un éventuel
  // décalage d'arrondi entre SQL et JS), sinon fallback sur le calcul JS.
  const percent = formation.progress_percent ?? derived.percent

  let status: 'not_started' | 'in_progress' | 'completed'
  if (formation.chapter_count > 0 && formation.completed_count >= formation.chapter_count) {
    status = 'completed'
  } else if (formation.has_started || formation.completed_count > 0) {
    status = 'in_progress'
  } else {
    status = 'not_started'
  }

  const noContent = formation.chapter_count === 0

  return (
    <Link
      to="/app/formations/$slug"
      params={{ slug: formation.slug }}
      className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-[var(--card)] transition-all duration-150 touch-manipulation hover:shadow-md active:scale-[0.98] active:bg-[var(--muted)]/30',
        status === 'completed'
          ? 'border-[var(--bleu-ciel)]/50 hover:border-[var(--bleu-ciel)]'
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

          {/* Tube de progression style Skool — toujours visible */}
          <div className="mt-4">
            {noContent ? (
              <div className="space-y-1">
                <ProgressTube value={0} size="md" className="opacity-60" />
                <p className="text-center text-[10px] font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
                  Pas encore disponible
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <ProgressTube value={percent} size="md" />
                {status !== 'not_started' && (
                  <p className="text-center text-[11px] text-[var(--muted-foreground)]">
                    {formation.completed_count}/{formation.chapter_count}{' '}
                    chapitre{formation.chapter_count > 1 ? 's' : ''}
                  </p>
                )}
              </div>
            )}
          </div>
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
      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--bleu-ciel)]/15 px-2.5 py-0.5 text-xs font-medium text-[var(--bleu-ciel-deep)]">
        <CheckCircle2 className="h-3 w-3" />
        Terminée
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
      className="pointer-events-none absolute right-[-32px] top-3 z-10 rotate-45 bg-[var(--bleu-ciel-deep)] px-10 py-1 text-[10px] font-semibold uppercase tracking-wider text-white shadow"
    >
      Terminée
    </span>
  )
}
