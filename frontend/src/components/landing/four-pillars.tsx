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
    <div className="relative w-full max-w-[250px] rounded-xl border border-zinc-200 bg-white p-2.5 shadow-lg transition-transform duration-500 group-hover:scale-105">
      <div className="mb-2 flex items-center justify-between border-b border-zinc-100 pb-1.5 px-1">
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-red-400" />
          <div className="h-2 w-2 rounded-full bg-yellow-400" />
          <div className="h-2 w-2 rounded-full bg-green-400" />
        </div>
        <span className="text-[9px] font-mono text-zinc-400">formation_01.mp4</span>
      </div>

      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-[#0F1E4D] flex items-center justify-center border border-zinc-200">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0F1E4D] via-[#1E3A8A] to-[#2563EB]/40" />
        
        <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#0F1E4D] shadow-xl backdrop-blur-sm">
          <Play className="h-4 w-4 fill-current translate-x-0.5" />
        </div>

        <div className="absolute bottom-2 left-2 right-2 flex items-center gap-2">
          <div className="h-1 flex-1 rounded-full bg-white/30 overflow-hidden">
            <div className="h-full w-3/4 bg-[#60A5FA]" />
          </div>
          <span className="text-[8px] font-mono text-white/80">18:45</span>
        </div>
      </div>
    </div>
  )
}

function CommunityPreviewGraphic() {
  return (
    <div className="relative flex items-center justify-center w-full h-full">
      <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-200 bg-[#0F1E4D] text-white shadow-xl transition-transform duration-500 group-hover:scale-110">
        <MessagesSquare className="h-8 w-8 text-[#60A5FA]" />
      </div>

      <div className="absolute -top-1 left-10 flex h-8 w-8 items-center justify-center rounded-full border border-white bg-[#2563EB] text-white text-xs font-bold shadow-md">
        <span className="h-2 w-2 rounded-full bg-emerald-400 absolute -top-0.5 -right-0.5 ring-2 ring-white" />
        GT
      </div>

      <div className="absolute -bottom-1 right-10 flex h-8 w-8 items-center justify-center rounded-full border border-white bg-[#0F1E4D] text-white text-xs font-bold shadow-md">
        <span className="h-2 w-2 rounded-full bg-emerald-400 absolute -top-0.5 -right-0.5 ring-2 ring-white" />
        MC
      </div>
    </div>
  )
}

function NewsPreviewGraphic() {
  return (
    <div className="relative w-full max-w-[240px] rounded-xl border border-zinc-200 bg-white p-3 shadow-lg transition-transform duration-500 group-hover:scale-105">
      <div className="flex items-center justify-between border-b border-zinc-100 pb-2 mb-2">
        <div className="flex items-center gap-1.5">
          <Newspaper className="h-3.5 w-3.5 text-[#2563EB]" />
          <span className="text-[11px] font-bold text-[#0A0A0A]">Veille IA</span>
        </div>
        <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[9px] font-mono text-[#2563EB] border border-blue-100">Toutes les 6h</span>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between rounded bg-zinc-50 p-1.5 text-[10px] border border-zinc-100">
          <span className="truncate text-zinc-700 font-medium">Synthèse Agents IA Mistral</span>
          <CheckCircle2 className="h-3 w-3 text-[#2563EB] shrink-0" />
        </div>
        <div className="flex items-center justify-between rounded bg-zinc-50 p-1.5 text-[10px] border border-zinc-100">
          <span className="truncate text-zinc-700 font-medium">Nouveau modèle Claude 3.5</span>
          <CheckCircle2 className="h-3 w-3 text-[#2563EB] shrink-0" />
        </div>
      </div>
    </div>
  )
}

function ResourcesPreviewGraphic() {
  return (
    <div className="relative flex items-center justify-center h-full w-full">
      <div className="relative transition-transform duration-500 group-hover:scale-105">
        <div className="absolute -top-2 -left-2 h-24 w-36 rounded-xl border border-zinc-200 bg-zinc-100 shadow-sm rotate-[-6deg]" />
        
        <div className="relative h-24 w-36 rounded-xl border border-blue-200 bg-gradient-to-br from-[#0F1E4D] to-[#1E3A8A] p-3 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <Library className="h-5 w-5 text-[#60A5FA]" />
            <span className="rounded bg-white/20 px-1.5 py-0.5 text-[8px] font-mono text-white uppercase font-bold">PROMPT</span>
          </div>
          <div>
            <div className="h-1.5 w-20 rounded bg-white/90" />
            <div className="mt-1 h-1.5 w-12 rounded bg-white/50" />
          </div>
        </div>
      </div>
    </div>
  )
}
