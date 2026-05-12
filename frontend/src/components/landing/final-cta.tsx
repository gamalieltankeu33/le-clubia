import { Link } from '@tanstack/react-router'
import { ArrowRight, Check } from 'lucide-react'
import { Reveal } from './reveal'
import { CardElite } from '@/components/shared/card-elite'

const REASSURANCE = [
  'Sans réabonnement auto',
  'Paiement mobile money',
  'Sécurisé',
]

export function FinalCTA() {
  return (
    <section className="relative overflow-hidden bg-[var(--background)] py-14 sm:py-20 lg:py-24">
      <div className="relative mx-auto max-w-4xl px-4 sm:px-6">
        <Reveal>
          {/* Surface bleu Bloomberg en gradient subtil. Accent bleu ciel
              (--bleu-ciel) sur les éléments vivants. L'or n'apparaît pas
              ici — gardé pour le numéro de membre et le top 3 classement. */}
          <CardElite
            variant="gradient"
            className="px-6 py-14 text-center sm:px-12 sm:py-20 lg:py-24"
          >
            <div className="relative z-10">
              <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-[var(--bleu-ciel)]">
                Dernière étape
              </span>

              <h2 className="mt-6 font-display text-4xl font-bold leading-[1.05] tracking-tight text-[#FAFAF9] sm:text-5xl lg:text-6xl">
                Prêt à{' '}
                <span className="font-serif-signature italic text-[var(--bleu-ciel)]">
                  passer le cap&nbsp;?
                </span>
              </h2>

              <p className="mx-auto mt-6 max-w-xl text-base text-white/75 sm:text-lg">
                Rejoins une communauté qui t'aide à avancer chaque jour.
                <br className="hidden sm:block" />
                Pas demain. Aujourd'hui.
              </p>

              <div className="mt-10 flex flex-col items-stretch gap-5 sm:items-center">
                <Link
                  to="/auth"
                  className="cta-bleu-ciel cta-bleu-ciel-xl w-full sm:w-auto"
                >
                  <span className="sm:hidden">
                    Rejoindre — dès 69&nbsp;000&nbsp;FCFA/6&nbsp;mois
                  </span>
                  <span className="hidden sm:inline">
                    Rejoindre — 69&nbsp;000&nbsp;FCFA/6&nbsp;mois ou 99&nbsp;000&nbsp;FCFA/an
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-white/60">
                  {REASSURANCE.map((r) => (
                    <li key={r} className="inline-flex items-center gap-1.5">
                      <Check className="h-3 w-3 text-[var(--bleu-ciel)]" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardElite>
        </Reveal>
      </div>
    </section>
  )
}
