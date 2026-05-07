import { useEffect, useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Bell,
  CalendarClock,
  CalendarDays,
  Edit3,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Loader2,
  Mic2,
  Plus,
  Send,
  Trash2,
  Video,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAuthStore } from '@/stores/auth-store'
import { supabase } from '@/lib/supabase'
import { compressImage } from '@/lib/compress-image'
import { generateAndUploadFallbackCover } from '@/lib/event-cover-fallback'
import type { Database, EventType } from '@/lib/database.types'
import { cn } from '@/lib/utils'
import { useConfirm } from '@/hooks/use-confirm'

type Event = Database['public']['Tables']['events']['Row']
type EventInsert = Database['public']['Tables']['events']['Insert']

export const Route = createFileRoute('/app/admin/events')({
  component: AdminEventsPage,
})

const TYPE_LABELS: Record<EventType, string> = {
  coaching: 'Coaching live',
  masterclass: 'Masterclass',
  qa: 'Q&A',
  other: 'Autre',
}

const TYPE_TONES: Record<EventType, string> = {
  coaching: 'bg-[var(--primary)]/10 text-[var(--primary)]',
  masterclass: 'bg-violet-100 text-violet-700',
  qa: 'bg-emerald-100 text-emerald-700',
  other: 'bg-[var(--secondary)] text-[var(--muted-foreground)]',
}

interface FormState {
  id: string | null
  title: string
  description: string
  type: EventType
  speaker_name: string
  speaker_bio: string
  starts_at_local: string // datetime-local string
  duration_minutes: number
  meet_url: string
  cover_image_url: string | null
  notify_on_publish: boolean
  notify_1_day_before: boolean
  notify_on_day: boolean
  is_published: boolean
}

const EMPTY_FORM: FormState = {
  id: null,
  title: '',
  description: '',
  type: 'coaching',
  speaker_name: '',
  speaker_bio: '',
  starts_at_local: '',
  duration_minutes: 90,
  meet_url: '',
  cover_image_url: null,
  notify_on_publish: true,
  notify_1_day_before: true,
  notify_on_day: true,
  is_published: false,
}

function isoToLocalDatetime(iso: string): string {
  // datetime-local attend "YYYY-MM-DDTHH:MM" en local
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function localDatetimeToIso(local: string): string {
  return new Date(local).toISOString()
}

function formatStartsAt(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

async function fetchAllEvents(): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('starts_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Event[]
}

interface BroadcastResult {
  triggered: boolean
  ok?: boolean
  sent?: number
  failed?: number
  skippedReason?: string
  error?: string
}

async function broadcastAnnouncement(
  eventId: string,
  force = false,
): Promise<BroadcastResult> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.access_token) {
    return {
      triggered: true,
      ok: false,
      error: 'Session expirée. Reconnecte-toi.',
    }
  }
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
  try {
    const res = await fetch(
      `${supabaseUrl}/functions/v1/event-broadcast-announcement`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ event_id: eventId, force }),
      },
    )
    const json = (await res.json()) as {
      ok?: boolean
      sent_count?: number
      failed_count?: number
      skipped?: boolean
      reason?: string
      error?: string
    }
    if (!res.ok || !json.ok) {
      return {
        triggered: true,
        ok: false,
        error: json.error ?? `HTTP ${res.status}`,
      }
    }
    return {
      triggered: true,
      ok: true,
      sent: json.sent_count ?? 0,
      failed: json.failed_count ?? 0,
      skippedReason: json.skipped ? json.reason : undefined,
    }
  } catch (err) {
    return {
      triggered: true,
      ok: false,
      error: err instanceof Error ? err.message : 'Erreur réseau.',
    }
  }
}

async function uploadCover(file: File): Promise<string> {
  const compressed = await compressImage(file, {
    maxWidthOrHeight: 1280,
    maxSizeMB: 2,
    initialQuality: 0.85,
  })
  const ext =
    compressed.type === 'image/png'
      ? 'png'
      : compressed.type === 'image/webp'
        ? 'webp'
        : 'jpg'
  const path = `${crypto.randomUUID()}.${ext}`
  const { error: upErr } = await supabase.storage
    .from('event-covers')
    .upload(path, compressed, {
      contentType: compressed.type || 'image/jpeg',
      upsert: false,
    })
  if (upErr) throw upErr
  const { data } = supabase.storage.from('event-covers').getPublicUrl(path)
  return data.publicUrl
}

