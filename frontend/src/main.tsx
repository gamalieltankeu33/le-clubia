import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'

import './index.css'
import { routeTree } from './routeTree.gen'
import { queryClient } from '@/lib/query-client'

// Console mobile activable via ?debug=1 dans l'URL.
// Permet d'inspecter le téléphone sans câble USB.
if (typeof window !== 'undefined' && /[?&]debug=1\b/.test(window.location.search)) {
  import('eruda').then(({ default: eruda }) => eruda.init())
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
