import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Check,
  ChevronRight,
  ExternalLink,
  GraduationCap,
  Info,
  Loader2,
  Lock,
  Sparkles,
  Trophy,
} from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MarkdownRenderer } from '@/components/coach/markdown-renderer'
import { cn } from '@/lib/utils'

interface TaskItem {
  id: string
  label: string
  optional: boolean
}

interface ChallengeWeek {
  id: string
  week_number: number
  title: string
  description: string
  tasks: TaskItem[]
  is_active: boolean
}

interface ChallengeSubmission {
  id: string
  user_id: string
  challenge_week_id: string
  project_name: string
  deliverable_url: string | null
  deliverable_description: string
  post_id: string | null
  completed_tasks: string[]
  created_at: string
}

export function WeeklyChallenges() {
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const profile = useAuthStore((s) => s.profile)

  const [selectedWeekNum, setSelectedWeekNum] = useState<number>(1)
  const [projectName, setProjectName] = useState('')
  const [deliverableUrl, setDeliverableUrl] = useState('')
  const [description, setDescription] = useState('')
  const [checkedTasks, setCheckedTasks] = useState<Record<string, boolean>>({})

  // 1. Fetch challenge weeks
  const weeksQuery = useQuery<ChallengeWeek[]>({
    queryKey: ['challenge-weeks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('challenge_weeks')
        .select('*')
        .order('week_number', { ascending: true })
      if (error) throw error
      return data ?? []
    },
    staleTime: 10 * 60 * 1000,
  })

  // 2. Fetch submissions
  const submissionsQuery = useQuery<ChallengeSubmission[]>({
    queryKey: ['challenge-submissions', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('challenge_submissions')
        .select('*')
        .eq('user_id', user!.id)
      if (error) throw error
      return data ?? []
    },
    enabled: !!user?.id,
    staleTime: 30_000,
  })

  const weeks = weeksQuery.data ?? []
  const submissions = submissionsQuery.data ?? []

  const activeWeek = weeks.find((w) => w.week_number === selectedWeekNum)
  const activeSubmission = submissions.find((s) => s.challenge_week_id === activeWeek?.id)

  // Pre-fill project name from user's last submission if any
  useEffect(() => {
    if (submissions.length > 0 && !projectName) {
      // Find the most recent submission and extract project_name
      const sorted = [...submissions].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      setProjectName(sorted[0].project_name)
    }
  }, [submissions, projectName])

  // Load checkboxes state from local storage or submission database
  useEffect(() => {
    if (!activeWeek) return

    if (activeSubmission) {
      const dbChecked: Record<string, boolean> = {}
      for (const tId of activeSubmission.completed_tasks || []) {
        dbChecked[tId] = true
      }
      setCheckedTasks(dbChecked)
    } else {
      const storageKey = `leclubia-challenge-w${activeWeek.week_number}-tasks`
      try {
        const stored = localStorage.getItem(storageKey)
        if (stored) {
          setCheckedTasks(JSON.parse(stored))
        } else {
          setCheckedTasks({})
        }
      } catch {
        setCheckedTasks({})
      }
    }
  }, [activeWeek, activeSubmission])

  const toggleTask = (taskId: string) => {
    if (activeSubmission) return // cannot toggle if already submitted

    const newChecked = { ...checkedTasks, [taskId]: !checkedTasks[taskId] }
    setCheckedTasks(newChecked)

    if (activeWeek) {
      const storageKey = `leclubia-challenge-w${activeWeek.week_number}-tasks`
      localStorage.setItem(storageKey, JSON.stringify(newChecked))
    }
  }

  // 3. Submit Challenge Mutation
  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !activeWeek) return

      const checkedTaskIds = Object.keys(checkedTasks).filter((k) => checkedTasks[k])
      
      // Validation check: mandatory tasks must be checked
      const mandatoryTasks = activeWeek.tasks.filter((t) => !t.optional)
      const missingMandatory = mandatoryTasks.filter((t) => !checkedTasks[t.id])
      if (missingMandatory.length > 0) {
        throw new Error("Tu dois cocher toutes les tâches obligatoires avant de soumettre !")
      }

      // Format post content (HTML format for Tiptap compat)
      const sanitizedDesc = description.replace(/\n/g, '<br />')
      const linkHtml = deliverableUrl.trim() 
        ? `<p>🔗 Réalisation : <a href="${deliverableUrl.trim()}" target="_blank" rel="noopener noreferrer">${deliverableUrl.trim()}</a></p>`
        : ''
      const postContent = `
        <p>🎯 <strong>Challenge Semaine ${activeWeek.week_number} relevé !</strong></p>
        <p>💡 Projet : <strong>${projectName.trim()}</strong></p>
        ${linkHtml}
        <br />
        <p>${sanitizedDesc}</p>
      `

      // A. Create the post in the community
      const { data: post, error: postErr } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: postContent,
          challenge_week_number: activeWeek.week_number,
          challenge_project_name: projectName.trim(),
        })
        .select('id')
        .single()

      if (postErr) throw postErr

      // B. Create the submission record
      const { error: subErr } = await supabase
        .from('challenge_submissions')
        .insert({
          user_id: user.id,
          challenge_week_id: activeWeek.id,
          project_name: projectName.trim(),
          deliverable_url: deliverableUrl.trim() || null,
          deliverable_description: description.trim(),
          post_id: post.id,
          completed_tasks: checkedTaskIds,
        })

      if (subErr) throw subErr
    },
    onSuccess: () => {
      toast.success("Challenge validé ! +20 points obtenus 🎉")
      // Invalidate queries to refresh state
      queryClient.invalidateQueries({ queryKey: ['challenge-submissions'] })
      queryClient.invalidateQueries({ queryKey: ['community-feed'] })
      queryClient.invalidateQueries({ queryKey: ['my-points'] })
      setDescription('')
      setDeliverableUrl('')
    },
    onError: (err: any) => {
      toast.error(err.message || "Impossible de soumettre ton livrable. Réessaye.")
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (submitMutation.isPending) return
    submitMutation.mutate()
  }

  if (weeksQuery.isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
      </div>
    )
  }

  return (
    <div className="mt-8 space-y-6">
      {/* 8-Week horizontal selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-gray-200">
        {weeks.map((w) => {
          const isSubmitted = submissions.some((s) => s.challenge_week_id === w.id)
          const isSelected = selectedWeekNum === w.week_number

          return (
            <button
              key={w.id}
              type="button"
              onClick={() => setSelectedWeekNum(w.week_number)}
              className={cn(
                'relative flex h-14 w-28 shrink-0 flex-col items-center justify-center rounded-xl border text-xs font-semibold transition-all',
                isSelected
                  ? 'border-[var(--primary)] bg-[var(--primary)] text-white shadow-sm'
                  : 'border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:border-[var(--muted-foreground)]/30',
              )}
            >
              <span>Semaine {w.week_number}</span>
              {isSubmitted && (
                <span className={cn(
                  'absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] text-white shadow-sm',
                  isSelected ? 'bg-emerald-500' : 'bg-emerald-600'
                )}>
                  <Check className="h-3 w-3" />
                </span>
              )}
            </button>
          )
        })}
      </div>

      <AnimatePresence mode="wait">
        {activeWeek && (
          <motion.div
            key={activeWeek.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            {/* Challenge Consigne Header */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm relative overflow-hidden">
              <div className="absolute -right-12 -top-12 h-24 w-24 rounded-full bg-[var(--primary)]/5 blur-xl pointer-events-none" />
              
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-[var(--primary)]/10 px-2.5 py-0.5 text-xs font-bold text-[var(--primary)]">
                  Semaine {activeWeek.week_number}
                </span>
                <span className="text-xs text-[var(--muted-foreground)]">Objectif hebdomadaire</span>
              </div>

              <h2 className="mt-2 font-display text-xl font-bold tracking-tight text-[var(--foreground)] sm:text-2xl">
                {activeWeek.title}
              </h2>

              <div className="mt-4 text-sm text-[var(--muted-foreground)] leading-relaxed max-w-none prose dark:prose-invert">
                <MarkdownRenderer content={activeWeek.description} />
              </div>
            </div>

            {/* Checklist tasks section */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
              <h3 className="font-display text-sm font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                Tâches à accomplir
              </h3>

              <div className="mt-4 space-y-3">
                {activeWeek.tasks.map((task) => {
                  const isChecked = Boolean(checkedTasks[task.id])
                  return (
                    <button
                      key={task.id}
                      type="button"
                      disabled={Boolean(activeSubmission)}
                      onClick={() => toggleTask(task.id)}
                      className={cn(
                        'flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-all',
                        isChecked
                          ? 'border-emerald-500/30 bg-emerald-50/10'
                          : 'border-[var(--border)] bg-[var(--card)] hover:border-[var(--muted-foreground)]/30',
                        activeSubmission ? 'cursor-default opacity-85' : 'cursor-pointer'
                      )}
                    >
                      <span className={cn(
                        'flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors mt-0.5',
                        isChecked
                          ? 'border-emerald-600 bg-emerald-600 text-white'
                          : 'border-[var(--border)] bg-[var(--card)]'
                      )}>
                        {isChecked && <Check className="h-3.5 w-3.5" />}
                      </span>
                      <div className="flex-1 text-sm font-medium">
                        <span className={cn(isChecked && 'text-[var(--muted-foreground)] line-through')}>
                          {task.label}
                        </span>
                        {task.optional && (
                          <span className="ml-2 rounded bg-gray-100 dark:bg-zinc-800 px-1.5 py-0.5 text-[10px] font-semibold text-[var(--muted-foreground)] uppercase">
                            Optionnel
                          </span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Submission card or Form */}
            {activeSubmission ? (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-50/5 p-6 shadow-sm relative overflow-hidden">
                <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />
                
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                    <Trophy className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-display text-base font-bold text-emerald-800 dark:text-emerald-400">
                      Challenge validé ! 🎉
                    </h3>
                    <p className="text-xs text-emerald-600 dark:text-emerald-500">
                      Tu as obtenu +20 points pour ton classement mensuel.
                    </p>
                  </div>
                </div>

                <div className="mt-6 border-t border-emerald-500/10 pt-4 space-y-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700/60 dark:text-emerald-500/60">
                      Nom du projet
                    </span>
                    <p className="text-sm font-semibold text-[var(--foreground)] mt-0.5">
                      {activeSubmission.project_name}
                    </p>
                  </div>

                  {activeSubmission.deliverable_url && (
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700/60 dark:text-emerald-500/60">
                        Lien du livrable
                      </span>
                      <p className="mt-0.5">
                        <a
                          href={activeSubmission.deliverable_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--primary)] hover:underline dark:text-sky-400"
                        >
                          {activeSubmission.deliverable_url}
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </p>
                    </div>
                  )}

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700/60 dark:text-emerald-500/60">
                      Ce que tu as fait
                    </span>
                    <p className="text-sm text-[var(--foreground)] mt-1 whitespace-pre-line leading-relaxed">
                      {activeSubmission.deliverable_description}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary)]/5 text-[var(--primary)]">
                    <Sparkles className="h-4 w-4" />
                  </span>
                  <h3 className="font-display text-base font-bold">
                    Soumettre mon livrable
                  </h3>
                </div>
                
                <p className="text-xs text-[var(--muted-foreground)] max-w-md leading-relaxed">
                  Soumets ton travail de la semaine pour motiver la communauté. Cela créera automatiquement un post dans le fil général et créditera ton compte de 20 points.
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="project_name" className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                      Nom de ton projet
                    </label>
                    <Input
                      id="project_name"
                      required
                      placeholder="Ex: SaaS Facturation IA"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="deliverable_url" className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                      Lien du livrable (Optionnel)
                    </label>
                    <Input
                      id="deliverable_url"
                      type="url"
                      placeholder="Ex: https://mon-saas.com"
                      value={deliverableUrl}
                      onChange={(e) => setDeliverableUrl(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="description" className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                    Ce que tu as accompli cette semaine
                  </label>
                  <textarea
                    id="description"
                    required
                    rows={4}
                    placeholder="Partage ton retour d'expérience : quels outils tu as utilisé, les difficultés surmontées..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm font-medium transition-all focus:border-[var(--primary)]/40 focus:outline-none focus:ring-4 focus:ring-[var(--primary)]/5 hover:border-[var(--muted-foreground)]/30"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={submitMutation.isPending}
                  className="w-full py-6 rounded-xl bg-[var(--primary)] text-white font-semibold transition-all hover:bg-[var(--primary-light)] active:scale-[0.98] shadow-sm flex items-center justify-center gap-2 group"
                >
                  {submitMutation.isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      Valider le challenge et publier (+20 points)
                      <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </Button>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
