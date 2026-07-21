import {
  ArrowRight,
  GraduationCap,
  Library,
  MessagesSquare,
  Newspaper,
} from 'lucide-react'
import { Eyebrow } from './eyebrow'
import { Reveal } from './reveal'
import { FormationsPreview } from './previews/formations-preview'
import { CommunityPreview } from './previews/community-preview'
import { NewsPreview } from './previews/news-preview'
import { ResourcesPreview } from './previews/resources-preview'
import { Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'

/* ─── Bento grid layout ─────────────────────────────────────────────
   Desktop (lg):  col 1 = 2/3 wide  |  col 2 = 1/3 wide
   Row 1: Formations (large) + Community (tall)
   Row 2: News (medium)     + Resources (medium)
   ─────────────────────────────────────────────────────────────────── */

export function FourPillars() {
  return (
    <section
      id="piliers"
      className="relative overflow-clip bg-[var(--background)] py-16 sm:py-24 lg:py-28"
    >
      {/* subtle glow */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-[var(--primary)]/[0.04] blur-[120px]" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* ── Header ── */}
        <div className="mx-auto max-w-2xl text-center">
          <Reveal>
            <Eyebrow className="mb-4">Tout en un</Eyebrow>
            <h2 className="font-display text-4xl font-bold tracking-tight text-[var(--foreground)] sm:text-5xl">
              Quatre piliers.{' '}
              <span className="serif-accent">Une expérience complète.</span>
            </h2>
            <p className="mt-5 text-base leading-relaxed text-[var(--muted-foreground)] sm:text-lg">
              Maîtrise l'IA sans te disperser dans 15 abonnements. Une plateforme, tout inclus.
            </p>
          </Reveal>
        </div>

        {/* ── Bento grid ── */}
        <div className="mt-12 sm:mt-16 grid grid-cols-1 gap-4 lg:grid-cols-3 lg:grid-rows-2">

          {/* ① Formations — large card, spans 2 cols, 1 row */}
          <Reveal delay={0.05} className="lg:col-span-2 lg:row-span-1">
            <BentoCard
              icon={GraduationCap}
              tag="Formations"
              title="Catalogue de formations"
              description="Vidéos chapitrées, classées par thématique. Progression suivie, certificats à la clé."
              accent
              cta={<Link to="/catalogue" className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[var(--primary)] transition-all hover:gap-2.5">Voir le catalogue <ArrowRight className="h-3.5 w-3.5" /></Link>}
              preview={<FormationsPreview />}
              horizontal
            />
          </Reveal>

          {/* ② Communauté — tall card, spans 1 col, 2 rows */}
          <Reveal delay={0.1} className="lg:col-span-1 lg:row-span-2">
            <BentoCard
              icon={MessagesSquare}
              tag="Communauté"
              title="Communauté active"
              description="Un mini-réseau social entre membres : partage tes projets, pose tes questions, échange en français."
              dark
              preview={<CommunityPreview />}
              tall
            />
          </Reveal>

          {/* ③ Actualités IA — bottom-left */}
          <Reveal delay={0.15} className="lg:col-span-1">
            <BentoCard
              icon={Newspaper}
              tag="Actualités"
              title="Actualités IA"
              description="L'agent IA scanne les meilleures sources toutes les 6h et publie un résumé pédagogique."
              preview={<NewsPreview />}
            />
          </Reveal>

          {/* ④ Bibliothèque — bottom-right (in the 2-col span area) */}
          <Reveal delay={0.2} className="lg:col-span-1">
            <BentoCard
              icon={Library}
              tag="Ressources"
              title="Bibliothèque de ressources"
              description="Prompts pré-faits, templates, guides PDF et liens vers les meilleurs outils."
              preview={<ResourcesPreview />}
            />
          </Reveal>

        </div>

        {/* ── CTA ── */}
        <Reveal delay={0.4} className="mt-14 sm:mt-16">
          <div className="flex justify-center">
            <Link
              to="/auth"
              className="group relative inline-flex items-center gap-3 overflow-hidden rounded-full bg-[var(--foreground)] px-10 py-4 text-sm font-bold uppercase tracking-widest text-white shadow-xl shadow-black/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="relative z-10">Rejoindre Le Club IA</span>
              <ArrowRight className="relative z-10 h-4 w-4 transition-transform group-hover:translate-x-1" />
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            </Link>
          </div>
        </Reveal>

      </div>
    </section>
  )
}

/* ─── BentoCard ─────────────────────────────────────────────────────── */

interface BentoCardProps {
  icon: React.ElementType
  tag: string
  title: string
  description: string
  preview: React.ReactNode
  accent?: boolean   // blue highlight
  dark?: boolean     // dark bg
  horizontal?: boolean // icon/text left, preview right
  tall?: boolean     // full height (2-row span)
  cta?: React.ReactNode
}

function BentoCard({
  icon: Icon,
  tag,
  title,
  description,
  preview,
  accent = false,
  dark = false,
  horizontal = false,
  tall = false,
  cta,
}: BentoCardProps) {
  const bg = dark
    ? 'bg-[var(--noir)] text-white border-[var(--noir)]'
    : accent
      ? 'bg-white border-[var(--primary)]/20'
      : 'bg-white border-[var(--border)]'

  const tagColor = dark
    ? 'bg-white/10 text-white/60'
    : accent
      ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
      : 'bg-[var(--secondary)] text-[var(--muted-foreground)]'

  const iconBg = dark
    ? 'bg-white/10 text-white'
    : accent
      ? 'bg-[var(--primary)] text-white'
      : 'bg-[var(--foreground)] text-white'

  const titleColor = dark ? 'text-white' : 'text-[var(--foreground)]'
  const descColor  = dark ? 'text-white/50' : 'text-[var(--muted-foreground)]'

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.25 }}
      className={`group relative flex h-full ${tall ? 'min-h-[480px]' : ''} ${horizontal ? 'flex-row' : 'flex-col'} overflow-hidden rounded-3xl border ${bg} transition-shadow duration-500 hover:shadow-[0_20px_60px_-10px_rgba(0,0,0,0.1)]`}
    >
      {/* Content area */}
      <div className={`relative z-10 flex flex-col ${horizontal ? 'w-[45%] shrink-0' : ''} p-7 sm:p-8`}>
        {/* Tag + Icon */}
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${tagColor}`}>
            {tag}
          </span>
        </div>

        <div className={`mt-5 flex h-10 w-10 items-center justify-center rounded-xl ${iconBg} shadow-sm transition-transform duration-300 group-hover:scale-110`}>
          <Icon className="h-5 w-5" />
        </div>

        <h3 className={`mt-4 font-display text-xl font-bold leading-tight tracking-tight ${titleColor} sm:text-2xl`}>
          {title}
        </h3>
        <p className={`mt-2.5 text-sm leading-relaxed ${descColor}`}>
          {description}
        </p>

        {cta && <div className="mt-5">{cta}</div>}
      </div>

      {/* Preview area */}
      <div className={`relative ${horizontal ? 'flex-1' : 'px-6 pb-6 sm:px-8 sm:pb-8'}`}>
        <div className={`relative overflow-hidden ${horizontal ? 'h-full rounded-none' : 'rounded-2xl'} ${dark ? 'bg-white/5' : 'bg-[var(--secondary)]'} ${horizontal ? '' : 'p-3'} transition-transform duration-500 group-hover:scale-[1.01]`}>
          {preview}
        </div>
      </div>
    </motion.div>
  )
}
