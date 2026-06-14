import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth-store'
import { cn } from '@/lib/utils'

/**
 * Pill discret sous le titre « Communauté » :
 *   · 247 membres   🟢 12 en ligne
 *
 * - Total membres : RPC `count_active_members` (compte les abonnements
 *   actifs/trialing non expirés). Cache 5 min — la valeur change
 *   rarement. Dégradation propre si la RPC n'existe pas encore :
 *   on cache simplement le total.
 *
 * - En ligne : Supabase Realtime Presence. Chaque membre qui affiche
 *   la page Communauté rejoint un canal partagé et s'identifie par
 *   son user.id. Le count = nombre de user.id uniques présents.
 *   À la destruction du composant (changement de page, fermeture
 *   d'onglet), on `untrack()` proprement → le count baisse en
 *   temps réel pour les autres.
 */

const PRESENCE_CHANNEL = 'community-online'

export function CommunityStatsPill({ className }: { className?: string }) {
  const user = useAuthStore((s) => s.user)

  // ── Total membres (RPC) ────────────────────────────────────────────
  const totalQuery = useQuery({
    queryKey: ['community-stats', 'total-members'],
    queryFn: async (): Promise<number | null> => {
      // @ts-expect-error - count_active_members est une RPC custom non typée
      const { data, error } = await supabase.rpc('count_active_members')
      if (error) {
        // Avant l'application de la migration 0054, la RPC n'existe
        // pas → on retourne null pour cacher le total dans le pill,
        // sans casser le reste de la page.
        return null
      }
      return typeof data === 'number' ? data : null
    },
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  })

  // ── En ligne (Realtime Presence) ────────────────────────────────────
  const [onlineCount, setOnlineCount] = useState<number>(0)

  useEffect(() => {
    if (!user?.id) return
    let cancelled = false
    const channel = supabase.channel(PRESENCE_CHANNEL, {
      config: { presence: { key: user.id } },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        if (cancelled) return
        // presenceState() = { '<userId>': [meta, ...], ... }
        // On compte les CLÉS uniques (= users uniques, même s'ils ont
        // plusieurs onglets ouverts).
        setOnlineCount(Object.keys(channel.presenceState()).length)
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          void channel.track({ at: new Date().toISOString() }).catch(() => {})
        }
      })

    return () => {
      cancelled = true
      void channel.untrack().catch(() => {})
      void supabase.removeChannel(channel).catch(() => {})
    }
  }, [user?.id])

  // ── Rendu ──────────────────────────────────────────────────────────
  // En attendant le premier sync de presence, on affiche « 1 en ligne »
  // (au minimum le user courant), pas « 0 » qui serait trompeur.
  const displayedOnline = onlineCount > 0 ? onlineCount : 1
  const total = totalQuery.data
  // Format fr-FR : 1247 → « 1 247 » (espace insécable fin), naturel à
  // l'œil et conforme à la convention francophone.
  const totalLabel =
    total != null ? total.toLocaleString('fr-FR').replace(/\s/g, ' ') : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={cn(
        'mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--muted-foreground)] sm:text-sm',
        className,
      )}
    >
      {/* Total membres : skeleton tant que la RPC charge (évite un saut
          de texte quand la donnée arrive). Caché complètement si la RPC
          n'existe pas encore (migration 0054 non appliquée). */}
      {totalQuery.isLoading ? (
        <span
          aria-hidden="true"
          className="inline-flex items-center gap-1.5"
        >
          <span className="h-1 w-1 rounded-full bg-[var(--muted-foreground)]/40" />
          <span className="inline-block h-3 w-20 animate-pulse rounded bg-[var(--muted-foreground)]/15" />
        </span>
      ) : (
        total != null && (
          <span className="inline-flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="h-1 w-1 rounded-full bg-[var(--muted-foreground)]/40"
            />
            <span>
              <strong className="font-semibold text-[var(--foreground)] tabular-nums">
                {totalLabel}
              </strong>{' '}
              {total === 1 ? 'membre' : 'membres'}
            </span>
          </span>
        )
      )}
      <span
        className="inline-flex items-center gap-1.5"
        title="Membres actuellement connectés à la communauté"
      >
        <span aria-hidden="true" className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        <span>
          <strong className="font-semibold text-[var(--foreground)] tabular-nums">
            {displayedOnline}
          </strong>{' '}
          en ligne
        </span>
      </span>
    </motion.div>
  )
}
