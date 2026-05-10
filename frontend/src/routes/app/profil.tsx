import { useEffect, useRef, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Camera,
  Check,
  KeyRound,
  Loader2,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { AvatarDisplay } from '@/components/avatar-display'
import { CardElite } from '@/components/shared/card-elite'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth-store'
import { useCoachStore } from '@/stores/coach-store'
import { INTERESTS } from '@/lib/interests'
import { compressImage } from '@/lib/compress-image'
import { cn } from '@/lib/utils'
import { useConfirm } from '@/hooks/use-confirm'
import { formatMemberNumber } from '@/lib/format-member-number'

export const Route = createFileRoute('/app/profil')({
  component: ProfilPage,
})

function ProfilPage() {
  const user = useAuthStore((s) => s.user)
  const profile = useAuthStore((s) => s.profile)
  const refreshUserData = useAuthStore((s) => s.refreshUserData)
  const isMember = useAuthStore((s) => s.isMember)()
  const conversations = useCoachStore((s) => s.conversations)
  const quotaUsed = useCoachStore((s) => s.quotaUsed)
  const quotaLimit = useCoachStore((s) => s.quotaLimit)
  const refreshHistory = useCoachStore((s) => s.refreshHistory)
  const refreshQuota = useCoachStore((s) => s.refreshQuota)
  const showHistory = useCoachStore((s) => s.showHistory)
  const openCoach = useCoachStore((s) => s.openPanel)

  // Charge stats coach à l'arrivée sur la page
  useEffect(() => {
    void refreshHistory()
    void refreshQuota()
  }, [refreshHistory, refreshQuota])

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [bio, setBio] = useState('')
  const [interests, setInterests] = useState<string[]>([])
  const [emailPrefs, setEmailPrefs] = useState({
    weekly_recap: true,
    event_announce: true,
    event_reminders: true,
  })
  const [savingPrefs, setSavingPrefs] = useState(false)
  const [saving, setSaving] = useState(false)

  // Hydrate les champs depuis le store
  useEffect(() => {
    if (!profile) return
    setFirstName(profile.first_name ?? '')
    setLastName(profile.last_name ?? '')
    setBio(profile.bio ?? '')
    setInterests(profile.interests ?? [])
    setEmailPrefs({
      weekly_recap: profile.email_pref_weekly_recap ?? true,
      event_announce: profile.email_pref_event_announce ?? true,
      event_reminders: profile.email_pref_event_reminders ?? true,
    })
  }, [profile])

  async function updateEmailPref(
    key: 'weekly_recap' | 'event_announce' | 'event_reminders',
    value: boolean,
  ) {
    if (!user || savingPrefs) return
    setSavingPrefs(true)
    const previous = { ...emailPrefs }
    // Optimistic
    setEmailPrefs((p) => ({ ...p, [key]: value }))
    const updatePayload =
      key === 'weekly_recap'
        ? { email_pref_weekly_recap: value }
        : key === 'event_announce'
          ? { email_pref_event_announce: value }
          : { email_pref_event_reminders: value }
    const { error } = await supabase
      .from('profiles')
      .update(updatePayload)
      .eq('id', user.id)
    if (error) {
      console.error(error)
      setEmailPrefs(previous) // rollback
      toast.error('Préférence non enregistrée. Réessaie.')
    } else {
      void refreshUserData()
    }
    setSavingPrefs(false)
  }

  function toggleInterest(label: string) {
    setInterests((prev) =>
      prev.includes(label)
        ? prev.filter((i) => i !== label)
        : [...prev, label],
    )
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!user || saving) return
    if (!firstName.trim() || !lastName.trim()) {
      toast.error('Renseigne ton prénom et ton nom.')
      return
    }
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        bio: bio.trim() || null,
        interests,
      })
      .eq('id', user.id)

    if (error) {
      toast.error('Impossible de sauvegarder. Réessaie.')
      setSaving(false)
      return
    }
    await refreshUserData()
    toast.success('Profil mis à jour.')
    setSaving(false)
  }

  const memberLabel = formatMemberNumber(profile?.member_number)
  const points = profile?.points ?? 0
  const joinedAt = profile?.created_at ?? null
  const interestsCount = profile?.interests?.length ?? 0
  const displayName = [profile?.first_name, profile?.last_name]
    .filter(Boolean)
    .join(' ')
    .trim() || (user?.email?.split('@')[0] ?? 'Membre')

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 lg:py-14">
      {/* Header élite : surface noire, numéro de membre or, signature */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <CardElite variant="bleu" className="px-6 py-10 sm:px-10 sm:py-14">
          <div className="relative z-10 flex flex-col items-start gap-6 sm:flex-row sm:items-center">
            <div className="shrink-0">
              <AvatarDisplay
                avatarUrl={profile?.avatar_url}
                firstName={profile?.first_name}
                lastName={profile?.last_name}
                email={user?.email}
                size="xl"
                isVerified={profile?.is_verified ?? false}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-serif-signature text-base italic text-[var(--bleu-ciel)] sm:text-lg">
                Mon profil
              </p>
              <h1 className="mt-2 font-display text-3xl font-bold leading-[1.05] tracking-tight text-[#FAFAF9] sm:text-4xl md:text-5xl">
                {displayName}
              </h1>
              {memberLabel ? (
                <p className="mt-4 text-sm text-white/60">
                  Membre{' '}
                  <span className="font-serif-number text-3xl text-[var(--or)] sm:text-4xl">
                    {memberLabel}
                  </span>{' '}
                  du Club
                </p>
              ) : (
                <p className="mt-4 text-sm italic text-white/50">
                  Numéro de membre en cours d'attribution…
                </p>
              )}
              {joinedAt && (
                <p className="mt-2 font-serif-signature text-sm italic text-white/55">
                  Rejoint en {formatJoinedDate(joinedAt)}
                </p>
              )}
            </div>
          </div>
        </CardElite>
      </motion.div>

      {/* Stats en serif — vitrine du membre */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15, ease: 'easeOut' }}
        className="mt-6 grid grid-cols-3 gap-3 sm:gap-5"
      >
        <StatTile
          label="Points"
          value={points.toLocaleString('fr-FR')}
          tone="emerald"
        />
        <StatTile
          label="Centres d'intérêt"
          value={interestsCount.toString()}
        />
        <StatTile
          label="Statut"
          value={isMember ? 'Actif' : '—'}
          serifSmall
        />
      </motion.div>

      {/* Carte profil */}
      <form onSubmit={handleSave} className="mt-12 space-y-10">
        <Section title="Informations personnelles">
          <AvatarUploader />



          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">Prénom</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Nom</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={saving}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Présente-toi en quelques mots — ce que tu fais, ce qui t'intéresse en IA…"
              maxLength={500}
              rows={4}
              disabled={saving}
            />
            <p className="text-xs text-[var(--muted-foreground)]">
              {bio.length}/500 caractères
            </p>
          </div>
        </Section>

        <Section
          title="Centres d'intérêt"
          description="Choisis tout ce qui te branche en IA."
        >
          <div className="flex flex-wrap gap-2">
            {INTERESTS.map((label) => {
              const selected = interests.includes(label)
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => toggleInterest(label)}
                  disabled={saving}
                  className={cn(
                    'flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors disabled:opacity-50',
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
        </Section>

        <div className="flex items-center justify-end gap-3 border-t border-[var(--border)] pt-6">
          <Button type="submit" size="lg" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enregistrement…
              </>
            ) : (
              <>Enregistrer les modifications</>
            )}
          </Button>
        </div>
      </form>

      {/* Compte */}
      <div className="mt-12">
        <Section title="Compte">
          <div className="space-y-2">
            <Label htmlFor="email">Adresse email</Label>
            <Input
              id="email"
              value={user?.email ?? ''}
              readOnly
              disabled
              className="cursor-not-allowed"
            />
            <p className="text-xs text-[var(--muted-foreground)]">
              Pour changer ton email, contacte-nous.
            </p>
          </div>
          <div>
            <Button
              variant="outline"
              type="button"
              onClick={() =>
                toast.info(
                  'Le changement de mot de passe arrive dans une prochaine session.',
                )
              }
            >
              <KeyRound className="h-4 w-4" />
              Changer de mot de passe
            </Button>
          </div>
        </Section>
      </div>

      {/* Préférences email */}
      <div className="mt-12">
        <Section
          title="Préférences email"
          description="Choisis quels emails tu veux recevoir. Tu peux modifier à tout moment."
        >
          <div className="space-y-1 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-2">
            <PrefRow
              label="Récap actu IA chaque dimanche"
              hint="Le résumé hebdomadaire des actualités IA marquantes, envoyé chaque dimanche à 9h UTC."
              checked={emailPrefs.weekly_recap}
              onChange={(v) => updateEmailPref('weekly_recap', v)}
              disabled={savingPrefs}
            />
            <PrefRow
              label="Annonces d'événements"
              hint="Email quand un nouveau coaching live, masterclass ou Q&A est programmé."
              checked={emailPrefs.event_announce}
              onChange={(v) => updateEmailPref('event_announce', v)}
              disabled={savingPrefs}
            />
            <PrefRow
              label="Rappels avant les événements"
              hint="Rappel par email la veille (J-1) et le jour de l'événement (à 9h UTC)."
              checked={emailPrefs.event_reminders}
              onChange={(v) => updateEmailPref('event_reminders', v)}
              disabled={savingPrefs}
            />
          </div>
          <p className="mt-3 text-xs text-[var(--muted-foreground)]">
            Tu reçois aussi des notifications dans l'app, indépendamment des
            préférences email.
          </p>
        </Section>
      </div>

      {/* Coach IA */}
      <div className="mt-12">
        <Section title="Coach IA">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
            <div className="flex items-start gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)]/15 text-[var(--accent)]">
                <Sparkles className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  Ton assistant IA personnel
                </p>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                  Pose-lui tes questions sur l'IA quand tu veux, 24/7.
                </p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-3">
                <p className="text-xs text-[var(--muted-foreground)]">
                  Conversations totales
                </p>
                <p className="mt-1 font-display text-2xl font-semibold tabular-nums">
                  {conversations.length}
                </p>
              </div>
              <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-3">
                <p className="text-xs text-[var(--muted-foreground)]">
                  Messages aujourd'hui
                </p>
                <p className="mt-1 font-display text-2xl font-semibold tabular-nums">
                  {quotaUsed}
                  <span className="text-sm font-normal text-[var(--muted-foreground)]">
                    /{quotaLimit}
                  </span>
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  openCoach()
                  showHistory()
                }}
              >
                Voir l'historique
              </Button>
              <Button
                type="button"
                onClick={openCoach}
              >
                Ouvrir le Coach
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Section>
      </div>

      {/* Abonnement */}
      <div className="mt-12">
        <Section title="Mon abonnement">
          {isMember ? (
            <SubscriptionCard />
          ) : (
            <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--card)] p-5">
              <p className="text-sm font-medium">
                Tu n'as pas encore d'abonnement actif
              </p>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                Rejoins Le Club pour débloquer l'accès complet aux 4 piliers.
                Choisis entre la formule semestrielle ou annuelle.
              </p>
              <Button asChild className="mt-4">
                <a href="/#tarif">
                  Voir les offres
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
            </div>
          )}
        </Section>
      </div>
    </div>
  )
}