function AdminEventsPage() {
  const queryClient = useQueryClient()
  const adminUser = useAuthStore((s) => s.user)
  const { confirm, ConfirmDialog } = useConfirm()
  const [editing, setEditing] = useState<FormState | null>(null)

  const eventsQuery = useQuery({
    queryKey: ['admin-events'],
    queryFn: fetchAllEvents,
  })

  const upsertMutation = useMutation({
    mutationFn: async (form: FormState) => {
      // 1. Si publication ET pas d'image → on génère un PNG fallback
      //    branded automatiquement et on l'uploade. Garantit que 100%
      //    des events ont une image dans les emails et sur la landing.
      let coverUrl = form.cover_image_url
      if (form.is_published && !coverUrl) {
        try {
          coverUrl = await generateAndUploadFallbackCover({
            title: form.title.trim() || 'Coaching live',
            startsAtIso: localDatetimeToIso(form.starts_at_local),
            speakerName: form.speaker_name.trim() || null,
          })
        } catch (err) {
          console.error('[admin-events] fallback cover failed:', err)
          // On ne bloque pas la publication — le mail partira sans image.
        }
      }

      const payload: EventInsert = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        type: form.type,
        speaker_name: form.speaker_name.trim() || null,
        speaker_bio: form.speaker_bio.trim() || null,
        starts_at: localDatetimeToIso(form.starts_at_local),
        duration_minutes: form.duration_minutes,
        meet_url: form.meet_url.trim() || null,
        cover_image_url: coverUrl,
        is_published: form.is_published,
        notify_on_publish: form.notify_on_publish,
        notify_1_day_before: form.notify_1_day_before,
        notify_on_day: form.notify_on_day,
        created_by: adminUser?.id ?? null,
      }

      let savedId: string
      let prevAnnouncementSent: string | null = null
      if (form.id) {
        const { data: prev } = await supabase
          .from('events')
          .select('announcement_sent_at')
          .eq('id', form.id)
          .maybeSingle()
        prevAnnouncementSent = prev?.announcement_sent_at ?? null
        const { data, error } = await supabase
          .from('events')
          .update(payload)
          .eq('id', form.id)
          .select('id')
          .single()
        if (error || !data) throw error ?? new Error('update failed')
        savedId = data.id
      } else {
        const { data, error } = await supabase
          .from('events')
          .insert(payload)
          .select('id')
          .single()
        if (error || !data) throw error ?? new Error('insert failed')
        savedId = data.id
      }

      // 2. Si publication + notify_on_publish + pas encore annoncé →
      //    déclenche l'envoi de l'email d'annonce immédiatement via
      //    l'edge function event-broadcast-announcement.
      let broadcastResult: BroadcastResult = { triggered: false }
      const shouldBroadcast =
        form.is_published &&
        form.notify_on_publish &&
        !prevAnnouncementSent
      if (shouldBroadcast) {
        broadcastResult = await broadcastAnnouncement(savedId)
      }
      return { id: savedId, broadcast: broadcastResult }
    },
    onSuccess: (res, form) => {
      if (res.broadcast.triggered && res.broadcast.ok) {
        toast.success(
          `Événement publié — annonce envoyée à ${res.broadcast.sent ?? 0} membre${(res.broadcast.sent ?? 0) > 1 ? 's' : ''}.`,
        )
      } else if (res.broadcast.triggered && !res.broadcast.ok) {
        toast.warning(
          `Événement publié, mais l'envoi de l'annonce a échoué : ${res.broadcast.error ?? 'erreur inconnue'}`,
        )
      } else if (form.is_published) {
        toast.success(
          form.id ? 'Événement publié.' : 'Événement créé et publié.',
        )
      } else {
        toast.success(form.id ? 'Brouillon mis à jour.' : 'Brouillon créé.')
      }
      queryClient.invalidateQueries({ queryKey: ['admin-events'] })
      setEditing(null)
    },
    onError: (err) => {
      console.error(err)
      const message =
        err instanceof Error
          ? err.message
          : 'Impossible de sauvegarder.'
      toast.error(`Sauvegarde impossible : ${message}`)
    },
  })

  const reannounceMutation = useMutation({
    mutationFn: async (event: Event) => {
      return broadcastAnnouncement(event.id, true)
    },
    onSuccess: (res) => {
      if (res.ok) {
        toast.success(
          `Annonce ré-envoyée à ${res.sent ?? 0} membre${(res.sent ?? 0) > 1 ? 's' : ''}.`,
        )
      } else {
        toast.error(`Ré-envoi impossible : ${res.error ?? 'erreur inconnue'}`)
      }
      queryClient.invalidateQueries({ queryKey: ['admin-events'] })
    },
    onError: (err) => {
      console.error(err)
      toast.error('Ré-envoi impossible.')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (event: Event) => {
      // Best-effort : supprime l'image de couverture si présente
      if (event.cover_image_url) {
        const marker = `/storage/v1/object/public/event-covers/`
        const idx = event.cover_image_url.indexOf(marker)
        if (idx !== -1) {
          const path = event.cover_image_url
            .slice(idx + marker.length)
            .split('?')[0]
          await supabase.storage.from('event-covers').remove([path])
        }
      }
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', event.id)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Événement supprimé.')
      queryClient.invalidateQueries({ queryKey: ['admin-events'] })
    },
    onError: () => toast.error('Suppression impossible.'),
  })

  const togglePublishMutation = useMutation({
    mutationFn: async (event: Event) => {
      const becomingPublished = !event.is_published
      // Si on bascule en publié et qu'il n'y a pas de cover, on génère
      // d'abord le PNG fallback pour que les emails partent avec image.
      if (becomingPublished && !event.cover_image_url) {
        try {
          const coverUrl = await generateAndUploadFallbackCover({
            title: event.title,
            startsAtIso: event.starts_at,
            speakerName: event.speaker_name,
          })
          await supabase
            .from('events')
            .update({ cover_image_url: coverUrl })
            .eq('id', event.id)
        } catch (err) {
          console.error('[admin-events] toggle fallback cover failed:', err)
        }
      }

      const { error } = await supabase
        .from('events')
        .update({ is_published: becomingPublished })
        .eq('id', event.id)
      if (error) throw error

      // Si on passe à publié et que l'annonce n'a pas encore été envoyée,
      // on déclenche le broadcast (si notify_on_publish actif).
      let broadcast: BroadcastResult = { triggered: false }
      if (
        becomingPublished &&
        event.notify_on_publish &&
        !event.announcement_sent_at
      ) {
        broadcast = await broadcastAnnouncement(event.id)
      }
      return { wasUnpublishing: !becomingPublished, broadcast }
    },
    onSuccess: (res) => {
      if (res.wasUnpublishing) {
        toast.success('Événement dépublié.')
      } else if (res.broadcast.triggered && res.broadcast.ok) {
        toast.success(
          `Publié — annonce envoyée à ${res.broadcast.sent ?? 0} membre${(res.broadcast.sent ?? 0) > 1 ? 's' : ''}.`,
        )
      } else if (res.broadcast.triggered && !res.broadcast.ok) {
        toast.warning(
          `Publié, mais l'envoi de l'annonce a échoué : ${res.broadcast.error ?? 'erreur inconnue'}`,
        )
      } else {
        toast.success('Événement publié.')
      }
      queryClient.invalidateQueries({ queryKey: ['admin-events'] })
    },
    onError: () => toast.error('Modification impossible.'),
  })

  function handleEdit(ev: Event) {
    setEditing({
      id: ev.id,
      title: ev.title,
      description: ev.description ?? '',
      type: ev.type,
      speaker_name: ev.speaker_name ?? '',
      speaker_bio: ev.speaker_bio ?? '',
      starts_at_local: isoToLocalDatetime(ev.starts_at),
      duration_minutes: ev.duration_minutes,
      meet_url: ev.meet_url ?? '',
      cover_image_url: ev.cover_image_url,
      notify_on_publish: ev.notify_on_publish,
      notify_1_day_before: ev.notify_1_day_before,
      notify_on_day: ev.notify_on_day,
      is_published: ev.is_published,
    })
  }

  async function handleDelete(ev: Event) {
    const ok = await confirm({
      title: 'Supprimer cet événement ?',
      contentPreview: ev.title,
      description:
        "L'événement, son image de couverture et tous les rappels associés seront supprimés.",
      confirmLabel: 'Supprimer',
      variant: 'destructive',
    })
    if (!ok) return
    deleteMutation.mutate(ev)
  }

  async function handleReannounce(ev: Event) {
    const ok = await confirm({
      title: "Ré-envoyer l'email d'annonce ?",
      contentPreview: ev.title,
      description:
        "L'email partira à tous les membres actifs avec opt-in. À utiliser uniquement en cas d'urgence (envoi initial cassé, info corrigée).",
      confirmLabel: 'Ré-envoyer',
      variant: 'default',
    })
    if (!ok) return
    reannounceMutation.mutate(ev)
  }

  const events = eventsQuery.data ?? []

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:py-14">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-wrap items-start justify-between gap-4"
      >
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
            <CalendarDays className="h-5 w-5" />
          </span>
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl">
              Événements
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-[var(--muted-foreground)] sm:text-base">
              Coaching live, masterclass, Q&A. À la publication, une notif
              in-app est envoyée à tous les membres actifs. Les rappels J-1 et
              jour J sont envoyés par email automatiquement.
            </p>
          </div>
        </div>
        <Button onClick={() => setEditing({ ...EMPTY_FORM })}>
          <Plus className="h-4 w-4" />
          Nouvel événement
        </Button>
      </motion.div>

      <div className="mt-8">
        {eventsQuery.isLoading ? (
          <div className="flex items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--card)] p-12">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--muted-foreground)]" />
          </div>
        ) : events.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-12 text-center">
            <p className="text-sm text-[var(--muted-foreground)]">
              Aucun événement pour l'instant. Crée le premier coaching live !
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
            <ul className="divide-y divide-[var(--border)]">
              {events.map((ev) => (
                <li
                  key={ev.id}
                  className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:gap-5 sm:px-5"
                >
                  <div className="h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-[var(--secondary)]">
                    {ev.cover_image_url ? (
                      <img
                        src={ev.cover_image_url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[var(--muted-foreground)]">
                        <ImageIcon className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
                          ev.is_published
                            ? 'bg-[var(--accent)]/15 text-[var(--accent)]'
                            : 'bg-[var(--secondary)] text-[var(--muted-foreground)]',
                        )}
                      >
                        {ev.is_published ? 'Publié' : 'Brouillon'}
                      </span>
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-[10px] font-medium',
                          TYPE_TONES[ev.type],
                        )}
                      >
                        {TYPE_LABELS[ev.type]}
                      </span>
                      <NotifBadges ev={ev} />
                    </div>
                    <p className="mt-1 truncate font-medium">{ev.title}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      <CalendarClock className="mr-1 inline h-3 w-3" />
                      {formatStartsAt(ev.starts_at)} · {ev.duration_minutes} min
                      {ev.speaker_name && (
                        <>
                          {' · '}
                          <Mic2 className="mr-1 inline h-3 w-3" />
                          {ev.speaker_name}
                        </>
                      )}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => togglePublishMutation.mutate(ev)}
                      disabled={togglePublishMutation.isPending}
                    >
                      {ev.is_published ? (
                        <EyeOff className="h-3.5 w-3.5" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                      {ev.is_published ? 'Dépublier' : 'Publier'}
                    </Button>
                    {ev.is_published && ev.announcement_sent_at && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReannounce(ev)}
                        disabled={reannounceMutation.isPending}
                        title={`Annonce déjà envoyée le ${new Date(ev.announcement_sent_at).toLocaleDateString('fr-FR')}`}
                      >
                        <Send className="h-3.5 w-3.5" />
                        Re-annoncer
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(ev)}
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      Éditer
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(ev)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Supprimer
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {editing && (
        <EventFormModal
          form={editing}
          onChange={setEditing}
          onCancel={() => setEditing(null)}
          onSubmit={() => upsertMutation.mutate(editing)}
          submitting={upsertMutation.isPending}
        />
      )}

      <ConfirmDialog />
    </div>
  )
}

