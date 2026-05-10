import { Link } from '@tanstack/react-router'
import { Check, Star } from 'lucide-react'
import type { ReactNode } from 'react'
import { BrandLogo } from '@/components/brand-logo'

const HIGHLIGHTS = [
  'Coach IA personnel propulsé par Claude 4.5',
  'Catalogue de formations à jour, en français',
  'Communauté active de passionnés francophones',
  'Veille IA automatisée, mise à jour 4×/jour',
]

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* Visual side — premium éditorial */}
      <div className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-14">
        {/* Fond bleu profond avec halos */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(135deg, #1c3a9e 0%, #1E40AF 50%, #3858d8 100%)',
          }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0"
        >
          <div className="absolute -right-32 -top-20 h-[480px] w-[480px] rounded-full bg-[var(--bleu-ciel)]/30 blur-[120px]" />
          <div className="absolute -bottom-32 -left-20 h-[400px] w-[400px] rounded-full bg-white/10 blur-[120px]" />
        </div>

        <Link to="/" className="relative z-10 inline-flex self-start">
          <BrandLogo size="md" variant="inverse" asLink={false} />
        </Link>

        <div className="relative z-10 max-w-lg text-white">
          <h2 className="font-display text-[2.5rem] font-bold leading-[1.05] tracking-tight">
            La communauté francophone qui te fait avancer avec l'IA.
          </h2>
          <p className="mt-5 text-lg text-white/80">
            Formations, coach IA, communauté, ressources. Tout ce qu'il te
            faut, pour 79&nbsp;000&nbsp;FCFA/an.
          </p>

          <ul className="mt-8 space-y-3">
            {HIGHLIGHTS.map((h) => (
              <li key={h} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--bleu-ciel)]/20 text-[var(--bleu-ciel)]">
                  <Check className="h-3 w-3" />
                </span>
                <span className="text-sm text-white/90">{h}</span>
              </li>
            ))}
          </ul>

          {/* Mini témoignage social proof */}
          <figure className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
            <div className="flex items-center gap-1 text-[var(--or)]">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-current" />
              ))}
            </div>
            <blockquote className="mt-3 text-sm leading-relaxed text-white/90">
              "En deux mois j'ai automatisé toute ma veille IA et doublé ma
              production. Le Coach est devenu ma routine du matin."
            </blockquote>
            <figcaption className="mt-4 flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-xs font-semibold text-white">
                CR
              </span>
              <div className="text-xs">
                <p className="font-medium text-white">Camille R.</p>
                <p className="text-white/60">Freelance content · Lyon</p>
              </div>
            </figcaption>
          </figure>
        </div>

        <div className="relative z-10 text-xs text-white/50">
          © {new Date().getFullYear()} Le Club IA — Communauté francophone
        </div>
      </div>

      {/* Form side */}
      <div className="relative flex flex-col items-center justify-center bg-white px-6 py-12">
        {/* Halo extrêmement subtil sur le côté droit */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-0 top-1/3 -z-0 h-96 w-96 rounded-full bg-[#1E40AF]/[0.04] blur-3xl"
        />

        <div className="relative z-10 w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Link to="/" className="inline-flex">
              <BrandLogo size="md" variant="primary" asLink={false} />
            </Link>
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            {title}
          </h1>
          <p className="mt-2 text-[var(--muted-foreground)]">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <div className="mt-8 text-center text-sm text-[var(--muted-foreground)]">
            {footer}
          </div>
        </div>
      </div>
    </div>
  )
}
