import { CheckCircle2, GraduationCap, Video } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const STATIC_FORMATION_CHALLENGES = [
  {
    id: 'c1',
    formationTitle: 'Lancer son Agence IA (Blueprint)',
    tasks: [
      'Définir sa niche et son avatar client',
      'Créer son offre irrésistible',
      'Paramétrer son CRM',
    ],
  },
  {
    id: 'c2',
    formationTitle: 'Automatisation avec Make & Zapier',
    tasks: [
      'Créer son compte Make',
      'Réaliser le premier scénario (Gmail vers Gsheets)',
      'Connecter OpenAI pour résumer un email',
    ],
  },
  {
    id: 'c3',
    formationTitle: 'Maîtriser ChatGPT (Prompt Engineering)',
    tasks: [
      'Rédiger 3 prompts avec le framework ACT',
      'Créer un Custom GPT spécialisé',
      'Partager son meilleur prompt dans la communauté',
    ],
  },
]

export function FormationChallenges() {
  return (
    <div className="flex flex-col gap-6 mt-8">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10 text-[var(--accent)]">
          <GraduationCap className="h-5 w-5" />
        </span>
        <h2 className="font-display text-xl font-bold tracking-tight">
          Devoirs des Formations
        </h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {STATIC_FORMATION_CHALLENGES.map((challenge, idx) => (
          <motion.div
            key={challenge.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="flex flex-col gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm transition-all hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-4">
              <h3 className="font-semibold leading-tight text-[var(--foreground)]">
                {challenge.formationTitle}
              </h3>
              <Video className="h-4 w-4 shrink-0 text-[var(--muted-foreground)]" />
            </div>

            <ul className="flex flex-col gap-2.5">
              {challenge.tasks.map((task, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-[var(--muted-foreground)]">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--border)] transition-colors hover:text-[var(--primary)] cursor-pointer" />
                  <span className="leading-snug">{task}</span>
                </li>
              ))}
            </ul>

            <Button variant="outline" className="mt-auto w-full text-xs" size="sm">
              Voir la formation
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
