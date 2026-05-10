import { useEffect, useState } from 'react'

/**
 * Retourne `true` après `ms` millisecondes. Sert de garde-fou UX :
 * quand une query reste en loading trop longtemps, on bascule l'écran
 * de chargement vers un message "ça prend plus de temps que prévu +
 * bouton Recharger" plutôt que de laisser un spinner infini.
 */
export function useLoadingTimeout(ms = 12_000): boolean {
  const [timedOut, setTimedOut] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), ms)
    return () => clearTimeout(t)
  }, [ms])
  return timedOut
}
