import {
  GraduationCap,
  MessagesSquare,
  Newspaper,
  Library,
  Sparkles,
  Award,
  ArrowRight,
  Play,
  CheckCircle2,
  Zap,
} from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { Reveal } from './reveal'
import { Eyebrow } from './eyebrow'

/* ─────────────────────────────────────────────────────────────────────────────
   LES 4 PILIERS DU CLUB IA (+ 2 FORCES COMPLÉMENTAIRES POUR UNE GRILLE 3x2 PARFAITE)
   Identité graphique : Bleu Bloomberg (#0F1E4D), Bleu Ciel (#60A5FA), Dark Noir (#0A0A0A)
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
      className="relative overflow-hidden bg-[#07090e] py-20 sm:py-28 lg:py-32 text-white"
    >
      {/* Background brand glows (Bleu Bloomberg & Bleu Ciel) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-gradient-to-b from-[#0F1E4D]/30 via-[#3B82F6]/10 to-transparent blur-[130px]" />
        <div className="absolute bottom-10 right-10 h-[350px] w-[350px] rounded-full bg-[#3B82F6]/10 blur-[100px]" />
        <div className="absolute top-20 left-10 h-[350px] w-[350px] rounded-full bg-[#0F1E4D]/20 blur-[100px]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <Eyebrow className="mb-4 text-[#60A5FA] border-[#3B82F6]/30 bg-[#3B82F6]/10 px-3.5 py-1 rounded-full inline-block">
              TOUT EN UN
            </Eyebrow>
            <h2 className="font-display text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Quatre piliers.{' '}
              <span className="serif-accent text-[#60A5FA] font-serif italic font-normal">
                Une expérience complète.
              </span>
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-base text-zinc-400 sm:text-lg leading-relaxed font-normal">
              Pensé pour que tu maîtrises l'IA en autonomie, sans te disperser dans 15 abonnements différents. Une plateforme unique, optimisée.
            </p>
          </Reveal>
        </div>

        {/* 3x2 Grid of Cards */}
        <div className="mt-14 sm:mt-20 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          
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

          {/* 5. Coach IA 24/7 */}
          <Reveal delay={0.25}>
            <PillarCard
              badge="ASSISTANT IA DÉDIÉ"
              title="Coach IA 24/7"
              description="Un agent spécialisé réponds à tes questions techniques et débloque tes workflows à tout moment."
              graphic={<CoachPreviewGraphic />}
            />
          </Reveal>

          {/* 6. Certification & Progression */}
          <Reveal delay={0.3}>
            <PillarCard
              badge="SUIVI & CERTIFICATS"
              title="Progression & Certificats"
              description="Valide tes acquis au fur et à mesure avec des badges et certificats officiels Club IA."
              graphic={<CertificatePreviewGraphic />}
            />
          </Reveal>

        </div>

        {/* Bottom CTA */}
        <Reveal delay={0.4} className="mt-16 sm:mt-20">
          <div className="flex justify-center">
            <Link
              to="/auth"
              className="group relative inline-flex items-center gap-3 overflow-hidden rounded-full bg-[#0F1E4D] px-10 py-5 text-sm font-bold uppercase tracking-widest text-white shadow-xl shadow-blue-900/30 transition-all duration-300 hover:bg-[#1E3A8A] hover:scale-[1.02] active:scale-[0.98]"
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
   CARD CONTAINER
   ───────────────────────────────────────────────────────────────────────────── */

