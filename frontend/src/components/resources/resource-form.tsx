import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  ExternalLink,
  FileUp,
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
  RESOURCE_CATEGORIES,
  RESOURCE_TYPES,
  RESOURCE_TYPE_LABELS,
  fileExt,
} from '@/lib/resource-helpers'
import type { Resource, ResourceType } from '@/lib/database.types'
import { cn } from '@/lib/utils'
import { useConfirm } from '@/hooks/use-confirm'

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
  content: z.string().nullable().optional(),
  download_url: z.string().nullable().optional(),
  external_url: z.string().url().optional().or(z.literal('')).nullable(),
})

export function ResourceForm({
  initial,
  onSaved,
}: {
  initial?: Resource
  onSaved: (id: string) => void
}) {
  const navigate = useNavigate()
  const isEditing = Boolean(initial)
  const { confirm, ConfirmDialog } = useConfirm()

  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [category, setCategory] = useState<string>(
    initial?.category ?? RESOURCE_CATEGORIES[0],
  )
  const [resourceType, setResourceType] = useState<ResourceType>(
    initial?.resource_type ?? 'prompt',
  )
  const [content, setContent] = useState(initial?.content ?? '')
  const [downloadUrl, setDownloadUrl] = useState<string | null>(
    initial?.download_url ?? null,
  )
  const [externalUrl, setExternalUrl] = useState(initial?.external_url ?? '')
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(
    initial?.thumbnail_url ?? null,
  )
  const [isPublished, setIsPublished] = useState<boolean>(
    initial?.is_published ?? false,
  )

  const [uploadingThumb, setUploadingThumb] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [saving, setSaving] = useState(false)

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

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 25 * 1024 * 1024) {
      toast.error('Fichier trop lourd (25 Mo max).')
      return
    }
    setUploadingFile(true)
    const ext = fileExt(file.name) || 'bin'
    const path = `${crypto.randomUUID()}.${ext}`
    const { error } = await supabase.storage
      .from('resource-files')
      .upload(path, file, { contentType: file.type, upsert: false })
    if (error) {
      toast.error('Upload du fichier impossible.')
      setUploadingFile(false)
      return
    }
    // On stocke le chemin RELATIF dans la DB, pas l'URL signée (qui expire).
    setDownloadUrl(path)
    setUploadingFile(false)
    toast.success('Fichier uploadé.')
  }

  async function handleRemoveFile() {
    if (!downloadUrl) return
    const ok = await confirm({
      title: 'Supprimer le fichier uploadé ?',
      description:
        'Le fichier sera retiré du stockage. Tu pourras en téléverser un nouveau ensuite.',
      confirmLabel: 'Supprimer',
      variant: 'destructive',
    })
    if (!ok) return
    await supabase.storage.from('resource-files').remove([downloadUrl])
    setDownloadUrl(null)
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
      content: resourceType === 'prompt' ? content : null,
      download_url: downloadUrl,
      external_url: externalUrl || null,
    })
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? 'Formulaire invalide.')
      return
    }

    // Validations conditionnelles
    if (resourceType === 'prompt' && !content.trim()) {
      toast.error('Le contenu du prompt est requis.')
      return
    }
    if ((resourceType === 'template' || resourceType === 'guide_pdf') && !downloadUrl) {
      toast.error('Uploade un fichier pour ce type de ressource.')
      return
    }
    if (resourceType === 'tool_link' && !externalUrl.trim()) {
      toast.error("L'URL de l'outil est requise.")
      return
    }

    setSaving(true)
    try {
      // On nettoie les champs non pertinents pour ce type
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        category,
        thumbnail_url: thumbnailUrl,
        resource_type: resourceType,
        download_url:
          resourceType === 'template' || resourceType === 'guide_pdf'
            ? downloadUrl
            : null,
        external_url: resourceType === 'tool_link' ? externalUrl.trim() : null,
        content: resourceType === 'prompt' ? content : null,
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

      toast.success(isEditing ? 'Ressource mise à jour.' : 'Ressource créée.')
      onSaved(id)
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : 'Erreur de sauvegarde.')
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
          {resourceType === 'prompt' && 'Contenu du prompt'}
          {resourceType === 'template' && 'Fichier template'}
          {resourceType === 'guide_pdf' && 'Fichier PDF du guide'}
          {resourceType === 'tool_link' && "Lien vers l'outil"}
        </h2>

        <div className="mt-5">
          {resourceType === 'prompt' && (
            <div className="space-y-2">
              <Label htmlFor="content">Texte du prompt *</Label>
              <Textarea
                id="content"
                rows={10}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Tu es un expert en…"
                disabled={saving}
                className="font-mono text-sm"
              />
              <p className="text-xs text-[var(--muted-foreground)]">
                Les membres pourront copier ce texte en un clic.
              </p>
            </div>
          )}

          {(resourceType === 'template' || resourceType === 'guide_pdf') && (
            <FileUploadField
              currentPath={downloadUrl}
              uploading={uploadingFile}
              disabled={saving}
              onUpload={handleFileUpload}
              onRemove={handleRemoveFile}
              accept={
                resourceType === 'guide_pdf'
                  ? 'application/pdf'
                  : 'application/pdf,application/zip,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain,text/csv,application/json'
              }
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

      <ConfirmDialog />
    </form>
  )
}

function FileUploadField({
  currentPath,
  uploading,
  disabled,
  onUpload,
  onRemove,
  accept,
}: {
  currentPath: string | null
  uploading: boolean
  disabled?: boolean
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRemove: () => void
  accept: string
}) {
  return (
    <div className="space-y-3">
      {currentPath ? (
        <div className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--background)] p-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
            <FileUp className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{currentPath}</p>
            <p className="text-xs text-[var(--muted-foreground)]">
              Stocké dans le bucket <code>resource-files</code>
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onRemove}
            aria-label="Retirer le fichier"
            disabled={disabled}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <p className="text-sm text-[var(--muted-foreground)]">
          Aucun fichier uploadé.
        </p>
      )}

      <label className="inline-flex">
        <input
          type="file"
          accept={accept}
          onChange={onUpload}
          disabled={uploading || disabled}
          className="hidden"
        />
        <span
          className={cn(
            'inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 text-sm transition-colors hover:bg-[var(--secondary)]',
            (uploading || disabled) && 'pointer-events-none opacity-50',
          )}
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Upload…
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              {currentPath ? 'Remplacer le fichier' : 'Uploader un fichier'}
            </>
          )}
        </span>
      </label>
      <p className="text-xs text-[var(--muted-foreground)]">
        25 Mo max. Le fichier est stocké en privé, accessible aux membres via
        un lien signé temporaire.
      </p>
    </div>
  )
}
