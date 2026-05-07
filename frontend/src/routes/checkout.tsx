import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BrandLogo } from '@/components/brand-logo'

export const Route = createFileRoute('/checkout')({
  component: CheckoutPage,
})

// Placeholder. L'intégration mobile money sera branchée plus tard.
const PAYMENT_METHODS = [
  { name: 'Orange Money', tone: 'bg-[#FF7900]/10 text-[#FF7900]' },
  { name: 'Wave', tone: 'bg-[#1DC8FF]/10 text-[#0E91C6]' },
  { name: 'MTN Money', tone: 'bg-[#FFCC00]/15 text-[#A88A00]' },
  { name: 'Moov Money', tone: 'bg-[#005FAA]/10 text-[#005FAA]' },
]

function CheckoutPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-6 py-12">
      <div className="w-full max-w-lg text-center">
        <div className="flex justify-center">
          <BrandLogo size="md" variant="primary" />
        </div>
        <h1 className="mt-8 font-display text-3xl font-bold tracking-tight md:text-4xl">
          Paiement par mobile money
          <br />
          <span className="text-[var(--muted-foreground)]">à venir bientôt</span>
        </h1>
        <p className="mt-4 text-[var(--muted-foreground)]">
          La page de paiement pour l'abonnement annuel à
          <strong className="text-[var(--foreground)]"> 79&nbsp;000&nbsp;FCFA/an </strong>
          sera activée très prochainement. Tu pourras payer en quelques
          secondes via le moyen mobile de ton choix.
        </p>

        {/* Liste des 4 moyens de paiement */}
        <ul className="mx-auto mt-8 grid max-w-sm grid-cols-2 gap-3">
          {PAYMENT_METHODS.map((m) => (
            <li
              key={m.name}
              className={`flex items-center justify-center rounded-xl border border-[var(--border)] px-4 py-3 text-sm font-medium ${m.tone}`}
            >
              {m.name}
            </li>
          ))}
        </ul>

        <p className="mt-6 inline-flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
          <Lock className="h-3 w-3" />
          Paiement sécurisé · Sans réabonnement automatique
        </p>

        <Button variant="outline" className="mt-10" asChild>
          <Link to="/app/dashboard">
            <ArrowLeft className="h-4 w-4" />
            Retour au dashboard
          </Link>
        </Button>
      </div>
    </div>
  )
}
