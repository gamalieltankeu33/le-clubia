import { useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Loader2,
  Trash2,
  Upload,
} from 'lucide-react'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { supabase } from '@/lib/supabase'
import {
  PDF_MAX_BYTES,
  PDF_MIME,
  RESOURCE_CATEGORIES,
  RESOURCE_TYPES,
  RESOURCE_TYPE_LABELS,
  deleteResourceFile,
  fileExt,
  formatFileSize,
  uploadResourcePdf,
} from '@/lib/resource-helpers'
import type { Resource, ResourceType } from '@/lib/database.types'
import { cn } from '@/lib/utils'

const baseSchema = z.object({
  title: z.string().trim().min(1, 'Le titre est requis').max(100),
  description: z
    .string()
    .trim()
    .max(500, 'Description trop longue (500 max)'),
  category: z.string().trim().min(1, 'La catégorie est requise'),
  resource_type: z.enum(['prompt', 'template', 'guide_pdf', 'tool_link']),
  is_published: z.boolean(),
  thumbnail_url: z.string().url().nullable().optional(),
  external_url: z.string().url().optional().or(z.literal('')).nullable(),
})

const PDF_TYPES: ResourceType[] = ['prompt', 'template', 'guide_pdf']
function isPdfType(t: ResourceType): boolean {
  return PDF_TYPES.includes(t)
}

interface PendingPdf {
  /** File local sélectionné, pas encore uploadé. */
  file: File
  sizeKb: number
}

