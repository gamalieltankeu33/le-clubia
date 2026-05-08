import { ReactLenis } from 'lenis/react'
import type { ReactNode } from 'react'

interface SmoothScrollProps {
  children: ReactNode
}

/**
 * Wrapper Lenis pour le smooth scrolling momentum-based.
 * Indispensable pour une landing "cinématique" haute-fidélité.
 */
export function SmoothScroll({ children }: SmoothScrollProps) {
  return (
    <ReactLenis
      root
      options={{
        lerp: 0.1,
        duration: 1.5,
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 2,
        infinite: false,
      }}
    >
      {children}
    </ReactLenis>
  )
}
