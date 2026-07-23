import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'

interface RequireAuthOptions {
  /** Si true, redirige vers /onboarding si l'utilisateur ne l'a pas complété. */
  requireOnboarded?: boolean
  /** Si true, redirige vers /checkout si l'utilisateur n'est pas membre actif (Stripe). */
  requireMember?: boolean
  /** Si true, redirige vers /app/dashboard si l'utilisateur n'est pas admin. */
  requireAdmin?: boolean
}

/**
 * Hook de garde de route. À appeler en haut d'un composant de page.
 * - Pas authentifié → /auth
 * - requireOnboarded + onboarding pas fini → /onboarding
 * - requireMember + abo pas actif → /checkout
 * - requireAdmin + pas admin → /app/dashboard
 *
 * Retourne `true` quand l'utilisateur a passé toutes les conditions (sinon
 * une redirection est en cours, le composant peut afficher null).
 */
export function useRequireAuth(opts: RequireAuthOptions = {}): boolean {
  const navigate = useNavigate()
  const isInitialized = useAuthStore((s) => s.isInitialized)
  const user = useAuthStore((s) => s.user)
  const profile = useAuthStore((s) => s.profile)
  const subscription = useAuthStore((s) => s.subscription)

  useEffect(() => {
    if (!isInitialized) return

    if (!user) {
      navigate({ to: '/auth' })
      return
    }
    if (opts.requireOnboarded && !profile?.onboarding_completed) {
      navigate({ to: '/onboarding' })
      return
    }
    if (opts.requireMember) {
      const isAdmin = profile?.role === 'admin'
      const active =
        subscription?.status === 'active' || subscription?.status === 'trialing'
      // Au retour de paiement (?payment=success) la subscription locale
      // n'a pas encore été refresh : on laisse passer pour que le
      // PaymentSuccessHandler puisse vérifier la transaction Chariow. Si la
      // vérif échoue, le user repassera sur cette guard au prochain
      // render et sera redirigé proprement.
      const isPaymentReturn =
        typeof window !== 'undefined' &&
        new URLSearchParams(window.location.search).get('payment') === 'success'
      if (!active && !isAdmin && !isPaymentReturn) {
        // Si on connaît son plan en attente, on l'amène directement
        // sur le checkout pré-rempli ; sinon retour landing.
        if (profile?.desired_plan_id) {
          navigate({ to: `/checkout?plan=${profile.desired_plan_id}` })
        } else {
          toast.error(
            "L'accès au Club est réservé aux membres ayant un abonnement actif.",
          )
          navigate({ to: '/', hash: 'tarif' })
        }
        return
      }
    }
    if (opts.requireAdmin && profile?.role !== 'admin') {
      // Toast d'erreur uniquement quand un user CONNECTÉ tente d'accéder
      // à une route admin sans en avoir le rôle. Pour le cas !user, on
      // a déjà redirect vers /auth ligne 35 (sans toast — c'est juste
      // une redirection de session, pas un refus d'accès).
      toast.error('Accès réservé aux administrateurs.')
      navigate({ to: '/app/dashboard' })
    }
  }, [
    isInitialized,
    user,
    profile,
    subscription,
    navigate,
    opts.requireOnboarded,
    opts.requireMember,
    opts.requireAdmin,
  ])

  if (!isInitialized || !user) return false
  if (opts.requireOnboarded && !profile?.onboarding_completed) return false
  if (opts.requireMember) {
    const isAdmin = profile?.role === 'admin'
    const active =
      subscription?.status === 'active' || subscription?.status === 'trialing'
    const isPaymentReturn =
      typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).get('payment') === 'success'
    if (!active && !isAdmin && !isPaymentReturn) return false
  }
  if (opts.requireAdmin && profile?.role !== 'admin') return false
  return true
}
