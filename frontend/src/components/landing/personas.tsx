import { Briefcase, Code2, Palette, type LucideIcon } from 'lucide-react'
import { Eyebrow } from './eyebrow'
import { Reveal } from './reveal'

interface Persona {
  icon: LucideIcon
  title: string
  description: string
  bullets: string[]
}

const PERSONAS: Persona[] = [
  {
    icon: Briefcase,
    title: 'Entrepreneurs',
    description:
      "Tu veux automatiser ton business avec l'IA et libérer du temps pour ce qui compte vraiment.",
    bullets: [
      'Workflows Make / n8n',
      'Automatisation marketing',
      'Génération de contenu en série',
    ],
  },
  {
    icon: Palette,
    title: 'Créateurs de contenu',
    description:
      "Tu veux booster ta production avec l'IA — vidéo, image, écriture — sans perdre ton style.",
    bullets: [
      'Vidéo générative',
      'Image & visuels Midjourney',
      'Scripts et écriture IA',
    ],
  },
  {
    icon: Code2,
    title: 'Développeurs / Tech',
    description:
      'Tu veux maîtriser les nouveaux outils IA et les intégrer dans tes produits avant les autres.',
    bullets: [
      'API Anthropic, OpenAI, Mistral',
      'RAG, agents, MCP',
      'Vibe-coding & no-code IA',
    ],
  },
]

export function Personas() {
  return (
    <section className="overflow-hidden bg-[var(--background)] py-12 sm:py-16 lg:py-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <Eyebrow>Pour qui</Eyebrow>
            <h2 className="mt-6 font-display text-4xl font-bold leading-[1.05] tracking-tight text-[var(--foreground)] sm:text-5xl lg:text-6xl">
              Pensé pour ceux{' '}
              <span className="serif-accent">qui font.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-[var(--muted-foreground)]">
              Que tu viennes du business, de la création ou du tech, le Club te
              fait gagner du temps.
            </p>
          </Reveal>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {PERSONAS.map((p, i) => (
            <Reveal key={p.title} delay={i * 0.08}>
              <div className="flex h-full flex-col rounded-2xl border border-[var(--border)] bg-white p-7 transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--foreground)]/15 hover:shadow-xl hover:shadow-black/5">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--foreground)] text-white">
                  <p.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 font-display text-2xl font-bold tracking-tight text-[var(--foreground)]">
                  {p.title}
                </h3>
                <p className="mt-2 text-[var(--muted-foreground)]">
                  {p.description}
                </p>
                <ul className="mt-5 space-y-1.5 border-t border-[var(--border)] pt-5 text-sm text-[var(--foreground)]">
                  {p.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--foreground)]/40" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
