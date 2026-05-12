import type { Profile, Subscription } from './database.types'

/**
 * Calcule la destination après une authentification réussie.
 *
 * Retourne `null` si l'utilisateur **ne doit pas pouvoir entrer** sur la
 * plateforme (cas d'un membre sans abonnement actif qui n'a pas non plus
 * de plan en attente — typiquement un ancien compte non renouvelé qui
 * tente de se reconnecter via /auth). Le caller est responsable d'agir
 * sur ce `null` (signOut + toast + redirect vers la landing).
 *
 * Règles :
 *   1. Onboarding pas fini   → /onboarding
 *   2. Membre actif OU admin → /app/dashboard
 *   3. Plan en attente       → /checkout?plan=<desired_plan_id>
 *   4. Aucun des cas ci-dessus → null (bloquer l'accès)
 */
export function nextRouteAfterAuth(
  profile: Profile | null,
  subscription: Subscription | null,
): string | null {
  if (!profile?.onboarding_completed) return '/onboarding'

  const isAdmin = profile.role === 'admin'
  const isActive =
    (subscription?.status === 'active' || subscription?.status === 'trialing') &&
    (!subscription?.current_period_end ||
      new Date(subscription.current_period_end) > new Date())

  if (isActive || isAdmin) return '/app/dashboard'

  if (profile.desired_plan_id) {
    return `/checkout?plan=${profile.desired_plan_id}`
  }

  return null
}
