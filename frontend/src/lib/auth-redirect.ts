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
): string {
  if (!profile?.onboarding_completed) return '/onboarding'

  // Si l'utilisateur a un plan en attente (choisi sur la landing)
  // et qu'il n'est pas encore actif, on l'envoie vers le checkout.
  const isActive =
    subscription?.status === 'active' || subscription?.status === 'trialing'

  if (profile?.desired_plan_id && !isActive) {
    return `/checkout?plan=${profile.desired_plan_id}`
  }

  if (requireMember && !isActive) {
    return '/checkout'
  }

  return '/app/dashboard'
}
