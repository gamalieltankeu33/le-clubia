import { motion } from 'framer-motion'

const EASE_EXPO = [0.16, 1, 0.3, 1] as const

/** 
 * Wrapper Framer Motion : fade + translate au scroll.
 * Version "Senior Creative Tech" avec easing Expo Out cinématique.
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
  const initialX = direction === 'left' ? distance : direction === 'right' ? -distance : 0
  const initialY = direction === 'up' ? distance : direction === 'down' ? -distance : 0

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, x: initialX, y: initialY }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ 
        duration: 1.2, 
        ease: EASE_EXPO, 
        delay 
      }}
    >
      {children}
    </motion.div>
  )
}
