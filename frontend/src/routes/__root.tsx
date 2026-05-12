import { useEffect } from 'react'
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { Toaster } from 'sonner'
import { Sparkles } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { PaymentSuccessHandler } from '@/components/payment/payment-success-handler'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  const isInitialized = useAuthStore((s) => s.isInitialized)
  const initialize = useAuthStore((s) => s.initialize)

  useEffect(() => {
    initialize()
  }, [initialize])

  if (!isInitialized) {
    return <BootLoader />
  }

  return (
    <>
      <Outlet />
      {/* Monté à la racine pour survivre aux redirections de gardes
          (typiquement ?payment=success → /onboarding) et garantir que
          la vérification Maketou tourne quoi qu'il arrive. */}
      <PaymentSuccessHandler />
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: 'var(--card)',
            color: 'var(--foreground)',
            border: '1px solid var(--border)',
            borderRadius: '0.75rem',
          },
        }}
      />
    </>
  )
}

function BootLoader() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[var(--background)]">
      <span className="flex h-10 w-10 animate-pulse items-center justify-center rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)]">
        <Sparkles className="h-5 w-5" />
      </span>
      <span className="text-sm text-[var(--muted-foreground)]">
        Chargement…
      </span>
    </div>
  )
}
