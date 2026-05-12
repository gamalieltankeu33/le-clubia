import { useEffect, useMemo, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Check, Loader2, Lock, LogOut, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { BrandLogo } from '@/components/brand-logo'
import { useAuthStore } from '@/stores/auth-store'
import { supabase } from '@/lib/supabase'
import {
  fetchActivePricingPlans,
  formatXof,
} from '@/lib/pricing-queries'
import type { PublicPricingPlan } from '@/lib/database.types'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/abonnement')({
  component: AbonnementPage,
})

// Fallback si la RPC ne répond pas — garde l'UI utilisable même hors-ligne.
const FALLBACK_PLANS: PublicPricingPlan[] = [
  {
    id: 'annual',
    display_name: 'Plan Master',
    price_xof: 99_000,
    duration_months: 12,
    is_recommended: true,
    description: 'La maîtrise totale. Économise 39 000 FCFA par an.',
    monthly_price_xof: 8_250,
  },
  {
    id: 'semestrial',
    display_name: 'Plan Progress',
    price_xof: 69_000,
    duration_months: 6,
    is_recommended: false,
    description: 'Idéal pour lancer ta transformation IA sur 6 mois.',
    monthly_price_xof: 11_500,
  },
]

const INCLUSIONS = [
  'Catalogue de formations IA en français (illimité)',
  'Communauté privée francophone',
  'Coach IA personnel (30 messages / jour)',
  'Récap des actus IA chaque dimanche',
  'Bibliothèque de ressources téléchargeables',
  'Coaching live mensuel avec experts IA',
]

const PAYMENT_METHODS = ['Orange Money', 'Wave', 'MTN Money', 'Moov Money']

function AbonnementPage() {
  const navigate = useNavigate()
  const isInitialized = useAuthStore((s) => s.isInitialized)
  const user = useAuthStore((s) => s.user)
  const profile = useAuthStore((s) => s.profile)
  const subscription = useAuthStore((s) => s.subscription)
  const signOut = useAuthStore((s) => s.signOut)
  const refreshUserData = useAuthStore((s) => s.refreshUserData)
  const [selectingId, setSelectingId] = useState<string | null>(null)

  // Garde : seul un compte authentifié SANS abonnement actif a sa place ici.
  // Un membre actif ou admin → on l'envoie au dashboard directement.
  useEffect(() => {
    if (!isInitialized) return
    if (!user) {
      navigate({ to: '/auth' })
      return
    }
    const isActive =
      subscription?.status === 'active' || subscription?.status === 'trialing'
    const isAdmin = profile?.role === 'admin'
    if (isActive || isAdmin) {
      navigate({ to: '/app/dashboard' })
    }
  }, [isInitialized, user, subscription, profile, navigate])

  const { data, isLoading } = useQuery({
    queryKey: ['abonnement-pricing-plans'],
    queryFn: fetchActivePricingPlans,
    staleTime: 5 * 60_000,
  })

  const plans = useMemo(() => {
    const list = (data && data.length > 0 ? data : FALLBACK_PLANS).slice()
    list.sort((a, b) => {
      if (a.is_recommended !== b.is_recommended) return a.is_recommended ? -1 : 1
      return b.duration_months - a.duration_months
    })
    return list.slice(0, 2)
  }, [data])

  const savings = useMemo(() => {
    const recommended = plans.find((p) => p.is_recommended)
    const other = plans.find((p) => !p.is_recommended)
    if (!recommended || !other) return null
    const otherFor12Months = (other.price_xof / other.duration_months) * 12
    const recommendedFor12Months =
      (recommended.price_xof / recommended.duration_months) * 12
    const diff = Math.round(otherFor12Months - recommendedFor12Months)
    return diff > 0 ? diff : null
  }, [plans])

  const firstName = profile?.first_name?.trim() || ''

  async function handleSelect(planId: string) {
    if (!user || selectingId) return
    setSelectingId(planId)

    // Persiste le choix dans profiles.desired_plan_id pour que tout le
    // reste de la chaîne (auth-redirect, edge functions) sache quel plan
    // est en cours de checkout — même si l'utilisateur ferme l'onglet.
    const { error } = await supabase
      .from('profiles')
      .update({ desired_plan_id: planId })
      .eq('id', user.id)

    if (error) {
      console.error('[abonnement] update desired_plan_id', error)
      toast.error('Impossible de sauvegarder ton choix. Réessaie.')
      setSelectingId(null)
      return
    }

    await refreshUserData()
    navigate({ to: '/checkout', search: { plan: planId } as any })
  }

  async function handleSignOut() {
    await signOut()
    navigate({ to: '/' })
  }

  if (!isInitialized || !user) return null

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--background)]">
      {/* Halos cinématiques en fond */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute -top-48 left-1/2 h-[900px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-b from-[var(--primary)]/[0.06] to-transparent blur-[140px]" />
        <div className="absolute right-[10%] top-1/3 h-[500px] w-[500px] rounded-full bg-[var(--accent)]/[0.04] blur-[100px]" />
      </div>

      {/* Header minimal — logo + signout */}
      <header className="border-b border-[var(--border)]/60 bg-white/40 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
          <BrandLogo size="md" variant="primary" />
          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)] sm:text-sm"
          >
            <LogOut className="h-3.5 w-3.5" />
            Se déconnecter
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16 lg:py-24">
        {/* Step indicator + hero */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--primary)]/20 bg-[var(--primary)]/[0.05] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--primary)]">
            <Sparkles className="h-3 w-3" />
            Étape 2 / 2 — Active ton accès
          </div>

          <h1 className="mt-8 font-display text-4xl font-bold leading-[1.05] tracking-tight text-[var(--foreground)] sm:text-5xl lg:text-6xl">
            {firstName ? (
              <>
                Plus qu'une étape,{' '}
                <span className="serif-accent italic">{firstName}.</span>
              </>
            ) : (
              <>
                Plus qu'une <span className="serif-accent italic">étape.</span>
              </>
            )}
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[var(--muted-foreground)] sm:text-xl">
            Ton compte est créé. Il te reste à choisir ton abonnement pour
            débloquer la communauté, les formations et ton Coach IA.
            <br className="hidden sm:block" />
            <span className="font-semibold text-[var(--foreground)]">
              Pas demain. Aujourd'hui.
            </span>
          </p>

          {savings && (
            <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-[var(--foreground)] px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-white">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
              {formatXof(savings)} d'économie avec le plan annuel
            </p>
          )}
        </div>

        {/* Packs */}
        <div className="mt-14 grid gap-6 sm:gap-8 lg:grid-cols-2 lg:items-stretch">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              loading={isLoading}
              submitting={selectingId === plan.id}
              disabled={selectingId !== null && selectingId !== plan.id}
              onSelect={() => handleSelect(plan.id)}
            />
          ))}
        </div>

        {/* Réassurance */}
        <div className="mt-14 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white/60 px-4 py-2 text-xs font-bold uppercase tracking-widest text-[var(--muted-foreground)] backdrop-blur-sm">
            <Lock className="h-3.5 w-3.5" />
            Paiement 100 % sécurisé via Maketou
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-6 opacity-50 transition-all hover:opacity-100 sm:gap-10">
            {PAYMENT_METHODS.map((m) => (
              <span
                key={m}
                className="text-xs font-black tracking-tight text-[var(--foreground)] sm:text-sm"
              >
                {m}
              </span>
            ))}
          </div>
          <p className="mt-8 text-xs text-[var(--muted-foreground)]">
            Sans renouvellement automatique · Annulation à tout moment
          </p>
        </div>
      </main>
    </div>
  )
}

