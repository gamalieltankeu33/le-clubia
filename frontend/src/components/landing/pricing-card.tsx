import { useMemo } from 'react'
import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
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
  /** True = mis en avant avec badge "NOUVEAU". */
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
        pour le membre le plus actif chaque mois
      </>
    ),
    isNew: true,
  },
  { label: "Accès aux experts invités du Club" },
]

const PAYMENT_METHODS = [
  'Orange Money',
  'Wave',
  'MTN Money',
  'Moov Money',
]

/** Fallback affiché si la RPC est lente ou en erreur — évite un écran
 *  vide à l'arrivée sur la landing. Les valeurs correspondent exactement
 *  au seed de la migration 0023. */
const FALLBACK_PLANS: PublicPricingPlan[] = [
  {
    id: 'annual',
    display_name: 'Annuel',
    price_xof: 99_000,
    duration_months: 12,
    is_recommended: true,
    description: 'Économise 39 000 FCFA par an. Le plus populaire.',
    monthly_price_xof: 8_250,
  },
  {
    id: 'semestrial',
    display_name: '6 mois',
    price_xof: 69_000,
    duration_months: 6,
    is_recommended: false,
    description: 'Idéal pour découvrir Le Club IA en douceur',
    monthly_price_xof: 11_500,
  },
]