export function ResourceForm({
  initial,
  onSaved,
}: {
  initial?: Resource
  onSaved: (id: string) => void
}) {
  const navigate = useNavigate()
  const isEditing = Boolean(initial)

  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [category, setCategory] = useState<string>(
    initial?.category ?? RESOURCE_CATEGORIES[0],
  )
  const [resourceType, setResourceType] = useState<ResourceType>(
    initial?.resource_type ?? 'prompt',
  )
  const [externalUrl, setExternalUrl] = useState(initial?.external_url ?? '')
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(
    initial?.thumbnail_url ?? null,
  )
  const [isPublished, setIsPublished] = useState<boolean>(
    initial?.is_published ?? false,
  )

  // PDF state : on tracke (a) le fichier déjà sauvegardé en DB, (b) un
  // nouveau fichier sélectionné mais pas encore uploadé. L'upload réel
  // se fait au submit pour pouvoir cleanup en cas d'annulation.
  const [existingFileUrl, setExistingFileUrl] = useState<string | null>(
    initial?.file_url ?? null,
  )
  const [existingFileName, setExistingFileName] = useState<string | null>(
    initial?.file_name ?? null,
  )
  const [existingFileSizeKb, setExistingFileSizeKb] = useState<number | null>(
    initial?.file_size_kb ?? null,
  )
  const [pendingPdf, setPendingPdf] = useState<PendingPdf | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [uploadingThumb, setUploadingThumb] = useState(false)
  const [saving, setSaving] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const hasFile = Boolean(pendingPdf || existingFileUrl)

  async function handleThumbUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image trop lourde (5 Mo max).')
      return
    }
    setUploadingThumb(true)
    const ext = fileExt(file.name) || 'jpg'
    const path = `${crypto.randomUUID()}.${ext}`
    const { error } = await supabase.storage
      .from('resource-thumbnails')
      .upload(path, file, { contentType: file.type, upsert: false })
    if (error) {
      toast.error('Upload de la miniature impossible.')
      setUploadingThumb(false)
      return
    }
    const { data } = supabase.storage
      .from('resource-thumbnails')
      .getPublicUrl(path)
    setThumbnailUrl(data.publicUrl)
    setUploadingThumb(false)
    toast.success('Miniature uploadée.')
  }

  function selectPdf(file: File) {
    if (file.type !== PDF_MIME) {
      toast.error('Seuls les PDFs sont acceptés.')
      return
    }
    if (file.size > PDF_MAX_BYTES) {
      toast.error('Fichier trop lourd (max 10 MB).')
      return
    }
    setPendingPdf({
      file,
      sizeKb: Math.max(1, Math.round(file.size / 1024)),
    })
  }

  function handlePdfInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) selectPdf(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handlePdfDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) selectPdf(file)
  }

  function clearPdfSelection() {
    setPendingPdf(null)
  }

  function clearExistingFile() {
    // On ne supprime PAS du bucket maintenant — c'est fait au submit
    // quand on est sûr que la sauvegarde réussit.
    setExistingFileUrl(null)
    setExistingFileName(null)
    setExistingFileSizeKb(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (saving) return

    const parsed = baseSchema.safeParse({
      title,
      description,
      category,
      resource_type: resourceType,
      is_published: isPublished,
      thumbnail_url: thumbnailUrl,
      external_url: externalUrl || null,
    })
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? 'Formulaire invalide.')
      return
    }

    if (isPdfType(resourceType) && !hasFile) {
      toast.error('Uploade un PDF pour ce type de ressource.')
      return
    }
    if (resourceType === 'tool_link' && !externalUrl.trim()) {
      toast.error("L'URL de l'outil est requise.")
      return
    }

    setSaving(true)
    let newlyUploadedPath: string | null = null

    try {
      // Upload du nouveau PDF si l'admin en a sélectionné un.
      let fileUrl = existingFileUrl
      let fileName = existingFileName
      let fileSizeKb = existingFileSizeKb

      if (isPdfType(resourceType) && pendingPdf) {
        const meta = await uploadResourcePdf(
          pendingPdf.file,
          category,
          title,
        )
        newlyUploadedPath = meta.path
        fileUrl = meta.path
        fileName = meta.name
        fileSizeKb = meta.sizeKb
      }

      // Pour les outils, on nettoie tous les champs PDF.
      if (!isPdfType(resourceType)) {
        fileUrl = null
        fileName = null
        fileSizeKb = null
      }

      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        category,
        thumbnail_url: thumbnailUrl,
        resource_type: resourceType,
        external_url:
          resourceType === 'tool_link' ? externalUrl.trim() : null,
        // `content` (ancien texte de prompt) et `download_url` (ancien
        // upload générique) sont conservés en DB pour les ressources
        // legacy mais on n'en écrit plus de nouvelles : la nouvelle
        // source de vérité est file_url.
        content: null,
        download_url: null,
        file_url: fileUrl,
        file_name: fileName,
        file_size_kb: fileSizeKb,
        is_published: isPublished,
      }

      let id: string
      if (initial) {
        const { error } = await supabase
          .from('resources')
          .update(payload)
          .eq('id', initial.id)
        if (error) throw error
        id = initial.id
      } else {
        const { data, error } = await supabase
          .from('resources')
          .insert(payload)
          .select('id')
          .single()
        if (error || !data) throw error ?? new Error('insert')
        id = data.id
      }

      // Cleanup : si on a remplacé un ancien PDF, on le supprime du bucket.
      if (
        initial?.file_url &&
        initial.file_url !== fileUrl
      ) {
        await deleteResourceFile(initial.file_url).catch(() => {
          // Erreur de suppression non bloquante : la ressource est sauvée.
        })
      }
      // Pareil pour l'ancien `download_url` legacy si on bascule en file_url.
      if (
        initial?.download_url &&
        initial.download_url !== fileUrl &&
        !fileUrl
      ) {
        // On ne supprime pas le legacy file tant qu'on n'a pas migré la donnée.
      }

      toast.success(isEditing ? 'Ressource mise à jour.' : 'Ressource créée.')
      onSaved(id)
    } catch (err) {
      console.error('[resource-form] save error', err)
      // Si on a uploadé un nouveau PDF mais que le INSERT/UPDATE a foiré,
      // on supprime le PDF orphelin pour ne pas polluer le bucket.
      if (newlyUploadedPath) {
        await deleteResourceFile(newlyUploadedPath).catch(() => {})
      }
      const supaMsg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message?: unknown }).message ?? '')
          : ''
      toast.error(supaMsg || 'Erreur de sauvegarde.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      {/* Infos de base */}
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="font-display text-lg font-semibold tracking-tight">
          Informations
        </h2>

        <div className="mt-5 grid gap-5">
          <div className="space-y-2">
            <Label htmlFor="title">Titre *</Label>
            <Input
              id="title"
              maxLength={100}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex : Pack 50 prompts pour rédacteurs"
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={3}
              maxLength={500}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="À quoi sert cette ressource, ce qu'elle contient…"
              disabled={saving}
            />
            <p className="text-xs text-[var(--muted-foreground)]">
              {description.length}/500
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="category">Catégorie *</Label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={saving}
                className="flex h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              >
                {RESOURCE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Type de ressource *</Label>
              <div className="flex flex-wrap gap-2">
                {RESOURCE_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setResourceType(t)}
                    disabled={saving}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-xs transition-colors',
                      resourceType === t
                        ? 'border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]'
                        : 'border-[var(--border)] bg-[var(--card)] hover:border-[var(--muted-foreground)]',
                    )}
                  >
                    {RESOURCE_TYPE_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Champs conditionnels */}
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="font-display text-lg font-semibold tracking-tight">
          {resourceType === 'tool_link' ? "Lien vers l'outil" : 'Fichier PDF'}
        </h2>

        <div className="mt-5">
          {isPdfType(resourceType) && (
            <PdfUploadField
              isDragging={isDragging}
              setIsDragging={setIsDragging}
              onDrop={handlePdfDrop}
              fileInputRef={fileInputRef}
              onInputChange={handlePdfInputChange}
              disabled={saving}
              pending={pendingPdf}
              onClearPending={clearPdfSelection}
              existingFileName={existingFileName}
              existingFileSizeKb={existingFileSizeKb}
              hasExisting={Boolean(existingFileUrl)}
              onClearExisting={clearExistingFile}
              legacyContent={initial?.content ?? null}
              legacyDownloadUrl={initial?.download_url ?? null}
            />
          )}

          {resourceType === 'tool_link' && (
            <div className="space-y-2">
              <Label htmlFor="external_url">URL externe *</Label>
              <div className="relative">
                <ExternalLink className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
                <Input
                  id="external_url"
                  type="url"
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  placeholder="https://…"
                  className="pl-10"
                  disabled={saving}
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Miniature */}
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="font-display text-lg font-semibold tracking-tight">
          Miniature (optionnel)
        </h2>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          JPG, PNG ou WebP. 5 Mo max. Affichée sur la card de la ressource.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-[200px_1fr]">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--background)]">
            {thumbnailUrl ? (
              <img
                src={thumbnailUrl}
                alt="Aperçu miniature"
                className="aspect-video w-full rounded-xl object-cover"
              />
            ) : (
              <div className="flex aspect-video items-center justify-center">
                <ImageIcon className="h-7 w-7 text-[var(--muted-foreground)]" />
              </div>
            )}
          </div>
          <div className="flex flex-col items-start gap-2">
            <label className="inline-flex">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleThumbUpload}
                disabled={uploadingThumb || saving}
                className="hidden"
              />
              <span
                className={cn(
                  'inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 text-sm transition-colors hover:bg-[var(--secondary)]',
                  (uploadingThumb || saving) &&
                    'pointer-events-none opacity-50',
                )}
              >
                {uploadingThumb ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Upload…
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    {thumbnailUrl ? "Remplacer l'image" : "Uploader une image"}
                  </>
                )}
              </span>
            </label>
            {thumbnailUrl && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setThumbnailUrl(null)}
                disabled={saving}
              >
                Retirer la miniature
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Statut */}
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="font-display text-lg font-semibold tracking-tight">
          Statut
        </h2>
        <label className="mt-4 flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
            disabled={saving}
            className="h-4 w-4 rounded border-[var(--border)] text-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          />
          <span className="text-sm">
            <span className="font-medium">Publié</span>
            <span className="ml-2 text-[var(--muted-foreground)]">
              — visible par les membres
            </span>
          </span>
        </label>
      </section>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 border-t border-[var(--border)] pt-6">
        <Button
          type="button"
          variant="ghost"
          onClick={() => navigate({ to: '/app/admin/ressources' })}
          disabled={saving}
        >
          Annuler
        </Button>
        <Button type="submit" size="lg" disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Enregistrement…
            </>
          ) : isEditing ? (
            'Enregistrer'
          ) : (
            'Créer la ressource'
          )}
        </Button>
      </div>
    </form>
  )
}

