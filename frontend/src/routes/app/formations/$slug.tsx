import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock,
  Download,
  ExternalLink,
  GraduationCap,
  Loader2,
  PlayCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth-store'
import {
  formatDuration,
  LEVEL_LABELS,
} from '@/lib/formation-helpers'
import type {
  ChapterResource,
  Formation,
  FormationChapter,
  UserFormationProgress,
} from '@/lib/database.types'
import { ProgressBar } from '@/components/formations/progress-bar'
import { ChapterList } from '@/components/formations/chapter-list'
import { ChapterPlayer } from '@/components/formations/chapter-player'
import { MarkdownRenderer } from '@/components/coach/markdown-renderer'
import { saveProgressKeepalive } from '@/lib/save-progress-keepalive'

export const Route = createFileRoute('/app/formations/$slug')({
  component: FormationDetailPage,
})

interface FormationData {
  formation: Formation
  chapters: FormationChapter[]
}

async function fetchFormationBySlug(slug: string): Promise<FormationData | null> {
  const { data: formation, error: fErr } = await supabase
    .from('formations')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()
  if (fErr) throw fErr
  if (!formation) return null

  const { data: chapters, error: cErr } = await supabase
    .from('formation_chapters')
    .select('*')
    .eq('formation_id', formation.id)
    .order('order_index', { ascending: true })
  if (cErr) throw cErr

  return {
    formation: formation as Formation,
    chapters: (chapters ?? []) as FormationChapter[],
  }
}

