import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { Calendar, ExternalLink, Mic2, Video } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'

type Event = Database['public']['Tables']['events']['Row']

async function fetchNextUpcomingEvent(): Promise<Event | null> {
  // Fenêtre : démarre dans le futur OU vient de démarrer (-30 min de
  // tolérance) — pour qu'un event "live now" reste affiché.
  const cutoffIso = new Date(Date.now() - 30 * 60 * 1000).toISOString()
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('is_published', true)
    .gte('starts_at', cutoffIso)
    .order('starts_at', { ascending: true })
    .limit(1)
  if (error) throw error
  return (data?.[0] as Event | undefined) ?? null
}

function formatDateLabel(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function isJoinableNow(starts_at: string, duration_minutes: number): boolean {
  // Bouton "Rejoindre" visible dans la fenêtre [-5min, +30min] de l'event.
  const start = new Date(starts_at).getTime()
  const end = start + duration_minutes * 60 * 1000
  const now = Date.now()
  return now >= start - 5 * 60 * 1000 && now < end + 30 * 60 * 1000
}

function isStartingSoon(starts_at: string): boolean {
  // "Bientôt" = dans les 30 prochaines minutes (et pas encore commencé).
  const start = new Date(starts_at).getTime()
  const now = Date.now()
  return start - now > 0 && start - now <= 30 * 60 * 1000
}

export function NextEventCard() {
  const { data: event, isLoading } = useQuery({
    queryKey: ['dashboard-next-event'],
    queryFn: fetchNextUpcomingEvent,
    staleTime: 60_000,
    refetchInterval: 60_000, // re-check chaque minute pour faire apparaître le bouton "Rejoindre" au bon moment
  })

  const live = useMemo(() => {
    if (!event) return false
    return isJoinableNow(event.starts_at, event.duration_minutes)
  }, [event])

  const startingSoon = useMemo(() => {
    if (!event) return false
    return isStartingSoon(event.starts_at)
  }, [event])

  if (isLoading) return null
  if (!event) return null

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="overflow-hidden rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[var(--card)] via-[var(--card)] to-[var(--accent)]/5 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr]">
        {/* Image — top sur mobile, gauche sur desktop */}
        <div className="relative aspect-[16/9] w-full overflow-hidden md:aspect-auto md:h-full">
          {event.cover_image_url ? (
            <img
              src={event.cover_image_url}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[var(--primary)] text-[var(--primary-foreground)]">
              <Calendar className="h-12 w-12 opacity-60" />
            </div>
          )}
          {live && (
            <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-red-500 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-lg">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
              En live
            </span>
          )}
        </div>

        {/* Détails */}
        <div className="flex flex-col gap-3 p-5 sm:p-6 md:p-7">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
            Prochain coaching live
          </span>
          <h2 className="font-display text-xl font-semibold leading-tight tracking-tight sm:text-2xl">
            {event.title}
          </h2>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--muted-foreground)]">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {formatDateLabel(event.starts_at)}
            </span>
            {event.speaker_name && (
              <span className="inline-flex items-center gap-1.5">
                <Mic2 className="h-4 w-4" />
                {event.speaker_name}
              </span>
            )}
          </div>
          {event.description && (
            <p className="line-clamp-2 text-sm leading-relaxed text-[var(--muted-foreground)]">
              {event.description}
            </p>
          )}
          <div className="mt-2 flex flex-wrap gap-2">
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
            ) : startingSoon && event.meet_url ? (
              <Button asChild>
                <a
                  href={event.meet_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Video className="h-4 w-4" />
                  Rejoindre (commence bientôt)
                </a>
              </Button>
            ) : null}
            <Button asChild variant="outline">
              <Link to="/app/events">Voir tous les événements</Link>
            </Button>
          </div>
        </div>
      </div>
    </motion.section>
  )
}
