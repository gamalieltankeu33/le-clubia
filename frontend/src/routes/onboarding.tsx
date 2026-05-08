import { useEffect, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BrandLogo } from '@/components/brand-logo'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth-store'
import { cn } from '@/lib/utils'
import confetti from 'canvas-confetti'

export const Route = createFileRoute('/onboarding')({
  component: OnboardingPage,
})

const INTERESTS = [
  'Automatisation',
  'Création de contenu IA',
  'Vidéo IA',
  'Développement IA',
  'Prompt engineering',
  'Outils IA',
  'Business IA',
  'Veille IA',
] as const

type Step = 1 | 2 | 3

function OnboardingPage() {
  const navigate = useNavigate()
  const isInitialized = useAuthStore((s) => s.isInitialized)
  const user = useAuthStore((s) => s.user)
  const profile = useAuthStore((s) => s.profile)
  const refreshUserData = useAuthStore((s) => s.refreshUserData)

  const [step, setStep] = useState<Step>(1)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [interests, setInterests] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  // Auth guard + skip si onboarding déjà fini
  useEffect(() => {
    if (!isInitialized) return
    if (!user) {
      navigate({ to: '/auth' })
      return
    }
    if (profile?.onboarding_completed) {
      navigate({ to: '/app/dashboard' })
    }
  }, [isInitialized, user, profile, navigate])

  // Préremplit avec les valeurs existantes du profile au cas où
  useEffect(() => {
    if (profile) {
      if (profile.first_name) setFirstName(profile.first_name)
      if (profile.last_name) setLastName(profile.last_name)
      if (profile.interests?.length) setInterests(profile.interests)
    }
  }, [profile])

  if (!isInitialized || !user) return null

  function toggleInterest(label: string) {
    setInterests((prev) =>
      prev.includes(label)
        ? prev.filter((i) => i !== label)
        : [...prev, label],
    )
  }

  function handleNext() {
    if (step === 1) {
      if (!firstName.trim() || !lastName.trim()) {
        toast.error('Renseigne ton prénom et ton nom.')
        return
      }
      setStep(2)
      return
    }
    if (step === 2) {
      if (interests.length === 0) {
        toast.error('Sélectionne au moins un centre d\'intérêt.')
        return
      }
      setStep(3)
    }
  }

  function handleBack() {
    setStep((s) => (s > 1 ? ((s - 1) as Step) : s))
  }

  // Déclenche les confettis au passage à l'étape 3
  useEffect(() => {
    if (step === 3) {
      const duration = 3 * 1000
      const animationEnd = Date.now() + duration
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

      const randomInRange = (min: number, max: number) =>
        Math.random() * (max - min) + min

      const interval: any = setInterval(function () {
        const timeLeft = animationEnd - Date.now()

        if (timeLeft <= 0) {
          return clearInterval(interval)
        }

        const particleCount = 50 * (timeLeft / duration)
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        })
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        })
      }, 250)

      return () => clearInterval(interval)
    }
  }, [step])

  async function handleFinish() {
    if (!user || saving) return
    setSaving(true)

    const { error } = await supabase
      .from('profiles')
      .update({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        interests,
        onboarding_completed: true,
      })
      .eq('id', user.id)

    if (error) {
      toast.error('Impossible de sauvegarder ton profil. Réessaie.')
      setSaving(false)
      return
    }

    await refreshUserData()
    navigate({ to: '/app/dashboard' })
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)]">
      <header className="border-b border-[var(--border)]">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between gap-3 px-5 sm:px-6">
          <BrandLogo size="sm" variant="primary" className="sm:hidden" />
          <BrandLogo
            size="md"
            variant="primary"
            className="hidden sm:block"
          />
          <StepIndicator step={step} />
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-5 py-10 sm:px-6 sm:py-12">
        <div className="w-full max-w-xl">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <StepWrap key="step1">
                <StepHeader
                  title="Faisons connaissance"
                  subtitle="Ton prénom et ton nom apparaîtront sur ton profil et tes posts."
                />
                <div className="mt-8 space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Prénom</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Camille"
                      autoFocus
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Nom</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Rousseau"
                    />
                  </div>
                </div>
                <NavButtons
                  onBack={null}
                  onNext={handleNext}
                  nextLabel="Continuer"
                />
              </StepWrap>
            )}

            {step === 2 && (
              <StepWrap key="step2">
                <StepHeader
                  title="Qu'est-ce qui te branche en IA ?"
                  subtitle="Sélectionne tout ce qui t'intéresse — ça nous aide à personnaliser ton expérience."
                />
                <div className="mt-8 flex flex-wrap gap-2">
                  {INTERESTS.map((label) => {
                    const selected = interests.includes(label)
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => toggleInterest(label)}
                        className={cn(
                          'flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors',
                          selected
                            ? 'border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]'
                            : 'border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:border-[var(--muted-foreground)]',
                        )}
                      >
                        {selected && <Check className="h-3.5 w-3.5" />}
                        {label}
                      </button>
                    )
                  })}
                </div>
                <NavButtons
                  onBack={handleBack}
                  onNext={handleNext}
                  nextLabel="Continuer"
                />
              </StepWrap>
            )}

            {step === 3 && (
              <StepWrap key="step3">
                <div className="text-center">
                  <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent)]/15 text-[var(--accent)]">
                    <Sparkles className="h-6 w-6" />
                  </span>
                  <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
                    Bienvenue dans Le Club, {firstName}&nbsp;!
                  </h1>
                  <p className="mx-auto mt-4 max-w-md text-[var(--muted-foreground)]">
                    Tu fais maintenant partie d'une communauté francophone de
                    passionnés. Découvre formations, posts, actualités et
                    ressources — tout est prêt pour toi.
                  </p>
                </div>
                <div className="mt-10 flex justify-center">
                  <Button size="lg" onClick={handleFinish} disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Préparation…
                      </>
                    ) : (
                      <>
                        Aller au dashboard
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </StepWrap>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}

function StepIndicator({ step }: { step: Step }) {
  return (
    <div className="flex items-center gap-2">
      {[1, 2, 3].map((n) => (
        <span
          key={n}
          className={cn(
            'h-1.5 rounded-full transition-all',
            n === step
              ? 'w-8 bg-[var(--primary)]'
              : n < step
                ? 'w-4 bg-[var(--primary)]'
                : 'w-4 bg-[var(--border)]',
          )}
        />
      ))}
    </div>
  )
}

function StepWrap({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}

function StepHeader({
  title,
  subtitle,
}: {
  title: string
  subtitle: string
}) {
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl">
        {title}
      </h1>
      <p className="mt-2 text-sm text-[var(--muted-foreground)] sm:text-base">
        {subtitle}
      </p>
    </div>
  )
}

function NavButtons({
  onBack,
  onNext,
  nextLabel,
}: {
  onBack: (() => void) | null
  onNext: () => void
  nextLabel: string
}) {
  return (
    <div className="mt-10 flex items-center justify-between">
      {onBack ? (
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Button>
      ) : (
        <span />
      )}
      <Button size="lg" onClick={onNext}>
        {nextLabel}
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
