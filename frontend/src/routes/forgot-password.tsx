import { useEffect, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, CheckCircle2, Loader2, Send } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BrandLogo } from '@/components/brand-logo'
import { useAuthStore } from '@/stores/auth-store'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/forgot-password')({
  component: ForgotPasswordPage,
})

const RESEND_COOLDOWN_S = 30

function ForgotPasswordPage() {
  const requestPasswordReset = useAuthStore((s) => s.requestPasswordReset)

  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(0)

  // Décrémente le cooldown du bouton "Renvoyer"
  useEffect(() => {
    if (cooldown <= 0) return
    const id = window.setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => window.clearTimeout(id)
  }, [cooldown])

  async function send(targetEmail: string) {
    setSubmitting(true)
    const { error } = await requestPasswordReset(targetEmail)
    setSubmitting(false)
    if (error) {
      toast.error(error)
      return false
    }
    setSentTo(targetEmail)
    setCooldown(RESEND_COOLDOWN_S)
    toast.success(
      'Email envoyé ! Vérifie ta boîte (et tes spams). Le lien est valide 1 heure.',
    )
    return true
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submitting) return
    const trimmed = email.trim().toLowerCase()
    if (!trimmed) {
      toast.error('Renseigne ton adresse email.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error('Adresse email invalide.')
      return
    }
    await send(trimmed)
  }

  async function handleResend() {
    if (!sentTo || cooldown > 0 || submitting) return
    await send(sentTo)
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)] px-5 py-10 sm:px-6 sm:py-12">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
        <div className="mb-6 flex justify-center sm:mb-8">
          <BrandLogo size="md" variant="primary" />
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm sm:p-10">
          {sentTo ? (
            <ConfirmedState
              email={sentTo}
              cooldown={cooldown}
              submitting={submitting}
              onResend={handleResend}
            />
          ) : (
            <RequestForm
              email={email}
              setEmail={setEmail}
              submitting={submitting}
              onSubmit={handleSubmit}
            />
          )}

          <div className="mt-8 border-t border-[var(--border)] pt-6">
            <Link
              to="/auth"
              className="inline-flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function RequestForm({
  email,
  setEmail,
  submitting,
  onSubmit,
}: {
  email: string
  setEmail: (v: string) => void
  submitting: boolean
  onSubmit: (e: React.FormEvent) => void
}) {
  return (
    <>
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--foreground)] sm:text-3xl">
          Mot de passe oublié&nbsp;?
        </h1>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          Pas de souci. Tape ton email, on t'envoie un lien pour le
          réinitialiser.
        </p>
      </div>

      <form className="mt-8 space-y-4" onSubmit={onSubmit}>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="toi@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
            required
            autoFocus
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="cta-black w-full"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              Envoyer le lien
              <Send className="h-4 w-4" />
            </>
          )}
        </button>
      </form>
    </>
  )
}

function ConfirmedState({
  email,
  cooldown,
  submitting,
  onResend,
}: {
  email: string
  cooldown: number
  submitting: boolean
  onResend: () => void
}) {
  return (
    <div>
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600">
        <CheckCircle2 className="h-6 w-6" />
      </span>
      <h1 className="mt-6 font-display text-2xl font-bold tracking-tight text-[var(--foreground)] sm:text-3xl">
        Lien envoyé&nbsp;!
      </h1>
      <p className="mt-2 text-sm text-[var(--muted-foreground)]">
        On vient d'envoyer un lien à{' '}
        <strong className="text-[var(--foreground)]">{email}</strong>. Ouvre-le
        depuis ta boîte mail pour choisir un nouveau mot de passe. Le lien est
        valide 1 heure.
      </p>

      <p className="mt-5 text-xs text-[var(--muted-foreground)]">
        Pense à vérifier le dossier <em>Spam</em> ou <em>Promotions</em> si tu
        ne le trouves pas.
      </p>

      <button
        type="button"
        onClick={onResend}
        disabled={submitting || cooldown > 0}
        className={cn(
          'mt-8 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-white px-4 text-sm font-medium text-[var(--foreground)] transition-colors',
          'hover:bg-[var(--secondary)] disabled:cursor-not-allowed disabled:opacity-60',
        )}
      >
        {submitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : cooldown > 0 ? (
          `Renvoyer le lien (${cooldown}s)`
        ) : (
          'Renvoyer le lien'
        )}
      </button>
    </div>
  )
}
