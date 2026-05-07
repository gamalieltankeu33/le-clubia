import { createFileRoute, redirect } from '@tanstack/react-router'

// Conservé pour compat backwards : redirige vers /auth (page unifiée).
export const Route = createFileRoute('/login')({
  beforeLoad: () => {
    throw redirect({ to: '/auth' })
  },
})
