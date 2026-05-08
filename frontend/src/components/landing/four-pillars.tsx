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
    <section id="piliers" className="relative bg-white py-24 sm:py-32 lg:py-40">
      {/* Background depth halo */}
      <div className="pointer-events-none absolute left-0 top-1/2 h-[500px] w-[500px] -translate-y-1/2 rounded-full bg-[var(--primary)]/[0.03] blur-[100px]" />

      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <Eyebrow className="mb-4">Tout en un</Eyebrow>
            <h2 className="font-display text-4xl font-bold tracking-tight text-[var(--foreground)] sm:text-5xl lg:text-6xl">
              Quatre piliers.{' '}
              <span className="serif-accent">Une expérience complète.</span>
            </h2>
            <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-[var(--muted-foreground)] sm:text-xl">
              Pensé pour que tu maîtrises l'IA en autonomie, sans te disperser
              dans 15 abonnements différents. Une plateforme unique, optimisée.
            </p>
          </Reveal>
        </div>

        <div className="mt-16 grid gap-6 sm:mt-24 sm:gap-8 md:grid-cols-2">
          {PILLARS.map((p, i) => (
            <Reveal key={p.title} delay={i * 0.1} direction={i % 2 === 0 ? 'right' : 'left'}>
              <a
                href={p.anchor}
                className="group relative flex h-full flex-col overflow-hidden rounded-[2rem] border border-[var(--border)] bg-white transition-all duration-700 hover:scale-[1.01] hover:border-[var(--primary)]/20 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)]"
              >
                <div className="relative z-10 flex flex-col p-8 sm:p-10">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--foreground)] text-white shadow-xl shadow-black/10 transition-transform duration-500 group-hover:scale-110 group-hover:bg-[var(--primary)]">
                    <p.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-8 font-display text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">
                    {p.title}
                  </h3>
                  <p className="mt-4 text-lg leading-relaxed text-[var(--muted-foreground)]">
                    {p.description}
                  </p>
                  <div className="mt-6 inline-flex items-center gap-2 text-sm font-bold tracking-tight text-[var(--foreground)] transition-all duration-300 group-hover:gap-3 group-hover:text-[var(--primary)]">
                    Explorer la feature
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-auto border-t border-[var(--border)] bg-[var(--background)] p-6 sm:p-10">
                  <div className="mx-auto max-w-md transition-transform duration-700 group-hover:scale-[1.03]">
                    {p.mockup}
                  </div>
                </div>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
