import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
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
  Star,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth-store'
import { useCoachStore } from '@/stores/coach-store'
import {
  formatDuration,
  LEVEL_LABELS,
} from '@/lib/formation-helpers'
import { getResourceSignedUrl } from '@/lib/resource-helpers'
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
import { useChapterProgressTracker } from '@/lib/use-chapter-progress-tracker'
import { FormationReviewModal } from '@/components/formations/formation-review-modal'

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

async function fetchUserReviews(userId: string, formationId: string) {
  const { data, error } = await supabase
    .from('formation_reviews')
    .select('*')
    .eq('user_id', userId)
    .eq('formation_id', formationId)
  if (error) throw error
  return data
}

function FormationDetailPage() {
  const { slug } = Route.useParams()
  const userId = useAuthStore((s) => s.user?.id)
  const refreshHistory = useCoachStore((s) => s.refreshHistory)
  const refreshQuota = useCoachStore((s) => s.refreshQuota)
  const setContext = useCoachStore((s) => s.setContext)

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

  // Charge stats coach à l'arrivée sur la page + set context
  useEffect(() => {
    void refreshHistory()
    void refreshQuota()
    
    if (formation?.title) {
      setContext(`Formation : ${formation.title}`)
    }
    
    return () => {
      setContext(null)
    }
  }, [refreshHistory, refreshQuota, formation?.title, setContext])

  const progressByChapter = useMemo(() => {
    const m = new Map<string, UserFormationProgress>()
    for (const p of progressQuery.data ?? []) m.set(p.chapter_id, p)
    return m
  }, [progressQuery.data])

  const progressPercentByChapter = useMemo(() => {
    const m = new Map<string, number>()
    for (const p of progressQuery.data ?? []) {
      m.set(p.chapter_id, p.progress_percent ?? 0)
    }
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

  // Gestion de l'avis formation. Une seule modale, déclenchée uniquement
  // quand la formation atteint 100 % ET que le membre n'a pas encore
  // donné d'avis. Plus de modale par chapitre — jugée trop intrusive.
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  // Une seule auto-ouverture par session, même si l'utilisateur ferme et
  // qu'il revient sur la page. Pour redonner son avis, il doit utiliser
  // le bouton manuel "Donner mon avis".
  const [autoTriggeredThisSession, setAutoTriggeredThisSession] =
    useState(false)

  const closeReviewModal = useCallback(() => {
    setReviewModalOpen(false)
  }, [])

  const reviewsQuery = useQuery({
    queryKey: ['formation-reviews', userId, formation?.id],
    queryFn: () => fetchUserReviews(userId!, formation!.id),
    enabled: Boolean(userId && formation?.id),
    staleTime: 60_000,
  })

  // Le membre a-t-il déjà laissé un avis formation (chapter_id null) ?
  const hasFormationReview = useMemo(() => {
    return (reviewsQuery.data ?? []).some((r) => !r.chapter_id)
  }, [reviewsQuery.data])

  // IDs de chapitres pour lesquels l'utilisateur a re-cliqué alors qu'ils
  // étaient déjà complétés → on redémarre la lecture à 0 (revisite).
  const [resetChapterIds, setResetChapterIds] = useState<Set<string>>(
    () => new Set(),
  )

  // Dernière position reportée par le player, par chapitre. Sert au beforeunload
  // et à la sauvegarde lors d'un changement de chapitre.
  const lastTickRef = useRef<Map<string, number>>(new Map())

  // Sélectionne le chapitre par défaut :
  // 1. Le dernier chapitre consulté (basé sur updated_at le plus récent)
  // 2. Sinon le premier non complété
  // 3. Sinon le tout premier chapitre
  useEffect(() => {
    if (!chapters.length || activeChapterId || !progressQuery.isSuccess) return

    const progressData = progressQuery.data ?? []
    
    // 1. Chercher le plus récent
    if (progressData.length > 0) {
      const sorted = [...progressData].sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
      )
      const lastId = sorted[0].chapter_id
      if (chapters.some((c) => c.id === lastId)) {
        setActiveChapterId(lastId)
        return
      }
    }

    // 2. Fallback : premier incomplet
    const firstIncomplete = chapters.find(
      (c) => !completedChapterIds.has(c.id),
    )
    setActiveChapterId(firstIncomplete?.id ?? chapters[0].id)
  }, [chapters, completedChapterIds, activeChapterId, progressQuery.isSuccess, progressQuery.data])

  const activeChapter =
    chapters.find((c) => c.id === activeChapterId) ?? null
  const activeIndex = chapters.findIndex((c) => c.id === activeChapterId)
  const isCompleted = activeChapter
    ? completedChapterIds.has(activeChapter.id)
    : false
  const completedCount = completedChapterIds.size
  const totalChapters = chapters.length
  // Pourcentage global = moyenne des pct chapitre (chapitres sans
  // progression comptent comme 0). Cohérent avec la RPC catalogue.
  const overallPct = useMemo(() => {
    if (totalChapters === 0) return 0
    let sum = 0
    for (const c of chapters) {
      sum += progressByChapter.get(c.id)?.progress_percent ?? 0
    }
    return Math.round(sum / totalChapters)
  }, [chapters, progressByChapter, totalChapters])
  const isFullyCompleted = totalChapters > 0 && completedCount === totalChapters

  // Toast déclenché à la transition non-completed → completed (que ce
  // soit auto à 90% ou via le bouton manuel).
  const handleJustCompleted = useCallback(() => {
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
  }, [totalChapters, completedCount])

  // Tracker : centralise update_chapter_progress() avec throttle 5 s,
  // anti-régression et invalidation des queries (catalogue + détail).
  const tracker = useChapterProgressTracker({
    chapterId: activeChapterId,
    formationId: formation?.id ?? null,
    initialPercent:
      progressByChapter.get(activeChapterId ?? '')?.progress_percent ?? 0,
    isCompleted: activeChapterId
      ? completedChapterIds.has(activeChapterId)
      : false,
    onJustCompleted: handleJustCompleted,
  })

  const [markPending, setMarkPending] = useState(false)
  const handleManualComplete = useCallback(async () => {
    if (markPending) return
    setMarkPending(true)
    try {
      await tracker.markComplete()
    } catch {
      toast.error('Impossible de sauvegarder. Réessaie.')
    } finally {
      setMarkPending(false)
    }
  }, [markPending, tracker])

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

  // Auto-déclenchement du modal d'avis — uniquement à 100 % formation,
  // jamais à la fin d'un chapitre individuel. Garde-fous :
  //  - reviewsQuery.isSuccess : on attend d'avoir la réponse serveur sur
  //    l'éventuel avis existant avant de potentiellement ouvrir le modal
  //    (sinon flash d'ouverture suivi de fermeture si un avis existe déjà).
  //  - hasFormationReview : pas de réouverture si le membre a déjà donné
  //    son avis (à la place on affiche la pill "Avis donné").
  //  - autoTriggeredThisSession : 1× max par session, même si la session
  //    re-navigue et revient sur la page. Pour redonner son avis, le
  //    membre utilise le bouton manuel "Donner mon avis".
  useEffect(() => {
    if (!isFullyCompleted) return
    if (!reviewsQuery.isSuccess) return
    if (hasFormationReview) return
    if (autoTriggeredThisSession) return
    if (reviewModalOpen) return

    const timer = setTimeout(() => {
      setReviewModalOpen(true)
      setAutoTriggeredThisSession(true)
    }, 1500)
    return () => clearTimeout(timer)
  }, [
    isFullyCompleted,
    reviewsQuery.isSuccess,
    hasFormationReview,
    autoTriggeredThisSession,
    reviewModalOpen,
  ])

  // Sauve la position courante, puis change de chapitre.
  // Si la cible est un chapitre déjà complété ET différent du courant,
  // on remet la lecture à 0 (le membre veut le revoir depuis le début).
  const selectChapter = useCallback(
    (chapterId: string) => {
      if (chapterId === activeChapterId) return

      // Flush une dernière fois la position avant de switcher.
      if (activeChapterId) {
        const lastSeconds = lastTickRef.current.get(activeChapterId) ?? 0
        if (lastSeconds > 0) {
          tracker.flushFinal(lastSeconds)
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
    [activeChapterId, completedChapterIds, tracker],
  )

  function navigateChapter(delta: 1 | -1) {
    const next = activeIndex + delta
    if (next >= 0 && next < chapters.length) {
      selectChapter(chapters[next].id)
    }
  }

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

          {/* CTA avis — visible uniquement quand la formation est 100 %
              terminée. Bouton si pas encore d'avis, pill "Avis donné"
              sinon. Reste de l'écran inchangé. */}
          {isFullyCompleted && (
            <div className="mt-5 flex flex-wrap items-center gap-3">
              {hasFormationReview ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-[var(--bleu-ciel)]/15 px-4 py-2 text-sm font-medium text-[var(--bleu-ciel-deep)] ring-1 ring-[var(--bleu-ciel)]/25">
                  <CheckCircle2 className="h-4 w-4" />
                  Avis donné
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--bleu-ciel)] px-5 py-2.5 text-sm font-semibold text-[var(--bleu-ciel-foreground)] shadow-sm transition-all hover:bg-[var(--bleu-ciel-soft)] active:scale-95"
                >
                  <Star className="h-4 w-4" />
                  Donner mon avis
                </button>
              )}
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
                progressByChapterId={progressPercentByChapter}
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
                    onProgressTick={(seconds, duration) => {
                      lastTickRef.current.set(activeChapter.id, seconds)
                      tracker.reportProgress(seconds, duration)
                    }}
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
                        onClick={handleManualComplete}
                        disabled={markPending || isCompleted}
                      >
                        {markPending ? (
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

      {formation && userId && (
        <FormationReviewModal
          isOpen={reviewModalOpen}
          onClose={closeReviewModal}
          formationId={formation.id}
          formationTitle={formation.title}
          userId={userId}
        />
      )}
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
        {resources.map((r, i) => (
          <ResourceLink key={i} resource={r} />
        ))}
      </ul>
    </div>
  )
}

function ResourceLink({ resource }: { resource: ChapterResource }) {
  const isFile = Boolean(resource.path)
  // Pour les ressources uploadées : on régénère une signed URL à
  // l'arrivée du composant pour ne pas tomber sur une URL expirée
  // stockée en JSONB (les signed URLs sont valides 24h max).
  // getResourceSignedUrl() a son propre cache localStorage 1h, donc on
  // ne refait pas un round-trip à chaque navigation entre chapitres.
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(
    isFile ? null : resource.url,
  )
  const [resolving, setResolving] = useState(isFile)

  useEffect(() => {
    if (!isFile || !resource.path) {
      setResolvedUrl(resource.url)
      setResolving(false)
      return
    }
    let cancelled = false
    setResolving(true)
    getResourceSignedUrl(resource.path)
      .then((url) => {
        if (!cancelled) {
          setResolvedUrl(url)
          setResolving(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          // Fallback sur l'URL stockée — peut être expirée mais c'est
          // mieux que rien.
          setResolvedUrl(resource.url || null)
          setResolving(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [isFile, resource.path, resource.url])

  const isExternal =
    !isFile &&
    !/\.(pdf|zip|csv|docx?|xlsx?|txt)(\?|$)/i.test(resource.url)

  const Icon = isFile || !isExternal ? Download : ExternalLink
  const actionLabel = isFile || !isExternal ? 'Télécharger' : 'Ouvrir'

  return (
    <li>
      <a
        href={resolvedUrl ?? '#'}
        target="_blank"
        rel="noopener noreferrer"
        aria-disabled={resolving || !resolvedUrl}
        onClick={(e) => {
          if (resolving || !resolvedUrl) e.preventDefault()
        }}
        className="group flex items-center gap-3 rounded-lg border border-[var(--border)] p-3 transition-colors hover:border-[var(--primary)]/30 hover:bg-[var(--secondary)] aria-disabled:cursor-not-allowed aria-disabled:opacity-60"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
          {resolving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Icon className="h-4 w-4" />
          )}
        </span>
        <span className="flex-1 truncate text-sm font-medium">
          {resource.label}
        </span>
        <span className="text-xs text-[var(--muted-foreground)] group-hover:text-[var(--foreground)]">
          {resolving ? '…' : actionLabel}
        </span>
      </a>
    </li>
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
