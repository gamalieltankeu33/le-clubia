import React, { useState, useEffect } from 'react'
import {
  GraduationCap,
  MessagesSquare,
  Newspaper,
  Library,
  ArrowRight,
  Play,
  CheckCircle2,
  Sparkles,
  Zap,
  Users,
  Check,
  Bot,
  Copy,
  Clock
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from '@tanstack/react-router'
import { Reveal } from './reveal'
import { Eyebrow } from './eyebrow'
import { BrandLogo } from '@/components/brand-logo'

/* ─────────────────────────────────────────────────────────────────────────────
   LES 4 PILIERS DU CLUB IA — ÉCOSYSTÈME CIRCULAIRE DYNAMIQUE HAUTE IMPACT
   ───────────────────────────────────────────────────────────────────────────── */

interface PillarData {
  id: string
  num: string
  badge: string
  shortBadge: string
  title: string
  subtitle: string
  description: string
  icon: React.ElementType
  color: string
  bgLight: string
  borderLight: string
  link: string
  linkText: string
  previewType: 'formations' | 'communaute' | 'veille' | 'ressources'
}

const PILLARS_DATA: PillarData[] = [
  {
    id: 'formations',
    num: '01',
    badge: 'CATALOGUE DE FORMATIONS',
    shortBadge: 'Formations',
    title: 'Catalogue & Vidéos Pratiques',
    subtitle: 'Apprenez par la pratique avec des modules vidéo chapitrés.',
    description: 'Vidéos courtes (10-20 min), cas réels à dupliquer et certificats de fin de parcours.',
    icon: GraduationCap,
    color: '#2563EB',
    bgLight: 'bg-blue-50',
    borderLight: 'border-blue-200',
    link: '/catalogue',
    linkText: 'Explorer le catalogue',
    previewType: 'formations'
  },
  {
    id: 'communaute',
    num: '02',
    badge: 'COMMUNAUTÉ PRIVÉE',
    shortBadge: 'Communauté',
    title: 'Réseau & Entraide 24/7',
    subtitle: 'Échangez avec des membres francophones passionnés d\'IA.',
    description: 'Posez vos questions, partagez vos projets et trouvez des partenaires d\'affaires.',
    icon: MessagesSquare,
    color: '#10B981',
    bgLight: 'bg-emerald-50',
    borderLight: 'border-emerald-200',
    link: '/auth',
    linkText: 'Rejoindre le réseau',
    previewType: 'communaute'
  },
  {
    id: 'veille',
    num: '03',
    badge: 'VEILLE IA AUTOMATISÉE',
    shortBadge: 'Veille IA',
    title: 'Actualités & Synthèses IA 6h',
    subtitle: 'Résumés pédagogiques en français par nos agents IA.',
    description: 'Restez informé des meilleures nouveautés mondiales sans perdre de temps.',
    icon: Newspaper,
    color: '#8B5CF6',
    bgLight: 'bg-purple-50',
    borderLight: 'border-purple-200',
    link: '/auth',
    linkText: 'Découvrir la veille',
    previewType: 'veille'
  },
  {
    id: 'ressources',
    num: '04',
    badge: 'BIBLIOTHÈQUE DE PROMPTS',
    shortBadge: 'Ressources',
    title: 'Prompts & Templates Kits',
    subtitle: 'Ressources prêt-à-l\'emploi pour booster votre productivité.',
    description: 'Prompts optimisés à copier-coller, workflows d\'automatisation Make & guides PDF.',
    icon: Library,
    color: '#F59E0B',
    bgLight: 'bg-amber-50',
    borderLight: 'border-amber-200',
    link: '/auth',
    linkText: 'Accéder aux ressources',
    previewType: 'ressources'
  }
]

export function FourPillars() {
  const [activeIdx, setActiveIdx] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  // Auto rotation
  useEffect(() => {
    if (isPaused) return
    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % PILLARS_DATA.length)
    }, 4500)
    return () => clearInterval(timer)
  }, [isPaused])

  const activePillar = PILLARS_DATA[activeIdx]

  return (
    <section
      id="piliers"
      className="relative overflow-hidden bg-[var(--background)] py-16 sm:py-24 lg:py-28"
    >
      {/* Background glow and subtle ambient radial gradient */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[700px] w-[1000px] rounded-full bg-gradient-to-b from-[#2563EB]/[0.05] via-[#2563EB]/[0.02] to-transparent blur-[140px]" />
        <div className="absolute inset-0 bg-[radial-gradient(#2563EB_1px,transparent_1px)] [background-size:36px_36px] opacity-[0.03]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <Eyebrow className="mb-3.5 inline-block rounded-full border border-blue-200/80 bg-blue-50/80 px-3.5 py-1 text-xs font-extrabold text-[#2563EB] tracking-wider uppercase">
              ÉCOSYSTÈME UNIFIÉ
            </Eyebrow>
            <h2 className="font-display text-3xl font-extrabold tracking-tight text-[#0A0A0A] sm:text-5xl lg:text-6xl leading-[1.15]">
              Quatre piliers.{' '}
              <span className="serif-accent font-serif italic text-[#2563EB] font-normal block sm:inline">
                Un seul écosystème central.
              </span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm text-[#6B6B6B] sm:text-base leading-relaxed font-normal">
              Survolez ou cliquez sur les piliers pour explorer les capacités du Club IA.
            </p>
          </Reveal>
        </div>

        {/* Mobile Pillar Quick Tabs Bar */}
        <div className="mt-6 lg:hidden flex items-center justify-center gap-1.5 overflow-x-auto pb-2 px-1">
          {PILLARS_DATA.map((pillar, idx) => {
            const IconComp = pillar.icon
            const isActive = idx === activeIdx
            return (
              <button
                key={pillar.id}
                onClick={() => {
                  setActiveIdx(idx)
                  setIsPaused(true)
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${
                  isActive
                    ? 'bg-[#0F1E4D] text-white border-[#0F1E4D] shadow-md'
                    : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'
                }`}
              >
                <IconComp className={`w-3.5 h-3.5 ${isActive ? 'text-[#60A5FA]' : 'text-zinc-500'}`} />
                <span>{pillar.shortBadge}</span>
              </button>
            )}
          )}
        </div>

        {/* Large Interactive Circular Ecosystem Diagram */}
        <div 
          className="mt-8 sm:mt-12 relative mx-auto w-full max-w-6xl h-[560px] sm:h-[640px] lg:h-[680px] flex items-center justify-center"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* SVG Orbital Rays & Connecting Rings */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1000 680" fill="none">
            <defs>
              <linearGradient id="orbitGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2563EB" stopOpacity="0.3" />
                <stop offset="50%" stopColor="#60A5FA" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#2563EB" stopOpacity="0.3" />
              </linearGradient>
              <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Main Outer Orbital Dashed Circle */}
            <circle
              cx="500"
              cy="340"
              r="240"
              stroke="url(#orbitGlow)"
              strokeWidth="2"
              strokeDasharray="6 6"
              className="opacity-60"
            />

            {/* Active Highlight Arc */}
            <motion.circle
              cx="500"
              cy="340"
              r="240"
              stroke={activePillar.color}
              strokeWidth="3.5"
              filter="url(#glowEffect)"
              strokeDasharray="1507"
              animate={{
                strokeDashoffset: 1507 - (1507 / 4) * (activeIdx + 1),
              }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            />

            {/* Connecting Rays from Center (500, 340) to Nodes */}
            {/* Top-Left Node (230, 150) */}
            <line
              x1="500" y1="340" x2="230" y2="150"
              stroke={activeIdx === 0 ? '#2563EB' : '#E5E7EB'}
              strokeWidth={activeIdx === 0 ? '2.5' : '1'}
              strokeDasharray={activeIdx === 0 ? 'none' : '4 4'}
            />
            {/* Top-Right Node (770, 150) */}
            <line
              x1="500" y1="340" x2="770" y2="150"
              stroke={activeIdx === 1 ? '#10B981' : '#E5E7EB'}
              strokeWidth={activeIdx === 1 ? '2.5' : '1'}
              strokeDasharray={activeIdx === 1 ? 'none' : '4 4'}
            />
            {/* Bottom-Left Node (230, 530) */}
            <line
              x1="500" y1="340" x2="230" y2="530"
              stroke={activeIdx === 2 ? '#8B5CF6' : '#E5E7EB'}
              strokeWidth={activeIdx === 2 ? '2.5' : '1'}
              strokeDasharray={activeIdx === 2 ? 'none' : '4 4'}
            />
            {/* Bottom-Right Node (770, 530) */}
            <line
              x1="500" y1="340" x2="770" y2="530"
              stroke={activeIdx === 3 ? '#F59E0B' : '#E5E7EB'}
              strokeWidth={activeIdx === 3 ? '2.5' : '1'}
              strokeDasharray={activeIdx === 3 ? 'none' : '4 4'}
            />
          </svg>

          {/* Central Interactive Showcase Canvas inside the Orbit */}
          <div className="absolute z-20 w-[290px] sm:w-[350px] md:w-[380px] h-[290px] sm:h-[350px] md:h-[380px] rounded-full bg-white/95 backdrop-blur-xl border-4 border-zinc-200/90 shadow-2xl flex flex-col items-center justify-between p-5 sm:p-7 relative overflow-hidden group">
            {/* Ambient Background Glow in Center Hub */}
            <div 
              className="absolute inset-0 pointer-events-none opacity-20 transition-all duration-500"
              style={{ background: `radial-gradient(circle at center, ${activePillar.color}40, transparent 70%)` }}
            />

            {/* Central Top Header */}
            <div className="relative z-10 flex flex-col items-center text-center pt-1">
              <BrandLogo size="md" display="mark" showSignature={false} />
              <span className="mt-1 font-mono text-[9px] sm:text-[10px] font-extrabold tracking-widest text-[#2563EB] uppercase bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                HUB CENTRAL LE CLUB IA
              </span>
            </div>

            {/* Active Graphic Preview Canvas in Center Hub */}
            <div className="relative z-10 w-full flex-1 flex items-center justify-center my-2">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activePillar.id}
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  transition={{ duration: 0.3 }}
                  className="w-full flex justify-center"
                >
                  {activePillar.previewType === 'formations' && <FormationsCenterGraphic />}
                  {activePillar.previewType === 'communaute' && <CommunityCenterGraphic />}
                  {activePillar.previewType === 'veille' && <NewsCenterGraphic />}
                  {activePillar.previewType === 'ressources' && <ResourcesCenterGraphic />}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Center Hub Bottom Action Link */}
            <div className="relative z-10 pb-1">
              <Link
                to={activePillar.link as any}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-extrabold uppercase tracking-wider text-white shadow-md transition-all duration-200 hover:scale-105"
                style={{ backgroundColor: '#0F1E4D' }}
              >
                <span>{activePillar.linkText}</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#60A5FA]" />
              </Link>
            </div>
          </div>

          {/* 4 Orbit Node Cards with Integrated Description & Focus */}
          
          {/* Node 0: Formations (Top-Left) */}
          <PillarOrbitNodeCard
            pillar={PILLARS_DATA[0]}
            isActive={activeIdx === 0}
            onFocus={() => {
              setActiveIdx(0)
              setIsPaused(true)
            }}
            positionClass="top-[2%] left-[1%] sm:left-[4%] md:left-[6%]"
            cardAlign="text-left items-start"
          />

          {/* Node 1: Communauté (Top-Right) */}
          <PillarOrbitNodeCard
            pillar={PILLARS_DATA[1]}
            isActive={activeIdx === 1}
            onFocus={() => {
              setActiveIdx(1)
              setIsPaused(true)
            }}
            positionClass="top-[2%] right-[1%] sm:right-[4%] md:right-[6%]"
            cardAlign="text-right items-end"
          />

          {/* Node 2: Veille IA (Bottom-Left) */}
          <PillarOrbitNodeCard
            pillar={PILLARS_DATA[2]}
            isActive={activeIdx === 2}
            onFocus={() => {
              setActiveIdx(2)
              setIsPaused(true)
            }}
            positionClass="bottom-[2%] left-[1%] sm:left-[4%] md:left-[6%]"
            cardAlign="text-left items-start"
          />

          {/* Node 3: Ressources (Bottom-Right) */}
          <PillarOrbitNodeCard
            pillar={PILLARS_DATA[3]}
            isActive={activeIdx === 3}
            onFocus={() => {
              setActiveIdx(3)
              setIsPaused(true)
            }}
            positionClass="bottom-[2%] right-[1%] sm:right-[4%] md:right-[6%]"
            cardAlign="text-right items-end"
          />
        </div>

        {/* Section Bottom Main CTA */}
        <Reveal delay={0.2} className="mt-10 sm:mt-14">
          <div className="flex justify-center">
            <Link
              to="/auth"
              className="group relative inline-flex items-center gap-3 overflow-hidden rounded-full bg-[#0F1E4D] px-9 py-4.5 sm:px-11 sm:py-5 text-xs sm:text-sm font-extrabold uppercase tracking-widest text-white shadow-2xl transition-all duration-300 hover:bg-[#1E3A8A] hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="relative z-10">Rejoindre Le Club IA</span>
              <ArrowRight className="relative z-10 h-4 w-4 text-[#60A5FA] transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </Reveal>

      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   ORBIT NODE INTEGRATED DESCRIPTION CARD
   ───────────────────────────────────────────────────────────────────────────── */

function PillarOrbitNodeCard({
  pillar,
  isActive,
  onFocus,
  positionClass,
  cardAlign
}: {
  pillar: PillarData
  isActive: boolean
  onFocus: () => void
  positionClass: string
  cardAlign: string
}) {
  const IconComp = pillar.icon

  return (
    <div
      onMouseEnter={onFocus}
      onClick={onFocus}
      className={`absolute z-30 flex flex-col cursor-pointer group focus:outline-none transition-all ${positionClass} ${cardAlign}`}
    >
      <div className="flex items-center gap-3">
        {/* Node Icon Circle */}
        <motion.div
          animate={{
            scale: isActive ? 1.15 : 1,
            backgroundColor: isActive ? pillar.color : '#FFFFFF',
            borderColor: isActive ? pillar.color : '#E5E7EB',
          }}
          transition={{ duration: 0.3 }}
          className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl border-2 flex items-center justify-center shadow-lg transition-all shrink-0 ${
            isActive
              ? 'text-white shadow-2xl ring-4 ring-offset-2'
              : 'text-zinc-700 bg-white hover:border-zinc-300 hover:shadow-xl'
          }`}
          style={isActive ? { ringColor: `${pillar.color}40` } : {}}
        >
          <IconComp className={`w-5 h-5 sm:w-7 sm:h-7 ${isActive ? 'text-white' : 'text-zinc-700'}`} />
        </motion.div>
      </div>

      {/* Integrated Text Description Card */}
      <motion.div
        animate={{
          scale: isActive ? 1.03 : 1,
          borderColor: isActive ? pillar.color : '#E5E7EB',
          boxShadow: isActive ? '0 20px 25px -5px rgba(0, 0, 0, 0.1)' : '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
        }}
        transition={{ duration: 0.3 }}
        className={`mt-2.5 max-w-[200px] sm:max-w-[250px] p-3.5 sm:p-4 rounded-2xl border-2 bg-white/95 backdrop-blur-md transition-all ${cardAlign}`}
      >
        <span
          className="inline-block px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono font-extrabold uppercase tracking-wider mb-1.5 border"
          style={{
            color: pillar.color,
            backgroundColor: `${pillar.color}15`,
            borderColor: `${pillar.color}30`
          }}
        >
          {pillar.num} • {pillar.shortBadge}
        </span>

        <h4 className="font-display text-xs sm:text-sm font-extrabold text-[#0F1E4D] leading-tight">
          {pillar.title}
        </h4>

        <p className="mt-1 text-[10px] sm:text-xs text-zinc-600 font-normal leading-relaxed">
          {pillar.description}
        </p>
      </motion.div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   CENTER HUB INTERACTIVE GRAPHICS
   ───────────────────────────────────────────────────────────────────────────── */

function FormationsCenterGraphic() {
  return (
    <div className="w-full max-w-[240px] sm:max-w-[270px] rounded-xl border border-zinc-200 bg-white p-2.5 shadow-md space-y-2">
      <div className="flex items-center justify-between border-b border-zinc-100 pb-1 text-[9px] font-mono text-zinc-400">
        <span>cours_01_mastery.mp4</span>
        <span className="text-[#2563EB] font-bold">100% Pratique</span>
      </div>

      <div className="relative aspect-video w-full rounded-lg bg-[#0F1E4D] overflow-hidden flex items-center justify-center border border-zinc-200">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0F1E4D] via-[#1E3A8A] to-[#2563EB]/40" />
        <div className="relative z-10 w-9 h-9 rounded-full bg-white text-[#2563EB] flex items-center justify-center shadow-lg">
          <Play className="w-4 h-4 fill-current translate-x-0.5" />
        </div>
      </div>

      <div className="p-1.5 rounded bg-blue-50 border border-blue-100 flex items-center justify-between text-[10px] font-bold text-[#0F1E4D]">
        <div className="flex items-center gap-1.5 truncate">
          <CheckCircle2 className="w-3 h-3 text-[#2563EB] shrink-0" />
          <span className="truncate">Prompts & Workflows IA</span>
        </div>
        <span className="font-mono text-[9px] text-[#2563EB]">18:30</span>
      </div>
    </div>
  )
}

function CommunityCenterGraphic() {
  return (
    <div className="w-full max-w-[240px] sm:max-w-[270px] rounded-xl border border-zinc-200 bg-white p-2.5 shadow-md space-y-2">
      <div className="flex items-center justify-between border-b border-zinc-100 pb-1">
        <span className="text-[10px] font-extrabold text-[#0F1E4D]">Feed Communauté</span>
        <span className="text-[9px] font-mono font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
          ● 142 en ligne
        </span>
      </div>

      <div className="p-2 rounded-lg bg-zinc-50 border border-zinc-200/80 space-y-1">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-[9px] font-extrabold">
            GT
          </div>
          <span className="text-[10px] font-extrabold text-zinc-900">Gamaliel</span>
        </div>
        <p className="text-[10px] text-zinc-700 leading-tight">
          "Agent IA configuré avec succès ! Merci au Club !"
        </p>
      </div>
    </div>
  )
}

function NewsCenterGraphic() {
  return (
    <div className="w-full max-w-[240px] sm:max-w-[270px] rounded-xl border border-zinc-200 bg-white p-2.5 shadow-md space-y-1.5">
      <div className="flex items-center justify-between border-b border-zinc-100 pb-1">
        <span className="text-[10px] font-extrabold text-purple-700">Veille IA 6h</span>
        <span className="text-[9px] font-mono text-zinc-400">Agent Auto</span>
      </div>

      <div className="p-1.5 rounded bg-purple-50 border border-purple-100 space-y-0.5">
        <div className="text-[9px] font-mono font-extrabold text-purple-800">MISTRAL & CLAUDE 3.5</div>
        <div className="text-[10px] font-extrabold text-zinc-900 leading-tight">Synthèse des nouveautés IA</div>
        <p className="text-[9px] text-zinc-600 leading-tight">Résumés pédagogiques générés en français.</p>
      </div>
    </div>
  )
}

function ResourcesCenterGraphic() {
  return (
    <div className="w-full max-w-[240px] sm:max-w-[270px] rounded-xl border border-zinc-200 bg-white p-2.5 shadow-md space-y-1.5">
      <div className="flex items-center justify-between border-b border-zinc-100 pb-1">
        <span className="text-[10px] font-extrabold text-amber-700">Prompts & Templates</span>
        <span className="text-[9px] font-mono text-amber-800 bg-amber-50 px-1 rounded border border-amber-200">PDF</span>
      </div>

      <div className="p-2 rounded-lg bg-[#0F1E4D] text-white space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-mono text-[#60A5FA] font-bold">PROMPT #04</span>
          <span className="text-[8px] font-bold text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded">Copier</span>
        </div>
        <div className="text-[9px] font-mono text-zinc-200 truncate">
          "Agis comme un copywriter expert en IA..."
        </div>
      </div>
    </div>
  )
}