function PlanCard({
  plan,
  loading,
  submitting,
  disabled,
  onSelect,
}: {
  plan: PublicPricingPlan
  loading: boolean
  submitting: boolean
  disabled: boolean
  onSelect: () => void
}) {
  const isRecommended = plan.is_recommended

  // Copy ghostwriter — chaque pack a son angle d'attaque distinct.
  const tagline = isRecommended
    ? 'La voie de ceux qui ne veulent pas perdre 6 mois.'
    : 'Démarre sans t\'engager sur 12 mois.'

  const ctaLabel = isRecommended
    ? `Activer mon ${plan.display_name}`
    : `Choisir ${plan.display_name}`

  return (
    <div
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-[2rem] border bg-white p-8 transition-all duration-500 sm:p-10',
        isRecommended
          ? 'border-[var(--primary)] shadow-[0_48px_80px_-32px_rgba(30,64,175,0.25)] lg:scale-[1.02]'
          : 'border-[var(--border)] hover:border-[var(--foreground)]/40 hover:shadow-xl',
      )}
    >
      {isRecommended && (
        <div className="absolute right-6 top-6">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[var(--primary)] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
            <Sparkles className="h-3 w-3" />
            Recommandé
          </div>
        </div>
      )}

      <div>
        <h2 className="font-display text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">
          {plan.display_name}
        </h2>
        <p className="mt-3 text-sm font-medium text-[var(--primary)]">
          {tagline}
        </p>
        <p className="mt-3 text-base text-[var(--muted-foreground)] leading-relaxed">
          {plan.description}
        </p>
      </div>

      <div className={cn('mt-8', loading && 'animate-pulse')}>
        <div className="flex items-baseline gap-2">
          <span className="font-display text-5xl font-bold tracking-tighter text-[var(--foreground)] sm:text-6xl">
            {plan.price_xof.toLocaleString('fr-FR')}
          </span>
          <span className="text-lg font-bold text-[var(--foreground)]">
            FCFA
          </span>
        </div>
        <p className="mt-2 text-xs font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
          {plan.duration_months === 12
            ? 'Accès 1 an'
            : `Accès ${plan.duration_months} mois`}
          <span className="mx-2 opacity-30">|</span>
          {plan.monthly_price_xof.toLocaleString('fr-FR')} FCFA / mois
        </p>
      </div>

      <ul className="mt-8 flex-1 space-y-3">
        {INCLUSIONS.map((label) => (
          <li key={label} className="flex items-start gap-3">
            <div
              className={cn(
                'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full',
                isRecommended
                  ? 'bg-[var(--primary)]/15 text-[var(--primary)]'
                  : 'bg-[var(--border)] text-[var(--muted-foreground)]',
              )}
            >
              <Check className="h-3 w-3" />
            </div>
            <span className="text-sm text-[var(--foreground)]/85 leading-snug">
              {label}
            </span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onSelect}
        disabled={submitting || disabled}
        className={cn(
          'mt-10 group/btn relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-full py-4 text-base font-bold transition-all',
          isRecommended
            ? 'bg-[var(--primary)] text-white shadow-xl shadow-[var(--primary)]/30 hover:scale-[1.02]'
            : 'bg-[var(--foreground)] text-white hover:bg-[#1a1a1a]',
          (submitting || disabled) && 'cursor-wait opacity-80',
        )}
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Redirection…
          </>
        ) : (
          <>
            {ctaLabel}
            <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
          </>
        )}
        {isRecommended && !submitting && !disabled && (
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 group-hover/btn:translate-x-full" />
        )}
      </button>
    </div>
  )
}
