import type { ReactNode } from 'react'
import { Calendar, Check, Trophy, type LucideIcon } from 'lucide-react'
import { Eyebrow } from './eyebrow'
import { Reveal } from './reveal'
import { cn } from '@/lib/utils'

/**
 * Section "Au-delà du club" — 2 cards mettant en avant les bénéfices
 * exclusifs ajoutés à l'offre Le Club IA :
 *  1. Coaching live mensuel (90 min visio + replay)
 *  2. Prime mensuelle de 50 000 FCFA pour le membre le plus actif
 *
 * Position : entre <CoachSection /> et <Personas /> dans routes/index.tsx.
 */
export function BeyondClub() {
  return (
    <section className="bg-white py-16 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <Eyebrow>Bénéfices exclusifs</Eyebrow>
            <h2 className="mt-6 font-display text-3xl font-bold leading-[1.05] tracking-tight text-[var(--foreground)] sm:text-4xl lg:text-5xl xl:text-6xl">
              Bien plus qu'<span className="serif-accent">une plateforme.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base text-[var(--muted-foreground)] sm:text-lg">
              Le Club IA t'accompagne en présentiel virtuel chaque mois et
              récompense ton engagement.
            </p>
          </Reveal>
        </div>

        <div className="mt-12 grid gap-5 sm:mt-16 sm:gap-6 lg:grid-cols-2">
          <Reveal>
            <BenefitCard
              icon={Calendar}
              accent="primary"
              title="Coaching live mensuel"
              description="Une fois par mois, on se retrouve en visio pour une séance de coaching avec moi ou un expert invité. Tu poses tes questions, tu présentes ton projet, tu repars avec un plan d'action."
              points={[
                'Sessions de 90 minutes en visio',
                'Experts invités sur des thématiques pointues',
                'Replay disponible si tu manques la session',
              ]}
            />
          </Reveal>

          <Reveal delay={0.1}>
            <BenefitCard
              icon={Trophy}
              accent="accent"
              title={
                <>
                  <span className="text-[var(--primary)]">50&nbsp;000&nbsp;FCFA</span>{' '}
                  pour le membre le plus actif
                </>
              }
              description={
                <>
                  Chaque fin de mois, le membre le plus engagé reçoit une prime de{' '}
                  <span className="font-bold text-[var(--primary)]">
                    50&nbsp;000&nbsp;FCFA
                  </span>{' '}
                  pour booster son projet IA : formation, abonnement outil,
                  publicité, équipement… toi seul·e décides comment l'utiliser.
                </>
              }
              points={[
                'Classement basé sur ton activité dans la communauté',
                'Prime versée par mobile money',
                'Reconnaissance publique sur la plateforme',
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
    <article className="group flex h-full flex-col rounded-3xl border border-[var(--border)] bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--foreground)]/15 hover:shadow-xl hover:shadow-black/5 sm:p-8 lg:p-10">
      <span
        className={cn(
          'flex h-12 w-12 items-center justify-center rounded-2xl sm:h-14 sm:w-14',
          accent === 'primary'
            ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
            : 'bg-[var(--accent)]/15 text-[var(--accent)]',
        )}
      >
        <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
      </span>

      <h3 className="mt-5 font-display text-2xl font-bold tracking-tight text-[var(--foreground)] sm:mt-6 sm:text-3xl">
        {title}
      </h3>
      <p className="mt-3 text-base leading-relaxed text-[var(--muted-foreground)]">
        {description}
      </p>

      <ul className="mt-6 space-y-3 border-t border-[var(--border)] pt-5 text-sm text-[var(--foreground)]">
        {points.map((p) => (
          <li key={p} className="flex items-start gap-3">
            <span
              className={cn(
                'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full',
                accent === 'primary'
                  ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                  : 'bg-[var(--accent)]/15 text-[var(--accent)]',
              )}
            >
              <Check className="h-3 w-3" />
            </span>
            {p}
          </li>
        ))}
      </ul>
    </article>
  )
}