function PdfUploadField({
  isDragging,
  setIsDragging,
  onDrop,
  fileInputRef,
  onInputChange,
  disabled,
  pending,
  onClearPending,
  existingFileName,
  existingFileSizeKb,
  hasExisting,
  onClearExisting,
  legacyContent,
  legacyDownloadUrl,
}: {
  isDragging: boolean
  setIsDragging: (v: boolean) => void
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  disabled?: boolean
  pending: PendingPdf | null
  onClearPending: () => void
  existingFileName: string | null
  existingFileSizeKb: number | null
  hasExisting: boolean
  onClearExisting: () => void
  legacyContent: string | null
  legacyDownloadUrl: string | null
}) {
  const showExisting = hasExisting && !pending
  const hasLegacy =
    !pending &&
    !hasExisting &&
    (Boolean(legacyContent?.trim()) || Boolean(legacyDownloadUrl))

  return (
    <div className="space-y-3">
      {pending && (
        <div className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--background)] p-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
            <FileText className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{pending.file.name}</p>
            <p className="text-xs text-[var(--muted-foreground)]">
              {formatFileSize(pending.sizeKb)} · sera uploadé à
              l'enregistrement
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClearPending}
            aria-label="Retirer le fichier sélectionné"
            disabled={disabled}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}

      {showExisting && (
        <div className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--background)] p-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
            <FileText className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {existingFileName ?? 'PDF actuel'}
            </p>
            <p className="text-xs text-[var(--muted-foreground)]">
              {existingFileSizeKb
                ? `${formatFileSize(existingFileSizeKb)} · stocké en privé`
                : 'Stocké en privé'}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClearExisting}
            aria-label="Retirer le PDF actuel"
            disabled={disabled}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}

      {hasLegacy && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          ⚠️ Ressource legacy (texte ou ancien fichier) — les membres
          continuent de la voir, mais uploade un PDF pour passer au nouveau
          format.
        </div>
      )}

      <div
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={cn(
          'flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-colors',
          isDragging
            ? 'border-[var(--primary)] bg-[var(--primary)]/5'
            : 'border-[var(--border)] bg-[var(--background)]',
          disabled && 'pointer-events-none opacity-50',
        )}
      >
        <Upload className="h-8 w-8 text-[var(--muted-foreground)]" />
        <p className="mt-3 text-sm font-medium">
          Glisse ton PDF ici ou clique pour parcourir
        </p>
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
          PDF uniquement · 10 MB max
        </p>
        <label className="mt-4 inline-flex">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={onInputChange}
            disabled={disabled}
            className="hidden"
          />
          <span
            className={cn(
              'inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 text-sm transition-colors hover:bg-[var(--secondary)]',
              disabled && 'pointer-events-none opacity-50',
            )}
          >
            <Upload className="h-4 w-4" />
            {pending || hasExisting ? 'Remplacer le PDF' : 'Choisir un PDF'}
          </span>
        </label>
      </div>
    </div>
  )
}
