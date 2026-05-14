import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { ChapterResource } from '@/lib/database.types'
import {
  getVideoProvider,
  isValidVideoUrl,
} from '@/lib/formation-helpers'
import { cn } from '@/lib/utils'
import { ResourcesFormSection } from './resources-form-section'
import { useConfirm } from '@/hooks/use-confirm'

export interface ChapterFormState {
  /** id en DB (présent si ce chapitre existe déjà) */
  id?: string
  title: string
  description: string
  video_url: string
  duration_minutes: number
  resources: ChapterResource[]
}

export function ChaptersFormSection({
  chapters,
  onChange,
  disabled,
}: {
  chapters: ChapterFormState[]
  onChange: (next: ChapterFormState[]) => void
  disabled?: boolean
}) {
  const { confirm, ConfirmDialog } = useConfirm()

  function updateAt(index: number, patch: Partial<ChapterFormState>) {
    onChange(chapters.map((c, i) => (i === index ? { ...c, ...patch } : c)))
  }
  function add() {
    onChange([
      ...chapters,
      {
        title: '',
        description: '',
        video_url: '',
        duration_minutes: 0,
        resources: [],
      },
    ])
  }
  async function remove(index: number) {
    const ch = chapters[index]
    const ok = await confirm({
      title: 'Supprimer ce chapitre ?',
      contentPreview: ch?.title?.trim() || undefined,
      description:
        'Le chapitre sera retiré du formulaire. La progression des membres sur ce chapitre sera perdue à la sauvegarde de la formation.',
      confirmLabel: 'Supprimer',
      variant: 'destructive',
    })
    if (!ok) return
    onChange(chapters.filter((_, i) => i !== index))
  }
  function move(index: number, delta: -1 | 1) {
    const target = index + delta
    if (target < 0 || target >= chapters.length) return
    const next = [...chapters]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }

  return (
    <section>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold tracking-tight">
            Chapitres
          </h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Ordonnés du premier au dernier. Utilise les flèches pour réordonner.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={add} disabled={disabled}>
          <Plus className="h-4 w-4" />
          Ajouter un chapitre
        </Button>
      </div>

      {chapters.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--card)] p-8 text-center text-sm text-[var(--muted-foreground)]">
          Pas encore de chapitre. Ajoute-en un pour commencer.
        </div>
      ) : (
        <ul className="space-y-4">
          {chapters.map((c, i) => {
            const provider = c.video_url ? getVideoProvider(c.video_url) : null
            const validUrl = c.video_url ? isValidVideoUrl(c.video_url) : true
            return (
              <li
                key={i}
                className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--secondary)] text-xs font-semibold text-[var(--muted-foreground)]">
                    {i + 1}
                  </span>
                  <div className="flex-1 space-y-4">
                    <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
                      <div className="space-y-1.5">
                        <Label htmlFor={`chapter-title-${i}`}>Titre</Label>
                        <Input
                          id={`chapter-title-${i}`}
                          value={c.title}
                          onChange={(e) =>
                            updateAt(i, { title: e.target.value })
                          }
                          placeholder="Introduction au RAG"
                          disabled={disabled}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={`chapter-duration-${i}`}>
                          Durée (min)
                        </Label>
                        <Input
                          id={`chapter-duration-${i}`}
                          type="number"
                          min={0}
                          value={c.duration_minutes}
                          onChange={(e) =>
                            updateAt(i, {
                              duration_minutes: Number(e.target.value) || 0,
                            })
                          }
                          disabled={disabled}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor={`chapter-url-${i}`}>
                        URL vidéo (YouTube, Vimeo ou Google Drive)
                      </Label>
                      <div className="relative">
                        <Input
                          id={`chapter-url-${i}`}
                          type="url"
                          value={c.video_url}
                          onChange={(e) =>
                            updateAt(i, { video_url: e.target.value })
                          }
                          placeholder="https://www.youtube.com/… · https://vimeo.com/… · https://drive.google.com/file/d/…"
                          disabled={disabled}
                          className={provider ? 'pr-24' : undefined}
                        />
                        {provider && (
                          <span
                            className={cn(
                              'absolute right-2 top-1/2 -translate-y-1/2 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
                              provider === 'youtube' &&
                                'bg-[#FF0000]/10 text-[#CC0000]',
                              provider === 'vimeo' &&
                                'bg-[#1AB7EA]/10 text-[#0E91C6]',
                              provider === 'drive' &&
                                'bg-[#1A73E8]/10 text-[#1A73E8]',
                            )}
                          >
                            {provider}
                          </span>
                        )}
                      </div>
                      {!validUrl && (
                        <p className="text-xs text-red-600">
                          URL YouTube, Vimeo ou Google Drive invalide.
                        </p>
                      )}
                      <p className="text-xs text-[var(--muted-foreground)]">
                        YouTube non répertorié recommandé · Vimeo accepte les
                        vidéos privées (avec hash) · Drive : partage doit être
                        "Tous ceux qui ont le lien".
                      </p>
                      {provider === 'drive' && (
                        <p className="text-xs text-amber-700">
                          ⚠️ Sur Drive, la progression n'est pas auto-trackée —
                          les membres devront cliquer "Marquer comme terminé".
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor={`chapter-desc-${i}`}>
                        Description (markdown supporté)
                      </Label>
                      <Textarea
                        id={`chapter-desc-${i}`}
                        rows={3}
                        value={c.description}
                        onChange={(e) =>
                          updateAt(i, { description: e.target.value })
                        }
                        placeholder="Ce que le chapitre couvre…"
                        disabled={disabled}
                      />
                    </div>

                    <ResourcesFormSection
                      resources={c.resources}
                      onChange={(next) => updateAt(i, { resources: next })}
                      disabled={disabled}
                      chapterTitleHint={c.title || `chapitre-${i + 1}`}
                    />
                  </div>

                  <div className="flex shrink-0 flex-col gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Monter"
                      onClick={() => move(i, -1)}
                      disabled={disabled || i === 0}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Descendre"
                      onClick={() => move(i, 1)}
                      disabled={disabled || i === chapters.length - 1}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Supprimer"
                      onClick={() => remove(i)}
                      disabled={disabled}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <ConfirmDialog />
    </section>
  )
}
