import { createFileRoute, Link } from '@tanstack/react-router'
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
import { OnboardingGuide } from '@/components/onboarding/onboarding-guide'
import { WelcomeBlock } from '@/components/dashboard/welcome-block'

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
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      {/* Hero Welcome */}
      <Reveal>
        <section id="welcome-header">
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
              Bienvenue, {firstName} <span className="serif-accent italic">👋</span>
            </h1>
          </div>
          <p className="mt-2 max-w-xl text-base text-[var(--muted-foreground)]">
            Heureux de te revoir. Voici l'essentiel de ton Club IA pour aujourd'hui.
          </p>
        </section>
      </Reveal>

      {/* Welcome moment — visible 1× par jour calendaire */}
      {user?.id && (
        <div className="mt-6">
          <WelcomeBlock userId={user.id} />
        </div>
      )}

      {/* Prochain coaching live */}
      <Reveal delay={0.1} distance={10}>
        <section id="next-event" className="mt-8">
          <NextEventCard />
        </section>
      </Reveal>

      {/* Carte vedette Coach IA */}
      <Reveal delay={0.2} distance={10}>
        <section id="coach-section" className="mt-8">
          <button
            type="button"
            onClick={openCoach}
            className="group relative flex w-full flex-col sm:flex-row sm:items-center gap-5 overflow-hidden rounded-2xl border border-[var(--primary)]/20 bg-[var(--primary)] p-6 text-left text-white shadow-xl shadow-[var(--primary)]/10 transition-all hover:scale-[1.005]"
          >
            {/* Animated Halo in background */}
            <div
              aria-hidden="true"
              className="absolute -right-8 -top-8 h-48 w-48 rounded-full bg-[var(--accent)]/30 blur-[60px] transition-opacity group-hover:opacity-80"
            />
            
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md border border-white/20">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            
            <div className="relative min-w-0 flex-1">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-widest border border-white/10 mb-2">
                Assistant personnel
              </div>
              <h2 className="font-display text-xl font-bold tracking-tight sm:text-2xl text-white">
                Coach IA — prêt pour tes questions
              </h2>
              <p className="mt-1 text-sm text-white leading-relaxed max-w-xl">
                Besoin d'un prompt, d'un résumé ou d'un conseil ? Ton coach Claude est disponible 24/7.
              </p>
            </div>
            
            <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white text-[var(--primary)] shadow-md transition-transform group-hover:translate-x-1">
              <ArrowRight className="h-5 w-5" />
            </div>
          </button>
        </section>
      </Reveal>

      {/* 4 raccourcis */}
      <section className="mt-12">
        <Reveal delay={0.3}>
          <div className="flex items-center gap-3 mb-6">
            <h2 className="font-display text-xs font-bold uppercase tracking-[0.2em] text-[var(--muted-foreground)] opacity-60">
              Les 4 Piliers
            </h2>
            <div className="h-px flex-1 bg-[var(--border)] opacity-50" />
          </div>
        </Reveal>
        
        <div className="grid gap-4 sm:grid-cols-2">
          {SHORTCUTS.map((card, i) => {
            const pillarId = `pillar-${card.to.split('/').pop()}`
            return (
              <Reveal key={card.to} delay={0.4 + i * 0.05} distance={10}>
                <Link
                  id={pillarId}
                  to={card.to}
                  className="group relative block h-full overflow-hidden rounded-2xl border border-[var(--border)] bg-white p-6 transition-all duration-300 hover:border-[var(--primary)]/30 hover:shadow-lg"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)]/5 text-[var(--primary)] transition-colors group-hover:bg-[var(--primary)] group-hover:text-white">
                      <card.icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-display text-lg font-bold tracking-tight">
                          {card.title}
                        </h3>
                        <ArrowRight className="h-4 w-4 -translate-x-1 text-[var(--primary)] opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
                      </div>
                      <p className="mt-1 text-sm leading-relaxed text-[var(--muted-foreground)]">
                        {card.description}
                      </p>
                    </div>
                  </div>
                </Link>
              </Reveal>
            )
          })}
        </div>
      </section>

      {/* Mes points du mois */}
      <Reveal delay={0.8} distance={20}>
        <section id="points-section" className="mt-16">
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
      <OnboardingGuide />
    </div>
  )
}
