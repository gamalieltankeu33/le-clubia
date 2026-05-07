import { Globe, RefreshCw, Sparkles } from 'lucide-react'
import { Eyebrow } from './eyebrow'
import { Reveal } from './reveal'
import { NewsMockup } from './mockups'

const STATS = [
  { value: '8', label: 'Sources surveillées' },
  { value: '4', label: 'Mises à jour par jour' },
  { value: '100%', label: 'En français' },
]

export function NewsAgentSection() {
  return (
    <section className="bg-white py-16 sm:py-24 lg:py-32">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 lg:grid-cols-2">
        <Reveal delay={0.1} className="order-2 lg:order-1">
          <div className="relative">
            <div
              aria-hidden="true"
              className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-br from-[var(--primary)]/10 to-emerald-100/50 blur-xl"
            />
            <NewsMockup />
          </div>
        </Reveal>

        <Reveal className="order-1 lg:order-2">
          <Eyebrow>Veille automatique</Eyebrow>
          <h2 className="mt-6 font-display text-4xl font-bold leading-[1.05] tracking-tight text-[var(--foreground)] sm:text-5xl lg:text-6xl">
            Pendant que tu dors,{' '}
            <span className="serif-accent">ton agent travaille.</span>
          </h2>
          <p className="mt-6 max-w-xl text-lg text-[var(--muted-foreground)]">
            Un agent IA scanne automatiquement les sources les plus fiables —{' '}
            <strong className="text-[var(--foreground)]">
              OpenAI, Anthropic, Google AI, MIT, Hugging Face
            </strong>{' '}
            — et publie des résumés en français toutes les 6 heures.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-2 sm:gap-4">
            {STATS.map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-3 text-center sm:p-4"
              >
                <p className="font-display text-2xl font-bold tracking-tight text-[var(--foreground)] tabular-nums sm:text-3xl">
                  {s.value}
                </p>
                <p className="mt-1 text-[11px] leading-tight text-[var(--muted-foreground)] sm:text-xs">
                  {s.label}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-5 text-sm text-[var(--muted-foreground)]">
            <span className="inline-flex items-center gap-1.5">
              <Globe className="h-4 w-4 text-[var(--primary)]" />
              Sources internationales
            </span>
            <span className="inline-flex items-center gap-1.5">
              <RefreshCw className="h-4 w-4 text-[var(--primary)]" />
              Cron automatique
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-[var(--accent)]" />
              Résumé éditorial
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