function SubscriptionCard() {
  const subscription = useAuthStore((s) => s.subscription)
  const planId = subscription?.plan_id ?? null

  // Récupère les détails du plan via la table pricing_plans (la RLS
  // permet aux admins ET aux membres authentifiés de lire les plans
  // actifs ; pour 'legacy_annual' inactif, on tombe sur null et on
  // affiche un libellé fallback).
  const planQuery = useQuery({
    queryKey: ['profile-plan', planId],
    queryFn: async () => {
      if (!planId) return null
      const { data } = await supabase
        .from('pricing_plans')
        .select('id, display_name, price_xof, duration_months')
        .eq('id', planId)
        .maybeSingle()
      return data as
        | {
            id: string
            display_name: string
            price_xof: number
            duration_months: number
          }
        | null
    },
    enabled: !!planId,
    staleTime: 10 * 60_000,
  })

  const isLegacy = planId === 'legacy_annual'
  const startDate = subscription?.current_period_start ?? subscription?.created_at ?? null
  const endDate = subscription?.current_period_end ?? null

  // Fallback display name si la requête plan échoue ou si plan_id null.
  const planLabel =
    planQuery.data?.display_name ??
    (planId === 'annual'
      ? 'Annuel'
      : planId === 'semestrial'
        ? '6 mois'
        : isLegacy
          ? 'Annuel (ancien tarif)'
          : 'Membre du Club')

  const priceLabel = planQuery.data
    ? `${planQuery.data.price_xof.toLocaleString('fr-FR').replace(/ | /g, ' ')} FCFA / ${planQuery.data.duration_months} mois`
    : null

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
            Plan actuel
          </p>
          <p className="mt-1 font-display text-xl font-semibold tracking-tight">
            {planLabel}
          </p>
          {priceLabel && (
            <p className="mt-0.5 text-sm text-[var(--muted-foreground)]">
              {priceLabel}
            </p>
          )}
        </div>
        {isLegacy && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--or)]/15 px-3 py-1 text-xs font-medium text-[var(--or-deep)] ring-1 ring-[var(--or)]/30">
            🏆 Early Adopter — Tarif historique conservé
          </span>
        )}
      </div>

      <dl className="mt-5 grid grid-cols-1 gap-4 border-t border-[var(--border)] pt-5 sm:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-wider text-[var(--muted-foreground)]">
            Date de début
          </dt>
          <dd className="mt-1 text-sm font-medium">
            {startDate
              ? new Date(startDate).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })
              : '—'}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wider text-[var(--muted-foreground)]">
            Date de renouvellement
          </dt>
          <dd className="mt-1 text-sm font-medium">
            {endDate
              ? new Date(endDate).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })
              : '—'}
          </dd>
        </div>
      </dl>

      <p className="mt-5 text-xs text-[var(--muted-foreground)]">
        Tu seras notifié·e par email avant la fin de ta période. Le
        renouvellement automatique sera disponible dans une prochaine mise
        à jour.
      </p>
    </div>
  )
}

