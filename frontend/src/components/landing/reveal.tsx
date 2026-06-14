import { useState } from 'react'
import { motion } from 'framer-motion'

const EASE_EXPO = [0.16, 1, 0.3, 1] as const

/**
 * Wrapper Framer Motion : fade + translate au scroll.
 *
 * iOS Safari fix : sur mobile (<768px) on rend un `<div>` plain sans
 * aucun motion ni transform. Le souci sur iOS Safari WebKit : les
 * `<motion.div>` posent un compositing layer GPU avec un transform
 * initial (translateX/translateY), et même quand whileInView snape à
 * 0, des résidus subpixel persistent et donnent l'impression que tout
 * est décalé à droite. Désactiver motion entièrement sur mobile élimine
 * définitivement le bug. Animation visuelle conservée sur desktop.
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
  // ⚠️ initialiseur synchrone (avant 1er render). Pas de SSR ici.
  const [isMobile] = useState(() =>
    typeof window !== 'undefined' &&
    window.matchMedia('(max-width: 767px)').matches,
  )

  if (isMobile) {
    // Passthrough total — aucun transform, aucun layer GPU.
    return <div className={className}>{children}</div>
  }

  const initialX =
    direction === 'left' ? distance : direction === 'right' ? -distance : 0
  const initialY =
    direction === 'up' ? distance : direction === 'down' ? -distance : 0

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