export function PricingCard() {
  const { data, isLoading } = useQuery({
    queryKey: ['landing-pricing-plans'],
    queryFn: fetchActivePricingPlans,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
  })

  // Tri annuel en premier dans le rendu (recommandé), semestriel en second.
  // La RPC retourne déjà ce tri via ORDER BY duration_months DESC, on
  // re-trie côté client par sécurité au cas où la liste arrive dans un
  // autre ordre (ex : mock, fallback, edition manuelle plus tard).
  const plans = useMemo(() => {
    const list = (data && data.length > 0 ? data : FALLBACK_PLANS).slice()
    list.sort((a, b) => {
      // Recommandé d'abord, puis durée décroissante.
      if (a.is_recommended !== b.is_recommended) {
        return a.is_recommended ? -1 : 1
      }
      return b.duration_months - a.duration_months
    })
    return list
  }, [data])

  // Calcule l'économie par rapport à la formule la moins recommandée
  // (semestriel) ramenée à 12 mois. Affichée sur la carte recommandée.
  const savings = useMemo(() => {
    const recommended = plans.find((p) => p.is_recommended)
    const other = plans.find((p) => !p.is_recommended)
    if (!recommended || !other) return null
    // Coût équivalent 12 mois si on prenait l'autre plan
    const otherFor12Months =
      (other.price_xof / other.duration_months) * 12
    const recommendedFor12Months =
      (recommended.price_xof / recommended.duration_months) * 12
    const diff = Math.round(otherFor12Months - recommendedFor12Months)
    return diff > 0 ? diff : null
  }, [plans])

  return (
    <section
      id="tarif"
      className="relative overflow-hidden bg-white py-16 sm:py-24 lg:py-32"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute left-1/2 top-1/3 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-[var(--primary)]/[0.05] blur-3xl" />
      </div>

      <div className="mx-auto max-w-5xl px-6">
        <div className="text-center">
          <Reveal>
            <Eyebrow>Choisis ta formule</Eyebrow>
            <h2 className="mt-6 font-display text-4xl font-bold leading-[1.1] tracking-tight text-[var(--foreground)] sm:text-5xl lg:text-6xl">
              Deux façons de rejoindre Le Club.
            </h2>
            <p className="mt-5 text-lg text-[var(--muted-foreground)]">
              Tout est inclus dans les deux plans. La formule annuelle te
              fait économiser {savings ? formatXof(savings) : '39 000 FCFA'}.
            </p>
          </Reveal>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-2 lg:items-stretch">
          {plans.slice(0, 2).map((plan, idx) => (
            <PricingPlanCard
              key={plan.id}
              plan={plan}
              isLoading={isLoading}
              delay={0.05 + idx * 0.07}
            />
          ))}
        </div>

        <div className="mt-10 text-center">
          <p className="inline-flex items-center justify-center gap-1.5 text-xs text-[var(--muted-foreground)]">
            <Lock className="h-3 w-3" />
            Paiement sécurisé par mobile money
          </p>
          <ul className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-[11px] text-[var(--muted-foreground)]">
            {PAYMENT_METHODS.map((m, i) => (
              <li key={m} className="inline-flex items-center gap-3">
                <span>{m}</span>
                {i < PAYMENT_METHODS.length - 1 && (
                  <span className="text-[var(--border)]">·</span>
                )}
              </li>
            ))}
          </ul>
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
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className="relative h-full"
    >
      {/* Halo décoratif sous la carte recommandée */}
      {recommended && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-3 -z-10 rounded-[2.25rem] bg-gradient-to-br from-[var(--primary)]/15 via-transparent to-[var(--accent)]/15 blur-xl"
        />
      )}

      <div
        className={cn(
          'relative flex h-full flex-col overflow-hidden rounded-3xl border bg-white transition-all',
          recommended
            ? 'border-[var(--primary)] shadow-2xl shadow-[var(--primary)]/15 lg:scale-[1.02]'
            : 'border-[var(--border)] shadow-md hover:-translate-y-1 hover:shadow-lg',
        )}
      >
        {/* Badge "Le plus populaire" */}
        {recommended && (
          <div className="absolute right-6 top-6 inline-flex items-center gap-1.5 rounded-full bg-[var(--primary)] px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--primary-foreground)] shadow-md">
            <Sparkles className="h-3 w-3" />
            Le plus populaire
          </div>
        )}

        <div className="flex flex-1 flex-col px-6 py-8 sm:px-8 sm:py-10">
          {/* Header */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
              {recommended ? 'Notre recommandation' : 'Pour découvrir'}
            </p>
            <h3 className="mt-2 font-display text-2xl font-bold tracking-tight text-[var(--foreground)] sm:text-3xl">
              {plan.display_name}
            </h3>
            {plan.description && (
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                {plan.description}
              </p>
            )}
          </div>

          {/* Prix */}
          <div className={cn('mt-6', isLoading && 'animate-pulse')}>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-5xl font-bold leading-none tracking-tight text-[var(--foreground)] sm:text-6xl">
                {plan.price_xof.toLocaleString('fr-FR').replace(/ | /g, ' ')}
              </span>
              <span className="text-base font-semibold text-[var(--foreground)]">
                FCFA
              </span>
            </div>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              / {plan.duration_months === 12 ? '12 mois' : `${plan.duration_months} mois`}
              <span className="ml-2">
                · soit {plan.monthly_price_xof.toLocaleString('fr-FR').replace(/ | /g, ' ')} FCFA/mois
              </span>
            </p>
          </div>

          {/* Banner économie sur la card recommandée */}
          {recommended && (
            <div className="mt-5 inline-flex items-center gap-2 self-start rounded-full bg-[var(--accent)]/15 px-3 py-1.5 text-xs font-medium text-[var(--accent)]">
              💰 Économise 39 000 FCFA vs semestriel
            </div>
          )}

          {/* Inclusions */}
          <ul className="mt-7 space-y-2.5 text-sm">
            {INCLUSIONS.map((inc, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2.5 text-[var(--foreground)]"
              >
                <span
                  className={cn(
                    'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full',
                    inc.isNew
                      ? 'bg-[var(--primary)]/15 text-[var(--primary)]'
                      : 'bg-[var(--accent)]/15 text-[var(--accent)]',
                  )}
                >
                  <Check className="h-3 w-3" />
                </span>
                <span className="flex-1 leading-snug">
                  {inc.label}
                  {inc.isNew && (
                    <span className="ml-2 inline-flex items-center rounded-full bg-[var(--primary)] px-1.5 py-0.5 align-middle text-[10px] font-semibold uppercase tracking-wider text-[var(--primary-foreground)]">
                      Nouveau
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>

          {/* CTA */}
          <div className="mt-8 pt-6">
            <Link
              to={ctaUrl}
              className={cn(
                'inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold transition-all sm:text-base',
                recommended
                  ? 'bg-[var(--primary)] text-[var(--primary-foreground)] shadow-lg shadow-[var(--primary)]/25 hover:bg-[#1c3a9e] hover:shadow-xl'
                  : 'border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:border-[var(--primary)]/40 hover:bg-[var(--secondary)]',
              )}
            >
              S'abonner
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
