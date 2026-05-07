import { QueryClient } from '@tanstack/react-query'

/**
 * QueryClient singleton partagé par toute l'app.
 *
 * Extrait dans son propre module (et plus dans main.tsx) pour pouvoir
 * être importé depuis n'importe où côté logique métier — typiquement
 * dans `auth-store.signOut()` qui doit annuler les requêtes en cours
 * et vider tous les caches au logout, pour empêcher toute fuite de
 * données entre comptes sur le même navigateur.
 */
export const queryClient = new QueryClient()
