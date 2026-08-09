import {
  GraduationCap,
  MessagesSquare,
  Newspaper,
  Library,
  ArrowRight,
  Play,
  CheckCircle2,
} from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { Reveal } from './reveal'
import { Eyebrow } from './eyebrow'

/* ─────────────────────────────────────────────────────────────────────────────
   LES 4 PILIERS DU CLUB IA (GRILLE 2x2 ÉPURÉE SUR FOND CLAIR)
   ───────────────────────────────────────────────────────────────────────────── */

interface PillarCardProps {
  badge: string
  title: string
  description: string
  graphic: React.ReactNode
  link?: string
  linkText?: string
}

export function FourPillars() {
  return (
    <section
      id="piliers"
      className="relative overflow-hidden bg-[var(--background)] py-20 sm:py-28 lg:py-32"
    >
      {/* Halo de fond subtil */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-gradient-to-b from-[#3B82F6]/[0.05] via-transparent to-transparent blur-[120px]" />
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        
        {/* En-tête de section */}
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <Eyebrow className="mb-4 inline-block rounded-full border border-blue-200/80 bg-blue-50/80 px-3.5 py-1 text-xs font-semibold text-[#2563EB]">
              TOUT EN UN
            </Eyebrow>
            <h2 className="font-display text-4xl font-extrabold tracking-tight text-[#0A0A0A] sm:text-5xl lg:text-6xl">
              Quatre piliers.{' '}
              <span className="serif-accent font-serif italic text-[#2563EB] font-normal">
                Une expérience complète.
              </span>
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-base text-[#6B6B6B] sm:text-lg leading-relaxed font-normal">
              Pensé pour que tu maîtrises l'IA en autonomie, sans te disperser dans 15 abonnements différents. Une plateforme unique, optimisée.
            </p>
          </Reveal>
        </div>

        {/* Grille 2x2 des 4 piliers */}
        <div className="mt-14 sm:mt-20 grid grid-cols-1 gap-6 md:grid-cols-2">
          
          {/* 1. Catalogue de formations */}
          <Reveal delay={0.05}>
            <PillarCard
              badge="CATALOGUE DE FORMATIONS"
              title="Catalogue de formations"
              description="Vidéos chapitrées, classées par thématique. Progression suivie, certificats à la clé."
              link="/catalogue"
              linkText="Voir tout le catalogue"
              graphic={<FormationsPreviewGraphic />}
            />
          </Reveal>

          {/* 2. Communauté active */}
          <Reveal delay={0.1}>
            <PillarCard
              badge="COMMUNAUTÉ PRIVÉE"
              title="Communauté active"
              description="Un mini-réseau social entre membres : partage tes projets, pose tes questions, échange en français."
              graphic={<CommunityPreviewGraphic />}
            />
          </Reveal>

          {/* 3. Actualités IA */}
          <Reveal delay={0.15}>
            <PillarCard
              badge="VEILLE AUTOMATIQUE"
              title="Actualités IA"
              description="L'agent IA scanne les meilleures sources toutes les 6h et publie un résumé pédagogique en français."
              graphic={<NewsPreviewGraphic />}
            />
          </Reveal>

          {/* 4. Bibliothèque de ressources */}
          <Reveal delay={0.2}>
            <PillarCard
              badge="RESSOURCES & TEMPLATES"
              title="Bibliothèque de ressources"
              description="Prompts pré-faits, templates, guides PDF et liens vers les meilleurs outils."
              graphic={<ResourcesPreviewGraphic />}
            />
          </Reveal>

        </div>

        {/* CTA bas de section */}
        <Reveal delay={0.3} className="mt-16 sm:mt-20">
          <div className="flex justify-center">
            <Link
              to="/auth"
              className="group relative inline-flex items-center gap-3 overflow-hidden rounded-full bg-[#0A0A0A] px-10 py-5 text-sm font-bold uppercase tracking-widest text-white shadow-xl shadow-black/10 transition-all duration-300 hover:bg-[#1C1A18] hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="relative z-10">Rejoindre Le Club IA</span>
              <ArrowRight className="relative z-10 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </Reveal>

      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   CARTE INDIVIDUELLE
   ───────────────────────────────────────────────────────────────────────────── */

function PillarCard({ badge, title, description, graphic, link, linkText }: PillarCardProps) {
  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-[2rem] border border-[var(--border)] bg-white p-3 transition-all duration-500 hover:border-[#3B82F6]/30 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.07)]">
      
      {/* Zone de prévisualisation supérieure */}
      <div className="relative h-56 sm:h-64 w-full overflow-hidden rounded-[1.4rem] border border-zinc-200/70 bg-zinc-50/80 p-4 flex items-center justify-center">
        
        {/* Motifs de grille subtils */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#0000000a_1px,transparent_1px),linear-gradient(to_bottom,#0000000a_1px,transparent_1px)] bg-[size:20px_20px]" />
        <div className="pointer-events-none absolute inset-0 bg-radial-glow from-[#3B82F6]/10 via-transparent to-transparent opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Composant graphique */}
        <div className="relative z-10 flex h-full w-full items-center justify-center">
          {graphic}
        </div>

        {/* Badge pill noir épuré */}
        <div className="absolute bottom-3.5 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#0A0A0A] px-3.5 py-1.5 text-[10px] font-extrabold tracking-widest text-white uppercase shadow-md transition-transform duration-300 group-hover:scale-105">
          {badge}
        </div>
      </div>

      {/* Contenu texte */}
      <div className="relative z-10 flex flex-1 flex-col p-6 sm:p-7">
        <h3 className="font-display text-2xl font-bold tracking-tight text-[#0A0A0A] group-hover:text-[#2563EB] transition-colors">
          {title}
        </h3>
        <p className="mt-2.5 text-sm leading-relaxed text-[#6B6B6B] font-normal">
          {description}
        </p>

        {link && (
          <div className="mt-4 pt-3 border-t border-[var(--border)]">
            <Link
              to={link as any}
              className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#2563EB] transition-all hover:gap-2.5"
            >
              {linkText || 'En savoir plus'} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   APERÇUS GRAPHIQUES
   ───────────────────────────────────────────────────────────────────────────── */

function FormationsPreviewGraphic() {
  return (
    <div className="relative flex items-center justify-center w-full h-full">
      <div className="relative flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-3xl border-2 border-[#2563EB]/40 bg-[#0F1E4D] shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:border-[#2563EB]">
        <div className="absolute -inset-2 rounded-3xl bg-[#2563EB]/20 blur-xl opacity-60 group-hover:opacity-100 transition-opacity" />
        <GraduationCap className="relative z-10 h-10 w-10 sm:h-12 sm:w-12 text-[#60A5FA]" />
      </div>
    </div>
  )
}

function CommunityPreviewGraphic() {
  return (
    <div className="relative flex items-center justify-center w-full h-full">
      <div className="relative flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-3xl border-2 border-emerald-500/40 bg-[#0F1E4D] shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:border-emerald-500">
        <div className="absolute -inset-2 rounded-3xl bg-emerald-500/20 blur-xl opacity-60 group-hover:opacity-100 transition-opacity" />
        <MessagesSquare className="relative z-10 h-10 w-10 sm:h-12 sm:w-12 text-emerald-400" />
      </div>
    </div>
  )
}

function NewsPreviewGraphic() {
  return (
    <div className="relative flex items-center justify-center w-full h-full">
      <div className="relative flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-3xl border-2 border-purple-500/40 bg-[#0F1E4D] shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:border-purple-500">
        <div className="absolute -inset-2 rounded-3xl bg-purple-500/20 blur-xl opacity-60 group-hover:opacity-100 transition-opacity" />
        <Newspaper className="relative z-10 h-10 w-10 sm:h-12 sm:w-12 text-purple-300" />
      </div>
    </div>
  )
}

function ResourcesPreviewGraphic() {
  return (
    <div className="relative flex items-center justify-center w-full h-full">
      <div className="relative flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-3xl border-2 border-amber-500/40 bg-[#0F1E4D] shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:border-amber-500">
        <div className="absolute -inset-2 rounded-3xl bg-amber-500/20 blur-xl opacity-60 group-hover:opacity-100 transition-opacity" />
        <Library className="relative z-10 h-10 w-10 sm:h-12 sm:w-12 text-amber-300" />
      </div>
    </div>
  )
}