function StatTile({
  label,
  value,
  serifSmall,
  tone = 'neutral',
}: {
  label: string
  value: string
  /** Variante avec une police plus petite (pour les libellés non-numériques). */
  serifSmall?: boolean
  /** `emerald` : chiffre en émeraude vivant (pour les valeurs qui croissent
   *  — points, niveaux). `neutral` : noir sobre (défaut, pour le reste). */
  tone?: 'neutral' | 'emerald'
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-5">
      <p
        className={cn(
          'font-serif-number',
          serifSmall ? 'text-2xl sm:text-3xl' : 'text-3xl sm:text-4xl',
          tone === 'emerald'
            ? 'text-[var(--emerald-deep)]'
            : 'text-[var(--foreground)]',
        )}
      >
        {value}
      </p>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)] sm:text-xs">
        {label}
      </p>
    </div>
  )
}

function formatJoinedDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return ''
  }
}

function Section({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="mb-5">
        <h2 className="font-display text-lg font-semibold tracking-tight">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {description}
          </p>
        )}
      </div>
      <div className="space-y-5">{children}</div>
    </div>
  )
}

function PrefRow({
  label,
  hint,
  checked,
  onChange,
  disabled,
}: {
  label: string
  hint?: string
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-start gap-3 rounded-lg p-3 transition-colors hover:bg-[var(--secondary)]',
        disabled && 'cursor-wait opacity-70',
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="mt-0.5 h-4 w-4 cursor-pointer accent-[var(--primary)]"
      />
      <span className="flex-1">
        <span className="block text-sm font-medium">{label}</span>
        {hint && (
          <span className="mt-0.5 block text-xs text-[var(--muted-foreground)]">
            {hint}
          </span>
        )}
      </span>
    </label>
  )
}

