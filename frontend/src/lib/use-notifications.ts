import { useEffect } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { useNotificationsStore } from '@/stores/notifications-store'

/**
 * Hook d'init globale du système de notifications. À monter une seule fois,
 * dans un composant haut placé (ex: AppShell). Au login :
 *  - charge les 50 dernières notifs
 *  - branche l'abonnement Realtime (INSERT filtré par user_id)
 * Au logout : reset le store + débranche Realtime.
 */
export function useNotifications() {
  const userId = useAuthStore((s) => s.user?.id ?? null)
  const fetchNotifications = useNotificationsStore((s) => s.fetchNotifications)
  const subscribeToRealtime = useNotificationsStore(
    (s) => s.subscribeToRealtime,
  )
  const reset = useNotificationsStore((s) => s.reset)

  useEffect(() => {
    if (!userId) {
      reset()
      return
    }
    void fetchNotifications()
    subscribeToRealtime(userId)
    return () => {
      // Pas de unsub ici : si le composant remonte au même user, on garde
      // le channel actif. Le reset() au logout passe par useEffect rerun.
    }
  }, [userId, fetchNotifications, subscribeToRealtime, reset])
}
