import { ArrowRight, Check } from 'lucide-react'
import { Eyebrow } from './eyebrow'
import { Reveal } from './reveal'
import { CoachMockup } from './mockups'

const POINTS = [
  'Disponible 24/7, propulsé par Claude Sonnet 4.5',
  'Connaît le catalogue de formations du Club',
  'Adapte ses réponses à ton niveau et tes objectifs',
  "Conserve l'historique de toutes tes conversations",
]

export function CoachSection() {
  return (
    <section className="relative overflow-hidden bg-[var(--background)] py-16 sm:py-24 lg:py-32">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--accent)]/[0.04] blur-3xl" />
      </div>

      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 lg:grid-cols-2">
        <Reveal>
          <Eyebrow variant="accent">Feature exclusive</Eyebrow>
          <h2 className="mt-6 font-display text-4xl font-bold leading-[1.05] tracking-tight text-[var(--foreground)] sm:text-5xl lg:text-6xl">
            Un coach IA{' '}
            <span className="serif-accent">qui te connaît.</span>
          </h2>
          <p className="mt-6 max-w-xl text-lg text-[var(--muted-foreground)]">
            Pose tes questions IA en langage naturel. Reçois des réponses
            contextualisées par <strong className="text-[var(--foreground)]">Claude Sonnet 4.5</strong>,
            le meilleur modèle conversationnel actuel. 30 messages offerts par
            jour.
          </p>

          <ul className="mt-8 space-y-3">
            {POINTS.map((p) => (
              <li key={p} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/15 text-[var(--accent)]">
                  <Check className="h-3 w-3" />
                </span>
                <span className="text-[var(--foreground)]">{p}</span>
              </li>
            ))}
          </ul>

          <a href="#tarif" className="mt-10 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--primary)] transition-colors hover:text-[#1c3a9e]">
            Voir le Coach
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="relative">
            <div
              aria-hidden="true"
              className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-br from-[var(--accent)]/15 to-[var(--primary)]/10 blur-xl"
            />
            <CoachMockup />
          </div>
        </Reveal>
      </div>
    </section>
  )
}
