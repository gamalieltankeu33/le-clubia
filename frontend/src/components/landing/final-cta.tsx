import { Link } from '@tanstack/react-router'
import { ArrowRight, Check } from 'lucide-react'
import { Reveal } from './reveal'
import { Eyebrow } from './eyebrow'

const REASSURANCE = [
  'Sans réabonnement auto',
  'Paiement mobile money',
  'Sécurisé',
]

export function FinalCTA() {
  return (
    <section className="relative overflow-hidden bg-[var(--background)] py-14 sm:py-20 lg:py-24">
      {/* Halo bleu très subtil — la signature izi.club lumineuse, pas envahissante */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
      >
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--primary)]/[0.07] blur-[120px]" />
        <div className="absolute right-1/4 bottom-0 h-[400px] w-[400px] rounded-full bg-[var(--accent)]/[0.05] blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-3xl px-6 text-center">
        <Reveal>
          <Eyebrow>Dernière étape</Eyebrow>

          <h2 className="mt-6 font-display text-5xl font-bold leading-[1] tracking-tight text-[var(--foreground)] sm:text-6xl lg:text-7xl">
            Prêt à{' '}
            <span className="serif-accent">passer le cap&nbsp;?</span>
          </h2>

          <p className="mx-auto mt-6 max-w-xl text-lg text-[var(--muted-foreground)] sm:text-xl">
            Rejoins une communauté qui t'aide à avancer chaque jour.
            <br className="hidden sm:block" />
            Pas demain. Aujourd'hui.
          </p>

          <div className="mt-12 flex flex-col items-stretch gap-5 sm:items-center">
            <Link
              to="/auth"
              className="cta-black cta-black-xl w-full sm:w-auto"
            >
              <span className="sm:hidden">
                Rejoindre — 79&nbsp;000&nbsp;FCFA/an
              </span>
              <span className="hidden sm:inline">
                Rejoindre Le Club — 79&nbsp;000&nbsp;FCFA/an
              </span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-[var(--muted-foreground)]">
              {REASSURANCE.map((r) => (
                <li key={r} className="inline-flex items-center gap-1.5">
                  <Check className="h-3 w-3 text-[var(--primary)]" />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
