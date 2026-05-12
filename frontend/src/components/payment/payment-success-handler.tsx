import { useEffect, useRef } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'
import { supabase } from '@/lib/supabase'
import confetti from 'canvas-confetti'

export function PaymentSuccessHandler() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const refreshAuth = useAuthStore((s) => s.refreshAuth)
  const handled = useRef(false)

  useEffect(() => {
    if (handled.current || !user) return

    const params = new URLSearchParams(window.location.search)
    const isSuccess = params.get('payment') === 'success'

    if (isSuccess) {
      handled.current = true
      
      const verifyPayment = async () => {
        const id = toast.loading('Vérification de ton paiement...')
        
        try {
          const { data, error } = await supabase.functions.invoke('maketou-verify', {
            body: { userId: user.id }
          })

          if (error) throw error

          if (data.status === 'activated') {
            toast.success('Félicitations ! Ton accès au Club IA est maintenant activé.', { id })
            
            // Explosion de confettis !
            confetti({
              particleCount: 150,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#1E40AF', '#1DC8FF', '#FFCC00']
            })

            // Rafraîchir l'état de l'auth pour mettre à jour le rôle et la souscription
            await refreshAuth()
          } else {
            toast.info('Paiement en cours de traitement. Ton accès sera activé d\'ici quelques instants.', { id })
          }
        } catch (err) {
          console.error(err)
          toast.error('Erreur lors de la vérification. Contacte le support si le problème persiste.', { id })
        } finally {
          // Nettoyer l'URL
          const newUrl = window.location.pathname
          window.history.replaceState({}, '', newUrl)
        }
      }

      verifyPayment()
    }
  }, [user, refreshAuth])

  return null
}
