import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

const EASE_EXPO = [0.16, 1, 0.3, 1] as const

/**
 * Wrapper Framer Motion : fade + translate au scroll.
 *
 * Mobile-first : sur écrans <768px, les animations horizontales
 * (direction='left' / 'right') sont automatiquement converties en
 * 'up'. Sinon le translate horizontal initial décale le contenu hors
 * viewport et donne l'impression que la page est mal alignée tant
 * que l'animation n'a pas tourné (cas typique iOS Safari).
 */
export function Reveal({
  children,
  delay = 0,
  direction = 'up',
  distance = 30,
  className,
}: {
  children: React.ReactNode
  delay?: number
  direction?: 'up' | 'down' | 'left' | 'right' | 'none'
  distance?: number
  className?: string
}) {
  const [isMobile, setIsMobile] = useState(false)

  // Détection mobile une seule fois au mount + écoute resize.
  // Pas de SSR ici donc pas de mismatch.
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 767px)')
    setIsMobile(mql.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  const effectiveDirection =
    isMobile && (direction === 'left' || direction === 'right') ? 'up' : direction

  const initialX =
    effectiveDirection === 'left'
      ? distance
      : effectiveDirection === 'right'
        ? -distance
        : 0
  const initialY =
    effectiveDirection === 'up'
      ? distance
      : effectiveDirection === 'down'
        ? -distance
        : 0

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, x: initialX, y: initialY }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{
        duration: 0.6,
        ease: EASE_EXPO,
        delay,
      }}
    >
      {children}
    </motion.div>
  )
}
