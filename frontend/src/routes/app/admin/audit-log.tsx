import { useMemo, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale/fr'
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Filter,
  Loader2,
  ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { fetchPublicProfilesIn } from '@/lib/public-profile'
import { cn } from '@/lib/utils'
import { InitialsAvatar } from '@/components/initials-avatar'

export const Route = createFileRoute('/app/admin/audit-log')({
  component: AdminAuditLogPage,
})

interface AuditLogRow {
  id: string
  actor_id: string | null
  action: 'insert' | 'update' | 'delete'
  target_table: string
  target_id: string | null
  before: Record<string, unknown> | null
  after: Record<string, unknown> | null
  created_at: string
}

const PAGE_SIZE = 50

// Tables que le filtre propose. Tient à jour avec les triggers de la
// migration 0039 — ajouter ici quand on étend l'audit à d'autres tables.
const KNOWN_TABLES = [
  'formations',
  'news_articles',
  'events',
  'resources',
  'pricing_plans',
  'profiles.role',
] as const

async function fetchAuditLog(filterTable: string | null): Promise<AuditLogRow[]> {
  // Cast en `any` : admin_audit_log a été créé par la migration 0039,
  // les types Supabase locaux (`database.types.ts`) ne seront régénérés
  // qu'au prochain `supabase gen types typescript --project-id ...`.
  // En attendant, on bypasse le check de schéma sans masquer d'autre
  // erreur TS.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q = (supabase as any)
    .from('admin_audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE)
  if (filterTable) {
    q = q.eq('target_table', filterTable)
  }
  const { data, error } = await q
  if (error) throw error
  return (data ?? []) as AuditLogRow[]
}

function AdminAuditLogPage() {
  const [filterTable, setFilterTable] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const logQuery = useQuery({
    queryKey: ['admin-audit-log', filterTable],
    queryFn: () => fetchAuditLog(filterTable),
    staleTime: 30_000,
  })

  // Hydrate les profils des acteurs en bulk via la RPC sécurisée
  // (public_profiles_in retourne uniquement les colonnes safe — pas
  // d'email d'autres users qui fuiterait).
  const actorIds = useMemo(() => {
    const set = new Set<string>()
    for (const row of logQuery.data ?? []) {
      if (row.actor_id) set.add(row.actor_id)
    }
    return Array.from(set)
  }, [logQuery.data])

  const actorsQuery = useQuery({
    queryKey: ['public-profiles', actorIds.sort().join(',')],
    queryFn: () => fetchPublicProfilesIn(actorIds),
    enabled: actorIds.length > 0,
    staleTime: 5 * 60_000,
  })

  const actorMap = useMemo(() => {
    const m = new Map<
      string,
      { first_name: string | null; last_name: string | null }
    >()
    for (const a of actorsQuery.data ?? []) {
      m.set(a.id, { first_name: a.first_name, last_name: a.last_name })
    }
    return m
  }, [actorsQuery.data])

  function toggleExpanded(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 lg:py-14">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" asChild>
          <Link to="/app/admin">
            <ArrowLeft className="h-4 w-4" />
            Retour admin
          </Link>
        </Button>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
            Audit log admin
          </h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Trace append-only des actions critiques (création / modification /
            suppression) sur les contenus et les rôles. RLS limite la lecture
            aux admins.
          </p>
        </div>
      </div>

      {/* Filtre par table */}
      <div className="mt-8 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">
          <Filter className="h-3 w-3" />
          Filtrer
        </span>
        <button
          type="button"
          onClick={() => setFilterTable(null)}
          className={cn(
            'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
            filterTable === null
              ? 'border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]'
              : 'border-[var(--border)] bg-[var(--card)] hover:border-[var(--muted-foreground)]',
          )}
        >
          Toutes
        </button>
        {KNOWN_TABLES.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setFilterTable(t)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
              filterTable === t
                ? 'border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]'
                : 'border-[var(--border)] bg-[var(--card)] hover:border-[var(--muted-foreground)]',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Liste */}
      <div className="mt-6">
        {logQuery.isLoading ? (
          <div className="flex items-center justify-center py-12 text-sm text-[var(--muted-foreground)]">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Chargement…
          </div>
        ) : logQuery.isError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-900">
            Impossible de charger l'audit log. As-tu bien les droits admin ?
          </div>
        ) : (logQuery.data ?? []).length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-10 text-center">
            <p className="text-sm font-medium">Aucune entrée pour ce filtre.</p>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              L'audit log capture les nouvelles actions à partir d'aujourd'hui.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {(logQuery.data ?? []).map((row) => {
              const actor = row.actor_id ? actorMap.get(row.actor_id) : null
              const isOpen = expanded.has(row.id)
              return (
                <li
                  key={row.id}
                  className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)]"
                >
                  <button
                    type="button"
                    onClick={() => toggleExpanded(row.id)}
                    className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-[var(--secondary)]/50"
                  >
                    <span className="text-[var(--muted-foreground)]">
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </span>

                    {/* Acteur */}
                    <div className="flex min-w-0 items-center gap-2">
                      {actor ? (
                        <>
                          <InitialsAvatar
                            firstName={actor.first_name}
                            lastName={actor.last_name}
                            size="sm"
                          />
                          <span className="truncate text-sm font-medium">
                            {[actor.first_name, actor.last_name]
                              .filter(Boolean)
                              .join(' ') || 'Membre'}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--secondary)] text-[10px] font-bold text-[var(--muted-foreground)]">
                            SYS
                          </span>
                          <span className="text-sm text-[var(--muted-foreground)]">
                            Système
                          </span>
                        </>
                      )}
                    </div>

                    {/* Action badge */}
                    <ActionBadge action={row.action} />

                    {/* Cible */}
                    <span className="min-w-0 flex-1 truncate font-mono text-xs text-[var(--muted-foreground)]">
                      {row.target_table}
                      {row.target_id ? `#${row.target_id.slice(0, 8)}` : ''}
                    </span>

                    {/* Timestamp */}
                    <span className="shrink-0 text-xs text-[var(--muted-foreground)]">
                      {formatDistanceToNow(new Date(row.created_at), {
                        addSuffix: true,
                        locale: fr,
                      })}
                    </span>
                  </button>

                  {/* Détail expand : before / after en JSON */}
                  {isOpen && (
                    <div className="border-t border-[var(--border)] bg-[var(--background)] p-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">
                            Avant
                          </p>
                          <pre className="mt-2 max-h-64 overflow-auto rounded-lg border border-[var(--border)] bg-[var(--card)] p-3 text-[11px] leading-relaxed">
                            {row.before
                              ? JSON.stringify(row.before, null, 2)
                              : '(vide)'}
                          </pre>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">
                            Après
                          </p>
                          <pre className="mt-2 max-h-64 overflow-auto rounded-lg border border-[var(--border)] bg-[var(--card)] p-3 text-[11px] leading-relaxed">
                            {row.after
                              ? JSON.stringify(row.after, null, 2)
                              : '(vide)'}
                          </pre>
                        </div>
                      </div>
                      <p className="mt-3 font-mono text-[10px] text-[var(--muted-foreground)]">
                        id={row.id} · target={row.target_table}#{row.target_id}
                      </p>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <p className="mt-6 text-xs text-[var(--muted-foreground)]">
        {PAGE_SIZE} entrées max affichées. Pour une recherche plus avancée :
        Supabase SQL editor → table <code>admin_audit_log</code>.
      </p>
    </div>
  )
}

function ActionBadge({ action }: { action: 'insert' | 'update' | 'delete' }) {
  const config = {
    insert: { label: 'created', cls: 'bg-emerald-100 text-emerald-700' },
    update: { label: 'updated', cls: 'bg-amber-100 text-amber-700' },
    delete: { label: 'deleted', cls: 'bg-red-100 text-red-700' },
  }[action]
  return (
    <span
      className={cn(
        'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest',
        config.cls,
      )}
    >
      {config.label}
    </span>
  )
}