async function fetchProgressForFormation(
  userId: string,
  formationId: string,
): Promise<UserFormationProgress[]> {
  const { data, error } = await supabase
    .from('user_formation_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('formation_id', formationId)
  if (error) throw error
  return (data ?? []) as UserFormationProgress[]
}

function FormationDetailPage() {
  const { slug } = Route.useParams()
  const userId = useAuthStore((s) => s.user?.id)
  const queryClient = useQueryClient()

  const formationQuery = useQuery({
    queryKey: ['formation', slug],
    queryFn: () => fetchFormationBySlug(slug),
    staleTime: 5 * 60 * 1000,
  })

  const formation = formationQuery.data?.formation ?? null
  const chapters = formationQuery.data?.chapters ?? []

  const progressQuery = useQuery({
    queryKey: ['formation-progress', userId, formation?.id],
    queryFn: () => fetchProgressForFormation(userId!, formation!.id),
    enabled: Boolean(userId && formation?.id),
    staleTime: 30_000,
  })

  const progressByChapter = useMemo(() => {
    const m = new Map<string, UserFormationProgress>()
    for (const p of progressQuery.data ?? []) m.set(p.chapter_id, p)
    return m
  }, [progressQuery.data])

  const completedChapterIds = useMemo(() => {
    const s = new Set<string>()
    for (const p of progressQuery.data ?? []) {
      if (p.completed) s.add(p.chapter_id)
    }
    return s
  }, [progressQuery.data])

  const [activeChapterId, setActiveChapterId] = useState<string | null>(null)

  // IDs de chapitres pour lesquels l'utilisateur a re-cliqué alors qu'ils
  // étaient déjà complétés → on redémarre la lecture à 0 (revisite).
  const [resetChapterIds, setResetChapterIds] = useState<Set<string>>(
    () => new Set(),
  )

  // Dernière position reportée par le player, par chapitre. Sert au beforeunload
  // et à la sauvegarde lors d'un changement de chapitre.
  const lastTickRef = useRef<Map<string, number>>(new Map())

  // Sélectionne le chapitre par défaut : premier non complété, sinon premier
  useEffect(() => {
    if (!chapters.length || activeChapterId) return
    const firstIncomplete = chapters.find(
      (c) => !completedChapterIds.has(c.id),
    )
    setActiveChapterId(firstIncomplete?.id ?? chapters[0].id)
  }, [chapters, completedChapterIds, activeChapterId])

  const activeChapter =
    chapters.find((c) => c.id === activeChapterId) ?? null
  const activeIndex = chapters.findIndex((c) => c.id === activeChapterId)
  const isCompleted = activeChapter
    ? completedChapterIds.has(activeChapter.id)
    : false
  const completedCount = completedChapterIds.size
  const totalChapters = chapters.length
  const overallPct =
    totalChapters > 0
      ? Math.round((completedCount / totalChapters) * 100)
      : 0
  const isFullyCompleted = totalChapters > 0 && completedCount === totalChapters

  // Mutation : sauvegarde position vidéo
  const positionMutation = useMutation({
    mutationFn: async ({
      chapterId,
      seconds,
    }: {
      chapterId: string
      seconds: number
    }) => {
      if (!userId || !formation) return
      await supabase.from('user_formation_progress').upsert(
        {
          user_id: userId,
          formation_id: formation.id,
          chapter_id: chapterId,
          last_position_seconds: seconds,
        },
        { onConflict: 'user_id,chapter_id' },
      )
    },
  })

  // Mutation : toggle completed
  const completeMutation = useMutation({
    mutationFn: async ({
      chapterId,
      completed,
    }: {
      chapterId: string
      completed: boolean
    }) => {
      if (!userId || !formation) throw new Error('not-ready')
      const { error } = await supabase.from('user_formation_progress').upsert(
        {
          user_id: userId,
          formation_id: formation.id,
          chapter_id: chapterId,
          completed,
          completed_at: completed ? new Date().toISOString() : null,
        },
        { onConflict: 'user_id,chapter_id' },
      )
      if (error) throw error
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({
        queryKey: ['formation-progress', userId, formation?.id],
      })
      queryClient.invalidateQueries({
        queryKey: ['user-progress', userId],
      })
      queryClient.invalidateQueries({ queryKey: ['resume-formation', userId] })
      if (vars.completed) {
        const remaining = totalChapters - completedCount - 1
        if (remaining > 0) {
          toast.success(
            `Chapitre terminé ! Plus que ${remaining} chapitre${
              remaining > 1 ? 's' : ''
            }.`,
          )
        } else {
          toast.success('Bravo, tu as terminé la formation !')
        }
      }
    },
    onError: () => toast.error('Impossible de sauvegarder. Réessaie.'),
  })

  // Toast de félicitations la première fois qu'on atteint 100%
  const [celebratedFor, setCelebratedFor] = useState<string | null>(null)
  useEffect(() => {
    if (
      isFullyCompleted &&
      formation?.id &&
      celebratedFor !== formation.id
    ) {
      toast.success('Bravo ! Tu as terminé cette formation 🎉')
      setCelebratedFor(formation.id)
    }
  }, [isFullyCompleted, formation?.id, celebratedFor])

  // Sauve la position courante, puis change de chapitre.
  // Si la cible est un chapitre déjà complété ET différent du courant,
  // on remet la lecture à 0 (le membre veut le revoir depuis le début).
  const selectChapter = useCallback(
    (chapterId: string) => {
      if (chapterId === activeChapterId) return

      // Persiste la position courante avant de changer
      if (activeChapterId) {
        const lastSeconds = lastTickRef.current.get(activeChapterId) ?? 0
        if (lastSeconds > 0) {
          positionMutation.mutate({
            chapterId: activeChapterId,
            seconds: lastSeconds,
          })
        }
      }

      // Reset si le chapitre cible est terminé (revisite voulue)
      if (completedChapterIds.has(chapterId)) {
        setResetChapterIds((prev) => {
          if (prev.has(chapterId)) return prev
          const next = new Set(prev)
          next.add(chapterId)
          return next
        })
      }

      setActiveChapterId(chapterId)
    },
    [activeChapterId, completedChapterIds, positionMutation],
  )

  function navigateChapter(delta: 1 | -1) {
    const next = activeIndex + delta
    if (next >= 0 && next < chapters.length) {
      selectChapter(chapters[next].id)
    }
  }

  // Auto-complétion à 90% (tick player). Aucun effet si déjà complété.
  const handleAutoComplete = useCallback(() => {
    if (!activeChapter) return
    if (completedChapterIds.has(activeChapter.id)) return
    completeMutation.mutate({
      chapterId: activeChapter.id,
      completed: true,
    })
  }, [activeChapter, completedChapterIds, completeMutation])

  // Position de départ du player pour le chapitre actif :
  // - 0 si l'utilisateur a cliqué pour revisiter un chapitre terminé
  // - sinon la dernière position sauvegardée
  const playerStartSeconds = activeChapter
    ? resetChapterIds.has(activeChapter.id)
      ? 0
      : progressByChapter.get(activeChapter.id)?.last_position_seconds ?? 0
    : 0

  // Sauvegarde au beforeunload (fermeture brutale d'onglet) — best effort
  useEffect(() => {
    if (!userId || !formation) return
    const handler = () => {
      for (const [chapterId, seconds] of lastTickRef.current.entries()) {
        if (seconds > 0) {
          saveProgressKeepalive({
            userId,
            formationId: formation.id,
            chapterId,
            seconds,
          })
        }
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [userId, formation])

  // Sauvegarde quand le composant unmount (changement de page interne)
  useEffect(() => {
    return () => {
      if (!userId || !formation) return
      for (const [chapterId, seconds] of lastTickRef.current.entries()) {
        if (seconds > 0) {
          saveProgressKeepalive({
            userId,
            formationId: formation.id,
            chapterId,
            seconds,
          })
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, formation?.id])

  // Raccourcis clavier ← / → pour précédent / suivant.
  // Ignore si le focus est dans un champ de saisie.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
      const target = e.target as HTMLElement | null
      if (target) {
        const tag = target.tagName
        if (
          tag === 'INPUT' ||
          tag === 'TEXTAREA' ||
          tag === 'SELECT' ||
          target.isContentEditable
        ) {
          return
        }
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        navigateChapter(-1)
      } else {
        e.preventDefault()
        navigateChapter(1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, chapters.length, activeChapterId, completedChapterIds])

  if (formationQuery.isLoading) {
    return <DetailSkeleton />
  }
  if (formationQuery.isError || !formation) {
    return <NotFoundState />
  }

  return (
    <div className="pb-16">
      <div className="mx-auto max-w-6xl px-6 pt-8">
        <Button variant="outline" size="sm" asChild>
          <Link to="/app/formations">
            <ArrowLeft className="h-4 w-4" />
            Retour au catalogue
          </Link>
        </Button>
      </div>

      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm md:p-8"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[var(--primary)]/10 px-2.5 py-0.5 text-xs font-medium text-[var(--primary)]">
              {formation.category}
            </span>
            <span className="rounded-full border border-[var(--border)] px-2.5 py-0.5 text-xs font-medium text-[var(--muted-foreground)]">
              {LEVEL_LABELS[formation.level]}
            </span>
          </div>

          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight md:text-4xl">
            {formation.title}
          </h1>

          {formation.description && (
            <div className="mt-4 max-w-3xl text-[var(--muted-foreground)]">
              <MarkdownRenderer content={formation.description} />
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[var(--muted-foreground)]">
            <span className="inline-flex items-center gap-1.5">
              <PlayCircle className="h-4 w-4" />
              {totalChapters} chapitre{totalChapters > 1 ? 's' : ''}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {formatDuration(formation.duration_minutes)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <GraduationCap className="h-4 w-4" />
              {LEVEL_LABELS[formation.level]}
            </span>
          </div>

          {totalChapters > 0 && (
            <div className="mt-6 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--muted-foreground)]">
                  {completedCount}/{totalChapters} chapitre
                  {totalChapters > 1 ? 's' : ''} complétés
                </span>
                <span className="font-medium">{overallPct}%</span>
              </div>
              <ProgressBar value={overallPct} />
            </div>
          )}
        </motion.div>

        {totalChapters === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-10 text-center">
            <p className="text-[var(--muted-foreground)]">
              Cette formation n'a pas encore de chapitres.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[35%_1fr]">
            {/* Colonne gauche : liste chapitres */}
            <aside className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
              <h2 className="px-1 pb-2 text-sm font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                Chapitres
              </h2>
              <ChapterList
                chapters={chapters}
                activeChapterId={activeChapterId}
                completedChapterIds={completedChapterIds}
                onSelect={selectChapter}
              />
            </aside>

            {/* Colonne droite : player + détails */}
            <div className="space-y-6">
              {activeChapter ? (
                <>
                  <ChapterPlayer
                    chapter={activeChapter}
                    initialPositionSeconds={playerStartSeconds}
                    isCompleted={isCompleted}
                    onPositionTick={(seconds) => {
                      lastTickRef.current.set(activeChapter.id, seconds)
                      positionMutation.mutate({
                        chapterId: activeChapter.id,
                        seconds,
                      })
                    }}
                    onAutoComplete={handleAutoComplete}
                  />

                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
                    <p className="text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
                      Chapitre {activeIndex + 1} sur {totalChapters}
                    </p>
                    <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight">
                      {activeChapter.title}
                    </h2>
                    {activeChapter.duration_minutes > 0 && (
                      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                        {formatDuration(activeChapter.duration_minutes)}
                      </p>
                    )}

                    {activeChapter.description && (
                      <div className="mt-5">
                        <MarkdownRenderer
                          content={activeChapter.description}
                        />
                      </div>
                    )}

                    <div className="mt-6">
                      <Button
                        variant={isCompleted ? 'outline' : 'default'}
                        onClick={() =>
                          completeMutation.mutate({
                            chapterId: activeChapter.id,
                            completed: !isCompleted,
                          })
                        }
                        disabled={completeMutation.isPending}
                      >
                        {completeMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : isCompleted ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <Circle className="h-4 w-4" />
                        )}
                        {isCompleted
                          ? 'Marqué comme terminé'
                          : 'Marquer comme terminé'}
                      </Button>
                    </div>
                  </div>

                  <ResourcesSection resources={activeChapter.resources ?? []} />

                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      onClick={() => navigateChapter(-1)}
                      disabled={activeIndex <= 0}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Chapitre précédent
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => navigateChapter(1)}
                      disabled={activeIndex >= totalChapters - 1}
                    >
                      Chapitre suivant
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>

                </>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ResourcesSection({ resources }: { resources: ChapterResource[] }) {
  if (!resources || resources.length === 0) return null
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
      <h3 className="font-display text-base font-semibold tracking-tight">
        Ressources de ce chapitre
      </h3>
      <ul className="mt-4 space-y-2">
        {resources.map((r, i) => {
          const isExternal = !/\.(pdf|zip|csv|docx?|xlsx?|txt)(\?|$)/i.test(r.url)
          return (
            <li key={i}>
              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 rounded-lg border border-[var(--border)] p-3 transition-colors hover:border-[var(--primary)]/30 hover:bg-[var(--secondary)]"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
                  {isExternal ? (
                    <ExternalLink className="h-4 w-4" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                </span>
                <span className="flex-1 truncate text-sm font-medium">
                  {r.label}
                </span>
                <span className="text-xs text-[var(--muted-foreground)] group-hover:text-[var(--foreground)]">
                  {isExternal ? 'Ouvrir' : 'Télécharger'}
                </span>
              </a>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="h-9 w-48 animate-pulse rounded-md bg-[var(--secondary)]" />
      <div className="mt-6 space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8">
        <div className="h-6 w-1/3 animate-pulse rounded bg-[var(--secondary)]" />
        <div className="h-10 w-2/3 animate-pulse rounded bg-[var(--secondary)]" />
        <div className="h-4 w-full animate-pulse rounded bg-[var(--secondary)]" />
      </div>
    </div>
  )
}

function NotFoundState() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-20 text-center">
      <h1 className="font-display text-3xl font-semibold tracking-tight">
        Formation introuvable
      </h1>
      <p className="mt-3 text-[var(--muted-foreground)]">
        Elle a peut-être été dépubliée ou son lien a changé.
      </p>
      <Button asChild className="mt-6">
        <Link to="/app/formations">
          <ArrowLeft className="h-4 w-4" />
          Retour au catalogue
        </Link>
      </Button>
    </div>
  )
}