// Limite côté client AVANT compression. Les images plus grandes sont rejetées.
const MAX_AVATAR_INPUT_MB = 5
// Limite côté Supabase Storage (bucket avatars). Si la photo COMPRESSÉE
// dépasse ça, on bloque avec un message clair plutôt que de laisser
// Supabase renvoyer une erreur cryptique.
const MAX_AVATAR_STORAGE_MB = 2

function AvatarUploader() {
  const user = useAuthStore((s) => s.user)
  const profile = useAuthStore((s) => s.profile)
  const refreshUserData = useAuthStore((s) => s.refreshUserData)
  const { confirm, ConfirmDialog } = useConfirm()

  const [phase, setPhase] = useState<
    'idle' | 'compressing' | 'uploading' | 'removing'
  >('idle')
  const inputRef = useRef<HTMLInputElement>(null)
  const busy = phase !== 'idle'

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !user) return
    if (file.size > MAX_AVATAR_INPUT_MB * 1024 * 1024) {
      toast.error(
        'Cette image est trop grande. Essaie une photo plus petite (max 5 Mo) ou utilise un format plus léger.',
      )
      e.target.value = ''
      return
    }
    setPhase('compressing')
    try {
      // Compresse à 800x800 max, JPEG quality 0.85
      const compressed = await compressImage(file, {
        maxWidthOrHeight: 800,
        maxSizeMB: 0.5,
        initialQuality: 0.85,
      })

      // Sécurité : si après compression on est encore au-dessus de la limite
      // côté Supabase Storage, on stoppe avec un message clair.
      if (compressed.size > MAX_AVATAR_STORAGE_MB * 1024 * 1024) {
        toast.error(
          'Image encore trop lourde après compression. Essaie une photo plus petite ou un format JPG.',
        )
        return
      }

      setPhase('uploading')
      // Upload toujours sur le même path → overwrite. On bust le cache via ?v=
      const path = `${user.id}/avatar.jpg`
      const { error } = await supabase.storage
        .from('avatars')
        .upload(path, compressed, {
          contentType: 'image/jpeg',
          upsert: true,
          cacheControl: '3600',
        })
      if (error) throw error

      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      const cacheBusted = `${data.publicUrl}?v=${Date.now()}`

      const { error: updErr } = await supabase
        .from('profiles')
        .update({ avatar_url: cacheBusted })
        .eq('id', user.id)
      if (updErr) throw updErr

      await refreshUserData()
      toast.success('Photo mise à jour.')
    } catch (err) {
      console.error(err)
      toast.error('Upload impossible. Réessaie.')
    } finally {
      setPhase('idle')
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function handleRemove() {
    if (!user || !profile?.avatar_url || busy) return
    const ok = await confirm({
      title: 'Supprimer ta photo de profil ?',
      description:
        "Tu pourras toujours en téléverser une nouvelle plus tard. En attendant, tes initiales s'afficheront dans les avatars.",
      confirmLabel: 'Supprimer',
      variant: 'destructive',
    })
    if (!ok) return
    setPhase('removing')
    try {
      // Supprime le fichier dans le bucket (best-effort) puis nettoie le profil
      await supabase.storage
        .from('avatars')
        .remove([`${user.id}/avatar.jpg`])
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', user.id)
      if (error) throw error
      await refreshUserData()
      toast.success('Photo supprimée.')
    } catch (err) {
      console.error(err)
      toast.error('Suppression impossible.')
    } finally {
      setPhase('idle')
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-5">
      <AvatarDisplay
        avatarUrl={profile?.avatar_url}
        firstName={profile?.first_name}
        lastName={profile?.last_name}
        email={user?.email}
        size="xl"
        isVerified={profile?.is_verified ?? false}
      />
      <div className="space-y-1.5">
        <p className="text-sm font-medium">
          {profile?.avatar_url ? 'Ta photo de profil' : 'Pas encore de photo'}
        </p>
        <p className="text-xs text-[var(--muted-foreground)]">
          Format recommandé : JPG ou PNG, max 5 Mo. Compressée automatiquement
          avant l'upload.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
          >
            {phase === 'compressing' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Optimisation de l'image…
              </>
            ) : phase === 'uploading' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Upload…
              </>
            ) : (
              <>
                <Camera className="h-4 w-4" />
                {profile?.avatar_url ? 'Changer ma photo' : 'Ajouter une photo'}
              </>
            )}
          </Button>
          {profile?.avatar_url && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              disabled={busy}
            >
              {phase === 'removing' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Supprimer
            </Button>
          )}
        </div>
      </div>
      <ConfirmDialog />
    </div>
  )
}
