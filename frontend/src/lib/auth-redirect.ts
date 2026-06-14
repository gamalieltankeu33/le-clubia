import type { Profile, Subscription } from './database.types'

/**
 * Aiguillage post-authentification.
 *
 * Principe (SaaS gated) :
 *   - Le paiement est OBLIGATOIRE avant l'accès à la plateforme.
 *   - L'onboarding (prénom / intérêts) se fait APRÈS le paiement, pour
 *     que la friction "tu dois t'abonner" arrive en premier, juste après
 *     le signup. Pas de fausse sensation d'être "presque dedans".
 *
 * Règles :
 *   1. Non-membre (et non-admin)
 *      a. plan en attente (desired_plan_id) → /checkout?plan=<id>
 *      b. pas de plan choisi                → /abonnement (page packs)
 *   2. Membre actif (ou admin)
 *      a. onboarding pas fini → /onboarding
 *      b. onboarding fini     → /app/dashboard
 *
 * Retourne `null` uniquement si le profile n'est pas encore chargé
 * (cas anormal — le caller renvoie l'utilisateur sur la landing).
 */
export function nextRouteAfterAuth(
  profile: Profile | null,
  subscription: Subscription | null,
): string | null {
  if (!profile) return null

  const isAdmin = profile.role === 'admin'
  const isActive =
    (subscription?.status === 'active' || subscription?.status === 'trialing') &&
    (!subscription?.current_period_end ||
      new Date(subscription.current_period_end) > new Date())

  // ── 1. Non-membre : on PRIORISE le paiement ────────────────────────
  if (!isActive && !isAdmin) {
    if (profile.desired_plan_id) {
      return `/checkout?plan=${profile.desired_plan_id}`
    }
    return '/abonnement'
  }

  // ── 2. Membre (ou admin) : onboarding puis dashboard ───────────────
  if (!profile.onboarding_completed) return '/onboarding'
  return '/app/dashboard'
}
