import { useEffect, useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale/fr'
import {
  BadgeCheck,
  Loader2,
  Search,
  Shield,
  Users,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth-store'
import type { Profile, Subscription } from '@/lib/database.types'
import { InitialsAvatar } from '@/components/initials-avatar'
import { cn } from '@/lib/utils'
import { useConfirm } from '@/hooks/use-confirm'

export const Route = createFileRoute('/app/admin/members')({
  component: AdminMembersPage,
})

interface MemberRow extends Profile {
  posts_count: number
  comments_count: number
  subscription_status: Subscription['status'] | null
  /** Plan effectif de l'abonnement le plus récent (null si pas de sub). */
  plan_id: string | null
  /** ID de l'abonnement le plus récent (pour update manuel). */
  subscription_id: string | null
  /** Fin de la période courante de l'abonnement, si présente. */
  current_period_end: string | null
}

async function fetchMembers(): Promise<MemberRow[]> {
  const [profilesRes, postsRes, commentsRes, subsRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase.from('posts').select('user_id'),
    supabase.from('post_comments').select('user_id'),
    supabase
      .from('subscriptions')
      .select('id, user_id, status, plan_id, current_period_end, created_at')
      .order('created_at', { ascending: false }),
  ])
  if (profilesRes.error) throw profilesRes.error
  const postsByUser = new Map<string, number>()
  for (const p of postsRes.data ?? []) {
    postsByUser.set(
      p.user_id as string,
      (postsByUser.get(p.user_id as string) ?? 0) + 1,
    )
  }
  const commentsByUser = new Map<string, number>()
  for (const c of commentsRes.data ?? []) {
    commentsByUser.set(
      c.user_id as string,
      (commentsByUser.get(c.user_id as string) ?? 0) + 1,
    )
  }
  // Plus récent abonnement par user (les rows sont déjà order DESC).
  const latestSubByUser = new Map<
    string,
    {
      status: Subscription['status']
      plan_id: string | null
      subscription_id: string
      current_period_end: string | null
    }
  >()
  for (const s of subsRes.data ?? []) {
    const uid = s.user_id as string
    if (!latestSubByUser.has(uid)) {
      latestSubByUser.set(uid, {
        status: s.status as Subscription['status'],
        plan_id: (s.plan_id as string | null) ?? null,
        subscription_id: s.id as string,
        current_period_end: (s.current_period_end as string | null) ?? null,
      })
    }
  }
  return (profilesRes.data ?? []).map((p) => {
    const sub = latestSubByUser.get((p as Profile).id) ?? null
    return {
      ...(p as Profile),
      posts_count: postsByUser.get((p as Profile).id) ?? 0,
      comments_count: commentsByUser.get((p as Profile).id) ?? 0,
      subscription_status: sub?.status ?? null,
      plan_id: sub?.plan_id ?? null,
      subscription_id: sub?.subscription_id ?? null,
      current_period_end: sub?.current_period_end ?? null,
    }
  })
}

type Filter =
  | 'all'
  | 'active_sub'
  | 'verified'
  | 'admin'
  | 'plan_annual'
  | 'plan_semestrial'
  | 'plan_legacy'
type SortKey = 'created_at' | 'last_active_at' | 'name'

const PLAN_LABELS: Record<string, string> = {
  annual: 'Annuel',
  semestrial: '6 mois',
  legacy_annual: 'Legacy 79k',
}

const PLAN_DURATION_MONTHS: Record<string, number> = {
  annual: 12,
  semestrial: 6,
  legacy_annual: 12,
}

function AdminMembersPage() {
  const queryClient = useQueryClient()
  const myUserId = useAuthStore((s) => s.user?.id)
  const { confirm, ConfirmDialog } = useConfirm()

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [sortKey, setSortKey] = useState<SortKey>('created_at')
  const [activatingMember, setActivatingMember] = useState<MemberRow | null>(
    null,
  )

  const query = useQuery({
    queryKey: ['admin-members'],
    queryFn: fetchMembers,
    staleTime: 60_000,
  })

  const verifiedMutation = useMutation({
    mutationFn: async ({
      id,
      is_verified,
    }: {
      id: string
      is_verified: boolean
    }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_verified })
        .eq('id', id)
      if (error) throw error
    },
    onMutate: async ({ id, is_verified }) => {
      await queryClient.cancelQueries({ queryKey: ['admin-members'] })
      const prev = queryClient.getQueryData<MemberRow[]>(['admin-members'])
      if (prev) {
        queryClient.setQueryData<MemberRow[]>(
          ['admin-members'],
          prev.map((m) => (m.id === id ? { ...m, is_verified } : m)),
        )
      }
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(['admin-members'], ctx.prev)
      }
      toast.error('Modification impossible.')
    },
    onSuccess: (_data, vars) => {
      toast.success(vars.is_verified ? 'Membre certifié.' : 'Certification retirée.')
    },
  })

  const adminMutation = useMutation({
    mutationFn: async ({
      id,
      role,
    }: {
      id: string
      role: 'admin' | 'member'
    }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', id)
      if (error) throw error
    },
    onMutate: async ({ id, role }) => {
      await queryClient.cancelQueries({ queryKey: ['admin-members'] })
      const prev = queryClient.getQueryData<MemberRow[]>(['admin-members'])
      if (prev) {
        queryClient.setQueryData<MemberRow[]>(
          ['admin-members'],
          prev.map((m) => (m.id === id ? { ...m, role } : m)),
        )
      }
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(['admin-members'], ctx.prev)
      }
      toast.error('Modification impossible.')
    },
    onSuccess: (_data, vars) => {
      toast.success(
        vars.role === 'admin' ? 'Promu administrateur.' : 'Statut admin retiré.',
      )
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
    },
  })

  // Activation manuelle d'un abonnement.
  // Politique :
  //   - Si le membre a déjà une subscription : on UPDATE (statut → active,
  //     plan_id, period_start = now, period_end = now + duration).
  //   - Sinon on INSERT une nouvelle subscription complète.
  //   - duration_months est déduit du plan_id côté front (PLAN_DURATION_MONTHS)
  //     pour éviter un round-trip ; le serveur garde l'autorité sur les prix
  //     via pricing_plans.
  const activateMutation = useMutation({
    mutationFn: async (input: {
      member: MemberRow
      planId: 'annual' | 'semestrial' | 'legacy_annual'
    }) => {
      const months = PLAN_DURATION_MONTHS[input.planId] ?? 12
      const start = new Date()
      const end = new Date(start)
      end.setMonth(end.getMonth() + months)

      const payload = {
        plan_id: input.planId,
        status: 'active' as const,
        current_period_start: start.toISOString(),
        current_period_end: end.toISOString(),
      }

      if (input.member.subscription_id) {
        const { error } = await supabase
          .from('subscriptions')
          .update(payload)
          .eq('id', input.member.subscription_id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('subscriptions').insert({
          user_id: input.member.id,
          ...payload,
        })
        if (error) throw error
      }
    },
    onSuccess: (_data, vars) => {
      toast.success(
        `Abonnement activé : ${PLAN_LABELS[vars.planId] ?? vars.planId}.`,
      )
      queryClient.invalidateQueries({ queryKey: ['admin-members'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
      setActivatingMember(null)
    },
    onError: (err) => {
      console.error('[admin-members] activate error:', err)
      toast.error('Activation impossible. Réessaie.')
    },
  })

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    let list = (query.data ?? []).filter((m) => {
      const name =
        [m.first_name, m.last_name].filter(Boolean).join(' ') + ' ' + m.email
      if (q && !name.toLowerCase().includes(q)) return false
      if (filter === 'active_sub') {
        if (
          m.subscription_status !== 'active' &&
          m.subscription_status !== 'trialing'
        )
          return false
      }
      if (filter === 'verified' && !m.is_verified) return false
      if (filter === 'admin' && m.role !== 'admin') return false
      if (filter === 'plan_annual' && m.plan_id !== 'annual') return false
      if (filter === 'plan_semestrial' && m.plan_id !== 'semestrial') return false
      if (filter === 'plan_legacy' && m.plan_id !== 'legacy_annual') return false
      return true
    })
    list = [...list].sort((a, b) => {
      if (sortKey === 'name') {
        const an = (a.first_name ?? a.email).toLowerCase()
        const bn = (b.first_name ?? b.email).toLowerCase()
        return an.localeCompare(bn)
      }
      if (sortKey === 'last_active_at') {
        const at = a.last_active_at ? new Date(a.last_active_at).getTime() : 0
        const bt = b.last_active_at ? new Date(b.last_active_at).getTime() : 0
        return bt - at
      }
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    })
    return list
  }, [query.data, search, filter, sortKey])

  async function handleToggleAdmin(member: MemberRow) {
    if (member.id === myUserId && member.role === 'admin') {
      toast.error('Tu ne peux pas te démettre toi-même.')
      return
    }
    const promoting = member.role !== 'admin'
    if (promoting) {
      const fullName =
        [member.first_name, member.last_name].filter(Boolean).join(' ') ||
        member.email
      const ok = await confirm({
        title: 'Promouvoir ce membre administrateur ?',
        contentPreview: fullName,
        description:
          'Ce membre aura accès à toutes les fonctions admin : gestion du contenu, des membres, des abonnements et des paramètres de la plateforme.',
        confirmLabel: 'Promouvoir',
        variant: 'default',
        icon: Shield,
      })
      if (!ok) return
    }
    adminMutation.mutate({
      id: member.id,
      role: promoting ? 'admin' : 'member',
    })
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 lg:py-14">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/15 text-[var(--accent)]">
            <Users className="h-5 w-5" />
          </span>
          <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
            Gestion des membres
          </h1>
        </div>
        <p className="mt-3 max-w-2xl text-[var(--muted-foreground)]">
          Recherche, certifie et gère les rôles des membres du Club.
        </p>
      </motion.div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[260px] flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <Input
            type="search"
            placeholder="Rechercher par nom ou email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ['all', 'Tous'],
              ['active_sub', 'Abonnement actif'],
              ['plan_annual', 'Plan annuel'],
              ['plan_semestrial', 'Plan 6 mois'],
              ['plan_legacy', 'Legacy 79k'],
              ['verified', 'Certifiés'],
              ['admin', 'Admins'],
            ] as Array<[Filter, string]>
          ).map(([key, label]) => {
            const active = filter === key
            return (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-xs transition-colors',
                  active
                    ? 'border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]'
                    : 'border-[var(--border)] bg-[var(--card)] hover:border-[var(--muted-foreground)]',
                )}
              >
                {label}
              </button>
            )
          })}
        </div>
        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          className="h-9 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 text-xs"
        >
          <option value="created_at">Tri : Inscription</option>
          <option value="last_active_at">Tri : Dernière activité</option>
          <option value="name">Tri : Nom</option>
        </select>
        {(search || filter !== 'all') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch('')
              setFilter('all')
            }}
          >
            <X className="h-3.5 w-3.5" />
            Réinitialiser
          </Button>
        )}
      </div>

      <div className="mt-8">
        {query.isLoading ? (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 text-center text-sm text-[var(--muted-foreground)]">
            Chargement…
          </div>
        ) : query.isError ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-8 text-center">
            Impossible de charger les membres.
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-12 text-center">
            <p className="text-sm text-[var(--muted-foreground)]">
              {(query.data?.length ?? 0) === 0
                ? "Pas encore de membre dans le Club."
                : 'Aucun résultat.'}
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-[var(--border)] bg-[var(--background)] text-xs uppercase tracking-wider text-[var(--muted-foreground)]">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Membre</th>
                    <th className="px-4 py-3 text-left font-medium">
                      Inscription
                    </th>
                    <th className="px-4 py-3 text-left font-medium">
                      Activité
                    </th>
                    <th className="px-4 py-3 text-left font-medium">
                      Abonnement
                    </th>
                    <th className="px-4 py-3 text-left font-medium">
                      Plan
                    </th>
                    <th className="px-4 py-3 text-center font-medium">
                      Posts
                    </th>
                    <th className="px-4 py-3 text-center font-medium">
                      Coms.
                    </th>
                    <th className="px-4 py-3 text-center font-medium">
                      Certifié
                    </th>
                    <th className="px-4 py-3 text-center font-medium">
                      Admin
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((m) => {
                    const fullName =
                      [m.first_name, m.last_name].filter(Boolean).join(' ') ||
                      'Sans nom'
                    const isMe = m.id === myUserId
                    return (
                      <tr
                        key={m.id}
                        className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--secondary)]/30"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <InitialsAvatar
                              firstName={m.first_name}
                              lastName={m.last_name}
                              email={m.email}
                              size="sm"
                            />
                            <div className="min-w-0">
                              <p className="truncate font-medium">
                                {fullName}
                                {isMe && (
                                  <span className="ml-2 rounded-full bg-[var(--secondary)] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                                    Toi
                                  </span>
                                )}
                              </p>
                              <p className="truncate text-xs text-[var(--muted-foreground)]">
                                {m.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-[var(--muted-foreground)]">
                          {formatDistanceToNow(new Date(m.created_at), {
                            addSuffix: true,
                            locale: fr,
                          })}
                        </td>
                        <td className="px-4 py-3 text-xs text-[var(--muted-foreground)]">
                          {m.last_active_at
                            ? formatDistanceToNow(new Date(m.last_active_at), {
                                addSuffix: true,
                                locale: fr,
                              })
                            : 'Jamais'}
                        </td>
                        <td className="px-4 py-3">
                          <SubChip status={m.subscription_status} />
                        </td>
                        <td className="px-4 py-3">
                          <PlanCell
                            planId={m.plan_id}
                            onActivate={() => setActivatingMember(m)}
                            disabled={activateMutation.isPending}
                          />
                        </td>
                        <td className="px-4 py-3 text-center font-medium tabular-nums">
                          {m.posts_count}
                        </td>
                        <td className="px-4 py-3 text-center font-medium tabular-nums">
                          {m.comments_count}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <ToggleIcon
                            on={m.is_verified}
                            onClick={() =>
                              verifiedMutation.mutate({
                                id: m.id,
                                is_verified: !m.is_verified,
                              })
                            }
                            disabled={verifiedMutation.isPending}
                            ariaLabel="Toggle certifié"
                            iconOn={BadgeCheck}
                            iconOff={BadgeCheck}
                            onClassName="bg-[var(--accent)]/15 text-[var(--accent)]"
                            offClassName="bg-[var(--secondary)] text-[var(--muted-foreground)]"
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <ToggleIcon
                            on={m.role === 'admin'}
                            onClick={() => handleToggleAdmin(m)}
                            disabled={adminMutation.isPending}
                            ariaLabel="Toggle admin"
                            iconOn={Shield}
                            iconOff={Shield}
                            onClassName="bg-[var(--primary)]/10 text-[var(--primary)]"
                            offClassName="bg-[var(--secondary)] text-[var(--muted-foreground)]"
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog />
      <ActivateSubscriptionDialog
        member={activatingMember}
        onClose={() => setActivatingMember(null)}
        onConfirm={(planId) => {
          if (activatingMember) {
            activateMutation.mutate({
              member: activatingMember,
              planId,
            })
          }
        }}
        submitting={activateMutation.isPending}
      />
    </div>
  )
}

function PlanCell({
  planId,
  onActivate,
  disabled,
}: {
  planId: string | null
  onActivate: () => void
  disabled: boolean
}) {
  if (!planId) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onActivate}
        disabled={disabled}
      >
        Activer
      </Button>
    )
  }
  const tone =
    planId === 'annual'
      ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
      : planId === 'semestrial'
        ? 'bg-[var(--accent)]/15 text-[var(--accent)]'
        : 'bg-amber-100 text-amber-800'
  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
          tone,
        )}
      >
        {PLAN_LABELS[planId] ?? planId}
      </span>
      <button
        type="button"
        onClick={onActivate}
        disabled={disabled}
        className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:underline disabled:opacity-50"
      >
        Modifier
      </button>
    </div>
  )
}

