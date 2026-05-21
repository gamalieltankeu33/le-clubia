// ⚠️ EN PREMIER : capture le flag de récupération de mot de passe avant
// que supabase-js ne nettoie le hash de l'URL (cf. recovery-flag.ts).
import './lib/recovery-flag'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'

import './index.css'
import { routeTree } from './routeTree.gen'
import { queryClient } from '@/lib/query-client'

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
