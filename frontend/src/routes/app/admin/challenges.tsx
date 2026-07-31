import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale/fr'
import {
  CalendarDays,
  CheckCircle2,
  Edit,
  ExternalLink,
  Loader2,
  MessageSquare,
  Plus,
  Trash2,
  Trophy,
  Users,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AvatarDisplay } from '@/components/avatar-display'
import { useConfirm } from '@/hooks/use-confirm'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/app/admin/challenges')({
  component: AdminChallengesPage,
})

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

interface SubmissionWithProfile {
  id: string
  user_id: string
  challenge_week_id: string
  project_name: string
  deliverable_url: string | null
  deliverable_description: string
  post_id: string | null
  completed_tasks: string[]
  created_at: string
  profiles: {
    first_name: string | null
    last_name: string | null
    avatar_url: string | null
  } | null
}

function AdminChallengesPage() {
  const queryClient = useQueryClient()
  const { confirm, ConfirmDialog } = useConfirm()
  const [activeTab, setActiveTab] = useState<'challenges' | 'submissions'>('challenges')

  // Edit / Create Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [editingChallenge, setEditingChallenge] = useState<ChallengeWeek | null>(null)
  
  // Form fields
  const [weekNumber, setWeekNumber] = useState<number>(1)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [isActive, setIsActive] = useState(true)

  // 1. Query Challenges
  const challengesQuery = useQuery<ChallengeWeek[]>({
    queryKey: ['admin-challenge-weeks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('challenge_weeks')
        .select('*')
        .order('week_number', { ascending: true })
      if (error) throw error
      return data ?? []
    },
  })

  // 2. Query Submissions
  const submissionsQuery = useQuery<SubmissionWithProfile[]>({
    queryKey: ['admin-challenge-submissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('challenge_submissions')
        .select('*, profiles(first_name, last_name, avatar_url)')
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data as any) ?? []
    },
  })

  // 3. Mutate Challenge
  const upsertMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        week_number: Number(weekNumber),
        title: title.trim(),
        description: description.trim(),
        tasks,
        is_active: isActive,
      }

      if (editingChallenge?.id) {
        const { error } = await supabase
          .from('challenge_weeks')
          .update(payload)
          .eq('id', editingChallenge.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('challenge_weeks')
          .insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => {
      toast.success("Défi sauvegardé avec succès.")
      queryClient.invalidateQueries({ queryKey: ['admin-challenge-weeks'] })
      queryClient.invalidateQueries({ queryKey: ['challenge-weeks'] })
      setModalOpen(false)
    },
    onError: (err: any) => {
      toast.error(err.message || "Erreur de sauvegarde.")
    },
  })

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('challenge_weeks')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success("Défi supprimé.")
      queryClient.invalidateQueries({ queryKey: ['admin-challenge-weeks'] })
      queryClient.invalidateQueries({ queryKey: ['challenge-weeks'] })
    },
  })

  const openEditModal = (c: ChallengeWeek | null) => {
    if (c) {
      setEditingChallenge(c)
      setWeekNumber(c.week_number)
      setTitle(c.title)
      setDescription(c.description)
      setTasks(c.tasks ?? [])
      setIsActive(c.is_active)
    } else {
      setEditingChallenge(null)
      // Suggest next week number
      const nextNum = challengesQuery.data?.length 
        ? Math.max(...challengesQuery.data.map(w => w.week_number)) + 1 
        : 1
      setWeekNumber(nextNum)
      setTitle('')
      setDescription('')
      setTasks([])
      setIsActive(true)
    }
    setModalOpen(true)
  }

  const handleAddTask = () => {
    const newId = `t_${Date.now()}`
    setTasks([...tasks, { id: newId, label: '', optional: false }])
  }

  const handleRemoveTask = (id: string) => {
    setTasks(tasks.filter((t) => t.id !== id))
  }

  const handleUpdateTaskLabel = (id: string, label: string) => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, label } : t)))
  }

  const handleToggleTaskOptional = (id: string) => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, optional: !t.optional } : t)))
  }

  const handleDeleteChallenge = async (c: ChallengeWeek) => {
    const ok = await confirm({
      title: `Supprimer la semaine ${c.week_number} ?`,
      description: "Cette action supprimera également toutes les soumissions associées à cette semaine.",
      confirmLabel: "Supprimer",
      variant: "destructive"
    })
    if (ok) {
      deleteMutation.mutate(c.id)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 lg:py-14">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--foreground)] sm:text-3xl flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--or)]/10 text-[var(--or-deep)]">
              <Trophy className="h-5.5 w-5.5" />
            </span>
            Cockpit Challenges
          </h1>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Configure les défis hebdomadaires et suis les livrables des membres du Club.
          </p>
        </div>

        <Button
          type="button"
          onClick={() => openEditModal(null)}
          className="bg-[var(--or)] text-[var(--noir)] hover:bg-[var(--or-light)] rounded-xl flex items-center gap-2 font-semibold shadow-sm shrink-0 md:self-end"
        >
          <Plus className="h-4 w-4" />
          Nouveau Challenge
        </Button>
      </motion.div>

      {/* Tabs */}
      <div className="mt-8 flex border-b border-[var(--border)] gap-6">
        <button
          type="button"
          onClick={() => setActiveTab('challenges')}
          className={cn(
            'pb-3.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2',
            activeTab === 'challenges'
              ? 'border-[var(--or-deep)] text-[var(--foreground)]'
              : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
          )}
        >
          <CalendarDays className="h-4.5 w-4.5" />
          Liste des Défis ({challengesQuery.data?.length ?? 0})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('submissions')}
          className={cn(
            'pb-3.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2',
            activeTab === 'submissions'
              ? 'border-[var(--or-deep)] text-[var(--foreground)]'
              : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
          )}
        >
          <Users className="h-4.5 w-4.5" />
          Soumissions membres ({submissionsQuery.data?.length ?? 0})
        </button>
      </div>

      <div className="mt-6">
        {/* Tab 1: Challenges List */}
        {activeTab === 'challenges' && (
          <div className="space-y-4">
            {challengesQuery.isLoading ? (
              <div className="flex h-48 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--or-deep)]" />
              </div>
            ) : challengesQuery.data?.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[var(--border)] p-12 text-center text-[var(--muted-foreground)]">
                Aucun défi configuré pour le moment.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {challengesQuery.data?.map((c) => (
                  <div
                    key={c.id}
                    className={cn(
                      'rounded-2xl border bg-[var(--card)] p-5 shadow-sm flex flex-col justify-between transition-all',
                      c.is_active ? 'border-[var(--border)]' : 'border-gray-200 opacity-60'
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="rounded-lg bg-[var(--or)]/15 px-2 py-0.5 text-xs font-bold text-[var(--or-deep)]">
                          Semaine {c.week_number}
                        </span>
                        <span className={cn(
                          'text-[10px] font-bold uppercase tracking-wider',
                          c.is_active ? 'text-emerald-600' : 'text-gray-400'
                        )}>
                          {c.is_active ? 'Actif' : 'Désactivé'}
                        </span>
                      </div>

                      <h3 className="mt-3 font-display text-base font-bold text-[var(--foreground)]">
                        {c.title}
                      </h3>
                      
                      <p className="mt-2 text-xs text-[var(--muted-foreground)] line-clamp-3">
                        {c.description.replace(/[#*`\-_]/g, '')}
                      </p>

                      <div className="mt-4 border-t border-[var(--border)]/50 pt-3">
                        <span className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase">
                          Checklist ({c.tasks?.length ?? 0} tâches)
                        </span>
                        <ul className="mt-1.5 space-y-1">
                          {c.tasks?.slice(0, 3).map((t, idx) => (
                            <li key={t.id} className="text-xs text-[var(--foreground)] truncate flex items-center gap-1.5">
                              <span className="h-1.5 w-1.5 rounded-full bg-gray-400 shrink-0" />
                              <span className={cn(t.optional && 'opacity-60 text-gray-500')}>
                                {t.label} {t.optional && '(opt)'}
                              </span>
                            </li>
                          ))}
                          {c.tasks?.length > 3 && (
                            <li className="text-[10px] text-[var(--muted-foreground)] italic pl-3">
                              + {c.tasks.length - 3} autres tâches
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>

                    <div className="mt-6 flex items-center justify-end gap-2 border-t border-[var(--border)]/50 pt-3">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(c)}
                        className="rounded-lg text-xs font-semibold flex items-center gap-1 hover:bg-[var(--secondary)]"
                      >
                        <Edit className="h-3.5 w-3.5" />
                        Modifier
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteChallenge(c)}
                        className="rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Supprimer
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Submissions List */}
        {activeTab === 'submissions' && (
          <div className="space-y-4">
            {submissionsQuery.isLoading ? (
              <div className="flex h-48 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--or-deep)]" />
              </div>
            ) : submissionsQuery.data?.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[var(--border)] p-12 text-center text-[var(--muted-foreground)]">
                Aucune participation reçue pour le moment.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--border)] bg-gray-50/50 text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                      <th className="p-4">Membre</th>
                      <th className="p-4">Projet</th>
                      <th className="p-4">Challenge</th>
                      <th className="p-4">Livrable</th>
                      <th className="p-4">Soumission</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]/60 text-sm">
                    {submissionsQuery.data?.map((s) => {
                      const submissionDate = format(new Date(s.created_at), 'dd MMM yyyy HH:mm', { locale: fr })
                      const week = challengesQuery.data?.find((w) => w.id === s.challenge_week_id)

                      return (
                        <tr key={s.id} className="hover:bg-gray-50/40">
                          <td className="p-4">
                            <div className="flex items-center gap-2.5">
                              <AvatarDisplay
                                avatarUrl={s.profiles?.avatar_url}
                                firstName={s.profiles?.first_name}
                                lastName={s.profiles?.last_name}
                                size="sm"
                              />
                              <span className="font-semibold text-[var(--foreground)]">
                                {[s.profiles?.first_name, s.profiles?.last_name].filter(Boolean).join(' ') || 'Membre'}
                              </span>
                            </div>
                          </td>
                          <td className="p-4 font-medium">{s.project_name}</td>
                          <td className="p-4">
                            <span className="inline-flex items-center rounded-md bg-[var(--or)]/10 px-2 py-0.5 text-xs font-semibold text-[var(--or-deep)]">
                              Semaine {week?.week_number ?? '?'}
                            </span>
                          </td>
                          <td className="p-4">
                            {s.deliverable_url ? (
                              <a
                                href={s.deliverable_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[var(--primary)] hover:underline font-semibold"
                              >
                                Lien
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            ) : (
                              <span className="text-[var(--muted-foreground)] italic">Aucun</span>
                            )}
                          </td>
                          <td className="p-4 text-xs text-[var(--muted-foreground)]">{submissionDate}</td>
                          <td className="p-4 text-right">
                            {s.post_id && (
                              <Button
                                asChild
                                variant="ghost"
                                size="sm"
                                className="rounded-lg text-xs font-semibold hover:bg-[var(--secondary)] flex items-center gap-1 ml-auto"
                              >
                                <Link to="/app/communaute/$postId" params={{ postId: s.post_id }}>
                                  <MessageSquare className="h-3.5 w-3.5" />
                                  Voir Post
                                </Link>
                              </Button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit / Create Challenge Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-xl flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between border-b border-[var(--border)]/60 pb-3">
                  <h2 className="font-display text-lg font-bold">
                    {editingChallenge ? `Modifier le Défi Semaine ${editingChallenge.week_number}` : 'Nouveau Défi Hebdomadaire'}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="rounded-lg p-1 hover:bg-[var(--secondary)] text-[var(--muted-foreground)]"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="mt-4 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                        Semaine N°
                      </label>
                      <Input
                        type="number"
                        min={1}
                        value={weekNumber}
                        onChange={(e) => setWeekNumber(Number(e.target.value))}
                      />
                    </div>

                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                        Titre du challenge
                      </label>
                      <Input
                        type="text"
                        placeholder="Ex: Créer sa proposition de valeur"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                      Consignes (Format Markdown accepté)
                    </label>
                    <textarea
                      rows={5}
                      placeholder="### Objectifs...\n### Consignes..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm font-medium transition-all focus:border-[var(--primary)]/40 focus:outline-none focus:ring-4 focus:ring-[var(--primary)]/5 hover:border-[var(--muted-foreground)]/30"
                    />
                  </div>

                  {/* Checklist tasks manager */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between border-t border-[var(--border)]/50 pt-3">
                      <label className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                        Tâches de la checklist ({tasks.length})
                      </label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddTask}
                        className="rounded-lg text-xs font-semibold flex items-center gap-1 hover:bg-[var(--secondary)]"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Ajouter tâche
                      </Button>
                    </div>

                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {tasks.map((task, idx) => (
                        <div key={task.id} className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-[var(--muted-foreground)]">
                            {idx + 1}.
                          </span>
                          <Input
                            type="text"
                            placeholder="Libellé de la tâche..."
                            value={task.label}
                            onChange={(e) => handleUpdateTaskLabel(task.id, e.target.value)}
                            className="flex-1"
                          />
                          
                          <button
                            type="button"
                            onClick={() => handleToggleTaskOptional(task.id)}
                            className={cn(
                              'px-2 py-1.5 rounded-lg text-[10px] font-bold uppercase border transition-all shrink-0',
                              task.optional
                                ? 'border-amber-500/30 bg-amber-50/15 text-amber-600'
                                : 'border-[var(--border)] hover:bg-[var(--secondary)] text-[var(--muted-foreground)]'
                            )}
                          >
                            Optionnelle
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRemoveTask(task.id)}
                            className="rounded-lg p-2 text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100 shrink-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 border-t border-[var(--border)]/50 pt-4">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="h-4.5 w-4.5 rounded border-[var(--border)] text-[var(--or-deep)] focus:ring-[var(--or)]"
                    />
                    <label htmlFor="is_active" className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)] cursor-pointer select-none">
                      Rendre ce défi actif pour les membres
                    </label>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 border-t border-[var(--border)]/60 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl font-semibold border-[var(--border)] hover:bg-[var(--secondary)]"
                >
                  Annuler
                </Button>
                <Button
                  type="button"
                  onClick={() => upsertMutation.mutate()}
                  disabled={upsertMutation.isPending}
                  className="bg-[var(--or)] text-[var(--noir)] hover:bg-[var(--or-light)] rounded-xl font-semibold px-5"
                >
                  {upsertMutation.isPending ? (
                    <Loader2 className="h-4.5 w-4.5 animate-spin" />
                  ) : (
                    'Sauvegarder'
                  )}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmDialog />
    </div>
  )
}
