import { motion, useReducedMotion } from 'framer-motion'

interface CirclePulseProps {
  /** Couleur du cercle (CSS color). Défaut : OR signature. */
  color?: string
  /** Taille finale en pixels (point de départ = 0). Défaut : 200. */
  size?: number
  /** Nombre de cercles superposés (offset par 0.4 s). Défaut : 3. */
  count?: number
  /** Durée d'un cycle complet en secondes. Défaut : 2.4 s. */
  duration?: number
  className?: string
}

/**
 * Animation signature du Club : un cercle qui pulse depuis le centre,
 * démultiplié en plusieurs anneaux décalés pour un effet d'onde. Utilisé
 * pour les moments de prestige (welcome, achievement, palier atteint).
 *
 * Positionnement : absolu, centré dans son parent. Le parent doit être
 * `relative`. `pointer-events-none` pour ne jamais bloquer un clic.
 *
 * Respecte `prefers-reduced-motion` : si l'OS demande pas d'animation,
 * on rend un cercle statique au lieu d'un pulse infini.
 */
export function CirclePulse({
  color = 'var(--or)',
  size = 200,
  count = 3,
  duration = 2.4,
  className,
}: CirclePulseProps) {
  const reduceMotion = useReducedMotion()

  if (reduceMotion) {
    return (
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 flex items-center justify-center ${className ?? ''}`}
      >
        <div
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            border: `1px solid ${color}`,
            opacity: 0.25,
          }}
        />
      </div>
    )
  }

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 flex items-center justify-center ${className ?? ''}`}
    >
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ scale: 0, opacity: 0.55 }}
          animate={{ scale: 1.5, opacity: 0 }}
          transition={{
            duration,
            delay: (i * duration) / count,
            repeat: Infinity,
            ease: 'easeOut',
          }}
          style={{
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: '50%',
            border: `1.5px solid ${color}`,
          }}
        />
      ))}
    </div>
  )
}
