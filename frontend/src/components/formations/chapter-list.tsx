import { CheckCircle2, Circle } from 'lucide-react'
import type { FormationChapter } from '@/lib/database.types'
import { formatDuration } from '@/lib/formation-helpers'
import { cn } from '@/lib/utils'

export function ChapterList({
  chapters,
  activeChapterId,
  completedChapterIds,
  progressByChapterId,
  onSelect,
}: {
  chapters: FormationChapter[]
  activeChapterId: string | null
  completedChapterIds: Set<string>
  /** Map chapterId → progress_percent (0..100). Optionnel : si absent, 0. */
  progressByChapterId?: Map<string, number>
  onSelect: (chapterId: string) => void
}) {
  return (
    <ol className="space-y-1">
      {chapters.map((chapter, idx) => {
        const completed = completedChapterIds.has(chapter.id)
        const active = chapter.id === activeChapterId
        const pct = progressByChapterId?.get(chapter.id) ?? 0
        const showProgress = !completed && pct > 0

        return (
          <li key={chapter.id}>
            <button
              type="button"
              onClick={() => onSelect(chapter.id)}
              className={cn(
                'group flex w-full items-start gap-3 rounded-lg border border-transparent p-3 text-left transition-colors',
                active
                  ? 'border-[var(--primary)]/20 bg-[var(--primary)]/10'
                  : 'hover:bg-[var(--secondary)]',
              )}
            >
              <span className="mt-0.5 shrink-0">
                {completed ? (
                  <CheckCircle2 className="h-5 w-5 text-[var(--bleu-ciel-deep)]" />
                ) : (
                  <Circle className="h-5 w-5 text-[var(--muted-foreground)]" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={cn(
                    'block text-xs font-medium uppercase tracking-wider',
                    active
                      ? 'text-[var(--primary)]'
                      : 'text-[var(--muted-foreground)]',
                  )}
                >
                  Chapitre {idx + 1}
                  {showProgress && (
                    <span className="ml-2 normal-case tracking-normal text-[var(--primary)]">
                      · {pct}% vu
                    </span>
                  )}
                  {completed && (
                    <span className="ml-2 normal-case tracking-normal text-[var(--bleu-ciel-deep)]">
                      · Terminé
                    </span>
                  )}
                </span>
                <span
                  className={cn(
                    'mt-0.5 block text-sm leading-snug',
                    active ? 'font-semibold' : 'font-medium',
                  )}
                >
                  {chapter.title}
                </span>
                {chapter.duration_minutes > 0 && (
                  <span className="mt-1 block text-xs text-[var(--muted-foreground)]">
                    {formatDuration(chapter.duration_minutes)}
                  </span>
                )}
                {showProgress && (
                  <span
                    className="mt-2 block h-1 w-full overflow-hidden rounded-full bg-[var(--secondary)]"
                    aria-hidden="true"
                  >
                    <span
                      className="block h-full rounded-full bg-[var(--primary)] transition-[width] duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </span>
                )}
              </span>
            </button>
          </li>
        )
      })}
    </ol>
  )
}
