import { useCallback, useEffect, useMemo, useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BrandLogo } from '@/components/brand-logo'
import { PasswordStrengthMeter } from '@/components/password-strength-meter'
import { useAuthStore } from '@/stores/auth-store'
import { nextRouteAfterAuth } from '@/lib/auth-redirect'
import { validatePassword } from '@/lib/password-validator'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { Reveal } from '@/components/landing/reveal'

export const Route = createFileRoute('/auth')({
  component: AuthPage,
})

type AuthMode = 'login' | 'signup'

function AuthPage() {
  const navigate = useNavigate()
  const signIn = useAuthStore((s) => s.signIn)
  const signUp = useAuthStore((s) => s.signUp)
  const isInitialized = useAuthStore((s) => s.isInitialized)
  const user = useAuthStore((s) => s.user)
  const profile = useAuthStore((s) => s.profile)

  // Par défaut signup : nouvelle plateforme = nouvelle audience.
  const [mode, setMode] = useState<AuthMode>('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // MFA challenge state — actif uniquement si le user vient de réussir
  // son login avec mdp ET qu'il a un factor TOTP vérifié. Tant que
  // mfaFactorId est null, le step credentials normal est affiché.
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null)
  const [mfaCode, setMfaCode] = useState('')

  // Plan choisi sur la landing : passé en query param ?plan=annual|semestrial.
  // On le mémorise et on l'enregistre dans profiles.desired_plan_id après
  // signup pour que l'admin puisse pré-sélectionner ce plan à l'activation.
  const desiredPlanId = useMemo(() => {
    if (typeof window === 'undefined') return null
    const raw = new URLSearchParams(window.location.search).get('plan')
    if (raw === 'annual' || raw === 'semestrial') return raw
    return null
  }, [])

  // Route l'utilisateur authentifié vers /onboarding, /app/dashboard,
  // /checkout ou /abonnement (gating géré par nextRouteAfterAuth).
  const routeAuthenticatedUser = useCallback(() => {
    const state = useAuthStore.getState()
    // Profil pas encore hydraté : le fetch profil/abo est déféré juste
    // après le login (anti-deadlock supabase-js). Tant qu'il n'est pas là,
    // on ATTEND — surtout PAS de déconnexion, sinon un profile null
    // transitoire ferait croire à tort qu'un membre actif n'est pas membre.
    // Le useEffect ci-dessous re-déclenche dès que `profile` arrive.
    if (!state.profile) return
    const target = nextRouteAfterAuth(state.profile, state.subscription)
    if (!target) return
    navigate({ to: target })
  }, [navigate])

  // Auto-redirect post-OAuth (Google), après login, ou si déjà authentifié.
  // `profile` est dans les deps pour re-router dès que le profil est chargé
  // (le user est posé avant le profil par le listener onAuthStateChange).
  useEffect(() => {
    if (!isInitialized || !user) return
    routeAuthenticatedUser()
  }, [isInitialized, user, profile, routeAuthenticatedUser])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submitting) return

    const trimmedEmail = email.trim().toLowerCase()
    if (!trimmedEmail) {
      toast.error('Renseigne ton adresse email.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      toast.error('Adresse email invalide.')
      return
    }
    if (!password) {
      toast.error('Renseigne ton mot de passe.')
      return
    }
    if (mode === 'signup') {
      const v = validatePassword(password)
      if (!v.isValid && v.blockingError) {
        toast.error(`Mot de passe trop faible : ${v.blockingError}`)
        return
      }
    }

    setSubmitting(true)
    try {
      if (mode === 'login') {
        const { error } = await signIn(trimmedEmail, password)
        if (error) {
          toast.error(error)
          setSubmitting(false)
          return
        }

        // Après signIn, on est en AAL1 (mdp seul). Si le user a un
        // factor TOTP vérifié, Supabase exige un challenge supplémentaire
        // pour passer en AAL2. On NE call PAS routeAuthenticatedUser
        // dans ce cas — on switche en step MFA d'abord.
        const { data: aal } =
          await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
        if (
          aal?.currentLevel === 'aal1' &&
          aal?.nextLevel === 'aal2'
        ) {
          const { data: factors } = await supabase.auth.mfa.listFactors()
          const totpFactor = factors?.totp?.find(
            (f) => f.status === 'verified',
          )
          if (totpFactor) {
            setMfaFactorId(totpFactor.id)
            setSubmitting(false)
            return
          }
          // Aucun factor verified mais AAL2 requis → cas anormal, on
          // déconnecte pour éviter une session bancale.
          await useAuthStore.getState().signOut()
          toast.error('Configuration MFA inattendue. Reconnecte-toi.')
          setSubmitting(false)
          return
        }
      } else {
        const { error } = await signUp(trimmedEmail, password)
        if (error) {
          toast.error(error)
          setSubmitting(false)
          return
        }
        // Persiste le plan choisi sur la landing si présent. Best-effort :
        // un échec ici n'empêche PAS le signup ; l'admin pourra ajuster
        // manuellement à l'activation.
        if (desiredPlanId) {
          const { user: newUser } = useAuthStore.getState()
          if (newUser) {
            await supabase
              .from('profiles')
              .update({ desired_plan_id: desiredPlanId })
              .eq('id', newUser.id)
            // Recharge le store pour que le useEffect lise le bon
            // desired_plan_id et redirige vers /checkout après l'onboarding.
            await useAuthStore.getState().refreshUserData()
          }
        }
        // Message de transition : on annonce explicitement la prochaine
        // étape (paiement) pour que l'utilisateur sache où il en est.
        toast.success(
          desiredPlanId
            ? 'Compte créé. Direction le paiement pour activer ton accès.'
            : 'Compte créé. Plus qu’une étape : choisis ton abonnement.',
          { duration: 5000 },
        )
      }
      // Routage centralisé (bloque les non-membres sans plan en attente).
      await routeAuthenticatedUser()
    } catch (err) {
      console.error(err)
      toast.error('Une erreur est survenue. Réessaie.')
      setSubmitting(false)
    }
  }

  async function verifyMfa() {
    if (!mfaFactorId || mfaCode.length !== 6 || submitting) return
    setSubmitting(true)
    try {
      const { data: challenge, error: challErr } =
        await supabase.auth.mfa.challenge({ factorId: mfaFactorId })
      if (challErr || !challenge) {
        toast.error('Création du challenge MFA impossible.')
        setSubmitting(false)
        return
      }
      const { error: verifyErr } = await supabase.auth.mfa.verify({
        factorId: mfaFactorId,
        challengeId: challenge.id,
        code: mfaCode,
      })
      if (verifyErr) {
        toast.error('Code invalide. Réessaie.')
        setSubmitting(false)
        return
      }
      // AAL2 atteint — refresh le store (rôle / sub) puis route.
      await useAuthStore.getState().refreshUserData()
      setMfaFactorId(null)
      setMfaCode('')
      await routeAuthenticatedUser()
    } catch (err) {
      console.error('[auth] verifyMfa error', err)
      toast.error('Erreur lors de la vérification.')
      setSubmitting(false)
    }
  }

  async function cancelMfa() {
    // L'utilisateur abandonne le challenge MFA → on déconnecte pour
    // pas laisser une session AAL1 fantôme. Reset complet du formulaire.
    await useAuthStore.getState().signOut()
    setMfaFactorId(null)
    setMfaCode('')
    setPassword('')
  }

  const formDisabled = submitting
  const isSignup = mode === 'signup'
  const passwordValidation =
    isSignup && password.length > 0 ? validatePassword(password) : null

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[var(--background)] px-5 py-10 sm:px-6 sm:py-12">
      {/* Cinematic Background Halos */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute -top-48 left-1/2 h-[800px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-b from-[var(--primary)]/[0.05] to-transparent blur-[120px]" />
        <div className="absolute right-[10%] top-1/4 h-[500px] w-[500px] rounded-full bg-[var(--accent)]/[0.03] blur-[100px]" />
      </div>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
        <Reveal delay={0.1}>
          <div className="mb-8 flex justify-center">
            <BrandLogo size="md" variant="primary" />
          </div>
        </Reveal>

        <Reveal delay={0.2} distance={20}>
          <div className="glass overflow-hidden rounded-[2.5rem] border border-[var(--border)] p-6 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] sm:p-10">
            {/* Titre + sous-titre dynamique */}
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">
                {isSignup ? (
                  <>
                    Rejoins <span className="serif-accent italic">Le Club.</span>
                  </>
                ) : (
                  <>
                    Ravi de te <span className="serif-accent italic">revoir.</span>
                  </>
                )}
              </h1>
              <p className="mt-3 text-base text-[var(--muted-foreground)]">
                {isSignup
                  ? 'Crée ton compte en moins de 30 secondes.'
                  : 'Connecte-toi pour accéder à tes ressources.'}
              </p>
            </div>

          {/* Tabs login / signup */}
          <ModeTabs
            mode={mode}
            onChange={(next) => {
              if (next !== mode) setMode(next)
            }}
            disabled={formDisabled}
          />

          {/* Chip "Plan choisi" si l'utilisateur arrive depuis la landing
              avec ?plan=... — rassure visuellement et confirme le choix. */}
          {desiredPlanId && isSignup && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-[var(--primary)]/10 px-3 py-1.5 text-xs font-medium text-[var(--primary)]">
              <Sparkles className="h-3.5 w-3.5" />
              {desiredPlanId === 'annual'
                ? 'Plan choisi : Annuel — 150 €'
                : 'Plan choisi : 6 mois — 100 €'}
            </div>
          )}

          {/* Mention d'accès réservé en mode login — rappelle que la
              connexion est gated derrière un abonnement actif. */}
          {!isSignup && (
            <div className="mt-4 flex items-start gap-2 rounded-2xl border border-[var(--border)] bg-[var(--background)]/60 px-3 py-2.5 text-xs text-[var(--muted-foreground)]">
              <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--primary)]" />
              <span>
                Connexion réservée aux membres ayant un abonnement actif.{' '}
                <Link to="/" hash="tarif" className="font-semibold text-[var(--foreground)] underline">
                  Rejoindre le Club
                </Link>
              </span>
            </div>
          )}

          <div className="mt-6 space-y-5">
            {mfaFactorId ? (
              // Step MFA : remplace TOUT le formulaire (Google + email + mdp)
              // tant que le challenge n'est pas validé. L'utilisateur est
              // déjà authentifié AAL1 — on lui demande son code TOTP pour
              // monter en AAL2.
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault()
                  void verifyMfa()
                }}
              >
                <div className="rounded-lg border border-[var(--primary)]/20 bg-[var(--primary)]/[0.04] p-4">
                  <p className="text-sm font-semibold">
                    Double authentification
                  </p>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                    Ouvre ton app authenticator (Google Authenticator,
                    1Password, Aegis…) et saisis le code à 6 chiffres généré
                    pour Leclub.ia.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mfa-code">Code à 6 chiffres</Label>
                  <Input
                    id="mfa-code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="123456"
                    value={mfaCode}
                    onChange={(e) =>
                      setMfaCode(e.target.value.replace(/\D/g, ''))
                    }
                    disabled={submitting}
                    autoFocus
                    className="font-mono text-lg tracking-widest"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || mfaCode.length !== 6}
                  className="cta-black w-full"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Vérifier
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={cancelMfa}
                  disabled={submitting}
                  className="block w-full text-center text-xs text-[var(--muted-foreground)] underline hover:text-[var(--foreground)]"
                >
                  Annuler et se reconnecter
                </button>
              </form>
            ) : (
              <>
                <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="toi@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={formDisabled}
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Mot de passe</Label>
                  {!isSignup && (
                    <Link
                      to="/forgot-password"
                      className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                    >
                      Mot de passe oublié&nbsp;?
                    </Link>
                  )}
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={
                      isSignup ? 'new-password' : 'current-password'
                    }
                    placeholder={
                      isSignup ? 'Au moins 8 caractères' : 'Ton mot de passe'
                    }
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={formDisabled}
                    required
                    className="pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={
                      showPassword
                        ? 'Masquer le mot de passe'
                        : 'Afficher le mot de passe'
                    }
                    tabIndex={-1}
                    className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {/* Jauge de force visible uniquement en signup */}
                {passwordValidation && (
                  <PasswordStrengthMeter validation={passwordValidation} />
                )}
              </div>

              <button
                type="submit"
                disabled={formDisabled}
                className="cta-black w-full"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    {isSignup ? 'Créer mon compte' : 'Se connecter'}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              {/* Mention CGU/Conf — uniquement en signup */}
              {isSignup && (
                <p className="text-center text-xs text-[var(--muted-foreground)]">
                  En créant ton compte, tu acceptes nos{' '}
                  <Link
                    to="/cgu"
                    className="underline hover:text-[var(--foreground)]"
                  >
                    CGU
                  </Link>{' '}
                  et notre{' '}
                  <Link
                    to="/confidentialite"
                    className="underline hover:text-[var(--foreground)]"
                  >
                    Politique de confidentialité
                  </Link>
                  .
                </p>
              )}
            </form>
              </>
            )}
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.4}>
        <p className="mt-10 text-center text-xs text-[var(--muted-foreground)]">
          © {new Date().getFullYear()} Leclub.ia ·{' '}
          <Link to="/cgu" className="hover:text-[var(--foreground)]">
            CGU
          </Link>{' '}
          ·{' '}
          <Link
            to="/confidentialite"
            className="hover:text-[var(--foreground)]"
          >
            Confidentialité
          </Link>{' '}
          ·{' '}
          <Link
            to="/mentions-legales"
            className="hover:text-[var(--foreground)]"
          >
            Mentions légales
          </Link>
        </p>
      </Reveal>
    </div>
  </div>
)
}

function ModeTabs({
  mode,
  onChange,
  disabled,
}: {
  mode: AuthMode
  onChange: (next: AuthMode) => void
  disabled?: boolean
}) {
  return (
    <div
      role="tablist"
      aria-label="Choisir entre se connecter et s'inscrire"
      className="mt-8 grid grid-cols-2 gap-1 rounded-2xl bg-black/5 p-1 backdrop-blur-sm"
    >
      <TabButton
        active={mode === 'login'}
        onClick={() => onChange('login')}
        disabled={disabled}
      >
        Se connecter
      </TabButton>
      <TabButton
        active={mode === 'signup'}
        onClick={() => onChange('signup')}
        disabled={disabled}
      >
        S'inscrire
      </TabButton>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  disabled,
  children,
}: {
  active: boolean
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-300',
        active
          ? 'bg-white text-[var(--foreground)] shadow-sm'
          : 'bg-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
        disabled && 'cursor-not-allowed opacity-60',
      )}
    >
      {children}
    </button>
  )
}

