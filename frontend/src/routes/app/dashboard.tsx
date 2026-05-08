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
import { Reveal } from '@/components/landing/reveal'
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
    <div className="mx-auto max-w-6xl px-6 py-10 sm:py-14 lg:py-16">
      {/* Hero Welcome */}
      <Reveal>
        <section>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              Bienvenue, {firstName} <span className="serif-accent italic">👋</span>
            </h1>
          </div>
          <p className="mt-3 max-w-2xl text-lg text-[var(--muted-foreground)] sm:text-xl leading-relaxed">
            Heureux de te revoir. Voici l'essentiel du Club IA pour ta croissance aujourd'hui.
          </p>
        </section>
      </Reveal>

      {/* Prochain coaching live */}
      <Reveal delay={0.1} distance={20}>
        <section className="mt-12">
          <NextEventCard />
        </section>
      </Reveal>

      {/* Carte vedette Coach IA */}
      <Reveal delay={0.2} distance={20}>
        <section className="mt-12">
          <button
            type="button"
            onClick={openCoach}
            className="group relative flex w-full flex-col sm:flex-row sm:items-center gap-6 overflow-hidden rounded-[2rem] border border-[var(--primary)]/20 bg-[var(--primary)] p-8 text-left text-white shadow-2xl shadow-[var(--primary)]/20 transition-all hover:scale-[1.01]"
          >
            {/* Animated Halo in background */}
            <div
              aria-hidden="true"
              className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-[var(--accent)]/40 blur-[80px] transition-opacity group-hover:opacity-80"
            />
            
            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
              <Sparkles className="h-7 w-7 text-white" />
            </div>
            
            <div className="relative min-w-0 flex-1">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-widest border border-white/10 mb-3">
                Assistant personnel
              </div>
              <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                Coach IA — prêt pour tes questions
              </h2>
              <p className="mt-2 text-base text-white/80 leading-relaxed max-w-xl">
                Besoin d'un prompt, d'un résumé ou d'un conseil stratégique ? Ton coach Claude 4.5 est disponible 24/7.
              </p>
            </div>
            
            <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-white text-[var(--primary)] shadow-lg transition-transform group-hover:translate-x-2">
              <ArrowRight className="h-6 w-6" />
            </div>
          </button>
        </section>
      </Reveal>

      {/* 4 raccourcis */}
      <section className="mt-16">
        <Reveal delay={0.3}>
          <div className="flex items-center gap-4 mb-8">
            <h2 className="font-display text-xl font-bold uppercase tracking-[0.15em] text-[var(--muted-foreground)] opacity-80">
              Les 4 Piliers
            </h2>
            <div className="h-px flex-1 bg-[var(--border)]" />
          </div>
        </Reveal>
        
        <div className="grid gap-6 sm:grid-cols-2">
          {SHORTCUTS.map((card, i) => (
            <Reveal key={card.to} delay={0.4 + i * 0.1} distance={20}>
              <Link
                to={card.to}
                className="group relative block h-full overflow-hidden rounded-[2rem] border border-[var(--border)] bg-white p-8 transition-all duration-500 hover:border-[var(--primary)]/30 hover:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)]"
              >
                <div className="flex flex-col gap-6">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--primary)]/5 text-[var(--primary)] transition-colors group-hover:bg-[var(--primary)] group-hover:text-white">
                    <card.icon className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-display text-2xl font-bold tracking-tight">
                        {card.title}
                      </h3>
                      <ArrowRight className="h-5 w-5 -translate-x-2 text-[var(--primary)] opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
                    </div>
                    <p className="mt-2 text-base leading-relaxed text-[var(--muted-foreground)]">
                      {card.description}
                    </p>
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Mes points du mois */}
      <Reveal delay={0.8} distance={20}>
        <section className="mt-16">
          <MyPointsCard />
        </section>
      </Reveal>

      {/* Reprends ta dernière formation */}
      <section className="mt-20">
        <Reveal delay={0.9}>
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-display text-xl font-bold uppercase tracking-[0.15em] text-[var(--muted-foreground)] opacity-80">
              Continuer l'apprentissage
            </h2>
            <Link
              to="/app/formations"
              className="text-sm font-bold text-[var(--primary)] hover:underline"
            >
              Catalogue complet
            </Link>
          </div>
        </Reveal>
        <Reveal delay={1} distance={20}>
          <ResumeFormationCard />
        </Reveal>
      </section>

      {/* Activité récente de la communauté */}
      <section className="mt-20">
        <Reveal delay={1.1}>
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-display text-xl font-bold uppercase tracking-[0.15em] text-[var(--muted-foreground)] opacity-80">
              Flux Communautaire
            </h2>
            <Link
              to="/app/communaute"
              className="text-sm font-bold text-[var(--primary)] hover:underline"
            >
              Rejoindre la discussion
            </Link>
          </div>
        </Reveal>
        <Reveal delay={1.2} distance={20}>
          <RecentPostsCard />
        </Reveal>
      </section>
    </div>
  )
}

