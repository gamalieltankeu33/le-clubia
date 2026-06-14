import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Image as ImageIcon, Loader2, Save, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ensureFreshSession, supabase } from '@/lib/supabase'
import {
  FORMATION_CATEGORIES,
  LEVELS,
  LEVEL_LABELS,
  isValidVideoUrl,
  slugify,
} from '@/lib/formation-helpers'
import type {
  Formation,
  FormationChapter,
  FormationLevel,
} from '@/lib/database.types'
import { useAuthStore } from '@/stores/auth-store'
import {
  ChaptersFormSection,
  type ChapterFormState,
} from './chapters-form-section'
import { CoverImage } from './cover-image'

// =========================================================================
// Auto-save brouillon
// =========================================================================
// Pourquoi : l'admin peut perdre 30 min de saisie + uploads si la page se
// ferme (crash, fermeture accidentelle, F5 reflexe). On persiste tout
// l'état du formulaire en localStorage, debounce 1.5 s, key scopée par
// user + formation pour éviter qu'un autre compte sur le même navigateur
// récupère le brouillon. Les fichiers déjà uploadés vivent côté Supabase
// (resource-files bucket), seul le path est dans le draft → la reprise
// retrouve les fichiers même après reboot.

interface FormationDraft {
  v: 1
  savedAt: number
  title: string
  slug: string
  slugTouched: boolean
  description: string
  category: string
  level: FormationLevel
  durationManual: number | null
  coverUrl: string | null
  isPublished: boolean
  chapters: ChapterFormState[]
}

const DRAFT_DEBOUNCE_MS = 1500

function draftKey(userId: string, formationId: string | null): string {
  return `formation-draft:${userId}:${formationId ?? 'new'}`
}

function readDraft(key: string): FormationDraft | null {
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as FormationDraft
    if (parsed.v !== 1) return null
    return parsed
  } catch {
    return null
  }
}

