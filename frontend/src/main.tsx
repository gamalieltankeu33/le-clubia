// ⚠️ EN PREMIER : capture le flag de récupération de mot de passe avant
// que supabase-js ne nettoie le hash de l'URL (cf. recovery-flag.ts).
import './lib/recovery-flag'

// Initialisation Sentry — au plus tôt pour capturer toute erreur, même
// celle qui surviendrait pendant le bootstrap. No-op si VITE_SENTRY_DSN
// n'est pas configurée ou si on est en dev.
import { initSentry } from './lib/sentry'
initSentry()

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'

import './index.css'
import { routeTree } from './routeTree.gen'
import { queryClient } from '@/lib/query-client'

// Auto-recovery des chunks périmés après un déploiement.
// Quand on redéploie (Vercel), les noms de fichiers JS changent (hash).
// Un utilisateur qui avait l'app ouverte et navigue vers une route
// lazy-loadée demande un ancien chunk qui n'existe plus → le serveur
// renvoie index.html → "text/html is not a valid JavaScript MIME type".
// Vite émet `vite:preloadError` dans ce cas : on recharge la page (qui
// récupère le index.html frais + les bons chunks). Garde-fou anti-boucle :
// au plus un reload toutes les 10 s.
if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', () => {
    const KEY = '__chunk_reload_at'
    const last = Number(sessionStorage.getItem(KEY) || '0')
    if (Date.now() - last > 10_000) {
      sessionStorage.setItem(KEY, String(Date.now()))
      window.location.reload()
    }
  })
}

const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)
