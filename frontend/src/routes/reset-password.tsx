import { useEffect, useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BrandLogo } from '@/components/brand-logo'
import { PasswordStrengthMeter } from '@/components/password-strength-meter'
import { useAuthStore } from '@/stores/auth-store'
import { supabase } from '@/lib/supabase'
import { validatePassword } from '@/lib/password-validator'

export const Route = createFileRoute('/reset-password')({
  component: ResetPasswordPage,
})

// Délai d'attente max pour que supabase-js consomme le hash de l'URL
// (#access_token=...&type=recovery=...) et établisse une session.
const SESSION_GRACE_MS = 1500

type SessionStatus = 'checking' | 'ready' | 'invalid'

function ResetPasswordPage() {
  const navigate = useNavigate()
  const updatePassword = useAuthStore((s) => s.updatePassword)

  const [status, setStatus] = useState<SessionStatus>('checking')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Au mount : vérifie qu'une session de récupération est bien établie.
  // supabase-js consomme le hash de l'URL automatiquement (detectSessionInUrl)
  // et émet un event 'PASSWORD_RECOVERY'. On combine les 2 signaux.
  useEffect(() => {
    let cancelled = false

    const sub = supabase.auth.onAuthStateChange((event) => {
      if (cancelled) return
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setStatus('ready')
      }
    })

    // Fallback : si la session existe déjà (hash déjà consommé / refresh
    // de la page après ouverture du lien), on autorise.
    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return
      if (session?.user) setStatus('ready')
    })

    // Garde-fou : si rien n'est venu après le délai de grâce, le lien
    // est expiré ou invalide. On redirige vers /forgot-password.
    const timeout = window.setTimeout(() => {
      if (cancelled) return
      setStatus((prev) => {
        if (prev !== 'checking') return prev
        toast.error(
          'Lien expiré ou invalide. Demande un nouveau lien pour réinitialiser ton mot de passe.',
        )
        navigate({ to: '/forgot-password' })
        return 'invalid'
      })
    }, SESSION_GRACE_MS)

    return () => {
      cancelled = true
      window.clearTimeout(timeout)
      sub.data.subscription.unsubscribe()
    }
  }, [navigate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submitting || status !== 'ready') return

    const v = validatePassword(password)
    if (!v.isValid && v.blockingError) {
      toast.error(`Mot de passe trop faible : ${v.blockingError}`)
      return
    }
    if (password !== confirm) {
      toast.error('Les deux mots de passe ne correspondent pas.')
      return
    }

    setSubmitting(true)
    const { error } = await updatePassword(password)
    if (error) {
      toast.error(error)
      setSubmitting(false)
      return
    }
    toast.success('Mot de passe réinitialisé ! Tu es maintenant connectée.')
    navigate({ to: '/app/dashboard' })
  }

  const passwordValidation =
    password.length > 0 ? validatePassword(password) : null
  const passwordsMatch = password.length > 0 && password === confirm

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)] px-5 py-10 sm:px-6 sm:py-12">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
        <div className="mb-6 flex justify-center sm:mb-8">
          <BrandLogo size="md" variant="primary" />
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm sm:p-10">
          {status === 'checking' ? (
            <CheckingState />
          ) : status === 'invalid' ? (
            <InvalidState />
          ) : (
            <>
              <div>
                <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--foreground)] sm:text-3xl">
                  Nouveau mot de passe
                </h1>
                <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                  Choisis un mot de passe solide. Tu pourras te reconnecter
                  immédiatement.
                </p>
              </div>

              <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
                <PasswordField
                  id="new-password"
                  label="Nouveau mot de passe"
                  value={password}
                  onChange={setPassword}
                  show={showPassword}
                  onToggleShow={() => setShowPassword((v) => !v)}
                  autoComplete="new-password"
                  placeholder="Au moins 8 caractères"
                  disabled={submitting}
                  autoFocus
                />
                {passwordValidation && (
                  <PasswordStrengthMeter validation={passwordValidation} />
                )}

                <PasswordField
                  id="confirm-password"
                  label="Confirmer le mot de passe"
                  value={confirm}
                  onChange={setConfirm}
                  show={showConfirm}
                  onToggleShow={() => setShowConfirm((v) => !v)}
                  autoComplete="new-password"
                  placeholder="Retape le même mot de passe"
                  disabled={submitting}
                />
                {confirm.length > 0 && !passwordsMatch && (
                  <p className="text-xs text-red-600">
                    Les deux mots de passe ne correspondent pas.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="cta-black w-full"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Réinitialiser
                      <CheckCircle2 className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-8 border-t border-[var(--border)] pt-6">
                <Link
                  to="/auth"
                  className="inline-flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Retour à la connexion
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  show,
  onToggleShow,
  autoComplete,
  placeholder,
  disabled,
  autoFocus,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  show: boolean
  onToggleShow: () => void
  autoComplete: string
  placeholder: string
  disabled?: boolean
  autoFocus?: boolean
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? 'text' : 'password'}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          required
          className="pr-11"
          autoFocus={autoFocus}
        />
        <button
          type="button"
          onClick={onToggleShow}
          aria-label={show ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          tabIndex={-1}
          className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  )
}

function CheckingState() {
  return (
    <div className="flex flex-col items-center justify-center py-6 text-center">
      <Loader2 className="h-6 w-6 animate-spin text-[var(--muted-foreground)]" />
      <p className="mt-4 text-sm text-[var(--muted-foreground)]">
        Vérification du lien…
      </p>
    </div>
  )
}

function InvalidState() {
  return (
    <div className="text-center">
      <p className="text-sm text-[var(--muted-foreground)]">
        Redirection vers la page de récupération…
      </p>
    </div>
  )
}
