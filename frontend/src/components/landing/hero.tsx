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

const HERO_VIDEO_URL = import.meta.env.VITE_HERO_VIDEO_URL as string | undefined

const STATS = [
  { icon: GraduationCap, label: 'Catalogue de formations' },
  { icon: Sparkles, label: 'Coach IA 24/7' },
  { icon: Newspaper, label: 'Veille IA automatique' },
]

const EASE = [0.22, 1, 0.36, 1] as const

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-28 pb-16 sm:pt-32 sm:pb-20 lg:pt-40 lg:pb-28">
      {/* Halos très diffus pour la profondeur */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute -top-32 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[var(--primary)]/[0.05] blur-3xl" />
        <div className="absolute right-1/4 top-1/3 h-[400px] w-[400px] rounded-full bg-[var(--accent)]/[0.06] blur-3xl" />
      </div>

      <div className="mx-auto max-w-6xl px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE }}
          className="mx-auto max-w-4xl"
        >
          <Eyebrow>Communauté × IA francophone</Eyebrow>

          <h1 className="mt-6 font-display text-[2.5rem] font-bold leading-[1.05] tracking-tight text-[var(--foreground)] sm:mt-8 sm:text-6xl lg:text-7xl xl:text-8xl">
            Transforme l'IA en compétence{' '}
            <span className="serif-accent">rentable</span>.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base text-[var(--muted-foreground)] sm:mt-8 sm:text-xl">
            Rejoins la communauté francophone qui te forme, te coache et te
            tient au courant — chaque jour.
          </p>

          <ul className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {STATS.map((s) => (
              <li
                key={s.label}
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-white px-3 py-1.5 text-xs text-[var(--foreground)]"
              >
                <s.icon className="h-3.5 w-3.5 text-[var(--primary)]" />
                {s.label}
              </li>
            ))}
          </ul>

          <div className="mt-10 flex flex-col items-stretch gap-3 sm:items-center">
            <Link
              to="/auth"
              className="cta-black cta-black-xl w-full sm:w-auto"
            >
              <span className="sm:hidden">
                Rejoindre — 79&nbsp;000&nbsp;FCFA/an
              </span>
              <span className="hidden sm:inline">
                Rejoindre Le Club — 79&nbsp;000&nbsp;FCFA/an
              </span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="text-center text-xs text-[var(--muted-foreground)]">
              Sans réabonnement auto · Paiement mobile money sécurisé
            </p>
          </div>
        </motion.div>

        {/* VSL — emplacement vidéo 16:9 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.9, ease: EASE, delay: 0.2 }}
          className="relative mx-auto mt-16 max-w-5xl lg:mt-20"
        >
          <div
            aria-hidden="true"
            className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-gradient-to-br from-[var(--primary)]/15 via-transparent to-[var(--accent)]/15 blur-2xl"
          />
          <div className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-black shadow-2xl shadow-black/10">
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
        </motion.div>
      </div>
    </section>
  )
}

function VideoPlaceholder() {
  return (
    <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-[#0A0A0A] via-[#1c3a9e] to-[#3858d8]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-1/3 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--accent)]/30 blur-3xl" />
        <div className="absolute right-1/4 top-2/3 h-64 w-64 -translate-y-1/2 rounded-full bg-white/15 blur-3xl" />
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      <div className="relative flex h-full w-full flex-col items-center justify-center gap-4">
        <button
          type="button"
          aria-label="Lecture"
          disabled
          className="flex h-20 w-20 items-center justify-center rounded-full bg-white/95 shadow-2xl backdrop-blur transition-transform hover:scale-105 sm:h-24 sm:w-24"
        >
          <Play className="ml-1 h-8 w-8 fill-[#0A0A0A] text-[#0A0A0A] sm:h-10 sm:w-10" />
        </button>
        <p className="text-sm font-medium text-white/80 sm:text-base">
          Voir la démo en 90 secondes
        </p>
      </div>
    </div>
  )
}
