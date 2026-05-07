import {
  ArrowRight,
  GraduationCap,
  Library,
  MessagesSquare,
  Newspaper,
  type LucideIcon,
} from 'lucide-react'
import { Eyebrow } from './eyebrow'
import { Reveal } from './reveal'
import { FormationsPreview } from './previews/formations-preview'
import { CommunityPreview } from './previews/community-preview'
import { NewsPreview } from './previews/news-preview'
import { ResourcesPreview } from './previews/resources-preview'

interface Pillar {
  icon: LucideIcon
  title: string
  description: string
  anchor: string
  mockup: React.ReactNode
}

const PILLARS: Pillar[] = [
  {
    icon: GraduationCap,
    title: 'Catalogue de formations',
    description:
      'Vidéos chapitrées, classées par thématique. Progression suivie, certificats à la clé.',
    anchor: '#tarif',
    mockup: <FormationsPreview />,
  },
  {
    icon: MessagesSquare,
    title: 'Communauté active',
    description:
      'Un mini-réseau social entre membres : partage tes projets, pose tes questions, échange en français.',
    anchor: '#tarif',
    mockup: <CommunityPreview />,
  },
  {
    icon: Newspaper,
    title: 'Actualités IA',
    description:
      "L'agent IA scanne les meilleures sources toutes les 6h et publie un résumé pédagogique en français.",
    anchor: '#tarif',
    mockup: <NewsPreview />,
  },
  {
    icon: Library,
    title: 'Bibliothèque de ressources',
    description:
      'Prompts pré-faits, templates, guides PDF et liens vers les meilleurs outils.',
    anchor: '#tarif',
    mockup: <ResourcesPreview />,
  },
]

export function FourPillars() {
  return (
    <section id="piliers" className="bg-white py-16 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <Eyebrow>Tout en un</Eyebrow>
            <h2 className="mt-6 font-display text-4xl font-bold leading-[1.05] tracking-tight text-[var(--foreground)] sm:text-5xl lg:text-6xl">
              Quatre piliers.{' '}
              <span className="serif-accent">Une expérience complète.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-[var(--muted-foreground)]">
              Pensé pour que tu maîtrises l'IA en autonomie, sans te disperser
              dans 15 abonnements.
            </p>
          </Reveal>
        </div>

        <div className="mt-12 grid gap-5 sm:mt-16 sm:gap-6 md:grid-cols-2">
          {PILLARS.map((p, i) => (
            <Reveal key={p.title} delay={(i % 2) * 0.08}>
              <a
                href={p.anchor}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-white transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--foreground)]/15 hover:shadow-xl hover:shadow-black/5"
              >
                <div className="flex flex-col p-6 sm:p-7">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--foreground)] text-white">
                    <p.icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-5 font-display text-2xl font-bold tracking-tight text-[var(--foreground)]">
                    {p.title}
                  </h3>
                  <p className="mt-2 text-[var(--muted-foreground)]">
                    {p.description}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--foreground)] transition-colors group-hover:text-[var(--primary)]">
                    Découvrir
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
                <div className="mt-auto border-t border-[var(--border)] bg-[var(--background)] p-5 sm:p-8">
                  <div className="mx-auto max-w-md">{p.mockup}</div>
                </div>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
