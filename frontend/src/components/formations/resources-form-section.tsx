import { useRef, useState } from 'react'
import {
  ExternalLink,
  FileText,
  Loader2,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { ChapterResource } from '@/lib/database.types'
import {
  CHAPTER_RESOURCE_ACCEPT,
  formatFileSize,
  uploadChapterResource,
} from '@/lib/resource-helpers'
import { cn } from '@/lib/utils'

export function ResourcesFormSection({
  resources,
  onChange,
  disabled,
  chapterTitleHint,
}: {
  resources: ChapterResource[]
  onChange: (next: ChapterResource[]) => void
  disabled?: boolean
  /** Titre du chapitre, sert à organiser les paths côté bucket. */
  chapterTitleHint: string
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  // Set des pending IDs (préfixés `__pending:`) actuellement en upload.
  // On utilise des IDs et pas des indices parce que pendant un upload
  // long, l'admin peut retirer d'autres ressources et faire bouger les
  // indices. Avec un ID stable, l'item garde son indicateur uploading
  // quoi qu'il arrive.
  const [uploadingIds, setUploadingIds] = useState<Set<string>>(new Set())

  // Ref vers les `resources` les plus à jour. Indispensable pour les
  // uploads multi-fichiers : quand un upload se termine, on doit
  // patcher la liste actuelle (qui peut avoir évolué pendant l'await
  // de l'upload — ex : autre upload terminé, autre edit). Sans cette
  // ref, on capturerait `resources` au démarrage de handleFiles et on
  // écraserait les changements intermédiaires au moment de onChange.
  const resourcesRef = useRef(resources)
  resourcesRef.current = resources

  function update(index: number, patch: Partial<ChapterResource>) {
    onChange(resources.map((r, i) => (i === index ? { ...r, ...patch } : r)))
  }
  function addEmpty() {
    onChange([...resources, { label: '', url: '' }])
  }
  function remove(index: number) {
    onChange(resources.filter((_, i) => i !== index))
  }

  async function handleFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList)
    if (files.length === 0) return

    // Crée N placeholders avec un id unique chacun (random) pour pouvoir
    // les retrouver/remplacer dans la liste même si l'ordre change
    // (autre upload terminé entre-temps, retrait d'une autre ressource,
    // etc.). On stocke l'id dans `path` temporairement avec un préfixe
    // `__pending:` qu'on remplacera par le vrai path à la fin.
    const placeholders: ChapterResource[] = files.map((f) => ({
      label: f.name,
      url: '',
      path: `__pending:${crypto.randomUUID()}`,
    }))
    const pendingIds = placeholders.map((p) => p.path as string)

    setUploadingIds((prev) => {
      const next = new Set(prev)
      for (const id of pendingIds) next.add(id)
      return next
    })
    onChange([...resourcesRef.current, ...placeholders])

    let successCount = 0

    async function runOne(file: File, pendingId: string): Promise<void> {
      try {
        const meta = await uploadChapterResource(file, chapterTitleHint)
        // Patch via la dernière version connue (resourcesRef), pas via
        // une variable capturée — l'admin a pu retirer/ajouter des
        // ressources pendant l'upload.
        const next = resourcesRef.current.map((r) =>
          r.path === pendingId
            ? {
                ...r,
                label: r.label || meta.name,
                url: meta.signedUrl,
                path: meta.path,
              }
            : r,
        )
        onChange(next)
        successCount += 1
      } catch (err) {
        toast.error(
          `${file.name} : ${err instanceof Error ? err.message : 'upload échoué'}`,
        )
        // Retire le placeholder qui a foiré (toujours via le pendingId,
        // pas via l'index originel — la liste a pu bouger).
        const next = resourcesRef.current.filter((r) => r.path !== pendingId)
        onChange(next)
      } finally {
        // Retire l'ID du set uploading. Si l'admin a retiré l'item
        // entre-temps, c'est un no-op.
        setUploadingIds((prev) => {
          const next = new Set(prev)
          next.delete(pendingId)
          return next
        })
      }
    }

    // Worker pool : 3 uploads simultanés max pour pas saturer le réseau
    // si l'admin glisse 20 fichiers d'un coup.
    const CONCURRENCY = 3
    let cursor = 0
    async function worker() {
      while (cursor < files.length) {
        const i = cursor
        cursor += 1
        await runOne(files[i], pendingIds[i])
      }
    }
    const workers: Promise<void>[] = []
    for (let i = 0; i < Math.min(CONCURRENCY, files.length); i += 1) {
      workers.push(worker())
    }
    await Promise.all(workers)

    if (successCount > 0) {
      toast.success(
        successCount === 1
          ? '1 fichier importé.'
          : `${successCount} fichiers importés.`,
      )
    }
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (files && files.length > 0) void handleFiles(files)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files && files.length > 0) void handleFiles(files)
  }

  const isUploading = uploadingIds.size > 0

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Ressources de ce chapitre</p>
        <div className="flex items-center gap-1">
          <label className="inline-flex">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={CHAPTER_RESOURCE_ACCEPT}
              onChange={onInputChange}
              disabled={disabled || isUploading}
              className="hidden"
            />
            <span
              className={cn(
                'inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md px-2 text-xs font-medium text-[var(--muted-foreground)] transition-colors hover:bg-[var(--secondary)] hover:text-[var(--foreground)]',
                (disabled || isUploading) && 'pointer-events-none opacity-50',
              )}
            >
              {isUploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5" />
              )}
              Importer des fichiers
            </span>
          </label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={addEmpty}
            disabled={disabled}
          >
            <Plus className="h-3.5 w-3.5" />
            URL externe
          </Button>
        </div>
      </div>

      {/* Zone drag-drop compacte — toujours visible pour signaler la fonctionnalité */}
      <div
        onDragOver={(e) => {
          e.preventDefault()
          if (!disabled && !isUploading) setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={cn(
          'rounded-lg border border-dashed p-3 text-center text-xs transition-colors',
          isDragging
            ? 'border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--primary)]'
            : 'border-[var(--border)] bg-[var(--background)] text-[var(--muted-foreground)]',
          (disabled || isUploading) && 'opacity-50',
        )}
      >
        Glisse plusieurs PDF, ZIP, Word/Excel, CSV ou JSON ici · 25 MB max par fichier
      </div>

      {resources.length === 0 ? (
        <p className="text-xs text-[var(--muted-foreground)]">
          Aucune ressource — importe des fichiers ou ajoute une URL externe
          (Google Doc, Notion, Figma, etc.).
        </p>
      ) : (
        <ul className="space-y-2">
          {resources.map((r, i) => {
            const uploading = Boolean(r.path && uploadingIds.has(r.path))
            const isPending = Boolean(r.path?.startsWith('__pending:'))
            // "Fichier" = a un path et n'est pas un placeholder en cours
            // d'upload. Les placeholders pending s'affichent quand même
            // en branche fichier (label readonly + spinner) pour ne pas
            // perturber l'admin avec une input URL vide.
            const isFile = Boolean(r.path) && !isPending
            const renderAsFile = isFile || isPending
            return (
              <li
                key={i}
                className={cn(
                  'flex items-start gap-2 rounded-lg border border-[var(--border)] bg-[var(--background)] p-2.5',
                  uploading && 'opacity-70',
                )}
              >
                <span
                  className={cn(
                    'mt-1.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md',
                    renderAsFile
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-[var(--secondary)] text-[var(--muted-foreground)]',
                  )}
                >
                  {uploading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : renderAsFile ? (
                    <FileText className="h-3.5 w-3.5" />
                  ) : (
                    <ExternalLink className="h-3.5 w-3.5" />
                  )}
                </span>

                {renderAsFile ? (
                  // Ressource uploadée (ou en cours) : on n'autorise
                  // l'édition que du label. L'URL est une signed URL pas
                  // modifiable par l'admin (le path est ce qui compte
                  // côté DB).
                  <div className="grid flex-1 gap-1">
                    <Input
                      value={r.label}
                      onChange={(e) => update(i, { label: e.target.value })}
                      placeholder="Label visible"
                      className="h-9"
                      disabled={disabled || uploading}
                    />
                    <p className="truncate text-xs text-[var(--muted-foreground)]">
                      {isPending
                        ? 'Upload en cours…'
                        : r.path?.split('/').pop()}
                    </p>
                  </div>
                ) : (
                  // Ressource URL externe : label + URL éditables.
                  <div className="grid flex-1 gap-2 sm:grid-cols-[1fr_2fr]">
                    <Input
                      value={r.label}
                      onChange={(e) => update(i, { label: e.target.value })}
                      placeholder="Label visible"
                      className="h-9"
                      disabled={disabled || uploading}
                    />
                    <Input
                      value={r.url}
                      onChange={(e) => update(i, { url: e.target.value })}
                      placeholder="https://…"
                      type="url"
                      className="h-9"
                      disabled={disabled || uploading}
                    />
                  </div>
                )}

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(i)}
                  aria-label="Supprimer"
                  disabled={disabled || uploading}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

// formatFileSize ré-exporté pour ne pas casser un éventuel import externe.
export { formatFileSize }
