import { useEffect, useState } from 'react'
import { CheckCircle2, KeyRound, Loader2, ShieldCheck, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'

// =====================================================================
// MFA (TOTP) — gestion de la double authentification
//
// Architecture :
//   - listFactors() au mount → liste les factors TOTP existants
//   - Si aucun : bouton "Activer" → enroll() retourne qrcode + secret
//     → l'admin scanne avec une app authenticator → saisit le 1er code
//     → challenge() + verify() valide définitivement
//   - Si un factor existe : on l'affiche + bouton "Désactiver"
//
// Récupération : si l'admin perd son téléphone, il peut désactiver
// le factor depuis Supabase Dashboard → Authentication → Users →
// (user) → Multi-Factor Authentication. Documenté dans le help text.
//
// Pré-requis dashboard Supabase : Authentication → Multi-Factor →
// TOTP toggle activé.
// =====================================================================

interface TotpFactor {
  id: string
  friendly_name?: string | null
  factor_type: string
  status: 'verified' | 'unverified'
  created_at: string
}

interface EnrollState {
  factorId: string
  qrCode: string // data URI SVG
  secret: string
}

export function MfaSection() {
  const [factors, setFactors] = useState<TotpFactor[]>([])
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState<EnrollState | null>(null)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)

  async function refresh() {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.mfa.listFactors()
      if (error) {
        // Silent : si le toggle TOTP n'est pas activé côté Supabase,
        // l'API renvoie une erreur — on affiche un message dédié dans
        // l'UI plutôt qu'un toast intrusif.
        console.warn('[mfa] listFactors error', error)
        setFactors([])
      } else {
        setFactors((data?.totp ?? []) as TotpFactor[])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  async function startEnroll() {
    setBusy(true)
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: `Le Club IA — ${new Date().toLocaleDateString('fr-FR')}`,
      })
      if (error || !data) {
        toast.error(
          error?.message?.includes('disabled')
            ? "Le TOTP n'est pas activé côté Supabase. Active-le dans Dashboard → Auth → Multi-Factor."
            : `Impossible d'initier la 2FA : ${error?.message ?? 'erreur inconnue'}`,
        )
        return
      }
      setEnrolling({
        factorId: data.id,
        qrCode: data.totp.qr_code,
        secret: data.totp.secret,
      })
    } finally {
      setBusy(false)
    }
  }

  async function cancelEnroll() {
    if (!enrolling) return
    // Cleanup : on désenrolle le factor unverified pour qu'il ne
    // pollue pas listFactors. Sinon il reste en `unverified` jusqu'à
    // expiration auto Supabase.
    try {
      await supabase.auth.mfa.unenroll({ factorId: enrolling.factorId })
    } catch {
      // Ignore — le serveur fera le cleanup auto.
    }
    setEnrolling(null)
    setCode('')
  }

  async function verifyEnroll() {
    if (!enrolling || code.length !== 6 || busy) return
    setBusy(true)
    try {
      const { data: challenge, error: challErr } =
        await supabase.auth.mfa.challenge({ factorId: enrolling.factorId })
      if (challErr || !challenge) {
        toast.error('Création du challenge impossible.')
        return
      }
      const { error: verifyErr } = await supabase.auth.mfa.verify({
        factorId: enrolling.factorId,
        challengeId: challenge.id,
        code,
      })
      if (verifyErr) {
        toast.error(
          `Code invalide. Vérifie que ton app est bien à l'heure et que tu as scanné le bon QR code.`,
        )
        return
      }
      toast.success('Double authentification activée ✓')
      setEnrolling(null)
      setCode('')
      await refresh()
    } finally {
      setBusy(false)
    }
  }

  async function unenrollFactor(factor: TotpFactor) {
    if (
      !window.confirm(
        'Désactiver la double authentification ? Ton compte sera moins protégé contre les tentatives de phishing.',
      )
    ) {
      return
    }
    setBusy(true)
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId: factor.id })
      if (error) {
        toast.error(`Désactivation impossible : ${error.message}`)
        return
      }
      toast.success('Double authentification désactivée.')
      await refresh()
    } finally {
      setBusy(false)
    }
  }

  const verifiedFactor = factors.find((f) => f.status === 'verified')

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
      <div className="flex items-start gap-3">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
            verifiedFactor
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-[var(--secondary)] text-[var(--muted-foreground)]'
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-medium">Double authentification (2FA)</h3>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Protège ton compte avec un code généré par une app
            authenticator (Google Authenticator, 1Password, Aegis, etc.).
            Fortement recommandé pour les comptes admin.
          </p>
        </div>
      </div>

      {loading ? (
        <p className="mt-4 inline-flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
          <Loader2 className="h-4 w-4 animate-spin" />
          Chargement…
        </p>
      ) : enrolling ? (
        <div className="mt-5 space-y-4 rounded-lg border border-[var(--primary)]/20 bg-[var(--primary)]/[0.03] p-4">
          <div>
            <p className="text-sm font-semibold">1. Scanne le QR code</p>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              Avec Google Authenticator, 1Password, Aegis ou toute autre
              app TOTP RFC 6238.
            </p>
            <div className="mt-3 flex justify-center rounded-lg border border-[var(--border)] bg-white p-4">
              {/* qr_code retourné par Supabase est un data:image/svg+xml */}
              <img
                src={enrolling.qrCode}
                alt="QR code 2FA"
                width={192}
                height={192}
                className="h-48 w-48"
              />
            </div>
            <details className="mt-3 text-xs text-[var(--muted-foreground)]">
              <summary className="cursor-pointer underline">
                Saisie manuelle (si le QR ne marche pas)
              </summary>
              <code className="mt-2 block break-all rounded bg-[var(--secondary)] px-2 py-1 font-mono">
                {enrolling.secret}
              </code>
            </details>
          </div>

          <div>
            <Label htmlFor="mfa-code" className="text-sm font-semibold">
              2. Entre le code à 6 chiffres généré par ton app
            </Label>
            <Input
              id="mfa-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className="mt-2 font-mono text-lg tracking-widest"
              disabled={busy}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={cancelEnroll}
              disabled={busy}
            >
              <X className="h-4 w-4" />
              Annuler
            </Button>
            <Button
              type="button"
              onClick={verifyEnroll}
              disabled={busy || code.length !== 6}
            >
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Vérification…
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Vérifier et activer
                </>
              )}
            </Button>
          </div>
        </div>
      ) : verifiedFactor ? (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-700" />
            <span className="text-sm font-medium text-emerald-900">
              2FA activée
            </span>
            <span className="text-xs text-emerald-700">
              ({verifiedFactor.friendly_name ?? 'TOTP'})
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => unenrollFactor(verifiedFactor)}
            disabled={busy}
            className="text-emerald-900 hover:bg-emerald-100"
          >
            Désactiver
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          onClick={startEnroll}
          disabled={busy}
          className="mt-5"
        >
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Initialisation…
            </>
          ) : (
            <>
              <KeyRound className="h-4 w-4" />
              Activer la double authentification
            </>
          )}
        </Button>
      )}

      <p className="mt-4 text-xs text-[var(--muted-foreground)]">
        En cas de perte d'accès à ton authenticator, contacte le support
        ou un autre admin pour désactiver la 2FA depuis le dashboard
        Supabase.
      </p>
    </div>
  )
}
