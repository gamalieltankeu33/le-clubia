import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  Eye,
  Image as ImageIcon,
  Loader2,
  Pencil,
  Upload,
} from 'lucide-react'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { supabase } from '@/lib/supabase'
import { NEWS_CATEGORIES } from '@/lib/news-helpers'
import { slugify } from '@/lib/formation-helpers'
import { compressImage } from '@/lib/compress-image'
import { MarkdownRenderer } from '@/components/coach/markdown-renderer'
import type { NewsArticle } from '@/lib/database.types'
import { cn } from '@/lib/utils'

const schema = z.object({
  title: z.string().trim().min(1, 'Le titre est requis').max(200),
  slug: z
    .string()
    .trim()
    .min(1, 'Le slug est requis')
    .regex(/^[a-z0-9-]+$/, 'Slug en kebab-case (a-z, 0-9, -) uniquement'),
  category: z.string().trim().min(1),
  content: z.string().trim().min(1, 'Le contenu est requis'),
  source_url: z
    .string()
    .url('URL invalide')
    .optional()
    .or(z.literal(''))
    .nullable(),
  author: z.string().trim().optional(),
  is_published: z.boolean(),
  published_at: z.string().nullable().optional(),
  cover_image_url: z.string().url().nullable().optional(),
})

export function NewsForm({
  initial,
  onSaved,
}: {
  initial?: NewsArticle
  onSaved: (id: string) => void
}) {
  const navigate = useNavigate()
  const isEditing = Boolean(initial)

  const [title, setTitle] = useState(initial?.title ?? '')
  const [slug, setSlug] = useState(initial?.slug ?? '')
  const [slugTouched, setSlugTouched] = useState(isEditing)
  const [category, setCategory] = useState<string>(
    initial?.category ?? NEWS_CATEGORIES[0],
  )
  const [content, setContent] = useState(initial?.content ?? '')
  const [sourceUrl, setSourceUrl] = useState(initial?.source_url ?? '')
  const [author, setAuthor] = useState(
    initial?.author ?? 'Agent IA Le Club',
  )
  const [coverUrl, setCoverUrl] = useState<string | null>(
    initial?.cover_image_url ?? null,
  )
  const [isPublished, setIsPublished] = useState<boolean>(
    initial?.is_published ?? false,
  )
  const [publishedAt, setPublishedAt] = useState<string>(() => {
    const d = initial?.published_at
      ? new Date(initial.published_at)
      : new Date()
    // Format pour input datetime-local : YYYY-MM-DDTHH:mm
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  })

  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(title))
  }, [title, slugTouched])

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image trop lourde (5 Mo max).')
      e.target.value = ''
      return
    }
    setUploading(true)
    try {
      const compressed = await compressImage(file, {
        maxWidthOrHeight: 1600,
        maxSizeMB: 1.5,
        initialQuality: 0.85,
      })
      const ext =
        compressed.type === 'image/png'
          ? 'png'
          : compressed.type === 'image/webp'
            ? 'webp'
            : 'jpg'
      const path = `${crypto.randomUUID()}.${ext}`
      const { error } = await supabase.storage
        .from('news-covers')
        .upload(path, compressed, {
          contentType: compressed.type || 'image/jpeg',
          upsert: false,
        })
      if (error) throw error
      const { data } = supabase.storage
        .from('news-covers')
        .getPublicUrl(path)
      setCoverUrl(data.publicUrl)
      toast.success('Image uploadée.')
    } catch (err) {
      console.error(err)
      toast.error('Upload impossible. Vérifie tes droits admin.')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (saving) return

    const isoPublishedAt = publishedAt
      ? new Date(publishedAt).toISOString()
      : null

    const parsed = schema.safeParse({
      title,
      slug,
      category,
      content,
      source_url: sourceUrl || null,
      author: author || undefined,
      is_published: isPublished,
      published_at: isoPublishedAt,
      cover_image_url: coverUrl,
    })
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? 'Formulaire invalide.')
      return
    }

    setSaving(true)
    try {
      const payload = {
        title: title.trim(),
        slug: slug.trim(),
        category,
        content: content.trim(),
        source_url: sourceUrl?.trim() || null,
        author: author?.trim() || null,
        cover_image_url: coverUrl,
        is_published: isPublished,
        published_at: isoPublishedAt,
      }
      let id: string
      if (initial) {
        const { error } = await supabase
          .from('news_articles')
          .update(payload)
          .eq('id', initial.id)
        if (error) throw error
        id = initial.id
      } else {
        const { data, error } = await supabase
          .from('news_articles')
          .insert(payload)
          .select('id')
          .single()
        if (error || !data) throw error ?? new Error('insert')
        id = data.id
      }
      toast.success(isEditing ? 'Article mis à jour.' : 'Article créé.')
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
      {/* Infos principales */}
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="font-display text-lg font-semibold tracking-tight">
          Informations
        </h2>
        <div className="mt-5 grid gap-5">
          <div className="space-y-2">
            <Label htmlFor="title">Titre *</Label>
            <Input
              id="title"
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Anthropic publie Claude 4.7…"
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug *</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true)
                setSlug(e.target.value)
              }}
              placeholder="anthropic-publie-claude-4-7"
              disabled={saving}
            />
            <p className="text-xs text-[var(--muted-foreground)]">
              URL : /app/actualites/<strong>{slug || '…'}</strong>
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
                {NEWS_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="author">Auteur</Label>
              <Input
                id="author"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Agent IA Le Club"
                disabled={saving}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="source_url">URL de la source originale</Label>
            <Input
              id="source_url"
              type="url"
              value={sourceUrl ?? ''}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://openai.com/blog/…"
              disabled={saving}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="published_at">Date de publication</Label>
              <Input
                id="published_at"
                type="datetime-local"
                value={publishedAt}
                onChange={(e) => setPublishedAt(e.target.value)}
                disabled={saving}
              />
            </div>
            <div className="flex items-end">
              <label className="flex cursor-pointer items-center gap-3">
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
            </div>
          </div>
        </div>
      </section>

      {/* Cover */}
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="font-display text-lg font-semibold tracking-tight">
          Image de couverture (optionnel)
        </h2>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-[260px_1fr]">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--background)]">
            {coverUrl ? (
              <img
                src={coverUrl}
                alt="Aperçu"
                className="aspect-[16/9] w-full rounded-xl object-cover"
              />
            ) : (
              <div className="flex aspect-[16/9] items-center justify-center">
                <ImageIcon className="h-8 w-8 text-[var(--muted-foreground)]" />
              </div>
            )}
          </div>
          <div className="flex flex-col items-start gap-2">
            <label className="inline-flex">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleCoverUpload}
                disabled={uploading || saving}
                className="hidden"
              />
              <span
                className={cn(
                  'inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 text-sm transition-colors hover:bg-[var(--secondary)]',
                  (uploading || saving) && 'pointer-events-none opacity-50',
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
                    {coverUrl ? "Remplacer l'image" : 'Uploader une image'}
                  </>
                )}
              </span>
            </label>
            {coverUrl && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setCoverUrl(null)}
                disabled={saving}
              >
                Retirer l'image
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Contenu markdown + preview */}
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold tracking-tight">
            Contenu (markdown)
          </h2>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowPreview((v) => !v)}
          >
            {showPreview ? (
              <>
                <Pencil className="h-3.5 w-3.5" />
                Édition
              </>
            ) : (
              <>
                <Eye className="h-3.5 w-3.5" />
                Aperçu
              </>
            )}
          </Button>
        </div>
        <div className="mt-4">
          {showPreview ? (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-5">
              <MarkdownRenderer content={content || '*(rien à prévisualiser)*'} />
            </div>
          ) : (
            <Textarea
              rows={18}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`# Titre

Premier paragraphe…

**Mot clé** important.

- Point 1
- Point 2`}
              disabled={saving}
              className="font-mono text-sm leading-relaxed"
            />
          )}
        </div>
      </section>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 border-t border-[var(--border)] pt-6">
        <Button
          type="button"
          variant="ghost"
          onClick={() => navigate({ to: '/app/admin/actualites' })}
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
            "Créer l'article"
          )}
        </Button>
      </div>
    </form>
  )
}