function formatRelativeAgo(timestamp: number): string {
  const diffMs = Date.now() - timestamp
  const sec = Math.floor(diffMs / 1000)
  if (sec < 60) return "à l'instant"
  const min = Math.floor(sec / 60)
  if (min < 60) return `il y a ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `il y a ${h} h`
  const d = Math.floor(h / 24)
  return `il y a ${d} j`
}

const baseSchema = z.object({
  title: z.string().trim().min(1, 'Le titre est requis').max(100),
  slug: z
    .string()
    .trim()
    .min(1, 'Le slug est requis')
    .regex(/^[a-z0-9-]+$/, 'Slug en kebab-case (a-z, 0-9, -) uniquement'),
  description: z.string().trim().optional(),
  category: z.string().trim().min(1, 'La catégorie est requise'),
  level: z.enum(['debutant', 'intermediaire', 'avance']),
  duration_minutes: z.number().int().min(0),
  is_published: z.boolean(),
  cover_image_url: z.string().url().nullable(),
})

const chapterSchema = z.object({
  title: z.string().trim().min(1),
  video_url: z
    .string()
    .trim()
    .refine((v) => v === '' || isValidVideoUrl(v), {
      message: 'URL YouTube, Vimeo ou Google Drive invalide',
    }),
  duration_minutes: z.number().int().min(0),
})

interface InitialData {
  formation: Formation
  chapters: FormationChapter[]
}

export function FormationForm({
  initial,
  onSaved,
}: {
  initial?: InitialData
  onSaved: (formationId: string) => void
}) {
  const navigate = useNavigate()
  const isEditing = Boolean(initial)

  const [title, setTitle] = useState(initial?.formation.title ?? '')
  const [slug, setSlug] = useState(initial?.formation.slug ?? '')
  const [slugTouched, setSlugTouched] = useState(isEditing)
  const [description, setDescription] = useState(
    initial?.formation.description ?? '',
  )
  const [category, setCategory] = useState<string>(
    initial?.formation.category ?? FORMATION_CATEGORIES[0],
  )
  const [level, setLevel] = useState<FormationLevel>(
    initial?.formation.level ?? 'debutant',
  )
  const [durationManual, setDurationManual] = useState<number | null>(
    initial ? initial.formation.duration_minutes : null,
  )
  const [coverUrl, setCoverUrl] = useState<string | null>(
    initial?.formation.cover_image_url ?? null,
  )
  const [isPublished, setIsPublished] = useState<boolean>(
    initial?.formation.is_published ?? false,
  )

  const [chapters, setChapters] = useState<ChapterFormState[]>(
    () =>
      initial?.chapters.map((c) => ({
        id: c.id,
        title: c.title,
        description: c.description ?? '',
        video_url: c.video_url ?? '',
        duration_minutes: c.duration_minutes,
        resources: c.resources ?? [],
      })) ?? [],
  )

  const [uploadingCover, setUploadingCover] = useState(false)
  const [saving, setSaving] = useState(false)

  // -------------------------------------------------------------------
  // Auto-save brouillon (localStorage, debounced 1.5s)
  // -------------------------------------------------------------------
  const userId = useAuthStore((s) => s.user?.id ?? null)
  const formationId = initial?.formation.id ?? null
  const storageKey = userId ? draftKey(userId, formationId) : null

  // État du draft : null = pas encore chargé / pas de draft
  // `availableDraft` = draft en localStorage proposé à la restauration,
  // null après que l'admin a cliqué [Restaurer] OU [Ignorer].
  const [availableDraft, setAvailableDraft] = useState<FormationDraft | null>(
    null,
  )
  const [draftCheckDone, setDraftCheckDone] = useState(false)
  const [lastDraftSavedAt, setLastDraftSavedAt] = useState<number | null>(null)
  const draftTimerRef = useRef<number | null>(null)

  // Au mount : check s'il existe un draft local. Pour les EDITS, on ne
  // propose la restauration QUE si le draft est plus récent que
  // l'updated_at de la formation en DB — sinon l'admin verrait son
  // propre brouillon obsolète après que quelqu'un d'autre ait sauvé.
  useEffect(() => {
    if (!storageKey || draftCheckDone) return
    const found = readDraft(storageKey)
    if (!found) {
      setDraftCheckDone(true)
      return
    }
    const dbUpdated = initial
      ? new Date(initial.formation.updated_at).getTime()
      : 0
    if (found.savedAt > dbUpdated) {
      setAvailableDraft(found)
    } else {
      // Draft obsolète → on le nettoie pour pas qu'il revienne.
      try {
        window.localStorage.removeItem(storageKey)
      } catch {
        // ignore
      }
    }
    setDraftCheckDone(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey])

  function restoreDraft() {
    if (!availableDraft) return
    setTitle(availableDraft.title)
    setSlug(availableDraft.slug)
    setSlugTouched(availableDraft.slugTouched)
    setDescription(availableDraft.description)
    setCategory(availableDraft.category)
    setLevel(availableDraft.level)
    setDurationManual(availableDraft.durationManual)
    setCoverUrl(availableDraft.coverUrl)
    setIsPublished(availableDraft.isPublished)
    setChapters(availableDraft.chapters)
    setAvailableDraft(null)
    toast.success('Brouillon restauré.')
  }

  function dismissDraft() {
    if (!storageKey) return
    try {
      window.localStorage.removeItem(storageKey)
    } catch {
      // ignore
    }
    setAvailableDraft(null)
    setLastDraftSavedAt(null)
  }

  // Sauvegarde debounced sur chaque changement. On bypass tant que le
  // check initial n'est pas fait (sinon on écraserait le draft trouvé
  // avec l'état initial du form). On bypass aussi tant qu'un draft est
  // en attente de restauration — sinon dès que l'admin tape une touche,
  // on écraserait le draft proposé.
  useEffect(() => {
    if (!storageKey || !draftCheckDone || availableDraft || saving) return
    if (draftTimerRef.current !== null) {
      window.clearTimeout(draftTimerRef.current)
    }
    draftTimerRef.current = window.setTimeout(() => {
      const draft: FormationDraft = {
        v: 1,
        savedAt: Date.now(),
        title,
        slug,
        slugTouched,
        description,
        category,
        level,
        durationManual,
        coverUrl,
        isPublished,
        chapters,
      }
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(draft))
        setLastDraftSavedAt(draft.savedAt)
      } catch {
        // localStorage plein ou mode privé : on ignore silencieusement.
      }
    }, DRAFT_DEBOUNCE_MS)
    return () => {
      if (draftTimerRef.current !== null) {
        window.clearTimeout(draftTimerRef.current)
      }
    }
  }, [
    storageKey,
    draftCheckDone,
    availableDraft,
    saving,
    title,
    slug,
    slugTouched,
    description,
    category,
    level,
    durationManual,
    coverUrl,
    isPublished,
    chapters,
  ])

  // Sauvegarde immédiate du brouillon (bouton manuel). Bypass le debounce.
  function saveDraftNow() {
    if (!storageKey) return
    if (draftTimerRef.current !== null) {
      window.clearTimeout(draftTimerRef.current)
      draftTimerRef.current = null
    }
    const draft: FormationDraft = {
      v: 1,
      savedAt: Date.now(),
      title,
      slug,
      slugTouched,
      description,
      category,
      level,
      durationManual,
      coverUrl,
      isPublished,
      chapters,
    }
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(draft))
      setLastDraftSavedAt(draft.savedAt)
      toast.success('Brouillon sauvegardé.')
    } catch {
      toast.error('Impossible de sauvegarder le brouillon localement.')
    }
  }

  // Auto-slug tant que l'utilisateur ne l'a pas touché
  useEffect(() => {
    if (!slugTouched) setSlug(slugify(title))
  }, [title, slugTouched])

  // Durée totale auto = somme des chapitres (sauf si l'admin a saisi manuellement)
  const autoDuration = useMemo(
    () => chapters.reduce((sum, c) => sum + (c.duration_minutes || 0), 0),
    [chapters],
  )
  const effectiveDuration = durationManual ?? autoDuration

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image trop lourde (max 5 Mo).')
      return
    }
    setUploadingCover(true)
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const path = `${crypto.randomUUID()}.${ext}`
    const { error } = await supabase.storage
      .from('formation-covers')
      .upload(path, file, { contentType: file.type, upsert: false })
    if (error) {
      toast.error('Upload impossible. Vérifie tes droits admin.')
      setUploadingCover(false)
      return
    }
    const { data } = supabase.storage
      .from('formation-covers')
      .getPublicUrl(path)
    setCoverUrl(data.publicUrl)
    setUploadingCover(false)
    toast.success('Image uploadée.')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (saving) return

    // Validation principale
    const parsed = baseSchema.safeParse({
      title,
      slug,
      description: description.trim() || undefined,
      category,
      level,
      duration_minutes: effectiveDuration,
      is_published: isPublished,
      cover_image_url: coverUrl,
    })
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? 'Formulaire invalide.')
      return
    }

    // Au moins 1 chapitre pour publier
    if (isPublished && chapters.length === 0) {
      toast.error('Il faut au moins un chapitre pour publier.')
      return
    }

    // Validation des chapitres
    for (const [i, c] of chapters.entries()) {
      const r = chapterSchema.safeParse({
        title: c.title,
        video_url: c.video_url,
        duration_minutes: c.duration_minutes,
      })
      if (!r.success) {
        toast.error(`Chapitre ${i + 1} : ${r.error.issues[0]?.message}`)
        return
      }
      for (const [j, res] of c.resources.entries()) {
        if ((res.label && !res.url) || (!res.label && res.url)) {
          toast.error(
            `Chapitre ${i + 1}, ressource ${j + 1} : label et URL requis.`,
          )
          return
        }
      }
    }

    setSaving(true)

    try {
      // Garde-fou : si l'admin a laissé l'onglet idle pendant qu'il
      // remplissait le formulaire, l'access_token Supabase peut être
      // périmé. ensureFreshSession() force un refresh si nécessaire
      // avant qu'on parte sur la chaîne d'updates — évite le "rien ne
      // se passe quand je clique Enregistrer après une pause".
      await ensureFreshSession()

      // 1. Upsert formation
      let formationId: string
      if (initial) {
        const { error } = await supabase
          .from('formations')
          .update({
            slug,
            title,
            description: description.trim() || null,
            category,
            level,
            cover_image_url: coverUrl,
            duration_minutes: effectiveDuration,
            is_published: isPublished,
          })
          .eq('id', initial.formation.id)
        if (error) throw error
        formationId = initial.formation.id
      } else {
        const { data, error } = await supabase
          .from('formations')
          .insert({
            slug,
            title,
            description: description.trim() || null,
            category,
            level,
            cover_image_url: coverUrl,
            duration_minutes: effectiveDuration,
            is_published: isPublished,
          })
          .select('id')
          .single()
        if (error || !data) throw error ?? new Error('insert')
        formationId = data.id
      }

      // 2. Sync chapitres : delete ceux retirés, upsert le reste
      const initialIds = new Set(
        (initial?.chapters ?? []).map((c) => c.id),
      )
      const keptIds = new Set(
        chapters.filter((c) => c.id).map((c) => c.id as string),
      )
      const toDelete = [...initialIds].filter((id) => !keptIds.has(id))
      if (toDelete.length > 0) {
        const { error } = await supabase
          .from('formation_chapters')
          .delete()
          .in('id', toDelete)
        if (error) throw error
      }

      // Upsert chapitres dans l'ordre courant
      for (const [index, c] of chapters.entries()) {
        const payload = {
          formation_id: formationId,
          order_index: index,
          title: c.title.trim(),
          description: c.description.trim() || null,
          video_url: c.video_url.trim() || null,
          duration_minutes: c.duration_minutes,
          resources: c.resources.filter((r) => r.label && r.url),
        }
        if (c.id) {
          const { error } = await supabase
            .from('formation_chapters')
            .update(payload)
            .eq('id', c.id)
          if (error) throw error
        } else {
          const { error } = await supabase
            .from('formation_chapters')
            .insert(payload)
          if (error) throw error
        }
      }

      // Save réussi → on nettoie le brouillon local (il devient obsolète).
      if (storageKey) {
        try {
          window.localStorage.removeItem(storageKey)
        } catch {
          // ignore
        }
        setLastDraftSavedAt(null)
      }

      toast.success(isEditing ? 'Formation mise à jour.' : 'Formation créée.')
      onSaved(formationId)
    } catch (err) {
      console.error(err)
      toast.error(
        err instanceof Error
          ? err.message
          : 'Erreur lors de la sauvegarde.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      {/* Bannière restauration brouillon — visible seulement si un draft
          plus récent que la version DB a été détecté au mount. */}
      {availableDraft && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-amber-900">
                Tu as un brouillon non enregistré
              </p>
              <p className="mt-0.5 text-xs text-amber-800">
                Dernière modif {formatRelativeAgo(availableDraft.savedAt)} ·{' '}
                {availableDraft.chapters.length} chapitre
                {availableDraft.chapters.length > 1 ? 's' : ''} ·{' '}
                {availableDraft.chapters.reduce(
                  (n, c) => n + c.resources.length,
                  0,
                )}{' '}
                ressource(s)
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={dismissDraft}
                className="border-amber-300 bg-white text-amber-900 hover:bg-amber-100"
              >
                Ignorer
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={restoreDraft}
                className="bg-amber-600 text-white hover:bg-amber-700"
              >
                Restaurer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Informations générales */}
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="font-display text-lg font-semibold tracking-tight">
          Informations générales
        </h2>

        <div className="mt-5 grid gap-5">
          <div className="space-y-2">
            <Label htmlFor="title">Titre *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Maîtriser n8n en 2h"
              maxLength={100}
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
              placeholder="maitriser-n8n-en-2h"
              disabled={saving}
            />
            <p className="text-xs text-[var(--muted-foreground)]">
              URL : /app/formations/<strong>{slug || '…'}</strong>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (markdown)</Label>
            <Textarea
              id="description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ce que les membres vont apprendre…"
              disabled={saving}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="category">Catégorie *</Label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={saving}
                className="flex h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              >
                {FORMATION_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="level">Niveau *</Label>
              <select
                id="level"
                value={level}
                onChange={(e) => setLevel(e.target.value as FormationLevel)}
                disabled={saving}
                className="flex h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              >
                {LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {LEVEL_LABELS[l]}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Durée totale (min)</Label>
              <Input
                id="duration"
                type="number"
                min={0}
                value={effectiveDuration}
                onChange={(e) =>
                  setDurationManual(Number(e.target.value) || 0)
                }
                disabled={saving}
              />
              <p className="text-xs text-[var(--muted-foreground)]">
                Auto-calculé : {autoDuration} min
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Cover */}
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="font-display text-lg font-semibold tracking-tight">
          Image de couverture
        </h2>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          JPG, PNG ou WebP. 5 Mo max. Affichée en card et en hero.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-[260px_1fr]">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--background)]">
            {coverUrl ? (
              <CoverImage src={coverUrl} alt="Aperçu" className="rounded-xl" />
            ) : (
              <div className="flex aspect-video items-center justify-center">
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
                disabled={uploadingCover || saving}
                className="hidden"
              />
              <span
                className={
                  'inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 text-sm transition-colors hover:bg-[var(--secondary)] ' +
                  (uploadingCover || saving
                    ? 'pointer-events-none opacity-50'
                    : '')
                }
              >
                {uploadingCover ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Upload…
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    {coverUrl ? "Remplacer l'image" : "Uploader une image"}
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

      {/* Chapitres */}
      <ChaptersFormSection
        chapters={chapters}
        onChange={setChapters}
        disabled={saving}
      />

      {/* Actions */}
      <div className="flex flex-col gap-3 border-t border-[var(--border)] pt-6 sm:flex-row sm:items-center sm:justify-between">
        {/* Indicateur d'auto-save brouillon (gauche) */}
        <p className="text-xs text-[var(--muted-foreground)]">
          {lastDraftSavedAt
            ? `Brouillon sauvegardé ${formatRelativeAgo(lastDraftSavedAt)}`
            : storageKey
              ? 'Brouillon auto-sauvegardé en local pendant la saisie.'
              : ''}
        </p>

        {/* Boutons (droite) */}
        <div className="flex items-center gap-3 sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate({ to: '/app/admin/formations' })}
            disabled={saving}
          >
            Annuler
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={saveDraftNow}
            disabled={saving || !storageKey}
            title="Sauvegarde le brouillon en local (pas en base)"
          >
            <Save className="h-4 w-4" />
            Brouillon
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
              'Créer la formation'
            )}
          </Button>
        </div>
      </div>
    </form>
  )
}
