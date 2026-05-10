import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import {
  ArrowUpRight,
  Calendar,
  Clock,
  ExternalLink,
  Mic2,
  Sparkles,
  Video,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import type { Database } from '@/lib/database.types'

type Event = Database['public']['Tables']['events']['Row']

type Urgency = 'normal' | 'soon' | 'today' | 'live'

async function fetchNextUpcomingEvent(): Promise<Event | null> {
  // Tolérance -30 min : un event "live now" reste affiché.
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

function isJoinableNow(starts_at: string, duration_minutes: number, now: number): boolean {
  const start = new Date(starts_at).getTime()
  const end = start + duration_minutes * 60 * 1000
  return now >= start - 5 * 60 * 1000 && now < end + 30 * 60 * 1000
}

function isStartingSoon(starts_at: string, now: number): boolean {
  const start = new Date(starts_at).getTime()
  return start - now > 0 && start - now <= 30 * 60 * 1000
}

function getCountdown(
  starts_at: string,
  live: boolean,
  now: number,
): { label: string; sub: string; urgency: Urgency } {
  if (live) return { label: 'EN COURS', sub: 'Rejoins en direct', urgency: 'live' }

  const start = new Date(starts_at)
  const diffMs = start.getTime() - now
  const diffMinutes = Math.floor(diffMs / 60_000)

  if (diffMinutes > 0 && diffMinutes <= 30) {
    return {
      label: `DANS ${diffMinutes} MIN`,
      sub: 'Démarrage imminent',
      urgency: 'live',
    }
  }

  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate())
  const nowDate = new Date(now)
  const today = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate())
  const dayDiff = Math.round(
    (startDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  )

  if (dayDiff <= 0) return { label: "AUJOURD'HUI", sub: 'À ne pas manquer', urgency: 'today' }
  if (dayDiff === 1) return { label: 'DEMAIN', sub: 'Réserve ton créneau', urgency: 'soon' }
  if (dayDiff <= 3) return { label: `J-${dayDiff}`, sub: 'Bientôt', urgency: 'soon' }
  return { label: `J-${dayDiff}`, sub: 'À venir', urgency: 'normal' }
}

function formatDateRange(starts_at: string, duration_minutes: number): string {
  const start = new Date(starts_at)
  const end = new Date(start.getTime() + duration_minutes * 60 * 1000)
  const dayPart = start
    .toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  const capitalized = dayPart.charAt(0).toUpperCase() + dayPart.slice(1)
  const fmtTime = (d: Date) =>
    d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }).replace(':', 'h')
  return `${capitalized} · ${fmtTime(start)} - ${fmtTime(end)}`
}

const URGENCY_THEME: Record<
  Urgency,
  {
    overlay: string
    glow: string
    badgeBg: string
    badgeText: string
    accentBar: string
  }
> = {
  normal: {
    overlay: 'from-[#0A1F44]/80 via-[#0A1F44]/55 to-[#0A1F44]/30',
    glow: 'bg-[var(--primary)]/20',
    badgeBg: 'bg-white/15 ring-1 ring-white/25',
    badgeText: 'text-white',
    accentBar: 'bg-[var(--primary)]',
  },
  soon: {
    overlay: 'from-[#3a1d05]/85 via-[#7a3a08]/55 to-[#c2520a]/35',
    glow: 'bg-orange-400/25',
    badgeBg: 'bg-orange-400/25 ring-1 ring-orange-200/40',
    badgeText: 'text-orange-50',
    accentBar: 'bg-orange-400',
  },
  today: {
    overlay: 'from-emerald-950/85 via-emerald-800/55 to-emerald-600/35',
    glow: 'bg-emerald-400/25',
    badgeBg: 'bg-emerald-400/25 ring-1 ring-emerald-200/40',
    badgeText: 'text-emerald-50',
    accentBar: 'bg-emerald-400',
  },
  live: {
    overlay: 'from-rose-950/85 via-red-900/60 to-rose-700/35',
    glow: 'bg-red-500/30',
    badgeBg: 'bg-red-500/30 ring-1 ring-red-200/40',
    badgeText: 'text-red-50',
    accentBar: 'bg-red-500',
  },
}