function ActivateSubscriptionDialog({
  member,
  onClose,
  onConfirm,
  submitting,
}: {
  member: MemberRow | null
  onClose: () => void
  onConfirm: (planId: 'annual' | 'semestrial' | 'legacy_annual') => void
  submitting: boolean
}) {
  // Pré-sélection : 1) plan actuel s'il existe, 2) plan désiré au signup,
  // 3) annual par défaut (plan recommandé).
  const [selectedPlanId, setSelectedPlanId] = useState<
    'annual' | 'semestrial' | 'legacy_annual'
  >('annual')

  useEffect(() => {
    if (!member) return
    if (
      member.plan_id === 'annual' ||
      member.plan_id === 'semestrial' ||
      member.plan_id === 'legacy_annual'
    ) {
      setSelectedPlanId(member.plan_id)
      return
    }
    if (
      member.desired_plan_id === 'annual' ||
      member.desired_plan_id === 'semestrial'
    ) {
      setSelectedPlanId(member.desired_plan_id)
      return
    }
    setSelectedPlanId('annual')
  }, [member])

  // Échap + body lock
  useEffect(() => {
    if (!member) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) onClose()
    }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [member, submitting, onClose])

  if (!member) return null

  const fullName =
    [member.first_name, member.last_name].filter(Boolean).join(' ') ||
    member.email

  const months = PLAN_DURATION_MONTHS[selectedPlanId]
  const computedEnd = new Date()
  computedEnd.setMonth(computedEnd.getMonth() + months)

  return (
    <>
      <div
        className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
        onClick={submitting ? undefined : onClose}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none fixed inset-0 z-[61] flex items-end justify-center sm:items-center sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-label="Activer un abonnement"
      >
        <div className="pointer-events-auto flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-[var(--border)] bg-[var(--card)] shadow-2xl sm:rounded-2xl">
          <div className="flex shrink-0 items-start justify-between border-b border-[var(--border)] px-6 py-4">
            <div>
              <h2 className="font-display text-lg font-semibold tracking-tight">
                Activer un abonnement
              </h2>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                {fullName}
              </p>
            </div>
            {!submitting && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Fermer"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--secondary)]"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 space-y-3">
            {member.desired_plan_id && (
              <p className="rounded-lg bg-[var(--primary)]/10 px-3 py-2 text-xs text-[var(--primary)]">
                Le membre a indiqué vouloir le plan{' '}
                <strong>
                  {PLAN_LABELS[member.desired_plan_id] ??
                    member.desired_plan_id}
                </strong>{' '}
                à l'inscription.
              </p>
            )}

            <PlanRadio
              id="annual"
              label="Annuel — 99 000 FCFA"
              hint="12 mois · ~8 250 FCFA/mois ⭐ Recommandé"
              checked={selectedPlanId === 'annual'}
              onChange={() => setSelectedPlanId('annual')}
              disabled={submitting}
            />
            <PlanRadio
              id="semestrial"
              label="6 mois — 69 000 FCFA"
              hint="6 mois · ~11 500 FCFA/mois"
              checked={selectedPlanId === 'semestrial'}
              onChange={() => setSelectedPlanId('semestrial')}
              disabled={submitting}
            />
            <PlanRadio
              id="legacy_annual"
              label="Legacy 79 000 FCFA / an"
              hint="Réservé aux early adopters historiques"
              checked={selectedPlanId === 'legacy_annual'}
              onChange={() => setSelectedPlanId('legacy_annual')}
              disabled={submitting}
            />

            <p className="pt-2 text-xs text-[var(--muted-foreground)]">
              Renouvellement calculé&nbsp;:{' '}
              <strong>
                {computedEnd.toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </strong>
            </p>
          </div>

          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-[var(--border)] bg-[var(--background)] px-5 py-3">
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={submitting}
            >
              Annuler
            </Button>
            <Button
              onClick={() => onConfirm(selectedPlanId)}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Activation…
                </>
              ) : (
                'Activer'
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

function PlanRadio({
  id,
  label,
  hint,
  checked,
  onChange,
  disabled,
}: {
  id: string
  label: string
  hint: string
  checked: boolean
  onChange: () => void
  disabled: boolean
}) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors',
        checked
          ? 'border-[var(--primary)] bg-[var(--primary)]/5'
          : 'border-[var(--border)] hover:bg-[var(--secondary)]/40',
        disabled && 'cursor-not-allowed opacity-60',
      )}
    >
      <input
        type="radio"
        name="activate-plan"
        value={id}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="mt-1 h-4 w-4 cursor-pointer accent-[var(--primary)]"
      />
      <span className="flex-1">
        <span className="block text-sm font-medium">{label}</span>
        <span className="mt-0.5 block text-xs text-[var(--muted-foreground)]">
          {hint}
        </span>
      </span>
    </label>
  )
}

