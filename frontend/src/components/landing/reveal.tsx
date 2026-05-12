import { useState } from 'react'
import { motion } from 'framer-motion'

const EASE_EXPO = [0.16, 1, 0.3, 1] as const

/**
 * Wrapper Framer Motion : fade + translate au scroll.
 *
 * iOS Safari fix : la détection mobile est faite DANS l'initialiseur
 * de useState (donc avant le premier render), pas dans un useEffect.
 * Pourquoi : framer-motion capture `initial` au mount. Si on détecte
 * mobile après le mount, le translateX(-30) initial reste appliqué
 * jusqu'à ce que `whileInView` se déclenche, ce qui crée un décalage
 * visible sur iOS (~30px à droite) sur tout ce qui est en bas de fold.
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
  // ⚠️ initialiseur synchrone — exécuté au tout premier render, AVANT
  // que motion fige le state initial. Pas de SSR donc window est dispo.
  const [isMobile] = useState(() =>
    typeof window !== 'undefined' &&
    window.matchMedia('(max-width: 767px)').matches,
  )

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
