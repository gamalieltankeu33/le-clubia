import { QueryClient } from '@tanstack/react-query'

/**
 * QueryClient singleton partagé par toute l'app.
 *
 * Extrait dans son propre module (et plus dans main.tsx) pour pouvoir
 * être importé depuis n'importe où côté logique métier — typiquement
 * dans `auth-store.signOut()` qui doit annuler les requêtes en cours
 * et vider tous les caches au logout, pour empêcher toute fuite de
 * données entre comptes sur le même navigateur.
 *
 * Defaults bornés pour éviter les "loaders bloqués" : avec les defaults
 * React Query (retry: 3 + backoff exponentiel), une query qui patine
 * peut afficher un loader jusqu'à ~31 s avant de remonter l'erreur. On
 * coupe à 1 retry + 1.5 s de délai (~3 s max), avec un staleTime de 30 s
 * pour ne pas re-fetcher à chaque retour sur l'onglet.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      retryDelay: 1500,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
    },
  },
})
