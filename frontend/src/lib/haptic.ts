/**
 * Vibration haptic mobile. Silencieux sur iOS Safari (qui ne supporte
 * pas l'API Vibration) et si l'utilisateur a activé prefers-reduced-motion.
 *
 * Usage :
 *   haptic('light')   // tap léger : icône, bouton secondaire
 *   haptic('medium')  // action confirmée : like, save
 *   haptic('heavy')   // action importante : publier, supprimer
 *   haptic('success') // pattern triple bump
 *   haptic('warning')
 *   haptic('error')   // rollback / erreur
 */
export type HapticIntensity =
  | 'light'
  | 'medium'
  | 'heavy'
  | 'success'
  | 'warning'
  | 'error'

const HAPTIC_PATTERNS: Record<HapticIntensity, number | number[]> = {
  light: 5,
  medium: 10,
  heavy: 20,
  success: [10, 30, 10],
  warning: [20, 50, 20],
  error: [30, 50, 30, 50, 30],
}

export function haptic(intensity: HapticIntensity = 'light'): void {
  if (typeof window === 'undefined') return
  if (!('vibrate' in navigator)) return
  // Respect des préférences système d'accessibilité.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  try {
    navigator.vibrate(HAPTIC_PATTERNS[intensity])
  } catch {
    // Silencieux : certains navigateurs/OS bloquent l'API.
  }
}
