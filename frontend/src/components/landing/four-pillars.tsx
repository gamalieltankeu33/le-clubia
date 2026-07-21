import { useState } from 'react'
import {
  GraduationCap,
  Users,
  BookOpen,
  MessageSquareCode,
  Radio,
  Sparkles,
  Play,
  CheckCircle2,
  Zap,
  ArrowRight,
} from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { Reveal } from './reveal'
import { Eyebrow } from './eyebrow'

interface FeatureCardProps {
  badge: string
  title: string
  description: string
  graphic: React.ReactNode
  glowColor?: string
}

export function FourPillars() {
  return (
    <section
      id="piliers"
      className="relative overflow-hidden bg-[#050508] py-20 sm:py-28 lg:py-32 text-white"
    >
      {/* Background ambient lighting */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 h-[600px] w-[900px] rounded-full bg-gradient-to-b from-purple-900/15 via-blue-900/10 to-transparent blur-[140px]" />
        <div className="absolute bottom-10 right-10 h-[400px] w-[400px] rounded-full bg-purple-600/10 blur-[120px]" />
        <div className="absolute top-20 left-10 h-[400px] w-[400px] rounded-full bg-blue-600/10 blur-[120px]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <Eyebrow className="mb-4 text-purple-400/90 border-purple-500/20 bg-purple-500/10 px-3.5 py-1 rounded-full inline-block">
              TOUT EN UN
            </Eyebrow>
            <h2 className="font-display text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
              La plateforme IA la{' '}
              <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-indigo-300 bg-clip-text text-transparent italic font-serif">
                plus complète
              </span>
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-base text-zinc-400 sm:text-lg leading-relaxed font-normal">
              Cette suite d'outils et de ressources est conçue pour t'assurer un suivi dans le temps, avec des contenus exclusifs équilibrés entre technique et business.
            </p>
          </Reveal>
        </div>

        {/* 3x2 Grid of Cards */}
        <div className="mt-14 sm:mt-20 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          
          {/* 1. Modules de Formation */}
          <Reveal delay={0.05}>
            <FeatureCard
              badge="+10 MODULES DE FORMATION"
              title="+10 Modules de formation"
              description="Comme une série Netflix, suis à ton rythme (environ 40 heures) avec vidéos chapitrées et exercices pratiques."
              graphic={<FormationsGraphic />}
            />
          </Reveal>

          {/* 2. Communauté */}
          <Reveal delay={0.1}>
            <FeatureCard
              badge="ACCÈS COMMUNAUTÉ PRIVÉE"
              title="Communauté"
              description="Une communauté d'entraide exclusive pour aider à la moindre question, au moindre doute."
              graphic={<CommunityGraphic />}
            />
          </Reveal>

          {/* 3. Playbooks */}
          <Reveal delay={0.15}>
            <FeatureCard
              badge="RESSOURCES EXCLUSIVES"
              title="Playbooks & Prompts"
              description="Des templates, checklists et guides pratiques pour aller plus vite et maximiser sa performance."
              graphic={<PlaybooksGraphic />}
            />
          </Reveal>

          {/* 4. Coach IA / Accès Direct */}
          <Reveal delay={0.2}>
            <FeatureCard
              badge="ASSISTANT & COACH 24/7"
              title="Accès Direct & Coach IA"
              description="Obtiens des réponses en direct et un accompagnement virtuel instantané pour toutes tes questions."
              graphic={<CoachGraphic />}
            />
          </Reveal>

          {/* 5. Live Exclusifs */}
          <Reveal delay={0.25}>
            <FeatureCard
              badge="LIVES EXCLUSIFS"
              title="Lives & Ateliers"
              description="Des vidéos et sessions live par mois pour suivre les nouveautés de l'IA et partager des cas pratiques."
              graphic={<LivesGraphic />}
            />
          </Reveal>

          {/* 6. Veille Automatique */}
          <Reveal delay={0.3}>
            <FeatureCard
              badge="UPDATES CONTINUES"
              title="Veille Stratégique IA"
              description="Un agent IA scanne les meilleures sources toutes les 6h et publie un résumé clair et directement exploitable."
              graphic={<VeilleGraphic />}
            />
          </Reveal>

        </div>

        {/* CTA Button Bottom */}
        <Reveal delay={0.4} className="mt-16 sm:mt-20">
          <div className="flex justify-center">
            <Link
              to="/auth"
              className="group relative inline-flex items-center gap-3 overflow-hidden rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 px-10 py-5 text-sm font-bold uppercase tracking-widest text-white shadow-2xl shadow-purple-600/30 transition-all duration-300 hover:scale-[1.03] active:scale-[0.97]"
            >
              <span className="relative z-10">Rejoindre Le Club IA</span>
              <ArrowRight className="relative z-10 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   FEATURE CARD CONTAINER (reproducing the exact layout & glow from reference)
   ───────────────────────────────────────────────────────────────────────────── */

function FeatureCard({ badge, title, description, graphic }: FeatureCardProps) {
  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-[#0b0b12] p-3 transition-all duration-500 hover:border-purple-500/40 hover:shadow-[0_20px_50px_rgba(139,92,246,0.15)]">
      
      {/* Top Preview Area (Glassy container with grid pattern) */}
      <div className="relative h-52 sm:h-56 w-full overflow-hidden rounded-[1.4rem] border border-white/10 bg-[#12121c] p-4 flex items-center justify-center shadow-inner">
        
        {/* Radial & Grid texture background */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:20px_20px]" />
        <div className="pointer-events-none absolute inset-0 bg-radial-glow from-purple-500/10 via-transparent to-transparent opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Graphic Content */}
        <div className="relative z-10 flex h-full w-full items-center justify-center">
          {graphic}
        </div>

        {/* Floating Pill Badge at bottom of preview box */}
        <div className="absolute bottom-3 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/20 bg-black/80 px-3 py-1.5 text-[10px] font-extrabold tracking-widest text-white uppercase shadow-xl backdrop-blur-md transition-transform duration-300 group-hover:scale-105">
          {badge}
        </div>
      </div>

      {/* Card Text Content */}
      <div className="relative z-10 flex flex-1 flex-col p-5 sm:p-6">
        <h3 className="font-display text-2xl font-bold tracking-tight text-white group-hover:text-purple-200 transition-colors">
          {title}
        </h3>
        <p className="mt-2.5 text-sm leading-relaxed text-zinc-400 font-normal">
          {description}
        </p>
      </div>

      {/* Ambient bottom Purple Glow Effect */}
      <div className="pointer-events-none absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-purple-900/35 via-purple-900/10 to-transparent opacity-70 transition-opacity duration-500 group-hover:opacity-100" />
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   CARD 1 GRAPHIC: Formations Mockup (Netflix style video player)
   ───────────────────────────────────────────────────────────────────────────── */
function FormationsGraphic() {
  return (
    <div className="relative w-full max-w-[240px] rounded-xl border border-white/15 bg-[#181824] p-2.5 shadow-2xl transition-transform duration-500 group-hover:scale-105">
      {/* Top bar */}
      <div className="mb-2 flex items-center justify-between border-b border-white/10 pb-1.5 px-1">
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-red-500" />
          <div className="h-2 w-2 rounded-full bg-yellow-500" />
          <div className="h-2 w-2 rounded-full bg-green-500" />
        </div>
        <span className="text-[9px] font-mono text-zinc-400">module_04.mp4</span>
      </div>

      {/* Screen area */}
      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-[#09090f] flex items-center justify-center border border-white/5">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-black to-blue-900/20" />
        
        {/* Glowing play icon */}
        <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-purple-600/90 text-white shadow-lg shadow-purple-600/50 backdrop-blur-sm">
          <Play className="h-4 w-4 fill-current translate-x-0.5" />
        </div>

        {/* Progress bar */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center gap-2">
          <div className="h-1 flex-1 rounded-full bg-white/20 overflow-hidden">
            <div className="h-full w-2/3 bg-gradient-to-r from-purple-500 to-blue-400" />
          </div>
          <span className="text-[8px] font-mono text-zinc-300">24:12</span>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   CARD 2 GRAPHIC: Community Network Graphic
   ───────────────────────────────────────────────────────────────────────────── */
function CommunityGraphic() {
  return (
    <div className="relative flex items-center justify-center w-full h-full">
      {/* Glowing center hub */}
      <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-purple-500/40 bg-purple-950/60 shadow-[0_0_30px_rgba(168,85,247,0.4)] backdrop-blur-md transition-transform duration-500 group-hover:scale-110">
        <Users className="h-8 w-8 text-purple-300" />
      </div>

      {/* Satellite member nodes */}
      <div className="absolute -top-1 left-8 flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-blue-900/80 text-white text-xs font-bold shadow-lg">
        <span className="h-2 w-2 rounded-full bg-emerald-400 absolute -top-0.5 -right-0.5 ring-2 ring-black" />
        JD
      </div>

      <div className="absolute -bottom-1 right-8 flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-indigo-900/80 text-white text-xs font-bold shadow-lg">
        <span className="h-2 w-2 rounded-full bg-emerald-400 absolute -top-0.5 -right-0.5 ring-2 ring-black" />
        SL
      </div>

      <div className="absolute top-2 right-12 flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-purple-900/80 text-white text-[10px] font-bold shadow-lg">
        MK
      </div>

      <div className="absolute bottom-2 left-12 flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-pink-900/80 text-white text-[10px] font-bold shadow-lg">
        AL
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   CARD 3 GRAPHIC: 3D Stacked Playbooks & Guides
   ───────────────────────────────────────────────────────────────────────────── */
function PlaybooksGraphic() {
  return (
    <div className="relative flex items-center justify-center h-full w-full">
      <div className="relative transition-transform duration-500 group-hover:scale-105">
        {/* Book 3 (Back) */}
        <div className="absolute -top-3 -left-3 h-24 w-36 rounded-xl border border-white/10 bg-indigo-950/80 shadow-md rotate-[-8deg]" />
        
        {/* Book 2 (Middle) */}
        <div className="absolute -top-1.5 -left-1.5 h-24 w-36 rounded-xl border border-purple-500/20 bg-purple-900/90 shadow-lg rotate-[-4deg]" />

        {/* Book 1 (Front Cover) */}
        <div className="relative h-24 w-36 rounded-xl border border-purple-400/30 bg-gradient-to-br from-purple-800 to-indigo-900 p-3 shadow-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <BookOpen className="h-5 w-5 text-purple-200" />
            <span className="rounded bg-black/40 px-1.5 py-0.5 text-[8px] font-mono text-purple-200 uppercase">PDF</span>
          </div>
          <div>
            <div className="h-1.5 w-16 rounded bg-white/70" />
            <div className="mt-1 h-1.5 w-10 rounded bg-white/40" />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   CARD 4 GRAPHIC: Coach IA & Direct Access
   ───────────────────────────────────────────────────────────────────────────── */
function CoachGraphic() {
  return (
    <div className="relative w-full max-w-[230px] transition-transform duration-500 group-hover:scale-105">
      <div className="rounded-xl border border-white/15 bg-[#181824] p-3 shadow-2xl flex flex-col gap-2.5">
        
        {/* User Question bubble */}
        <div className="flex items-start gap-2">
          <div className="h-6 w-6 shrink-0 rounded-full bg-zinc-700 flex items-center justify-center text-[10px] font-bold text-white">
            M
          </div>
          <div className="rounded-2xl rounded-tl-none bg-zinc-800 px-3 py-1.5 text-[11px] text-zinc-200">
            Comment automatiser mes posts avec Claude 3.5 ?
          </div>
        </div>

        {/* AI Answer bubble */}
        <div className="flex items-start gap-2 justify-end">
          <div className="rounded-2xl rounded-tr-none bg-purple-600/90 px-3 py-1.5 text-[11px] text-white shadow-md">
            Voici le workflow n8n prêt à l'emploi ⚡
          </div>
          <div className="h-6 w-6 shrink-0 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-white shadow-sm">
            <Sparkles className="h-3 w-3" />
          </div>
        </div>

      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   CARD 5 GRAPHIC: Lives & Workshops
   ───────────────────────────────────────────────────────────────────────────── */
function LivesGraphic() {
  return (
    <div className="relative w-full max-w-[220px] rounded-xl border border-white/15 bg-[#181824] overflow-hidden shadow-2xl transition-transform duration-500 group-hover:scale-105">
      {/* Live Video Header */}
      <div className="relative aspect-video w-full bg-gradient-to-br from-indigo-950 via-purple-950 to-black flex items-center justify-center p-3">
        
        {/* Live Red Badge */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 rounded-full bg-red-600 px-2 py-0.5 text-[9px] font-black uppercase text-white shadow-md animate-pulse">
          <span className="h-1.5 w-1.5 rounded-full bg-white" />
          LIVE
        </div>

        {/* Presenter Avatar */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="h-12 w-12 rounded-full border-2 border-purple-400 bg-purple-900/80 flex items-center justify-center text-white shadow-lg overflow-hidden">
            <Radio className="h-6 w-6 text-purple-300" />
          </div>
          <span className="text-[10px] font-bold text-zinc-200">Masterclass Hebdo</span>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   CARD 6 GRAPHIC: Veille IA Dashboard
   ───────────────────────────────────────────────────────────────────────────── */
function VeilleGraphic() {
  return (
    <div className="relative w-full max-w-[220px] rounded-xl border border-white/15 bg-[#181824] p-3 shadow-2xl transition-transform duration-500 group-hover:scale-105">
      <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
        <div className="flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5 text-yellow-400" />
          <span className="text-[11px] font-bold text-white">Scanner IA</span>
        </div>
        <span className="rounded bg-purple-500/20 px-1.5 py-0.5 text-[9px] font-mono text-purple-300">Toutes les 6h</span>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between rounded bg-white/5 p-1.5 text-[10px]">
          <span className="truncate text-zinc-300">OpenAI lance GPT-4.5</span>
          <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
        </div>
        <div className="flex items-center justify-between rounded bg-white/5 p-1.5 text-[10px]">
          <span className="truncate text-zinc-300">Nouveau modèle Midjourney v7</span>
          <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
        </div>
      </div>
    </div>
  )
}
