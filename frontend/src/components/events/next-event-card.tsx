import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { ExternalLink } from 'lucide-react'
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
): { label: string; urgency: Urgency } {
  if (live) return { label: 'EN DIRECT', urgency: 'live' }

  const start = new Date(starts_at)
  const diffMs = start.getTime() - now
  const diffMinutes = Math.floor(diffMs / 60_000)

  if (diffMinutes > 0 && diffMinutes <= 30) {
    return { label: `DANS ${diffMinutes} MIN`, urgency: 'live' }
  }

  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate())
  const nowDate = new Date(now)
  const today = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate())
  const dayDiff = Math.round(
    (startDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  )

  if (dayDiff <= 0) return { label: "AUJOURD'HUI", urgency: 'today' }
  if (dayDiff === 1) return { label: 'DEMAIN', urgency: 'soon' }
  if (dayDiff <= 3) return { label: `J-${dayDiff}`, urgency: 'soon' }
  return { label: `J-${dayDiff}`, urgency: 'normal' }
}

function formatMeta(starts_at: string, duration_minutes: number, speaker_name: string | null): string {
  const start = new Date(starts_at)
  const datePart = start
    .toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
    .replace('.', '')
  const cap = datePart.charAt(0).toUpperCase() + datePart.slice(1)
  const timePart = start
    .toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    .replace(':', 'h')
  const hours = Math.floor(duration_minutes / 60)
  const minutes = duration_minutes % 60
  const durationPart =
    hours === 0 ? `${minutes} min` : minutes === 0 ? `${hours}h` : `${hours}h${String(minutes).padStart(2, '0')}`

  const parts = [`${cap} · ${timePart}`, durationPart]
  if (speaker_name) parts.push(speaker_name)
  return parts.join(' · ')
}

function formatFullDate(starts_at: string, duration_minutes: number): string {
  // Pour aria-label uniquement.
  const start = new Date(starts_at)
  const end = new Date(start.getTime() + duration_minutes * 60 * 1000)
  const dayPart = start.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const cap = dayPart.charAt(0).toUpperCase() + dayPart.slice(1)
  const fmt = (d: Date) =>
    d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }).replace(':', 'h')
  return `${cap} · ${fmt(start)} - ${fmt(end)}`
}

const URGENCY_DOT: Record<Urgency, string> = {
  normal: 'bg-[var(--primary)]',
  soon: 'bg-[var(--bleu-ciel)]',
  today: 'bg-[var(--bleu-ciel-deep)]',
  live: 'bg-red-500',
}

const URGENCY_LABEL: Record<Urgency, string> = {
  normal: 'text-[var(--primary)]',
  soon: 'text-[var(--bleu-ciel-deep)]',
  today: 'text-[var(--bleu-ciel-deep)]',
  live: 'text-red-600',
}

export function NextEventCard() {
  const { data: event, isLoading } = useQuery({
    queryKey: ['dashboard-next-event'],
    queryFn: fetchNextUpcomingEvent,
    staleTime: 60_000,
    refetchInterval: 60_000,
  })

  // Tick local toutes les 30s pour faire évoluer le décompte sans refetch.
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

  const meta = formatMeta(event.starts_at, event.duration_minutes, event.speaker_name)
  const fullDate = formatFullDate(event.starts_at, event.duration_minutes)
  const ctaJoinable = (live || startingSoon) && Boolean(event.meet_url)
  const animateGlow = startingSoon && !live // glow seulement quand imminent (pas pendant le live, qui a déjà sa pastille pulsante)

  return (
    <motion.section
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      aria-label={`Prochain événement : ${event.title}, ${countdown.label}, ${fullDate}`}
      className="group relative rounded-2xl border border-[var(--border)] bg-[var(--card)] px-5 py-4 shadow-sm transition-colors duration-200 hover:bg-[var(--muted)]/40 sm:px-6"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
        <div className="min-w-0 flex-1">
          {/* Status row */}
          <div className="flex items-center gap-2">
            <span
              aria-hidden
              className={cn(
                'h-2 w-2 shrink-0 rounded-full',
                URGENCY_DOT[countdown.urgency],
                (countdown.urgency === 'live' || countdown.urgency === 'soon') && 'animate-pulse',
              )}
            />
            <span
              aria-live="polite"
              className={cn(
                'text-[11px] font-semibold uppercase tracking-wider',
                URGENCY_LABEL[countdown.urgency],
              )}
            >
              {countdown.label}
            </span>
          </div>

          {/* Titre */}
          <h2 className="mt-1 truncate font-display text-base font-semibold leading-tight tracking-tight text-[var(--foreground)] sm:text-lg">
            {event.title}
          </h2>

          {/* Meta inline */}
          <p className="mt-0.5 truncate text-xs text-[var(--muted-foreground)] sm:text-sm">
            {meta}
          </p>
        </div>

        {/* CTA */}
        <div className="shrink-0 sm:ml-auto">
          {ctaJoinable ? (
            <motion.a
              href={event.meet_url ?? undefined}
              target="_blank"
              rel="noopener noreferrer"
              animate={
                animateGlow
                  ? {
                      boxShadow: [
                        '0 0 0 0 rgba(249,115,22,0.45)',
                        '0 0 0 8px rgba(249,115,22,0)',
                      ],
                    }
                  : undefined
              }
              transition={
                animateGlow
                  ? { duration: 2, repeat: Infinity, ease: 'easeOut' }
                  : { duration: 0.2 }
              }
              className="inline-flex w-full items-center justify-center gap-1 rounded-full bg-[var(--primary)] px-4 py-1.5 text-xs font-semibold text-[var(--primary-foreground)] transition-colors hover:bg-[var(--primary)]/90 sm:w-auto"
            >
              Rejoindre
              <ExternalLink className="ml-0.5 h-3 w-3" />
            </motion.a>
          ) : (
            <Link
              to="/app/events"
              className="inline-flex w-full items-center justify-center rounded-full bg-transparent px-4 py-1.5 text-xs font-medium text-[var(--foreground)] ring-1 ring-[var(--border)] transition-colors hover:bg-[var(--muted)] sm:w-auto"
            >
              Voir détails
            </Link>
          )}
        </div>
      </div>
    </motion.section>
  )
}
