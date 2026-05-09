import { ReactLenis } from 'lenis/react'
import { useEffect, useState, type ReactNode } from 'react'

interface SmoothScrollProps {
  children: ReactNode
}

/**
 * Wrapper Lenis — config "Linear / Notion" :
 *  - duration 0.8s + easeOutExpo : démarre vite, finit doux, pas de
 *    tail-off paresseux.
 *  - Désactivé entièrement sur mobile : iOS / Android ont un scroll
 *    natif plus fluide que tout smooth scroll JS.
 *  - Désactivé si l'OS demande prefers-reduced-motion.
 *  - smoothWheel: true (trackpad / molette desktop).
 *  - syncTouch: false (au cas où on entrerait quand même via tablette
 *    en CSS-mode desktop, on laisse le scroll natif gérer le touch).
 */
export function SmoothScroll({ children }: SmoothScrollProps) {
  const reduceMotion = usePrefersReducedMotion()
  const isMobile = useIsMobile()

  if (reduceMotion || isMobile) return <>{children}</>

  return (
    <ReactLenis
      root
      options={{
        duration: 0.8,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 2,
        syncTouch: false,
        infinite: false,
      }}
    >
      {children}
    </ReactLenis>
  )
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return reduced
}

/**
 * Détection mobile combinée : largeur viewport + UA. Couvre les vrais
 * mobiles ET les tablettes en mode portrait étroit.
 */
function useIsMobile(): boolean {
  const [mobile, setMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)')
    const ua = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    setMobile(mq.matches || ua)
    const onChange = (e: MediaQueryListEvent) => setMobile(e.matches || ua)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return mobile
}
