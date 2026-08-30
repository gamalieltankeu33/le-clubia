import { useEffect, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { Clock, CheckCircle2, RefreshCw, LogOut, MessageCircle, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { BrandLogo } from '@/components/brand-logo'
import { useAuthStore } from '@/stores/auth-store'

export const Route = createFileRoute('/en-attente-validation')({
  component: PendingApprovalPage,
})

function PendingApprovalPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const profile = useAuthStore((s) => s.profile)
  const subscription = useAuthStore((s) => s.subscription)
  const isMember = useAuthStore((s) => s.isMember)
  const refreshUserData = useAuthStore((s) => s.refreshUserData)
  const signOut = useAuthStore((s) => s.signOut)

  const [checking, setChecking] = useState(false)

  const isAdmin = profile?.role === 'admin'
  const active = isMember() || isAdmin

  // Si le membre est déjà validé / actif, redirection immédiate vers l'application
  useEffect(() => {
    if (active) {
      navigate({ to: '/app/communaute' })
    }
  }, [active, navigate])

  // Verification périodique automatique toutes les 6 secondes
  useEffect(() => {
    if (active) return
    const interval = setInterval(async () => {
      try {
        await refreshUserData()
      } catch {
        // quiet catch
      }
    }, 6000)
    return () => clearInterval(interval)
  }, [active, refreshUserData])

  async function handleManualCheck() {
    setChecking(true)
    try {
      await refreshUserData()
      const updatedProfile = useAuthStore.getState().profile
      const updatedSub = useAuthStore.getState().subscription
      const nowActive =
        updatedProfile?.role === 'admin' ||
        updatedSub?.status === 'active' ||
        updatedSub?.status === 'trialing'

      if (nowActive) {
        toast.success('Abonnement validé ! Bienvenue dans le Club IA.')
        navigate({ to: '/app/communaute' })
      } else {
        toast.info('Abonnement toujours en cours de validation par l’équipe.')
      }
    } catch {
      toast.error('Erreur lors de la vérification.')
    } finally {
      setChecking(false)
    }
  }

  const firstName = profile?.first_name || 'Cher membre'

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--background)] px-4 py-12 relative overflow-hidden">
      {/* Halo décoratif en arrière-plan */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[var(--primary)]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-8 relative z-10 text-center">
        {/* Logo Brand */}
        <div className="flex justify-center">
          <BrandLogo size="lg" />
        </div>

        {/* Carte principale */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 sm:p-8 shadow-xl shadow-black/5"
        >
          {/* Icône d'attente animée */}
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Clock className="h-8 w-8 animate-pulse" />
          </div>

          <h1 className="mt-5 font-display text-xl sm:text-2xl font-bold tracking-tight text-[var(--foreground)]">
            Abonnement en cours de validation
          </h1>

          <p className="mt-3 text-sm text-[var(--muted-foreground)] leading-relaxed">
            Merci <span className="font-semibold text-[var(--foreground)]">{firstName}</span> ! Ton compte a bien été créé.
          </p>

          <div className="mt-4 rounded-2xl bg-[var(--secondary)]/60 p-4 text-xs text-[var(--muted-foreground)] leading-relaxed text-left space-y-2 border border-[var(--border)]/40">
            <div className="flex items-start gap-2 text.text-[var(--foreground)]">
              <ShieldCheck className="h-4 w-4 shrink-0 text-[var(--primary)] mt-0.5" />
              <span>
                Ton accès est actuellement en attente d'approbation manuelle par l'administrateur du Club IA.
              </span>
            </div>
            <p className="pl-6 text-[11px]">
              Dès que ton abonnement sera validé, cette page se débloquera automatiquement.
            </p>
          </div>

          {/* Actions principales */}
          <div className="mt-6 space-y-3">
            <Button
              type="button"
              onClick={handleManualCheck}
              disabled={checking}
              className="w-full h-11 bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90 font-medium rounded-xl text-sm gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${checking ? 'animate-spin' : ''}`} />
              {checking ? 'Vérification en cours…' : 'Vérifier la validation'}
            </Button>

            <a
              href="https://wa.me/33600000000?text=Bonjour,%20je%20viens%20de%20cr%C3%A9er%20mon%20compte%20sur%20Le%20Club%20IA%20et%20je%20souhaite%20valider%20mon%20abonnement."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full h-11 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 text-xs sm:text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--secondary)]"
            >
              <MessageCircle className="h-4 w-4 text-emerald-500" />
              Contacter le support WhatsApp
            </a>
          </div>

          {/* Déconnexion */}
          <div className="mt-6 border-t border-[var(--border)]/50 pt-4 flex justify-between items-center text-xs text-[var(--muted-foreground)]">
            <span className="truncate max-w-[200px]">{user?.email}</span>
            <button
              type="button"
              onClick={() => void signOut().then(() => navigate({ to: '/auth' }))}
              className="inline-flex items-center gap-1 hover:text-red-500 transition-colors font-medium"
            >
              <LogOut className="h-3.5 w-3.5" />
              Se déconnecter
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
