import { useEffect } from 'react'
import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { Toaster } from 'sonner'
import { ArrowLeft, Compass, Sparkles } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { PaymentSuccessHandler } from '@/components/payment/payment-success-handler'
import { BrandLogo } from '@/components/brand-logo'

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFoundPage,
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

function NotFoundPage() {
  return (
    <div className="relative flex min-h-screen flex-col bg-[var(--background)] text-[var(--foreground)]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute -top-40 left-1/2 h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-gradient-to-b from-[var(--primary)]/[0.07] to-transparent blur-[120px]" />
      </div>

      <header className="border-b border-[var(--border)]/60">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-5 sm:px-8">
          <BrandLogo size="md" variant="primary" />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-5 py-16 text-center sm:px-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--primary)]/20 bg-[var(--primary)]/[0.05] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--primary)]">
          <Compass className="h-3 w-3" />
          Erreur 404
        </div>

        <h1 className="mt-8 font-display text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
          Cette page <span className="serif-accent italic">n'existe pas.</span>
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-[var(--muted-foreground)] sm:text-xl">
          Le lien est peut-être cassé ou la page a été déplacée. Pas de stress
          — on te ramène à un endroit utile.
        </p>

        <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            to="/"
            className="cta-black inline-flex items-center gap-2 px-8 py-4 text-base"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à l'accueil
          </Link>
          <Link
            to="/auth"
            className="text-sm font-semibold text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
          >
            Se connecter ou créer un compte →
          </Link>
        </div>
      </main>
    </div>
  )
}
