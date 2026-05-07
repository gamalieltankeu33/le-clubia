import { createFileRoute, Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  GraduationCap,
  Library,
  MessagesSquare,
  Newspaper,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { useCoachStore } from '@/stores/coach-store'
import { ResumeFormationCard } from '@/components/formations/resume-formation-card'
import { RecentPostsCard } from '@/components/community/recent-posts-card'
import { MyPointsCard } from '@/components/community/my-points-card'
import { NextEventCard } from '@/components/events/next-event-card'

export const Route = createFileRoute('/app/dashboard')({
  component: DashboardPage,
})

interface ShortcutCard {
  to: string
  title: string
  description: string
  icon: LucideIcon
}

const SHORTCUTS: ShortcutCard[] = [
  {
    to: '/app/formations',
    title: 'Formations',
    description:
      'Vidéos chapitrées et ressources, classées par thématique. Ton terrain de jeu pour progresser.',
    icon: GraduationCap,
  },
  {
    to: '/app/communaute',
    title: 'Communauté',
    description:
      'Partage tes projets, pose tes questions, échange avec les autres membres francophones.',
    icon: MessagesSquare,
  },
  {
    to: '/app/actualites',
    title: 'Actualités IA',
    description:
      'Les sorties qui comptent, sans le bruit. Lectures express, signal/bruit optimisé.',
    icon: Newspaper,
  },
  {
    to: '/app/ressources',
    title: 'Ressources',
    description:
      'Prompts, templates, guides PDF et liens vers les meilleurs outils. Tout est cherchable.',
    icon: Library,
  },
]

function DashboardPage() {
  const profile = useAuthStore((s) => s.profile)
  const user = useAuthStore((s) => s.user)
  const openCoach = useCoachStore((s) => s.openPanel)

  const firstName =
    profile?.first_name?.trim() ||
    user?.email?.split('@')[0] ||
    'membre'

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:py-14">
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
          Bienvenue, {firstName}
        </h1>
        <p className="mt-2 max-w-2xl text-base text-[var(--muted-foreground)] sm:text-lg">
          Voici ce qui se passe dans Le Club IA aujourd'hui.
        </p>
      </motion.section>

      {/* Prochain coaching live (visible uniquement si un event est à venir) */}
      <section className="mt-8">
        <NextEventCard />
      </section>

      {/* Carte vedette Coach IA */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="mt-8"
      >
        <button
          type="button"
          onClick={openCoach}
          className="group relative flex w-full items-center gap-5 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--primary)] p-6 text-left text-[var(--primary-foreground)] transition-shadow hover:shadow-lg sm:p-7"
        >
          <span
            aria-hidden="true"
            className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[var(--accent)]/30 blur-3xl"
          />
          <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
            <Sparkles className="h-6 w-6" />
          </span>
          <div className="relative min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/70">
              Nouveau
            </p>
            <h2 className="mt-1 font-display text-xl font-semibold tracking-tight text-white sm:text-2xl">
              Coach IA — ton assistant personnel
            </h2>
            <p className="mt-1 text-sm text-white/80">
              Pose tes questions à ton Coach IA personnel, 24/7. 30 messages
              offerts par jour.
            </p>
          </div>
          <ArrowRight className="relative hidden h-5 w-5 -translate-x-1 transition-transform group-hover:translate-x-0 sm:block" />
        </button>
      </motion.section>

      {/* 4 raccourcis */}
      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold tracking-tight">
          Explore les 4 piliers
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {SHORTCUTS.map((card, i) => (
            <motion.div
              key={card.to}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.05 + i * 0.04 }}
            >
              <Link
                to={card.to}
                className="group block h-full rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 transition-all hover:border-[var(--primary)]/30 hover:shadow-md"
              >
                <div className="flex items-start gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
                    <card.icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-display text-lg font-semibold">
                        {card.title}
                      </h3>
                      <ArrowRight className="h-4 w-4 -translate-x-1 text-[var(--muted-foreground)] opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                    </div>
                    <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                      {card.description}
                    </p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Mes points du mois */}
      <section className="mt-10">
        <MyPointsCard />
      </section>

      {/* Reprends ta dernière formation */}
      <section className="mt-12">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold tracking-tight">
            Reprends ta dernière formation
          </h2>
          <Link
            to="/app/formations"
            className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            Voir tout
          </Link>
        </div>
        <ResumeFormationCard />
      </section>

      {/* Activité récente de la communauté */}
      <section className="mt-12">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold tracking-tight">
            Activité récente de la communauté
          </h2>
          <Link
            to="/app/communaute"
            className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            Voir le feed
          </Link>
        </div>
        <RecentPostsCard />
      </section>
    </div>
  )
}