function NotifBadges({ ev }: { ev: Event }) {
  const items: Array<{ on: boolean; label: string }> = [
    { on: ev.notify_on_publish, label: 'Annonce' },
    { on: ev.notify_1_day_before, label: 'J-1' },
    { on: ev.notify_on_day, label: 'Jour J' },
  ]
  return (
    <span className="inline-flex items-center gap-1">
      <Bell className="h-3 w-3 text-[var(--muted-foreground)]" />
      <span className="flex gap-1">
        {items.map((it) => (
          <span
            key={it.label}
            className={cn(
              'rounded-full px-1.5 py-0.5 text-[9px] font-medium',
              it.on
                ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                : 'bg-[var(--secondary)] text-[var(--muted-foreground)] line-through',
            )}
          >
            {it.label}
          </span>
        ))}
      </span>
    </span>
  )
}

// =============================================================================
// Modal create/edit
// =============================================================================

function EventFormModal({
  form,
  onChange,
  onCancel,
  onSubmit,
  submitting,
}: {
  form: FormState
  onChange: (next: FormState) => void
  onCancel: () => void
  onSubmit: () => void
  submitting: boolean
}) {
  const [uploadingCover, setUploadingCover] = useState(false)

  const isValid = useMemo(() => {
    return (
      form.title.trim().length > 0 &&
      form.starts_at_local.length > 0 &&
      form.duration_minutes > 0
    )
  }, [form])

  // Échap pour fermer
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [submitting, onCancel])

  // Scroll lock du body pendant l'ouverture de la modale.
  // À la fermeture, on restaure la valeur précédente — pas de "lock
  // résiduel" qui empêcherait le scroll de la page derrière.
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  async function handleCoverPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image trop grande (max 5 Mo).')
      e.target.value = ''
      return
    }
    setUploadingCover(true)
    try {
      const url = await uploadCover(file)
      onChange({ ...form, cover_image_url: url })
      toast.success('Image téléversée.')
    } catch (err) {
      console.error(err)
      toast.error("Téléversement impossible.")
    } finally {
      setUploadingCover(false)
      e.target.value = ''
    }
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={submitting ? undefined : onCancel}
        aria-hidden="true"
      />
      {/* Wrapper flex plein-écran : centre la modale verticalement et
          horizontalement, et lui donne un parent à hauteur définie
          (100vh) — clé pour que `flex-1 overflow-y-auto` fonctionne. */}
      <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 12 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="pointer-events-auto flex max-h-[calc(100vh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-2xl sm:max-h-[88vh]"
          role="dialog"
          aria-modal="true"
          aria-label={form.id ? "Modifier l'événement" : 'Créer un événement'}
        >
          <div className="flex shrink-0 items-center justify-between border-b border-[var(--border)] px-5 py-4">
            <h2 className="font-display text-lg font-semibold tracking-tight">
              {form.id ? "Modifier l'événement" : 'Nouvel événement'}
            </h2>
            <button
              type="button"
              onClick={onCancel}
              disabled={submitting}
              aria-label="Fermer"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* min-h-0 est CRUCIAL : sans ça, un flex child a min-height:auto
              (= taille du contenu), ce qui empêche overflow-y-auto de
              déclencher la barre de scroll. */}
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 space-y-4">
            {/* Cover */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[160px_1fr]">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--background)]">
                {form.cover_image_url ? (
                  <img
                    src={form.cover_image_url}
                    alt=""
                    className="aspect-[16/9] w-full rounded-xl object-cover"
                  />
                ) : (
                  <div className="flex aspect-[16/9] items-center justify-center text-[var(--muted-foreground)]">
                    <ImageIcon className="h-6 w-6" />
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Image de couverture (optionnel)</Label>
                <p className="text-xs text-[var(--muted-foreground)]">
                  JPG/PNG/WebP. 5 Mo max. Compressée automatiquement à 1280px.
                </p>
                <div className="flex flex-wrap gap-2">
                  <input
                    id="cover-input"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleCoverPick}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('cover-input')?.click()}
                    disabled={uploadingCover || submitting}
                  >
                    {uploadingCover ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Upload…
                      </>
                    ) : (
                      <>
                        <ImageIcon className="h-4 w-4" />
                        {form.cover_image_url ? 'Changer' : 'Téléverser'}
                      </>
                    )}
                  </Button>
                  {form.cover_image_url && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onChange({ ...form, cover_image_url: null })}
                      disabled={submitting}
                    >
                      <Trash2 className="h-4 w-4" />
                      Retirer
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="event-title">Titre</Label>
              <Input
                id="event-title"
                value={form.title}
                onChange={(e) => onChange({ ...form, title: e.target.value })}
                placeholder="Coaching live — Construire son SaaS IA en 30 jours"
                disabled={submitting}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="event-type">Type</Label>
                <select
                  id="event-type"
                  value={form.type}
                  onChange={(e) =>
                    onChange({ ...form, type: e.target.value as EventType })
                  }
                  disabled={submitting}
                  className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 text-sm"
                >
                  <option value="coaching">Coaching live</option>
                  <option value="masterclass">Masterclass</option>
                  <option value="qa">Q&A</option>
                  <option value="other">Autre</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="event-duration">Durée (minutes)</Label>
                <Input
                  id="event-duration"
                  type="number"
                  min={15}
                  step={15}
                  value={form.duration_minutes}
                  onChange={(e) =>
                    onChange({
                      ...form,
                      duration_minutes: Number(e.target.value) || 90,
                    })
                  }
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="event-starts">Date et heure (heure locale)</Label>
              <Input
                id="event-starts"
                type="datetime-local"
                value={form.starts_at_local}
                onChange={(e) =>
                  onChange({ ...form, starts_at_local: e.target.value })
                }
                disabled={submitting}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="event-meet">Lien Google Meet (optionnel)</Label>
              <Input
                id="event-meet"
                type="url"
                value={form.meet_url}
                onChange={(e) => onChange({ ...form, meet_url: e.target.value })}
                placeholder="https://meet.google.com/..."
                disabled={submitting}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="event-desc">Description</Label>
              <Textarea
                id="event-desc"
                rows={4}
                value={form.description}
                onChange={(e) =>
                  onChange({ ...form, description: e.target.value })
                }
                placeholder="Ce qu'on couvre, à qui ça s'adresse, ce que tu vas en retirer…"
                disabled={submitting}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="event-speaker">Intervenant·e (optionnel)</Label>
                <Input
                  id="event-speaker"
                  value={form.speaker_name}
                  onChange={(e) =>
                    onChange({ ...form, speaker_name: e.target.value })
                  }
                  placeholder="Camille Rousseau"
                  disabled={submitting}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="event-bio">Bio courte intervenant·e</Label>
                <Input
                  id="event-bio"
                  value={form.speaker_bio}
                  onChange={(e) =>
                    onChange({ ...form, speaker_bio: e.target.value })
                  }
                  placeholder="Founder de XYZ, expert n8n"
                  disabled={submitting}
                />
              </div>
            </div>

            {/* Notifications */}
            <fieldset className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
              <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                Notifications
              </legend>
              <div className="space-y-2">
                <CheckboxRow
                  label="Annoncer à la publication (notif in-app)"
                  hint="Une notification est envoyée à tous les membres actifs au moment où l'événement passe en statut publié."
                  checked={form.notify_on_publish}
                  onChange={(v) => onChange({ ...form, notify_on_publish: v })}
                  disabled={submitting}
                />
                <CheckboxRow
                  label="Rappel J-1 (email)"
                  hint="Un email est envoyé la veille à 9h UTC à tous les membres actifs avec opt-in."
                  checked={form.notify_1_day_before}
                  onChange={(v) =>
                    onChange({ ...form, notify_1_day_before: v })
                  }
                  disabled={submitting}
                />
                <CheckboxRow
                  label="Rappel jour J (email)"
                  hint="Un email est envoyé le jour même à 9h UTC à tous les membres actifs avec opt-in."
                  checked={form.notify_on_day}
                  onChange={(v) => onChange({ ...form, notify_on_day: v })}
                  disabled={submitting}
                />
              </div>
            </fieldset>

            <CheckboxRow
              label="Publier maintenant"
              hint="Si décoché, l'événement reste en brouillon (invisible pour les membres)."
              checked={form.is_published}
              onChange={(v) => onChange({ ...form, is_published: v })}
              disabled={submitting}
            />
          </div>

          <div className="flex shrink-0 justify-end gap-2 border-t border-[var(--border)] bg-[var(--background)] px-5 py-3">
            <Button variant="ghost" onClick={onCancel} disabled={submitting}>
              Annuler
            </Button>
            <Button
              type="button"
              onClick={onSubmit}
              disabled={!isValid || submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sauvegarde…
                </>
              ) : (
                <>
                  {form.is_published ? <Send className="h-4 w-4" /> : <Video className="h-4 w-4" />}
                  {form.id ? 'Enregistrer' : form.is_published ? 'Créer & publier' : 'Créer brouillon'}
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </div>
    </>
  )
}

function CheckboxRow({
  label,
  hint,
  checked,
  onChange,
  disabled,
}: {
  label: string
  hint?: string
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg p-2 hover:bg-[var(--secondary)]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="mt-0.5 h-4 w-4 cursor-pointer accent-[var(--primary)]"
      />
      <span className="flex-1">
        <span className="block text-sm font-medium">{label}</span>
        {hint && (
          <span className="mt-0.5 block text-xs text-[var(--muted-foreground)]">
            {hint}
          </span>
        )}
      </span>
    </label>
  )
}
