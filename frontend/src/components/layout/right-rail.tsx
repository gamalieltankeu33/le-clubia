import { useQuery } from '@tanstack/react-query'
import { Link, useLocation } from '@tanstack/react-router'
import { Calendar, Users, TrendingUp, ExternalLink, Video } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'

type EventRow = Database['public']['Tables']['events']['Row']

async function fetchNextUpcomingEvent(): Promise<EventRow | null> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('is_published', true)
    .gte('starts_at', new Date(Date.now() - 30 * 60 * 1000).toISOString())
    .order('starts_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) return null
  return data
}

function formatStartsAt(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function isLiveNow(starts_at: string, duration_minutes: number): boolean {
  const start = new Date(starts_at).getTime()
  const end = start + duration_minutes * 60 * 1000
  const now = Date.now()
  return now >= start - 5 * 60 * 1000 && now < end + 30 * 60 * 1000
}

export function RightRail() {
  const { pathname } = useLocation()

  const isCommunity = pathname.startsWith('/app/communaute') || pathname === '/app'

  const { data: nextEvent } = useQuery({
    queryKey: ['right-rail-next-event'],
    queryFn: fetchNextUpcomingEvent,
    enabled: isCommunity,
    staleTime: 60_000,
  })

  if (!isCommunity) {
    return null
  }

  const live = nextEvent ? isLiveNow(nextEvent.starts_at, nextEvent.duration_minutes) : false

  return (
    <div className="flex h-full flex-col gap-8 overflow-y-auto py-6 px-4">
      {/* Block Événement (Affiche uniquement si un événement est réellement programmé & publié) */}
      {nextEvent && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[var(--muted-foreground)]" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
              Prochain Événement
            </h3>
          </div>
          
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm transition-colors hover:border-[var(--primary)]">
            <h4 className="font-medium text-[var(--foreground)] line-clamp-2">
              {nextEvent.title}
            </h4>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              {formatStartsAt(nextEvent.starts_at)}
            </p>
            
            {live && (
              <div className="mt-3 flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
                </span>
                <span className="text-xs font-medium text-red-500">En direct</span>
              </div>
            )}

            {nextEvent.meet_url ? (
              <Button asChild size="sm" className="mt-4 w-full bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90">
                <a href={nextEvent.meet_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5">
                  <Video className="h-3.5 w-3.5" />
                  {live ? 'Rejoindre maintenant' : 'Accéder au lien'}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
            ) : (
              <Button asChild size="sm" variant="outline" className="mt-4 w-full">
                <Link to="/app/events">Voir l'événement</Link>
              </Button>
            )}
          </div>
        </section>
      )}

      {/* Block Membres en ligne */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-[var(--muted-foreground)]" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
              En ligne (12)
            </h3>
          </div>
          <Link to="/app/membres" className="text-xs text-[var(--primary)] hover:underline">
            Voir tous
          </Link>
        </div>
        
        <div className="flex flex-col gap-3">
          {['Sarah N.', 'Benjamin T.', 'Yacouba M.'].map((name, i) => (
            <div key={i} className="flex items-center gap-3 cursor-pointer group">
              <div className="relative">
                <div className="h-8 w-8 rounded-full bg-[var(--secondary)] border border-[var(--border)] group-hover:border-[var(--primary)] transition-colors" />
                <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[var(--background)] bg-green-500" />
              </div>
              <span className="text-sm font-medium text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">
                {name}
              </span>
            </div>
          ))}
          <div className="mt-1 text-xs text-[var(--muted-foreground)]">
            + 9 autres membres
          </div>
        </div>
      </section>

      {/* Block Discussions */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-[var(--muted-foreground)]" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
            Discussions actives
          </h3>
        </div>
        
        <div className="flex flex-col gap-4">
          <div className="group cursor-pointer">
            <h4 className="text-sm font-medium text-[var(--foreground)] group-hover:text-[var(--primary)] line-clamp-2">
              Quel outil utilisez-vous pour faire des montages automatiques ?
            </h4>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">18 réponses</p>
          </div>
          <div className="group cursor-pointer">
            <h4 className="text-sm font-medium text-[var(--foreground)] group-hover:text-[var(--primary)] line-clamp-2">
              J'ai lancé mon premier produit SaaS ce matin !
            </h4>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">12 réponses</p>
          </div>
        </div>
      </section>
    </div>
  )
}