function SubChip({ status }: { status: Subscription['status'] | null }) {
  if (!status) {
    return (
      <span className="rounded-full bg-[var(--secondary)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
        Aucun
      </span>
    )
  }
  const map: Record<Subscription['status'], { bg: string; fg: string }> = {
    active: { bg: 'bg-emerald-100', fg: 'text-emerald-700' },
    trialing: { bg: 'bg-blue-100', fg: 'text-blue-700' },
    past_due: { bg: 'bg-orange-100', fg: 'text-orange-700' },
    canceled: { bg: 'bg-[var(--secondary)]', fg: 'text-[var(--muted-foreground)]' },
    incomplete: { bg: 'bg-orange-100', fg: 'text-orange-700' },
    unpaid: { bg: 'bg-red-100', fg: 'text-red-700' },
  }
  const styles = map[status]
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
        styles.bg,
        styles.fg,
      )}
    >
      {status}
    </span>
  )
}

function ToggleIcon({
  on,
  onClick,
  disabled,
  ariaLabel,
  iconOn: IconOn,
  iconOff: IconOff,
  onClassName,
  offClassName,
}: {
  on: boolean
  onClick: () => void
  disabled?: boolean
  ariaLabel: string
  iconOn: typeof BadgeCheck
  iconOff: typeof BadgeCheck
  onClassName: string
  offClassName: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-pressed={on}
      className={cn(
        'inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors disabled:opacity-50',
        on ? onClassName : offClassName,
      )}
    >
      {disabled ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : on ? (
        <IconOn className="h-4 w-4" />
      ) : (
        <IconOff className="h-4 w-4 opacity-40" />
      )}
    </button>
  )
}
