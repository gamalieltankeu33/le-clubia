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

import { Link } from '@tanstack/react-router'

interface Pillar {
  icon: LucideIcon
  title: string
  description: string
  anchor: string
  mockup: React.ReactNode
  link?: string
}

const PILLARS: Pillar[] = [
  {
    icon: GraduationCap,
    title: 'Catalogue de formations',
    description:
      'Vidéos chapitrées, classées par thématique. Progression suivie, certificats à la clé.',
    anchor: '#formations',
    mockup: <FormationsPreview />,
    link: '/catalogue',
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
    <section
      id="piliers"
      className="relative overflow-clip bg-white py-16 sm:py-24 lg:py-28"
    >
      {/* Background depth halo — masqué sur mobile : sur iOS Safari, un
          élément absolute avec filter: blur() + overflow-hidden parent
          fuit hors du clipping (bug WebKit compositing layer), ce qui
          déportait toute la section vers la droite. Sur ≥768px ça
          fonctionne correctement, on garde la profondeur visuelle. */}
      <div className="pointer-events-none absolute left-0 top-1/2 hidden h-[500px] w-[500px] -translate-y-1/2 rounded-full bg-[var(--primary)]/[0.03] blur-[100px] md:block" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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

        <div className="mt-12 grid gap-8 sm:mt-16 md:grid-cols-2">
          {PILLARS.map((p, i) => (
            <Reveal
              key={p.title}
              delay={i * 0.1}
              direction={i % 2 === 0 ? 'right' : 'left'}
              className="min-w-0"
            >
              <div className="group relative flex h-full max-w-full min-w-0 flex-col overflow-hidden rounded-3xl border border-[var(--border)] bg-white transition-all duration-700 hover:border-[var(--primary)]/20 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)] sm:rounded-[2.5rem]">
                <div className="relative z-10 flex flex-col p-6 sm:p-10">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0A0A0A] text-white shadow-xl shadow-black/10 transition-transform duration-500 group-hover:scale-110 group-hover:bg-[var(--primary)]">
                    <p.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-8 font-display text-2xl font-black tracking-tight text-[#0A0A0A] sm:text-4xl">
                    {p.title}
                  </h3>
                  <p className="mt-4 text-base font-medium leading-relaxed text-[#4A4A4A] opacity-70 sm:text-lg">
                    {p.description}
                  </p>

                  {p.link && (
                    <Link
                      to={p.link as any}
                      className="mt-6 inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#0A0A0A] transition-all duration-300 group-hover:gap-3 group-hover:text-[var(--primary)]"
                    >
                      Voir tout le catalogue
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  )}
                </div>

                {/* Mockup section - No longer forced to bottom with mt-auto */}
                <div className="px-4 pb-6 sm:px-8 sm:pb-10">
                  <div className="relative overflow-hidden rounded-2xl bg-[#F8F9FA] p-4 transition-transform duration-700 group-hover:scale-[1.01]">
                    {p.mockup}
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* CTA bottom — full-width sur mobile pour booster la conversion,
            pill centré sur desktop pour rester aéré. */}
        <Reveal delay={0.5} className="mt-16 sm:mt-20">
          <div className="flex justify-center">
            <Link
              to="/auth"
              className="group relative inline-flex w-full items-center justify-center gap-3 overflow-hidden rounded-full bg-[#0A0A0A] px-8 py-5 text-base font-black uppercase tracking-widest text-white shadow-xl shadow-black/10 transition-all hover:scale-[1.02] active:scale-[0.98] sm:w-auto sm:px-12 sm:text-sm"
            >
              <span className="relative z-10">Rejoindre Le Club IA</span>
              <ArrowRight className="relative z-10 h-5 w-5 transition-transform group-hover:translate-x-1" />
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
