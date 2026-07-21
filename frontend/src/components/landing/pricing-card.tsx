import { useMemo } from 'react'
import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Check, Lock, Sparkles } from 'lucide-react'
import { Eyebrow } from './eyebrow'
import { Reveal } from './reveal'
import {
  fetchActivePricingPlans,
  formatXof,
} from '@/lib/pricing-queries'
import type { PublicPricingPlan } from '@/lib/database.types'
import { cn } from '@/lib/utils'

interface Inclusion {
  label: React.ReactNode
  isNew?: boolean
}

const INCLUSIONS: Inclusion[] = [
  { label: 'Catalogue de formations IA en français (illimité)' },
  { label: 'Communauté privée francophone' },
  { label: 'Coach IA personnel (30 messages/jour)' },
  { label: 'Récap des actus IA chaque dimanche' },
  { label: 'Bibliothèque de ressources téléchargeables' },
  { label: 'Coaching live mensuel avec experts IA', isNew: true },
  {
    label: (
      <>
        Prime de{' '}
        <span className="font-bold text-[var(--primary)]">
          50&nbsp;000&nbsp;FCFA
        </span>{' '}
        pour le membre du mois
      </>
    ),
    isNew: true,
  },
]

const PAYMENT_METHODS = [
  'Orange Money',
  'Wave',
  'MTN Money',
  'Moov Money',
]

const FALLBACK_PLANS: PublicPricingPlan[] = [
  {
    id: 'annual',
    display_name: 'Plan Premium',
    price_xof: 230,
    duration_months: 12,
    is_recommended: false,
    description: 'Le meilleur tarif. Maîtrise totale sur 12 mois.',
    monthly_price_xof: 19,
  },
  {
    id: 'semestrial',
    display_name: 'Plan Master',
    price_xof: 150,
    duration_months: 6,
    is_recommended: true,
    description: 'La maîtrise totale. Économise 50 € tous les 6 mois.',
    monthly_price_xof: 25,
  },
  {
    id: 'trimestrial',
    display_name: 'Plan Progress',
    price_xof: 100,
    duration_months: 3,
    is_recommended: false,
    description: 'Idéal pour lancer ta transformation IA sur 3 mois',
    monthly_price_xof: 33,
  },
]

