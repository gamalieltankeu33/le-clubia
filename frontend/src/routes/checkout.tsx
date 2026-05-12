import { useEffect, useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Loader2, Lock, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BrandLogo } from '@/components/brand-logo'
import { useAuthStore } from '@/stores/auth-store'
import { createMakEtoUCheckout } from '@/lib/maketou'
import { toast } from 'sonner'

export const Route = createFileRoute('/checkout')({
  component: CheckoutPage,
})

function CheckoutPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const profile = useAuthStore((s) => s.profile)
  const [loading, setLoading] = useState(false)

  // Récupère le plan depuis l'URL (?plan=annual|semestrial)
  const planId = new URLSearchParams(window.location.search).get('plan') as 'annual' | 'semestrial' | null

  async function handlePayment() {
    if (!user || !planId) {
      toast.error("Données de paiement manquantes.")
      return
    }

    setLoading(true)
    try {
      // On passe une redirectURL "template" — l'edge function y injecte
      // `&cart=<cartId>` à la volée pour qu'au retour le handler puisse
      // vérifier le bon panier côté Maketou.
      const { url } = await createMakEtoUCheckout({
        planId,
        email: user.email!,
        firstName: profile?.first_name || '',
        lastName: profile?.last_name || '',
        redirectURL: `${window.location.origin}/app/dashboard?payment=success`,
        meta: { userId: user.id, planId }
      })

      // Redirection vers MakEtoU
      window.location.href = url
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Impossible d'initier le paiement.")
      setLoading(false)
    }
  }

  // Si pas de plan ou pas d'utilisateur, on redirige vers l'accueil ou auth
  useEffect(() => {
    if (!planId) {
      navigate({ to: '/' })
    }
  }, [planId, navigate])

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-6 py-12">
      <div className="w-full max-w-lg">
        <div className="flex justify-center">
          <BrandLogo size="md" variant="primary" />
        </div>

        <div className="mt-10 rounded-3xl border border-[var(--border)] bg-white p-8 shadow-xl shadow-black/5 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)]">
            <ShieldCheck className="h-7 w-7" />
          </div>

          <h1 className="mt-6 font-display text-3xl font-bold tracking-tight">
            Finalise ton inscription
          </h1>
          <p className="mt-3 text-[var(--muted-foreground)]">
            Tu as choisi le <strong className="text-[var(--foreground)] uppercase">{planId === 'annual' ? 'Plan Master (Annuel)' : 'Plan Progress (6 mois)'}</strong>.
            Prêt à propulser ton potentiel avec l'IA ?
          </p>

          <div className="mt-10 space-y-4">
            <Button
              onClick={handlePayment}
              disabled={loading}
              className="h-16 w-full rounded-2xl bg-[var(--primary)] text-lg font-bold text-white hover:scale-[1.02] transition-transform shadow-lg shadow-[var(--primary)]/20"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Initialisation...
                </>
              ) : (
                'Procéder au paiement'
              )}
            </Button>

            <p className="flex items-center justify-center gap-1.5 text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-widest">
              <Lock className="h-3.5 w-3.5" />
              Paiement 100% sécurisé via MakEtoU
            </p>
          </div>

          <div className="mt-10 border-t border-[var(--border)] pt-8">
            <div className="flex items-center justify-center gap-6 opacity-50 grayscale transition-all hover:opacity-100 hover:grayscale-0">
              <span className="text-xs font-black tracking-tighter">ORANGE MONEY</span>
              <span className="text-xs font-black tracking-tighter">MTN</span>
              <span className="text-xs font-black tracking-tighter">WAVE</span>
              <span className="text-xs font-black tracking-tighter">MOOV</span>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Button variant="ghost" className="text-[var(--muted-foreground)]" asChild>
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Changer de plan
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
