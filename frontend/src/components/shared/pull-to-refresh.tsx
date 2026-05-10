import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type TouchEvent as ReactTouchEvent,
} from 'react'
import { Loader2 } from 'lucide-react'
import { haptic } from '@/lib/haptic'
import { cn } from '@/lib/utils'

interface PullToRefreshProps {
  onRefresh: () => Promise<unknown> | void
  children: ReactNode
  /** Distance en px à dépasser pour déclencher le refresh (défaut 80). */
  threshold?: number
  className?: string
}

/**
 * Pull-to-refresh natif (touchstart/touchmove/touchend), sans
 * dépendance. Activé uniquement sur écrans tactiles ; ignoré sur
 * desktop pour ne pas créer un comportement parasite avec la molette.
 *
 * Le geste est détecté quand l'utilisateur tire vers le bas en partant
 * du tout haut du scroll (window.scrollY === 0). On affiche un cercle
 * de progression au-dessus du contenu, et on déclenche onRefresh
 * lorsque la distance dépasse le seuil au moment du relâchement.
 */
export function PullToRefresh({
  onRefresh,
  children,
  threshold = 80,
  className,
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const startYRef = useRef<number | null>(null)
  const trackingRef = useRef(false)
  const triggeredHapticRef = useRef(false)

  // Désactive le pull-to-refresh sur les périphériques sans touchscreen.
  const [isTouch, setIsTouch] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined') return
    setIsTouch(window.matchMedia('(pointer: coarse)').matches)
  }, [])

  function handleTouchStart(e: ReactTouchEvent<HTMLDivElement>) {
    if (!isTouch || refreshing) return
    if (window.scrollY > 0) return
    startYRef.current = e.touches[0].clientY
    trackingRef.current = true
    triggeredHapticRef.current = false
  }

  function handleTouchMove(e: ReactTouchEvent<HTMLDivElement>) {
    if (!trackingRef.current || startYRef.current === null) return
    const delta = e.touches[0].clientY - startYRef.current
    if (delta <= 0) {
      setPullDistance(0)
      return
    }
    // Resistance : on amortit le tirage pour donner une sensation plus
    // naturelle (asymptote à ~1.5 × threshold).
    const damped = Math.min(threshold * 1.5, delta * 0.55)
    setPullDistance(damped)

    // Petit haptic une seule fois quand on franchit le seuil.
    if (!triggeredHapticRef.current && damped >= threshold) {
      triggeredHapticRef.current = true
      haptic('light')
    }
  }

  async function handleTouchEnd() {
    if (!trackingRef.current) return
    trackingRef.current = false
    const shouldRefresh = pullDistance >= threshold
    startYRef.current = null
    if (shouldRefresh) {
      setRefreshing(true)
      setPullDistance(threshold)
      haptic('medium')
      try {
        await onRefresh()
      } finally {
        setRefreshing(false)
        setPullDistance(0)
      }
    } else {
      setPullDistance(0)
    }
  }

  const progress = Math.min(1, pullDistance / threshold)
  const showIndicator = pullDistance > 4 || refreshing

  return (
    <div
      className={cn('relative', className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={() => {
        trackingRef.current = false
        startYRef.current = null
        if (!refreshing) setPullDistance(0)
      }}
    >
      {showIndicator && (
        <div
          aria-hidden
          className="pointer-events-none absolute left-0 right-0 top-0 z-10 flex items-start justify-center"
          style={{ height: pullDistance }}
        >
          <div
            className="mt-3 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--card)] text-[var(--muted-foreground)] shadow-md ring-1 ring-[var(--border)]"
            style={{
              transform: `scale(${0.6 + 0.4 * progress})`,
              opacity: 0.4 + 0.6 * progress,
            }}
          >
            <Loader2
              className={cn('h-4 w-4', refreshing && 'animate-spin')}
              style={{
                transform: refreshing ? undefined : `rotate(${progress * 360}deg)`,
              }}
            />
          </div>
        </div>
      )}
      <div
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: trackingRef.current ? 'none' : 'transform 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        {children}
      </div>
    </div>
  )
}
