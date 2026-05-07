import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { Calendar, Mic2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Eyebrow } from './eyebrow'

interface PublicEvent {
  id: string
  title: string
  description: string | null
  starts_at: string
  duration_minutes: number
  cover_image_url: string | null
  speaker_name: string | null
  type: string
}

async function fetchNextPublicEvent(): Promise<PublicEvent | null> {
  // RPC publique exposée à anon (cf. migration 0018).
  // @ts-expect-error - get_next_public_event est une RPC custom non typée dans Database['public']['Functions']
  const { data, error } = await supabase.rpc('get_next_public_event')
  if (error) {
    console.warn('[NextEventBanner] rpc error:', error)
    return null
  }
  if (!data) return null
  const rows = Array.isArray(data) ? data : [data]
  if (rows.length === 0) return null
  return rows[0] as PublicEvent
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

const EASE = [0.22, 1, 0.36, 1] as const

export function NextEventBanner() {
  // 5 minutes de cache (brief).
  const { data: event } = useQuery({
    queryKey: ['landing-next-event'],
    queryFn: fetchNextPublicEvent,
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
  })

  if (!event) return null

  return (
    <section className="relative overflow-hidden py-16 sm:py-20 lg:py-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--primary)]/[0.04] blur-3xl" />
      </div>

      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7, ease: EASE }}
          className="overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm"
        >
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr]">
            {/* Image */}
            <div className="relative aspect-[16/10] w-full overflow-hidden lg:aspect-auto">
              {event.cover_image_url ? (
                <img
                  src={event.cover_image_url}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-[var(--primary)] text-white">
                  <Calendar className="h-16 w-16 opacity-60" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex flex-col justify-center gap-4 p-7 sm:p-10">
              <Eyebrow variant="accent">Prochain coaching live</Eyebrow>
              <h2 className="font-display text-2xl font-semibold leading-tight tracking-tight text-[#0A0A0A] sm:text-3xl lg:text-4xl">
                {event.title}
              </h2>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[#525252]">
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
                <p className="line-clamp-3 text-base leading-relaxed text-[#525252]">
                  {event.description}
                </p>
              )}
              <div className="mt-2">
                <Link
                  to="/auth"
                  className="inline-flex items-center justify-center rounded-full bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-[var(--primary)]/90 hover:shadow-md"
                >
                  Rejoindre Le Club IA pour y participer
                </Link>
                <p className="mt-3 text-xs text-[#737373]">
                  Réservé aux membres actifs · 14 € / mois
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