function PillarCard({ badge, title, description, graphic, link, linkText }: PillarCardProps) {
  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-[#0d1017] p-3 transition-all duration-500 hover:border-[#3B82F6]/50 hover:shadow-[0_20px_50px_rgba(59,130,246,0.15)]">
      
      {/* Glossy Top Preview Area */}
      <div className="relative h-52 sm:h-56 w-full overflow-hidden rounded-[1.4rem] border border-white/10 bg-[#131722] p-4 flex items-center justify-center shadow-inner">
        
        {/* Blue Grid texture */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#ffffff06_1px,transparent_1px),linear-gradient(to_bottom,#ffffff06_1px,transparent_1px)] bg-[size:20px_20px]" />
        <div className="pointer-events-none absolute inset-0 bg-radial-glow from-[#3B82F6]/15 via-transparent to-transparent opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Graphic illustration */}
        <div className="relative z-10 flex h-full w-full items-center justify-center">
          {graphic}
        </div>

        {/* Floating pill badge */}
        <div className="absolute bottom-3 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-md border border-[#3B82F6]/40 bg-[#07090e]/90 px-3 py-1.5 text-[10px] font-extrabold tracking-widest text-[#60A5FA] uppercase shadow-lg backdrop-blur-md transition-transform duration-300 group-hover:scale-105">
          {badge}
        </div>
      </div>

      {/* Card Content */}
      <div className="relative z-10 flex flex-1 flex-col p-5 sm:p-6">
        <h3 className="font-display text-2xl font-bold tracking-tight text-white group-hover:text-[#60A5FA] transition-colors">
          {title}
        </h3>
        <p className="mt-2.5 text-sm leading-relaxed text-zinc-400 font-normal">
          {description}
        </p>

        {link && (
          <div className="mt-4 pt-3 border-t border-white/10">
            <Link
              to={link as any}
              className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#60A5FA] transition-all hover:gap-2.5"
            >
              {linkText || 'En savoir plus'} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </div>

      {/* Bottom Brand Glow (Bleu Bloomberg) */}
      <div className="pointer-events-none absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-[#0F1E4D]/40 via-[#3B82F6]/10 to-transparent opacity-60 transition-opacity duration-500 group-hover:opacity-100" />
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   GRAPHICS (Clean Le Club IA style in brand blue)
   ───────────────────────────────────────────────────────────────────────────── */

function FormationsPreviewGraphic() {
  return (
    <div className="relative w-full max-w-[230px] rounded-xl border border-white/15 bg-[#171c2b] p-2.5 shadow-2xl transition-transform duration-500 group-hover:scale-105">
      <div className="mb-2 flex items-center justify-between border-b border-white/10 pb-1.5 px-1">
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-red-500" />
          <div className="h-2 w-2 rounded-full bg-yellow-500" />
          <div className="h-2 w-2 rounded-full bg-green-500" />
        </div>
        <span className="text-[9px] font-mono text-zinc-400">formation_01.mp4</span>
      </div>

      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-[#0a0d14] flex items-center justify-center border border-white/5">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0F1E4D]/50 via-black to-[#3B82F6]/20" />
        
        <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-[#2563EB] text-white shadow-lg shadow-blue-500/40 backdrop-blur-sm">
          <Play className="h-4 w-4 fill-current translate-x-0.5" />
        </div>

        <div className="absolute bottom-2 left-2 right-2 flex items-center gap-2">
          <div className="h-1 flex-1 rounded-full bg-white/20 overflow-hidden">
            <div className="h-full w-3/4 bg-gradient-to-r from-[#2563EB] to-[#60A5FA]" />
          </div>
          <span className="text-[8px] font-mono text-zinc-300">18:45</span>
        </div>
      </div>
    </div>
  )
}

function CommunityPreviewGraphic() {
  return (
    <div className="relative flex items-center justify-center w-full h-full">
      <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-[#3B82F6]/40 bg-[#0F1E4D]/80 shadow-[0_0_30px_rgba(59,130,246,0.3)] backdrop-blur-md transition-transform duration-500 group-hover:scale-110">
        <MessagesSquare className="h-8 w-8 text-[#60A5FA]" />
      </div>

      <div className="absolute -top-1 left-10 flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-blue-900/90 text-white text-xs font-bold shadow-lg">
        <span className="h-2 w-2 rounded-full bg-emerald-400 absolute -top-0.5 -right-0.5 ring-2 ring-black" />
        GT
      </div>

      <div className="absolute -bottom-1 right-10 flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-indigo-900/90 text-white text-xs font-bold shadow-lg">
        <span className="h-2 w-2 rounded-full bg-emerald-400 absolute -top-0.5 -right-0.5 ring-2 ring-black" />
        MC
      </div>
    </div>
  )
}

function NewsPreviewGraphic() {
  return (
    <div className="relative w-full max-w-[220px] rounded-xl border border-white/15 bg-[#171c2b] p-3 shadow-2xl transition-transform duration-500 group-hover:scale-105">
      <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
        <div className="flex items-center gap-1.5">
          <Newspaper className="h-3.5 w-3.5 text-[#60A5FA]" />
          <span className="text-[11px] font-bold text-white">Veille IA</span>
        </div>
        <span className="rounded bg-[#3B82F6]/20 px-1.5 py-0.5 text-[9px] font-mono text-[#60A5FA]">Toutes les 6h</span>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between rounded bg-white/5 p-1.5 text-[10px]">
          <span className="truncate text-zinc-300">Synthèse Agents IA Mistral</span>
          <CheckCircle2 className="h-3 w-3 text-[#60A5FA] shrink-0" />
        </div>
        <div className="flex items-center justify-between rounded bg-white/5 p-1.5 text-[10px]">
          <span className="truncate text-zinc-300">Nouveau modèle Claude 3.5</span>
          <CheckCircle2 className="h-3 w-3 text-[#60A5FA] shrink-0" />
        </div>
      </div>
    </div>
  )
}

function ResourcesPreviewGraphic() {
  return (
    <div className="relative flex items-center justify-center h-full w-full">
      <div className="relative transition-transform duration-500 group-hover:scale-105">
        <div className="absolute -top-2 -left-2 h-24 w-36 rounded-xl border border-white/10 bg-[#0F1E4D]/80 shadow-md rotate-[-6deg]" />
        
        <div className="relative h-24 w-36 rounded-xl border border-[#3B82F6]/40 bg-gradient-to-br from-[#0F1E4D] to-[#1E3A8A] p-3 shadow-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <Library className="h-5 w-5 text-[#60A5FA]" />
            <span className="rounded bg-black/40 px-1.5 py-0.5 text-[8px] font-mono text-blue-200 uppercase">PROMPT</span>
          </div>
          <div>
            <div className="h-1.5 w-20 rounded bg-white/80" />
            <div className="mt-1 h-1.5 w-12 rounded bg-white/40" />
          </div>
        </div>
      </div>
    </div>
  )
}

function CoachPreviewGraphic() {
  return (
    <div className="relative w-full max-w-[220px] transition-transform duration-500 group-hover:scale-105">
      <div className="rounded-xl border border-white/15 bg-[#171c2b] p-3 shadow-2xl flex flex-col gap-2">
        <div className="flex items-start gap-2">
          <div className="h-5 w-5 shrink-0 rounded-full bg-zinc-700 flex items-center justify-center text-[9px] font-bold text-white">
            U
          </div>
          <div className="rounded-xl rounded-tl-none bg-zinc-800 px-2.5 py-1 text-[10px] text-zinc-200">
            Quel prompt pour générer ce visuel ?
          </div>
        </div>

        <div className="flex items-start gap-2 justify-end">
          <div className="rounded-xl rounded-tr-none bg-[#2563EB] px-2.5 py-1 text-[10px] text-white shadow-md">
            Voici la structure exacte à copier ⚡
          </div>
          <div className="h-5 w-5 shrink-0 rounded-full bg-[#60A5FA] flex items-center justify-center text-black">
            <Sparkles className="h-3 w-3" />
          </div>
        </div>
      </div>
    </div>
  )
}

function CertificatePreviewGraphic() {
  return (
    <div className="relative flex items-center justify-center h-full w-full">
      <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-[#3B82F6]/50 bg-gradient-to-br from-[#0F1E4D] to-[#2563EB] shadow-xl transition-transform duration-500 group-hover:scale-110">
        <Award className="h-8 w-8 text-[#60A5FA]" />
      </div>
    </div>
  )
}
