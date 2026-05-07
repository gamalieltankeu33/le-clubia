import type { Profile, Subscription } from './database.types'

export type AuthRedirectTarget = '/onboarding' | '/app/dashboard' | '/checkout'

/**
 * Cible de redirection après signup/login ou navigation vers une route protégée.
 *
 * @param requireMember Active la vérification d'abonnement (renvoie vers /checkout
 *   si pas membre actif). À mettre à `true` une fois Stripe branché.
 *   Pour l'instant on laisse `false` afin de ne pas bloquer l'accès à l'app.
 */
export function nextRouteAfterAuth(
  profile: Profile | null,
  subscription: Subscription | null,
  requireMember = false,
): AuthRedirectTarget {
  if (!profile?.onboarding_completed) return '/onboarding'

  if (requireMember) {
    const isActive =
      subscription?.status === 'active' || subscription?.status === 'trialing'
    if (!isActive) return '/checkout'
  }

  return '/app/dashboard'
}
