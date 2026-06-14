import { Globe, RefreshCw, Sparkles } from 'lucide-react'
import { Eyebrow } from './eyebrow'
import { Reveal } from './reveal'
import { NewsMockup } from './mockups'
import { motion } from 'framer-motion'

const STATS = [
  { value: '8', label: 'Sources surveillées' },
  { value: '4', label: 'Mises à jour quotidiennes' },
  { value: '100%', label: 'Pédagogie française' },
]

export function NewsAgentSection() {
  return (
    <section className="relative overflow-hidden bg-white py-16 sm:py-24 lg:py-28">
      {/* Dynamic Background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute right-0 top-1/2 h-[600px] w-[600px] -translate-y-1/2 rounded-full bg-[var(--bleu-ciel)]/10 blur-[120px]" />
      </div>

      <div className="mx-auto grid max-w-7xl items-center gap-16 px-6 lg:grid-cols-2 lg:gap-24">
        <Reveal direction="right" className="order-2 lg:order-1">
          <div className="relative group">
            <div
              aria-hidden="true"
              className="absolute -inset-10 -z-10 rounded-[3rem] bg-gradient-to-br from-[var(--primary)]/10 to-[var(--bleu-ciel)]/25 blur-3xl transition-opacity duration-700 group-hover:opacity-80"
            />
            <div className="relative overflow-hidden rounded-[2.5rem] border border-[var(--border)] bg-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] transition-transform duration-700 group-hover:scale-[1.01]">
              <NewsMockup />
            </div>
            
            {/* Status Badge Over Mockup */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              className="absolute -bottom-6 -right-6 hidden rounded-2xl border border-[var(--border)] bg-white p-4 shadow-xl sm:block"
            >
              <div className="flex items-center gap-3">
                <div className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--bleu-ciel)] opacity-75"></span>
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-[var(--bleu-ciel-deep)]"></span>
                </div>
                <span className="text-sm font-bold text-[var(--foreground)]">Agent Actif</span>
              </div>
            </motion.div>
          </div>
        </Reveal>

        <Reveal direction="left" className="order-1 lg:order-2">
          <Eyebrow className="mb-6">Intelligence Collective</Eyebrow>
          <h2 className="font-display text-4xl font-bold tracking-tight text-[var(--foreground)] sm:text-5xl lg:text-6xl">
            Pendant que tu dors,{' '}
            <span className="serif-accent">l'agent travaille.</span>
          </h2>
          <p className="mt-8 text-lg leading-relaxed text-[var(--muted-foreground)] sm:text-xl">
            Plus besoin de passer des heures sur X ou LinkedIn. Notre agent IA filtre le bruit et extrait la valeur stratégique des meilleures sources mondiales.
          </p>

          <div className="mt-12 grid grid-cols-3 gap-3 sm:gap-6">
            {STATS.map((s) => (
              <div
                key={s.label}
                className="group relative rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4 transition-all duration-300 hover:border-[var(--primary)]/20 hover:bg-white hover:shadow-lg sm:p-6"
              >
                <p className="font-display text-2xl font-bold tracking-tight text-[var(--foreground)] tabular-nums sm:text-4xl">
                  {s.value}
                </p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] sm:text-sm">
                  {s.label}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
              <Globe className="h-5 w-5 text-[var(--primary)]" />
              Surveillance 360°
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
              <RefreshCw className="h-5 w-5 text-[var(--primary)]" />
              Updates Temps Réel
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
              <Sparkles className="h-5 w-5 text-[var(--accent)]" />
              Synthèse Actionnable
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
