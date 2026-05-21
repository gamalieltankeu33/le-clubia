import { useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar,
  CalendarDays,
  CalendarPlus,
  ExternalLink,
  Loader2,
  Mic2,
  PlayCircle,
  Sparkles,
  Video,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRequireAuth } from '@/lib/use-require-auth'
import { supabase } from '@/lib/supabase'
import type { Database, EventType } from '@/lib/database.types'
import { cn } from '@/lib/utils'
import { VideoEmbed } from '@/components/shared/video-embed'

type Event = Database['public']['Tables']['events']['Row']

export const Route = createFileRoute('/app/events')({
  component: EventsPage,
})

const TYPE_LABELS: Record<EventType, string> = {
  coaching: 'Coaching live',
  masterclass: 'Masterclass',
  qa: 'Q&A',
  other: 'Événement',
}

const TYPE_TONES: Record<EventType, string> = {
  coaching: 'bg-[var(--primary)]/10 text-[var(--primary)]',
  masterclass: 'bg-violet-100 text-violet-700',
  qa: 'bg-emerald-100 text-emerald-700',
  other: 'bg-[var(--secondary)] text-[var(--muted-foreground)]',
}

async function fetchUpcomingEvents(): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('is_published', true)
    .gte('starts_at', new Date(Date.now() - 30 * 60 * 1000).toISOString()) // tolérance 30 min en cours
    .order('starts_at', { ascending: true })
    .limit(10)
  if (error) throw error
  return (data ?? []) as Event[]
}

async function fetchPastEvents(): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('is_published', true)
    .lt('starts_at', new Date(Date.now() - 30 * 60 * 1000).toISOString())
    .order('starts_at', { ascending: false })
    .limit(12)
  if (error) throw error
  return (data ?? []) as Event[]
}

