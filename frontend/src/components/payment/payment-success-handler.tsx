import { useEffect, useRef } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'
import { supabase } from '@/lib/supabase'
import confetti from 'canvas-confetti'

export function PaymentSuccessHandler() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const refreshUserData = useAuthStore((s) => s.refreshUserData)
  const handled = useRef(false)

  useEffect(() => {
    if (handled.current || !user) return

    const params = new URLSearchParams(window.location.search)
    const isSuccess = params.get('payment') === 'success'

    if (!isSuccess) return
    handled.current = true

    const cartId = params.get('cart') || params.get('cartId') || params.get('sale_id') || params.get('transaction_id') || null

    const verifyPayment = async () => {
      const id = toast.loading('Vérification de ton paiement...')

      try {
        const { data, error } = await supabase.functions.invoke('chariow-verify', {
          body: { userId: user.id, cartId },
        })

        if (error) throw error

        if (data?.status === 'activated') {
          toast.success('Félicitations ! Ton accès à Leclub.ia est maintenant activé.', { id })

          confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#1E40AF', '#1DC8FF', '#FFCC00'],
          })

          await refreshUserData()

          // Onboarding pas encore fait → on l'envoie tout de suite remplir
          // son profil avant d'accéder au dashboard. Sinon il est redirigé
          // directement dans la communauté.
          const profile = useAuthStore.getState().profile
          if (profile && !profile.onboarding_completed) {
            navigate({ to: '/onboarding' })
          } else {
            navigate({ to: '/app/communaute' })
          }
        } else if (data?.status === 'pending') {
          toast.info(
            "Paiement en cours de traitement. Ton accès sera activé d'ici quelques instants.",
            { id },
          )
        } else if (data?.status === 'failed') {
          toast.error(
            "Le paiement n'a pas abouti. Tu peux réessayer depuis la page de checkout.",
            { id },
          )
        } else {
          toast.info('Statut du paiement inconnu. Contacte le support si nécessaire.', { id })
        }
      } catch (err) {
        console.error(err)
        toast.error(
          'Erreur lors de la vérification. Contacte le support si le problème persiste.',
          { id },
        )
      } finally {
        // Nettoyer l'URL (retire payment, cart, cartId, sale_id, transaction_id)
        const cleanUrl = new URL(window.location.href)
        cleanUrl.searchParams.delete('payment')
        cleanUrl.searchParams.delete('cart')
        cleanUrl.searchParams.delete('cartId')
        cleanUrl.searchParams.delete('sale_id')
        cleanUrl.searchParams.delete('transaction_id')
        window.history.replaceState({}, '', cleanUrl.pathname + cleanUrl.search)
      }
    }

    verifyPayment()
  }, [user, refreshUserData, navigate])

  return null
}