export function PricingCard() {
  const { data, isLoading } = useQuery({
    queryKey: ['landing-pricing-plans'],
    queryFn: fetchActivePricingPlans,
    staleTime: 5 * 60_000,
  })

  const plans = useMemo(() => {
    const list = (data && data.length > 0 ? data : FALLBACK_PLANS).slice()
    list.sort((a, b) => {
      if (a.is_recommended !== b.is_recommended) return a.is_recommended ? -1 : 1
      return b.duration_months - a.duration_months
    })
    return list
  }, [data])

  const savings = useMemo(() => {
    const annualPlan = plans.find((p) => p.id === 'annual')
    const trimestrial = plans.find((p) => p.id === 'trimestrial')
    if (!annualPlan || !trimestrial) return null
    const triFor12 = (trimestrial.price_xof / trimestrial.duration_months) * 12
    const diff = Math.round(triFor12 - annualPlan.price_xof)
    return diff > 0 ? diff : null
  }, [plans])

  // Adaptive grid: center properly for 2 or 3 plans
  const gridCols = plans.length <= 2 ? 'lg:grid-cols-2' : 'lg:grid-cols-3'
  const gridMaxW = plans.length <= 2 ? 'max-w-4xl' : 'max-w-6xl'

  return (
    <section id="tarif" className="relative overflow-hidden bg-white py-16 sm:py-24 lg:py-28">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--primary)]/[0.03] blur-[120px]" />
      </div>

      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="text-center">
          <Reveal>
            <Eyebrow className="mb-6">Investis sur toi</Eyebrow>
            <h2 className="font-display text-4xl font-bold tracking-tight text-[var(--foreground)] sm:text-5xl lg:text-6xl">
              Prêt à dominer l'IA ?
            </h2>
            <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-[var(--muted-foreground)] sm:text-xl">
              Tout est inclus dans les trois plans. Le Plan Premium (12 mois) te
              fait économiser <span className="font-bold text-[var(--foreground)]">{savings ? formatXof(savings) : '170 €'}</span> vs 3 mois.
            </p>
          </Reveal>
        </div>

        <div className={cn('mt-14 grid gap-6 lg:items-stretch mx-auto', gridCols, gridMaxW)}>
          {plans.map((plan, idx) => (
            <PricingPlanCard
              key={plan.id}
              plan={plan}
              isLoading={isLoading}
              delay={0.05 + idx * 0.04}
            />
          ))}
        </div>

        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-widest">
            <Lock className="h-3.5 w-3.5" />
            Paiement 100% Sécurisé
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-8 opacity-40 grayscale transition-all hover:opacity-100 hover:grayscale-0">
             {PAYMENT_METHODS.map(m => (
               <span key={m} className="text-sm font-bold tracking-tight text-[var(--foreground)]">{m}</span>
             ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function PricingPlanCard({
  plan,
  isLoading,
  delay,
}: {
  plan: PublicPricingPlan
  isLoading: boolean
  delay: number
}) {
  const recommended = plan.is_recommended
  const ctaUrl = `/auth?plan=${encodeURIComponent(plan.id)}`

  return (
    <Reveal direction={recommended ? 'none' : 'up'} delay={delay}>
      <div
        className={cn(
          'group relative flex h-full flex-col overflow-hidden rounded-3xl border transition-all duration-500',
          recommended
            ? 'border-[var(--primary)] bg-white shadow-[0_24px_64px_-16px_rgba(30,64,175,0.15)] ring-1 ring-[var(--primary)]/10'
            : 'border-[var(--border)] bg-[var(--background)]/50 hover:bg-white hover:shadow-lg hover:border-[var(--border)]',
        )}
      >
        {/* Badge */}
        {recommended && (
          <div className="bg-[var(--primary)] px-8 py-2.5 text-center">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-white">
              <Sparkles className="h-3 w-3" />
              Recommandé
            </span>
          </div>
        )}

        <div className="flex flex-1 flex-col p-8 sm:p-10">
          {/* Plan name & description */}
          <div>
            <h3 className="font-display text-2xl font-bold tracking-tight text-[var(--foreground)]">
              {plan.display_name}
            </h3>
            <p className="mt-2 text-sm text-[var(--muted-foreground)] leading-relaxed">
              {plan.description}
            </p>
          </div>

          {/* Price */}
          <div className={cn('mt-8', isLoading && 'animate-pulse')}>
            <div className="flex items-baseline gap-1.5">
              <span className="font-display text-5xl font-bold tracking-tighter text-[var(--foreground)]">
                {plan.price_xof.toLocaleString('fr-FR')}
              </span>
              <span className="text-lg font-bold text-[var(--muted-foreground)]">€</span>
            </div>
            <p className="mt-1.5 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              {plan.duration_months === 12 ? 'Accès 1 an' : `Accès ${plan.duration_months} mois`}
              <span className="mx-2 opacity-30">|</span>
              {plan.monthly_price_xof.toLocaleString('fr-FR')} € / mois
            </p>
          </div>

          {/* Divider */}
          <div className="my-8 h-px bg-[var(--border)]" />

          {/* Inclusions */}
          <ul className="space-y-3 flex-1">
            {INCLUSIONS.map((inc, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <div className={cn(
                  "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                  recommended ? "bg-[var(--primary)]/10 text-[var(--primary)]" : "bg-[var(--border)] text-[var(--muted-foreground)]"
                )}>
                  <Check className="h-3 w-3" />
                </div>
                <span className="text-sm font-medium text-[var(--foreground)]/80 leading-snug">
                  {inc.label}
                </span>
              </li>
            ))}
          </ul>

          {/* CTA */}
          <div className="mt-8">
            <Link
              to={ctaUrl}
              className={cn(
                'group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl py-4 text-sm font-bold transition-all',
                recommended
                  ? 'bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/20 hover:shadow-xl hover:shadow-[var(--primary)]/30'
                  : 'bg-[var(--foreground)] text-white hover:bg-[#1a1a1a]',
              )}
            >
              <span className="relative z-10 flex items-center gap-2">
                Rejoindre Le Club
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
              {recommended && (
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
              )}
            </Link>
            <p className="mt-3 text-center text-[10px] font-semibold text-[var(--muted-foreground)] uppercase tracking-widest">
              Pas de renouvellement automatique
            </p>
          </div>
        </div>
      </div>
    </Reveal>
  )
}
