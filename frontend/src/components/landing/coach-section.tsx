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
    <section className="relative overflow-hidden bg-[var(--background)] py-24 sm:py-32 lg:py-40">
      {/* Immersive Background Gradients */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute left-[10%] top-[20%] h-[600px] w-[600px] rounded-full bg-[var(--accent)]/[0.05] blur-[100px]" />
        <div className="absolute right-[5%] bottom-[10%] h-[500px] w-[500px] rounded-full bg-[var(--primary)]/[0.04] blur-[120px]" />
      </div>

      <div className="mx-auto grid max-w-7xl items-center gap-16 px-6 lg:grid-cols-2 lg:gap-24">
        <Reveal direction="right">
          <Eyebrow variant="accent" className="mb-6">Feature exclusive</Eyebrow>
          <h2 className="font-display text-4xl font-bold tracking-tight text-[var(--foreground)] sm:text-5xl lg:text-7xl">
            Un coach IA{' '}
            <span className="serif-accent italic">qui te connaît.</span>
          </h2>
          <p className="mt-8 text-lg leading-relaxed text-[var(--muted-foreground)] sm:text-xl">
            Pose tes questions IA en langage naturel. Reçois des réponses
            contextualisées par <strong className="text-[var(--foreground)]">Claude Sonnet 4.5</strong>,
            le modèle le plus avancé au monde. Ta productivité, démultipliée.
          </p>

          <ul className="mt-10 space-y-4">
            {POINTS.map((p, i) => (
              <motion.li 
                key={p} 
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-start gap-4"
              >
                <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/10 text-[var(--accent)]">
                  <Check className="h-3.5 w-3.5" />
                </div>
                <span className="text-lg font-medium text-[var(--foreground)]/80">{p}</span>
              </motion.li>
            ))}
          </ul>

          <div className="mt-12">
            <a href="#tarif" className="cta-primary group px-8 py-4">
              Démarrer avec le Coach
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>
          </div>
        </Reveal>

        <Reveal delay={0.2} direction="left">
          <div className="relative group">
            {/* Cinematic frame around mockup */}
            <div
              aria-hidden="true"
              className="absolute -inset-8 -z-10 rounded-[3rem] bg-gradient-to-br from-[var(--accent)]/10 to-[var(--primary)]/10 blur-2xl transition-all duration-700 group-hover:inset-[-3rem] group-hover:opacity-60"
            />
            <div className="relative overflow-hidden rounded-[2.5rem] border border-[var(--border)] bg-white shadow-[0_48px_96px_-24px_rgba(0,0,0,0.12)] transition-transform duration-700 group-hover:scale-[1.02]">
               <CoachMockup />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