export function NextEventCard() {
  const { data: event, isLoading } = useQuery({
    queryKey: ['dashboard-next-event'],
    queryFn: fetchNextUpcomingEvent,
    staleTime: 60_000,
    refetchInterval: 60_000,
  })

  // Tick local pour rafraîchir le décompte chaque 30s (sans refetch).
  const [now, setNow] = useState<number>(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(id)
  }, [])

  const live = useMemo(() => {
    if (!event) return false
    return isJoinableNow(event.starts_at, event.duration_minutes, now)
  }, [event, now])

  const startingSoon = useMemo(() => {
    if (!event) return false
    return isStartingSoon(event.starts_at, now)
  }, [event, now])

  const countdown = useMemo(() => {
    if (!event) return null
    return getCountdown(event.starts_at, live, now)
  }, [event, live, now])

  if (isLoading) return null
  if (!event || !countdown) return null

  const theme = URGENCY_THEME[countdown.urgency]
  const isPaid = false
  const ctaJoinable = live || startingSoon
  const ctaPulses = ctaJoinable
  const dateLabel = formatDateRange(event.starts_at, event.duration_minutes)

  const ariaCountdown =
    countdown.urgency === 'live'
      ? `${countdown.label}. ${event.title}.`
      : `Prochain événement ${countdown.label}. ${event.title}, ${dateLabel}.`

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      aria-label={`Prochain coaching live : ${event.title}, ${countdown.label}, ${dateLabel}`}
      className={cn(
        'group relative overflow-hidden rounded-3xl border border-white/10 shadow-[0_24px_48px_-16px_rgba(10,31,68,0.25)] transition-shadow duration-500',
        countdown.urgency === 'live' &&
          'shadow-[0_0_0_1px_rgba(244,63,94,0.45),0_24px_48px_-16px_rgba(244,63,94,0.5)]',
      )}
    >
      <span aria-live="polite" className="sr-only">
        {ariaCountdown}
      </span>

      {/* Image de fond / fallback */}
      <div className="relative aspect-[4/5] w-full sm:aspect-[16/9] md:aspect-[16/8] lg:aspect-[16/7]">
        {event.cover_image_url ? (
          <img
            src={event.cover_image_url}
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.06),transparent_60%),radial-gradient(ellipse_at_bottom_right,rgba(255,255,255,0.04),transparent_60%)] bg-[var(--primary)]">
            <div
              aria-hidden
              className="absolute inset-0 opacity-[0.18]"
              style={{
                backgroundImage:
                  'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
                backgroundSize: '48px 48px',
              }}
            />
          </div>
        )}

        {/* Overlay coloré selon urgence */}
        <div
          aria-hidden
          className={cn(
            'absolute inset-0 bg-gradient-to-tr',
            theme.overlay,
          )}
        />
        {/* Halo doux */}
        <div
          aria-hidden
          className={cn(
            'pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full blur-[80px]',
            theme.glow,
          )}
        />

        {/* Contenu posé sur l'image */}
        <div className="relative flex h-full flex-col justify-between p-6 text-white sm:p-8 lg:p-10">
          {/* Top row : eyebrow + badge accès */}
          <div className="flex items-start justify-between gap-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/90 ring-1 ring-white/15 backdrop-blur">
              <Sparkles className="h-3 w-3" />
              Prochain coaching live
            </div>
            <div
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] backdrop-blur',
                isPaid
                  ? 'bg-white/15 text-white ring-1 ring-white/25'
                  : 'bg-white/15 text-white ring-1 ring-white/25',
              )}
            >
              {isPaid ? 'Exclusif membre' : 'Gratuit'}
            </div>
          </div>

          {/* Décompte (centre / haut-gauche en desktop) */}
          <div className="mt-4 flex items-center gap-3 sm:mt-6">
            <CountdownBadge
              label={countdown.label}
              sub={countdown.sub}
              urgency={countdown.urgency}
              theme={theme}
            />
          </div>

          {/* Bottom : titre + meta + CTA */}
          <div className="mt-6 space-y-4 sm:mt-10">
            <h2
              className="font-display text-2xl font-semibold leading-tight tracking-tight drop-shadow-sm sm:text-3xl lg:text-[2.25rem] lg:leading-[1.1]"
              style={{ textShadow: '0 2px 16px rgba(0,0,0,0.35)' }}
            >
              {event.title}
            </h2>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/85">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {dateLabel}
              </span>
              {event.speaker_name && (
                <span className="inline-flex items-center gap-1.5">
                  <Mic2 className="h-4 w-4" />
                  {event.speaker_name}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {event.duration_minutes} min
              </span>
            </div>

            {event.description && (
              <p className="line-clamp-2 max-w-2xl text-sm leading-relaxed text-white/75 sm:text-base">
                {event.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-2">
              {ctaJoinable && event.meet_url ? (
                <motion.a
                  href={event.meet_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  animate={
                    ctaPulses
                      ? { boxShadow: ['0 0 0 0 rgba(255,255,255,0.45)', '0 0 0 14px rgba(255,255,255,0)'] }
                      : undefined
                  }
                  transition={
                    ctaPulses
                      ? { duration: 1.6, repeat: Infinity, ease: 'easeOut' }
                      : { duration: 0.2 }
                  }
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#0A0A0A] shadow-lg transition-colors hover:bg-white/95',
                  )}
                >
                  <Video className="h-4 w-4" />
                  Rejoindre maintenant
                  <ExternalLink className="h-3.5 w-3.5 opacity-60" />
                </motion.a>
              ) : (
                <Link
                  to="/app/events"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#0A0A0A] shadow-lg transition-transform hover:scale-[1.02]"
                >
                  Réserver ma place
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              )}

              <Link
                to="/app/events"
                className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-3 text-sm font-medium text-white/90 ring-1 ring-white/20 backdrop-blur transition-colors hover:bg-white/15"
              >
                Voir tous les événements
              </Link>
            </div>
          </div>
        </div>

        {/* Barre d'accent en bas */}
        <div
          aria-hidden
          className={cn(
            'absolute bottom-0 left-0 right-0 h-[3px]',
            theme.accentBar,
          )}
        />
      </div>
    </motion.section>
  )
}

function CountdownBadge({
  label,
  sub,
  urgency,
  theme,
}: {
  label: string
  sub: string
  urgency: Urgency
  theme: (typeof URGENCY_THEME)[Urgency]
}) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-3 rounded-2xl px-4 py-2.5 backdrop-blur',
        theme.badgeBg,
      )}
    >
      {urgency === 'live' && (
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/80 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
        </span>
      )}
      <div className="flex flex-col leading-tight">
        <span
          className={cn(
            'font-mono text-2xl font-black tracking-tight tabular-nums sm:text-3xl',
            theme.badgeText,
          )}
        >
          {label}
        </span>
        <span className={cn('text-[10px] font-semibold uppercase tracking-[0.16em] opacity-80', theme.badgeText)}>
          {sub}
        </span>
      </div>
    </div>
  )
}
