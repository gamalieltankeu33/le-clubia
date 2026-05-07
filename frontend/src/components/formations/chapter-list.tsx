import { CheckCircle2, Circle } from 'lucide-react'
import type { FormationChapter } from '@/lib/database.types'
import { formatDuration } from '@/lib/formation-helpers'
import { cn } from '@/lib/utils'

export function ChapterList({
  chapters,
  activeChapterId,
  completedChapterIds,
  onSelect,
}: {
  chapters: FormationChapter[]
  activeChapterId: string | null
  completedChapterIds: Set<string>
  onSelect: (chapterId: string) => void
}) {
  return (
    <ol className="space-y-1">
      {chapters.map((chapter, idx) => {
        const completed = completedChapterIds.has(chapter.id)
        const active = chapter.id === activeChapterId
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
                  <CheckCircle2 className="h-5 w-5 text-[var(--accent)]" />
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
              </span>
            </button>
          </li>
        )
      })}
    </ol>
  )
}
