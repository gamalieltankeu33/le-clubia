import { ExternalLink, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { ChapterResource } from '@/lib/database.types'

export function ResourcesFormSection({
  resources,
  onChange,
  disabled,
}: {
  resources: ChapterResource[]
  onChange: (next: ChapterResource[]) => void
  disabled?: boolean
}) {
  function update(index: number, patch: Partial<ChapterResource>) {
    onChange(resources.map((r, i) => (i === index ? { ...r, ...patch } : r)))
  }
  function add() {
    onChange([...resources, { label: '', url: '' }])
  }
  function remove(index: number) {
    onChange(resources.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Ressources de ce chapitre</p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={add}
          disabled={disabled}
        >
          <Plus className="h-3.5 w-3.5" />
          Ajouter
        </Button>
      </div>

      {resources.length === 0 ? (
        <p className="text-xs text-[var(--muted-foreground)]">
          Aucune ressource — clique "Ajouter" pour lier un PDF, un template ou
          un outil externe.
        </p>
      ) : (
        <ul className="space-y-2">
          {resources.map((r, i) => (
            <li
              key={i}
              className="flex items-start gap-2 rounded-lg border border-[var(--border)] bg-[var(--background)] p-2.5"
            >
              <ExternalLink className="mt-2.5 h-3.5 w-3.5 shrink-0 text-[var(--muted-foreground)]" />
              <div className="grid flex-1 gap-2 sm:grid-cols-[1fr_2fr]">
                <Input
                  value={r.label}
                  onChange={(e) => update(i, { label: e.target.value })}
                  placeholder="Label visible"
                  className="h-9"
                  disabled={disabled}
                />
                <Input
                  value={r.url}
                  onChange={(e) => update(i, { url: e.target.value })}
                  placeholder="https://…"
                  type="url"
                  className="h-9"
                  disabled={disabled}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => remove(i)}
                aria-label="Supprimer"
                disabled={disabled}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
