import type { ReactNode } from 'react'
import { Calendar, Check, Trophy, type LucideIcon } from 'lucide-react'
import { Eyebrow } from './eyebrow'
import { Reveal } from './reveal'
import { cn } from '@/lib/utils'

export function BeyondClub() {
  return (
    <section className="relative overflow-hidden bg-white py-16 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <Eyebrow className="mb-6">Bénéfices exclusifs</Eyebrow>
            <h2 className="font-display text-4xl font-bold tracking-tight text-[var(--foreground)] sm:text-5xl lg:text-6xl">
              Bien plus qu'<span className="serif-accent italic">une plateforme.</span>
            </h2>
            <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-[var(--muted-foreground)] sm:text-xl">
              Le Club IA t'accompagne avec une présence humaine et des récompenses concrètes pour booster ta carrière.
            </p>
          </Reveal>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-2 lg:mt-16">
          <Reveal direction="right">
            <BenefitCard
              icon={Calendar}
              accent="primary"
              title="Coaching live mensuel"
              description="Chaque mois, rejoins-nous en direct pour une session de coaching stratégique. Pose tes questions, débloque tes projets et profite de l'expertise de mentors invités."
              points={[
                "90 minutes d'échange interactif",
                'Experts invités de classe mondiale',
                'Replay HD disponible sous 24h',
              ]}
            />
          </Reveal>

          <Reveal direction="left" delay={0.1}>
            <BenefitCard
              icon={Trophy}
              accent="accent"
              title={
                <>
                  Prime de <span className="text-[var(--primary)]">50&nbsp;000&nbsp;FCFA</span>
                </>
              }
              description={
                <>
                  Nous récompensons l'engagement. Chaque mois, le membre le plus actif reçoit une prime de{' '}
                  <span className="font-bold text-[var(--primary)]">
                    50&nbsp;000&nbsp;FCFA
                  </span>{' '}
                  pour financer ses outils ou sa croissance.
                </>
              }
              points={[
                "Classement d'activité transparent",
                'Prime versée par Mobile Money',
                'Visibilité boostée au sein du réseau',
              ]}
            />
          </Reveal>
        </div>
      </div>
    </section>
  )
}

function BenefitCard({
  icon: Icon,
  accent,
  title,
  description,
  points,
}: {
  icon: LucideIcon
  accent: 'primary' | 'accent'
  title: ReactNode
  description: ReactNode
  points: string[]
}) {
  return (
    <article className="group relative h-full flex flex-col rounded-[2.5rem] border border-[var(--border)] bg-white p-8 transition-all duration-700 hover:scale-[1.01] hover:border-[var(--primary)]/20 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)] sm:p-12">
      <div
        className={cn(
          'flex h-14 w-14 items-center justify-center rounded-2xl transition-transform duration-500 group-hover:scale-110 shadow-lg',
          accent === 'primary'
            ? 'bg-[var(--primary)] text-white shadow-[var(--primary)]/20'
            : 'bg-[var(--accent)] text-[var(--accent-foreground)] shadow-[var(--accent)]/20',
        )}
      >
        <Icon className="h-6 w-6" />
      </div>

      <h3 className="mt-8 font-display text-3xl font-bold tracking-tight text-[var(--foreground)]">
        {title}
      </h3>
      <p className="mt-4 text-lg leading-relaxed text-[var(--muted-foreground)] flex-1">
        {description}
      </p>

      <ul className="mt-10 space-y-4 border-t border-[var(--border)] pt-8">
        {points.map((p) => (
          <li key={p} className="flex items-start gap-4">
            <div
              className={cn(
                'mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
                accent === 'primary'
                  ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                  : 'bg-[var(--accent)]/10 text-[var(--accent)]',
              )}
            >
              <Check className="h-3.5 w-3.5" />
            </div>
            <span className="text-lg font-medium text-[var(--foreground)]/80">{p}</span>
          </li>
        ))}
      </ul>
    </article>
  )
}