function formatStartsAt(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function isLiveNow(starts_at: string, duration_minutes: number): boolean {
  const start = new Date(starts_at).getTime()
  const end = start + duration_minutes * 60 * 1000
  const now = Date.now()
  // 5 min avant le début → 30 min après la fin "officielle" → on considère live
  return now >= start - 5 * 60 * 1000 && now < end + 30 * 60 * 1000
}

function downloadIcs(event: Event) {
  const start = new Date(event.starts_at)
  const end = new Date(start.getTime() + event.duration_minutes * 60 * 1000)
  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Le Club IA//Events//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.id}@leclub-ia.com`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${escapeIcs(event.title)}`,
    `DESCRIPTION:${escapeIcs(event.description ?? '')}`,
    event.meet_url ? `URL:${event.meet_url}` : '',
    `LOCATION:${escapeIcs(event.meet_url ?? 'En ligne')}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n')
  const blob = new Blob([lines], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${event.title.replace(/[^a-z0-9]+/gi, '-').slice(0, 40)}.ics`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function escapeIcs(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

function EventsPage() {
  const allowed = useRequireAuth({ requireOnboarded: true })
  const [replayEvent, setReplayEvent] = useState<Event | null>(null)

  const upcomingQuery = useQuery({
    queryKey: ['member-events-upcoming'],
    queryFn: fetchUpcomingEvents,
    enabled: allowed,
    staleTime: 60_000,
  })

  const pastQuery = useQuery({
    queryKey: ['member-events-past'],
    queryFn: fetchPastEvents,
    enabled: allowed,
    staleTime: 5 * 60_000,
  })

  if (!allowed) return null

  const upcoming = upcomingQuery.data ?? []
  const past = pastQuery.data ?? []

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10 lg:py-14">
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
            <CalendarDays className="h-5 w-5" />
          </span>
          <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl">
            Événements
          </h1>
        </div>
        <p className="mt-2 max-w-2xl text-base text-[var(--muted-foreground)] sm:text-lg">
          Coaching live mensuel, masterclasses et sessions Q&A. Tu reçois un
          rappel par email J-1 et le jour J.
        </p>
      </motion.section>

      {/* Prochains événements */}
      <section className="mt-10">
        <h2 className="font-display text-lg font-semibold tracking-tight">
          À venir
        </h2>
        <div className="mt-4 space-y-4">
          {upcomingQuery.isLoading ? (
            <div className="flex items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--card)] p-12">
              <Loader2 className="h-5 w-5 animate-spin text-[var(--muted-foreground)]" />
            </div>
          ) : upcoming.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-10 text-center">
              <Calendar className="mx-auto h-8 w-8 text-[var(--muted-foreground)]" />
              <p className="mt-3 text-sm font-medium">
                Aucun événement programmé pour le moment
              </p>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                Le prochain coaching live mensuel sera bientôt annoncé.
              </p>
            </div>
          ) : (
            upcoming.map((ev) => <EventCard key={ev.id} event={ev} />)
          )}
        </div>
      </section>

      {/* Passés / Masterclass Replay */}
      {past.length > 0 && (
        <section className="mt-12">
          <h2 className="font-display text-lg font-semibold tracking-tight">
            Masterclass Replay
          </h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Tu as manqué une session live&nbsp;? Revois-la quand tu veux.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {past.map((ev) => (
              <PastEventCard
                key={ev.id}
                event={ev}
                onWatch={() => setReplayEvent(ev)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Modal lecteur de replay */}
      <AnimatePresence>
        {replayEvent && (
          <ReplayModal
            event={replayEvent}
            onClose={() => setReplayEvent(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function PastEventCard({
  event,
  onWatch,
}: {
  event: Event
  onWatch: () => void
}) {
  const hasReplay = !!event.replay_url

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm transition-shadow hover:shadow-md">
      {/* Vignette */}
      <button
        type="button"
        onClick={hasReplay ? onWatch : undefined}
        disabled={!hasReplay}
        className={cn(
          'relative aspect-[16/9] w-full overflow-hidden bg-[var(--secondary)]',
          hasReplay ? 'cursor-pointer' : 'cursor-default',
        )}
        aria-label={hasReplay ? `Voir le replay : ${event.title}` : undefined}
      >
        {event.cover_image_url ? (
          <img
            src={event.cover_image_url}
            alt=""
            loading="lazy"
            className={cn(
              'h-full w-full object-cover transition-transform duration-500',
              hasReplay && 'group-hover:scale-105',
            )}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Mic2 className="h-8 w-8 text-[var(--muted-foreground)]" />
          </div>
        )}

        {hasReplay && (
          <>
            <div className="absolute inset-0 bg-black/30 transition-colors group-hover:bg-black/45" />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/95 text-[var(--primary)] shadow-lg transition-transform duration-300 group-hover:scale-110">
                <PlayCircle className="h-8 w-8" />
              </span>
            </span>
            <span className="absolute left-3 top-3 rounded-full bg-[var(--primary)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
              Replay
            </span>
          </>
        )}
      </button>

      {/* Infos */}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest',
              TYPE_TONES[event.type],
            )}
          >
            {TYPE_LABELS[event.type]}
          </span>
        </div>
        <h3 className="mt-2 font-display text-base font-semibold leading-snug tracking-tight">
          {event.title}
        </h3>
        {event.speaker_name && (
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            Avec {event.speaker_name}
          </p>
        )}
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
          {formatStartsAt(event.starts_at)}
        </p>

        <div className="mt-3 flex-1" />

        {hasReplay ? (
          <Button
            onClick={onWatch}
            className="mt-2 w-full gap-2 bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90"
          >
            <PlayCircle className="h-4 w-4" />
            Voir le replay
          </Button>
        ) : (
          <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-[var(--muted-foreground)]">
            <Loader2 className="h-3 w-3" />
            Replay bientôt disponible
          </p>
        )}
      </div>
    </article>
  )
}

function ReplayModal({
  event,
  onClose,
}: {
  event: Event
  onClose: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Replay : ${event.title}`}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-3xl overflow-hidden rounded-2xl bg-[var(--card)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] p-4">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--primary)]">
              {TYPE_LABELS[event.type]} · Replay
            </p>
            <h3 className="mt-1 truncate font-display text-lg font-semibold tracking-tight">
              {event.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--muted-foreground)] transition-colors hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4">
          <VideoEmbed url={event.replay_url ?? ''} title={event.title} />
          {event.description && (
            <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-[var(--muted-foreground)]">
              {event.description}
            </p>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

function EventCard({ event }: { event: Event }) {
  const live = useMemo(
    () => isLiveNow(event.starts_at, event.duration_minutes),
    [event.starts_at, event.duration_minutes],
  )

  return (
    <article className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm transition-shadow hover:shadow-md">
      {event.cover_image_url && (
        <img
          src={event.cover_image_url}
          alt=""
          loading="lazy"
          className="aspect-[16/7] w-full object-cover"
        />
      )}
      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              'rounded-full px-2.5 py-0.5 text-xs font-medium',
              TYPE_TONES[event.type],
            )}
          >
            {TYPE_LABELS[event.type]}
          </span>
          {live && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-red-600">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
              En live
            </span>
          )}
        </div>
        <h3 className="mt-3 font-display text-xl font-semibold leading-tight tracking-tight sm:text-2xl">
          {event.title}
        </h3>
        <p className="mt-2 text-sm text-[var(--primary)] sm:text-base">
          📅 {formatStartsAt(event.starts_at)} · {event.duration_minutes} min
        </p>
        {event.speaker_name && (
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            <Mic2 className="mr-1 inline h-3.5 w-3.5" />
            {event.speaker_name}
            {event.speaker_bio && ` — ${event.speaker_bio}`}
          </p>
        )}
        {event.description && (
          <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-[var(--muted-foreground)]">
            {event.description}
          </p>
        )}
        <div className="mt-5 flex flex-wrap gap-2">
          {live && event.meet_url ? (
            <Button asChild>
              <a
                href={event.meet_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Video className="h-4 w-4" />
                Rejoindre maintenant
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          ) : event.meet_url ? (
            <Button asChild variant="outline">
              <a
                href={event.meet_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Video className="h-4 w-4" />
                Voir le lien Google Meet
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          ) : (
            <Button variant="outline" disabled>
              <Sparkles className="h-4 w-4" />
              Lien à venir
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => downloadIcs(event)}
          >
            <CalendarPlus className="h-4 w-4" />
            Ajouter à mon agenda
          </Button>
        </div>
      </div>
    </article>
  )
}
