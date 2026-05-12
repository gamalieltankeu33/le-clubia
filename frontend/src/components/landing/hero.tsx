import { Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  GraduationCap,
  Newspaper,
  Play,
  Sparkles,
} from 'lucide-react'
import { Eyebrow } from './eyebrow'
import { Reveal } from './reveal'

const HERO_VIDEO_URL = import.meta.env.VITE_HERO_VIDEO_URL as string | undefined

const STATS = [
  { icon: GraduationCap, label: 'Catalogue de formations' },
  { icon: Sparkles, label: 'Coach IA 24/7' },
  { icon: Newspaper, label: 'Veille IA automatique' },
]

const EASE_EXPO = [0.16, 1, 0.3, 1] as const

export function Hero() {
  const headline = "Transforme l'IA en compétence rentable."
  const words = headline.split(' ')

  return (
    <section className="relative overflow-hidden pt-24 pb-12 sm:pt-28 sm:pb-16 lg:pt-36 lg:pb-24">
      {/* Cinematic Background Halos */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute -top-48 left-1/2 h-[800px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-b from-[var(--primary)]/[0.08] to-transparent blur-[120px]" />
        <div className="absolute right-[10%] top-1/4 h-[500px] w-[500px] rounded-full bg-[var(--accent)]/[0.04] blur-[100px]" />
        <div className="absolute left-[15%] top-1/3 h-[400px] w-[400px] rounded-full bg-[var(--primary)]/[0.06] blur-[90px]" />
      </div>

      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8 text-center">
        <div className="mx-auto max-w-4xl">
          <Reveal delay={0.05}>
            <Eyebrow className="mb-8">Communauté × IA francophone</Eyebrow>
          </Reveal>

          <h1 className="relative font-display text-[2.5rem] font-bold leading-[0.95] tracking-tight text-[var(--foreground)] sm:text-5xl lg:text-6xl xl:text-7xl">
            {words.map((word, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.6,
                  delay: 0.1 + i * 0.05,
                  ease: EASE_EXPO,
                }}
                className={i === words.length - 1 ? 'serif-accent inline-block' : 'inline-block mr-[0.2em]'}
              >
                {word}
              </motion.span>
            ))}
          </h1>

          <Reveal delay={0.25}>
            <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-[var(--muted-foreground)] sm:text-2xl">
              Rejoins l'élite francophone qui maîtrise les outils d'aujourd'hui pour dominer demain. Formations, Coach IA et Veille stratégique.
            </p>
          </Reveal>

          <Reveal delay={0.35} distance={20}>
            <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
              {STATS.map((s) => (
                <div
                  key={s.label}
                  className="group inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white/50 px-4 py-2 text-sm backdrop-blur-sm transition-all hover:border-[var(--primary)]/30 hover:bg-white"
                >
                  <s.icon className="h-4 w-4 text-[var(--primary)] transition-transform group-hover:scale-110" />
                  <span className="font-medium text-[var(--foreground)]">{s.label}</span>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.45} distance={20}>
            <div className="mt-12 flex flex-col items-center gap-4">
              <Link
                to="/auth"
                className="cta-black cta-black-xl group relative overflow-hidden px-10 py-5"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <span className="hidden sm:inline">Rejoindre Le Club</span>
                  <span className="sm:hidden">Rejoindre</span>
                  <span className="mx-2 h-4 w-px bg-white/20" />
                  <span className="hidden sm:inline font-bold">69&nbsp;000&nbsp;FCFA/6&nbsp;mois&nbsp;·&nbsp;99&nbsp;000&nbsp;FCFA/an</span>
                  <span className="sm:hidden font-bold">dès 69&nbsp;000&nbsp;FCFA/6&nbsp;mois</span>
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </span>
                {/* Shine effect */}
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
              </Link>
              <p className="text-xs font-medium tracking-wide text-[var(--muted-foreground)] uppercase">
                Sans réabonnement auto · Paiement mobile money sécurisé
              </p>
            </div>
          </Reveal>
        </div>

        {/* VSL / Demo Video Area */}
        <Reveal delay={0.55} distance={40}>
          <div className="relative mx-auto mt-14 max-w-5xl lg:mt-24">
            <div
              aria-hidden="true"
              className="absolute -inset-10 -z-10 rounded-[3rem] bg-gradient-to-br from-[var(--primary)]/20 via-transparent to-[var(--accent)]/10 blur-[80px]"
            />
            
            <div className="group relative overflow-hidden rounded-[2rem] border border-[var(--border)] bg-black shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] transition-transform duration-700 hover:scale-[1.01]">
              <div className="absolute inset-0 z-10 pointer-events-none border border-white/10 rounded-[2rem]" />
              
              {HERO_VIDEO_URL ? (
                <video
                  src={HERO_VIDEO_URL}
                  controls
                  playsInline
                  preload="metadata"
                  className="aspect-video w-full"
                />
              ) : (
                <VideoPlaceholder />
              )}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function VideoPlaceholder() {
  return (
    <div className="relative aspect-video w-full overflow-hidden bg-[#0A0A0A]">
      {/* Background visual texture */}
      <div className="absolute inset-0 opacity-40">
        <div className="absolute left-1/4 top-1/3 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--primary)]/40 blur-[100px]" />
        <div className="absolute right-1/4 top-2/3 h-80 w-80 -translate-y-1/2 rounded-full bg-[var(--accent)]/20 blur-[100px]" />
      </div>
      
      {/* Grid pattern */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />

      <div className="relative flex h-full w-full flex-col items-center justify-center gap-6">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="button"
          aria-label="Lecture"
          disabled
          className="flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-2xl shadow-white/20 backdrop-blur transition-all sm:h-32 sm:w-32"
        >
          <Play className="ml-2 h-10 w-10 fill-[#0A0A0A] text-[#0A0A0A] sm:h-12 sm:w-12" />
        </motion.button>
        <div className="flex flex-col items-center gap-2">
          <p className="text-lg font-semibold tracking-tight text-white sm:text-xl">
            Voir la démo en 90 secondes
          </p>
          <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/60 backdrop-blur">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
            </span>
            Démo interactive
          </div>
        </div>
      </div>
    </div>
  )
}
