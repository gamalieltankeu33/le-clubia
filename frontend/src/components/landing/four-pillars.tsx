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
  ChevronRight,
  ShieldCheck,
  FileText,
  Copy,
  Clock
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from '@tanstack/react-router'
import { Reveal } from './reveal'
import { Eyebrow } from './eyebrow'
import { BrandLogo } from '@/components/brand-logo'

/* ─────────────────────────────────────────────────────────────────────────────
   LES 4 PILIERS DU CLUB IA — ÉCOSYSTÈME CIRCULAIRE DYNAMIQUE
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
  features: string[]
  previewType: 'formations' | 'communaute' | 'veille' | 'ressources'
}

const PILLARS_DATA: PillarData[] = [
  {
    id: 'formations',
    num: '01',
    badge: 'CATALOGUE DE FORMATIONS',
    shortBadge: 'Formations',
    title: 'Catalogue de Formations & Parcours Pratiques',
    subtitle: 'Apprenez par la pratique avec des modules vidéo chapitrés et des cas réels.',
    description: 'Accédez à des parcours guidés pas à pas pour dompter les meilleurs outils IA (ChatGPT, Midjourney, Claude, Lovable, Make, Automation). Suivez votre progression et validez vos compétences avec des certificats à la clé.',
    icon: GraduationCap,
    color: '#2563EB',
    bgLight: 'bg-blue-50',
    borderLight: 'border-blue-200',
    link: '/catalogue',
    linkText: 'Explorer le catalogue',
    features: [
      'Vidéos courtes & chapitrées (10 à 20 min)',
      'Cas pratiques & projets réels à dupliquer',
      'Certificat de réussite pour chaque parcours',
      'Mises à jour régulières au fil des nouveautés IA'
    ],
    previewType: 'formations'
  },
  {
    id: 'communaute',
    num: '02',
    badge: 'COMMUNAUTÉ PRIVÉE & NETWORK',
    shortBadge: 'Communauté',
    title: 'Réseau Exclusif & Entraide Francophone',
    subtitle: 'Connectez-vous avec des passionnés, entrepreneurs et experts de l\'IA.',
    description: 'Ne restez plus jamais bloqué seul. Notre mini-réseau social privé vous permet de partager vos projets, poser vos questions 24h/24 et 7j/7, et nouer des partenariats stratégiques.',
    icon: MessagesSquare,
    color: '#10B981',
    bgLight: 'bg-emerald-50',
    borderLight: 'border-emerald-200',
    link: '/auth',
    linkText: 'Rejoindre la communauté',
    features: [
      'Feed d\'entraide & salons thématiques en français',
      'Feedback direct sur vos prompts et projets',
      'Sessions live et échanges avec les experts',
      'Réseau francophone actif et bienveillant'
    ],
    previewType: 'communaute'
  },
  {
    id: 'veille',
    num: '03',
    badge: 'VEILLE AUTOMATISÉE PAR IA',
    shortBadge: 'Veille IA',
    title: 'Flux d\'Actualités IA Filtré & Pédagogique',
    subtitle: 'Recevez l’essentiel de l’actualité IA sans le bruit des réseaux sociaux.',
    description: 'Nos agents IA scannent les meilleures sources mondiales toutes les 6 heures et rédigent des résumés clairs en français. Gardez 10 longueurs d’avance sans y passer vos journées.',
    icon: Newspaper,
    color: '#8B5CF6',
    bgLight: 'bg-purple-50',
    borderLight: 'border-purple-200',
    link: '/auth',
    linkText: 'Découvrir le flux de veille',
    features: [
      'Mise à jour automatique toutes les 6h',
      'Synthèses claires et cas d\'usage en français',
      'Analyse d\'impact sur vos outils du quotidien',
      'Alertes prioritaires sur les ruptures majeures'
    ],
    previewType: 'veille'
  },
  {
    id: 'ressources',
    num: '04',
    badge: 'BIBLIOTHÈQUE & TEMPLATES',
    shortBadge: 'Ressources',
    title: 'Bibliothèque de Prompts & Templates Prêts à l\'Emploi',
    subtitle: 'Des outils directement utilisables pour démultiplier votre productivité.',
    description: 'Téléchargez nos guides PDF, copiez-collez nos prompts optimisés et déployez nos templates de workflows d’automatisation directement dans vos projets professionnels.',
    icon: Library,
    color: '#F59E0B',
    bgLight: 'bg-amber-50',
    borderLight: 'border-amber-200',
    link: '/auth',
    linkText: 'Accéder aux ressources',
    features: [
      'Prompts optimisés prêts à copier-coller',
      'Templates de workflows & automatisations',
      'Guides PDF & fiches de synthèse téléchargeables',
      'Sélection constante des meilleurs outils testés'
    ],
    previewType: 'ressources'
  }
]

export function FourPillars() {
  const [activeIdx, setActiveIdx] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  // Auto progression circular rotation
  useEffect(() => {
    if (isPaused) return
    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % PILLARS_DATA.length)
    }, 4500)
    return () => clearInterval(timer)
  }, [isPaused])

  const activePillar = PILLARS_DATA[activeIdx]
  const ActiveIcon = activePillar.icon

  return (
    <section
      id="piliers"
      className="relative overflow-hidden bg-[var(--background)] py-20 sm:py-28 lg:py-32"
    >
      {/* Background glow and subtle ambient radial gradient */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 h-[600px] w-[900px] rounded-full bg-gradient-to-b from-[#2563EB]/[0.06] via-[#2563EB]/[0.02] to-transparent blur-[140px]" />
        <div className="absolute inset-0 bg-[radial-gradient(#2563EB_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.03]" />
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <Eyebrow className="mb-4 inline-block rounded-full border border-blue-200/80 bg-blue-50/80 px-3.5 py-1 text-xs font-extrabold text-[#2563EB] tracking-wider uppercase">
              ÉCOSYSTÈME UNIFIÉ
            </Eyebrow>
            <h2 className="font-display text-4xl font-extrabold tracking-tight text-[#0A0A0A] sm:text-5xl lg:text-6xl leading-[1.15]">
              Quatre piliers.{' '}
              <span className="serif-accent font-serif italic text-[#2563EB] font-normal block sm:inline">
                Un seul écosystème central.
              </span>
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base text-[#6B6B6B] sm:text-lg leading-relaxed font-normal">
              Pensé pour que vous maîtrisiez l'IA en autonomie, sans vous disperser dans 15 abonnements différents. Une plateforme unique avec Le Club IA au cœur.
            </p>
          </Reveal>
        </div>

        {/* Mobile Pillar Selector Tabs (Mobile Quick Switch) */}
        <div className="mt-8 sm:hidden flex items-center justify-center gap-1.5 overflow-x-auto pb-2 px-1">
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

        {/* Dynamic Orbital Ecosystem Illustration */}
        <div 
          className="mt-12 sm:mt-16 relative mx-auto max-w-4xl"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Orbital Circle & Nodes Layout */}
          <div className="relative w-full max-w-[500px] h-[340px] sm:h-[420px] mx-auto flex items-center justify-center">
            
            {/* SVG Background Orbital Ring & Energy Pulses */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 500 420" fill="none">
              <defs>
                <linearGradient id="orbitGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#2563EB" stopOpacity="0.4" />
                  <stop offset="50%" stopColor="#60A5FA" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#2563EB" stopOpacity="0.4" />
                </linearGradient>
                <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Main Outer Dashed Orbit Ring */}
              <circle
                cx="250"
                cy="210"
                r="150"
                stroke="url(#orbitGlow)"
                strokeWidth="2"
                strokeDasharray="6 6"
                className="opacity-60 sm:opacity-80"
              />

              {/* Glowing Active Orbital Arc */}
              <motion.circle
                cx="250"
                cy="210"
                r="150"
                stroke="#2563EB"
                strokeWidth="3.5"
                filter="url(#glowEffect)"
                strokeDasharray="942"
                animate={{
                  strokeDashoffset: 942 - (942 / 4) * (activeIdx + 1),
                }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              />

              {/* Laser Connector Lines from Center Hub (250, 210) to 4 Nodes */}
              {/* Node 0: Top Left (130, 90) */}
              <line
                x1="250" y1="210" x2="130" y2="90"
                stroke={activeIdx === 0 ? '#2563EB' : '#E5E7EB'}
                strokeWidth={activeIdx === 0 ? '2.5' : '1'}
                strokeDasharray={activeIdx === 0 ? 'none' : '4 4'}
              />
              {/* Node 1: Top Right (370, 90) */}
              <line
                x1="250" y1="210" x2="370" y2="90"
                stroke={activeIdx === 1 ? '#10B981' : '#E5E7EB'}
                strokeWidth={activeIdx === 1 ? '2.5' : '1'}
                strokeDasharray={activeIdx === 1 ? 'none' : '4 4'}
              />
              {/* Node 2: Bottom Left (130, 330) */}
              <line
                x1="250" y1="210" x2="130" y2="330"
                stroke={activeIdx === 2 ? '#8B5CF6' : '#E5E7EB'}
                strokeWidth={activeIdx === 2 ? '2.5' : '1'}
                strokeDasharray={activeIdx === 2 ? 'none' : '4 4'}
              />
              {/* Node 3: Bottom Right (370, 330) */}
              <line
                x1="250" y1="210" x2="370" y2="330"
                stroke={activeIdx === 3 ? '#F59E0B' : '#E5E7EB'}
                strokeWidth={activeIdx === 3 ? '2.5' : '1'}
                strokeDasharray={activeIdx === 3 ? 'none' : '4 4'}
              />
            </svg>

            {/* Central Glowing Core Hub */}
            <div className="absolute z-20 flex flex-col items-center justify-center">
              <motion.div
                animate={{ scale: [1, 1.04, 1] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="relative p-4 sm:p-5 rounded-full bg-[#0F1E4D] text-white shadow-2xl border-4 border-[#2563EB]/40 flex flex-col items-center justify-center text-center cursor-pointer group"
              >
                {/* Ambient pulse halo */}
                <div className="absolute -inset-2 rounded-full bg-[#2563EB]/25 blur-xl pointer-events-none group-hover:bg-[#2563EB]/40 transition-colors" />

                <div className="relative z-10 flex flex-col items-center">
                  <BrandLogo size="md" display="mark" showSignature={false} />
                  <span className="mt-1 font-mono text-[9px] sm:text-[10px] font-extrabold tracking-widest text-[#60A5FA] uppercase bg-white/10 px-2 py-0.5 rounded-full border border-white/10">
                    HUB CENTRAL
                  </span>
                </div>
              </motion.div>
            </div>

            {/* 4 Orbital Pillar Nodes Around Center */}
            
            {/* Node 0: Formations (Top-Left) */}
            <OrbitalNodeButton
              pillar={PILLARS_DATA[0]}
              isActive={activeIdx === 0}
              onClick={() => {
                setActiveIdx(0)
                setIsPaused(true)
              }}
              positionClass="top-[5%] left-[8%] sm:left-[10%]"
            />

            {/* Node 1: Communauté (Top-Right) */}
            <OrbitalNodeButton
              pillar={PILLARS_DATA[1]}
              isActive={activeIdx === 1}
              onClick={() => {
                setActiveIdx(1)
                setIsPaused(true)
              }}
              positionClass="top-[5%] right-[8%] sm:right-[10%]"
            />

            {/* Node 2: Veille IA (Bottom-Left) */}
            <OrbitalNodeButton
              pillar={PILLARS_DATA[2]}
              isActive={activeIdx === 2}
              onClick={() => {
                setActiveIdx(2)
                setIsPaused(true)
              }}
              positionClass="bottom-[5%] left-[8%] sm:left-[10%]"
            />

            {/* Node 3: Ressources (Bottom-Right) */}
            <OrbitalNodeButton
              pillar={PILLARS_DATA[3]}
              isActive={activeIdx === 3}
              onClick={() => {
                setActiveIdx(3)
                setIsPaused(true)
              }}
              positionClass="bottom-[5%] right-[8%] sm:right-[10%]"
            />
          </div>

          {/* Active Pillar Interactive Showcase Card */}
          <div className="mt-6 sm:mt-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={activePillar.id}
                initial={{ opacity: 0, y: 15, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -15, scale: 0.98 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="w-full rounded-3xl border-2 border-zinc-200/90 bg-white p-6 sm:p-10 shadow-2xl relative overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
              >
                {/* Background Tint Gradient */}
                <div 
                  className="absolute inset-0 pointer-events-none opacity-20"
                  style={{ background: `radial-gradient(circle at 90% 10%, ${activePillar.color}33, transparent 60%)` }}
                />

                {/* Left Text & Features Content */}
                <div className="lg:col-span-7 space-y-4 sm:space-y-5 relative z-10">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span 
                      className="px-3.5 py-1 rounded-full text-xs font-mono font-extrabold uppercase tracking-wider border shadow-2xs"
                      style={{ 
                        color: activePillar.color, 
                        backgroundColor: `${activePillar.color}15`, 
                        borderColor: `${activePillar.color}35` 
                      }}
                    >
                      Phase {activePillar.num} • {activePillar.badge}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0F1E4D]">
                      {activePillar.title}
                    </h3>
                    <p className="text-xs sm:text-sm font-semibold text-[#2563EB]">
                      {activePillar.subtitle}
                    </p>
                  </div>

                  <p className="text-sm sm:text-base text-[#0F1E4D]/80 leading-relaxed font-normal">
                    {activePillar.description}
                  </p>

                  {/* Key Feature Bullet Points */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                    {activePillar.features.map((feature, fIdx) => (
                      <div key={fIdx} className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-zinc-800">
                        <div 
                          className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${activePillar.color}20`, color: activePillar.color }}
                        >
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Action Link Button */}
                  <div className="pt-3">
                    <Link
                      to={activePillar.link as any}
                      className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full text-xs sm:text-sm font-extrabold uppercase tracking-wider text-white shadow-lg transition-all duration-200 hover:scale-[1.02] cursor-pointer"
                      style={{ backgroundColor: '#0F1E4D' }}
                    >
                      <span>{activePillar.linkText}</span>
                      <ArrowRight className="w-4 h-4 text-[#60A5FA]" />
                    </Link>
                  </div>
                </div>

                {/* Right Interactive Mockup Graphic */}
                <div className="lg:col-span-5 relative z-10 flex justify-center">
                  {activePillar.previewType === 'formations' && <FormationsInteractiveGraphic />}
                  {activePillar.previewType === 'communaute' && <CommunityInteractiveGraphic />}
                  {activePillar.previewType === 'veille' && <NewsInteractiveGraphic />}
                  {activePillar.previewType === 'ressources' && <ResourcesInteractiveGraphic />}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Bottom Call to Action */}
        <Reveal delay={0.3} className="mt-14 sm:mt-18">
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
   ORBITAL NODE BUTTON COMPONENT
   ───────────────────────────────────────────────────────────────────────────── */

function OrbitalNodeButton({
  pillar,
  isActive,
  onClick,
  positionClass
}: {
  pillar: PillarData
  isActive: boolean
  onClick: () => void
  positionClass: string
}) {
  const IconComp = pillar.icon

  return (
    <button
      onClick={onClick}
      className={`absolute z-30 flex flex-col items-center group cursor-pointer focus:outline-none transition-all ${positionClass}`}
    >
      <motion.div
        animate={{
          scale: isActive ? 1.15 : 1,
          backgroundColor: isActive ? pillar.color : '#FFFFFF',
          borderColor: isActive ? pillar.color : '#E5E7EB',
        }}
        transition={{ duration: 0.3 }}
        className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl border-2 flex items-center justify-center shadow-lg transition-all ${
          isActive
            ? 'text-white shadow-xl ring-4 ring-offset-2'
            : 'text-zinc-600 bg-white hover:border-zinc-300 hover:shadow-xl'
        }`}
        style={isActive ? { ringColor: `${pillar.color}40` } : {}}
      >
        <IconComp className={`w-6 h-6 sm:w-7 sm:h-7 ${isActive ? 'text-white' : 'text-zinc-700'}`} />
      </motion.div>

      {/* Label Badge Pill below node */}
      <span
        className={`mt-2 px-3 py-1 rounded-full text-[10px] sm:text-xs font-extrabold uppercase tracking-wider shadow-sm transition-all whitespace-nowrap border ${
          isActive
            ? 'bg-[#0F1E4D] text-white border-[#0F1E4D] scale-105'
            : 'bg-white text-zinc-700 border-zinc-200 group-hover:border-zinc-300'
        }`}
      >
        {pillar.shortBadge}
      </span>
    </button>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   INTERACTIVE GRAPHIC PREVIEWS FOR THE 4 PILLARS
   ───────────────────────────────────────────────────────────────────────────── */

function FormationsInteractiveGraphic() {
  return (
    <div className="w-full max-w-sm rounded-2xl border-2 border-zinc-200 bg-white p-3.5 shadow-xl space-y-3 relative overflow-hidden">
      {/* Mockup Top Window Bar */}
      <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
        </div>
        <span className="text-[10px] font-mono font-bold text-zinc-400">module_01_automation.mp4</span>
      </div>

      {/* Video Player Box */}
      <div className="relative aspect-video w-full rounded-xl bg-[#0F1E4D] overflow-hidden flex items-center justify-center border border-zinc-300 shadow-inner">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0F1E4D] via-[#1E3A8A] to-[#2563EB]/40" />

        <div className="relative z-10 w-12 h-12 rounded-full bg-white text-[#2563EB] flex items-center justify-center shadow-2xl cursor-pointer hover:scale-110 transition-transform">
          <Play className="w-5 h-5 fill-current translate-x-0.5" />
        </div>

        {/* Video progress overlay */}
        <div className="absolute bottom-2.5 inset-x-3 flex items-center gap-2">
          <div className="h-1.5 flex-1 rounded-full bg-white/20 overflow-hidden">
            <div className="h-full w-2/3 bg-[#60A5FA]" />
          </div>
          <span className="text-[9px] font-mono font-extrabold text-white">12:45 / 18:30</span>
        </div>
      </div>

      {/* Chapters list preview */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between p-2 rounded-lg bg-blue-50 border border-blue-100 text-xs font-bold text-[#0F1E4D]">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>1. Configuration des Prompts IA</span>
          </div>
          <span className="font-mono text-[10px] text-zinc-500">05:20</span>
        </div>
        <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-50 border border-zinc-100 text-xs font-medium text-zinc-600">
          <div className="flex items-center gap-2">
            <Play className="w-3.5 h-3.5 text-zinc-400" />
            <span>2. Automatiser le Workflow Make</span>
          </div>
          <span className="font-mono text-[10px] text-zinc-400">13:10</span>
        </div>
      </div>
    </div>
  )
}

function CommunityInteractiveGraphic() {
  return (
    <div className="w-full max-w-sm rounded-2xl border-2 border-zinc-200 bg-white p-4 shadow-xl space-y-3">
      {/* Community Header */}
      <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#0F1E4D] text-[#60A5FA] flex items-center justify-center font-extrabold text-xs">
            <MessagesSquare className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-extrabold text-[#0F1E4D]">Feed Communauté</div>
            <div className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              142 membres en ligne
            </div>
          </div>
        </div>
        <span className="text-[10px] font-mono font-extrabold bg-blue-50 text-[#2563EB] px-2 py-0.5 rounded-full border border-blue-100">
          En direct
        </span>
      </div>

      {/* Simulated Live Post */}
      <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200/80 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-[10px] font-extrabold">
              GT
            </div>
            <div>
              <div className="text-xs font-extrabold text-zinc-900">Gamaliel Tankeu</div>
              <div className="text-[9px] text-zinc-400">Il y a 10 min • Général</div>
            </div>
          </div>
          <span className="text-[10px] font-bold text-[#2563EB] bg-white px-2 py-0.5 rounded border border-zinc-200">
            PROJET IA
          </span>
        </div>
        <p className="text-xs text-zinc-700 font-normal leading-relaxed">
          "Voici le premier aperçu de notre agent d'automatisation pour le Challenge Sprint Business IA 🚀"
        </p>
        <div className="flex items-center gap-3 pt-1 text-[10px] font-bold text-zinc-500">
          <span className="bg-white px-2 py-1 rounded border border-zinc-200 text-emerald-700">👍 18 Bravo</span>
          <span className="bg-white px-2 py-1 rounded border border-zinc-200">💬 7 commentaires</span>
        </div>
      </div>
    </div>
  )
}

function NewsInteractiveGraphic() {
  return (
    <div className="w-full max-w-sm rounded-2xl border-2 border-zinc-200 bg-white p-4 shadow-xl space-y-3">
      {/* News Agent Header */}
      <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-extrabold text-[#0F1E4D]">Agent Veille IA</div>
            <div className="text-[10px] text-purple-700 font-bold">Mise à jour automatique</div>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[10px] font-mono font-extrabold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
          <Clock className="w-3 h-3" />
          <span>Toutes les 6h</span>
        </div>
      </div>

      {/* Recent Summaries */}
      <div className="space-y-2">
        <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200/80 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">MISTRAL AI</span>
            <span className="text-[9px] font-mono text-zinc-400">12:00</span>
          </div>
          <div className="text-xs font-extrabold text-zinc-900">Lancement des nouveaux agents Mistral Large 2</div>
          <p className="text-[11px] text-zinc-600 leading-snug">Synthèse : Capacité de raisonnement multilingue accrue et intégration API simplifiée.</p>
        </div>

        <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200/80 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">CLAUDE 3.5 SONNET</span>
            <span className="text-[9px] font-mono text-zinc-400">06:00</span>
          </div>
          <div className="text-xs font-extrabold text-zinc-900">Mise à jour du Computer Use d'Anthropic</div>
          <p className="text-[11px] text-zinc-600 leading-snug">Capacités d'interaction directe avec les interfaces graphiques.</p>
        </div>
      </div>
    </div>
  )
}

function ResourcesInteractiveGraphic() {
  return (
    <div className="w-full max-w-sm rounded-2xl border-2 border-zinc-200 bg-white p-4 shadow-xl space-y-3">
      {/* Resources Header */}
      <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
            <Library className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-extrabold text-[#0F1E4D]">Bibliothèque de Prompts</div>
            <div className="text-[10px] text-amber-700 font-bold">Kits prêt à l'emploi</div>
          </div>
        </div>
        <span className="text-[10px] font-mono font-extrabold bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
          Templates
        </span>
      </div>

      {/* Floating Prompt Card Preview */}
      <div className="p-3.5 rounded-xl bg-[#0F1E4D] text-white border border-[#2563EB]/40 shadow-md space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono font-extrabold text-[#60A5FA] uppercase tracking-wider">
            PROMPT OPTIMISÉ #04
          </span>
          <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
            <Copy className="w-3 h-3" />
            <span>Copier</span>
          </div>
        </div>
        <div className="text-xs font-mono text-zinc-200 bg-white/10 p-2 rounded border border-white/10 leading-relaxed">
          "Agis comme un copywriter expert en produit digital. Génère un plan de vente en 5 étapes..."
        </div>
      </div>

      {/* Additional Resource Tag */}
      <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-50 border border-zinc-200 text-xs font-bold text-zinc-800">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-amber-600" />
          <span>Guide PDF — Blueprint Vente IA</span>
        </div>
        <span className="text-[10px] font-mono text-[#2563EB]">Télécharger</span>
      </div>
    </div>
  )
}
