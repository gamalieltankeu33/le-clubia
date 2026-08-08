import React, { useState, useEffect, useRef } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ArrowRight,
  Check,
  ChevronDown,
  Loader2,
  X,
  Sparkles,
  Lock,
  ChevronLeft,
  XCircle,
  CheckCircle2,
  Zap,
  FileText,
  ShoppingBag,
  TrendingUp,
  Bot,
  UserCheck,
  Briefcase,
  Target,
  Plus
} from 'lucide-react'
import { motion, AnimatePresence, useScroll, useSpring, useInView } from 'framer-motion'
import { toast } from 'sonner'
import confetti from 'canvas-confetti'
import { BrandLogo } from '@/components/brand-logo'
import { supabase } from '@/lib/supabase'
import Lenis from 'lenis'

export const Route = createFileRoute('/accompagnement')({
  component: AccompagnementPage,
})

/* ─── Custom CSS Injection (Premium typography, mesh gradients & grids) ─── */
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&family=Geist+Mono:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap');
  
  .premium-font-display {
    font-family: 'Instrument Sans', sans-serif;
  }
  .premium-font-body {
    font-family: 'Inter', sans-serif;
  }
  .premium-font-mono {
    font-family: 'Geist Mono', monospace;
  }

  .premium-grid-overlay {
    background-image: 
      linear-gradient(to right, rgba(15, 27, 61, 0.03) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(15, 27, 61, 0.03) 1px, transparent 1px);
    background-size: 32px 32px;
  }
  .premium-grid-overlay-dark {
    background-image: 
      linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
    background-size: 32px 32px;
  }

  /* Shimmer animation for loading states */
  @keyframes shimmer {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }

  .premium-shimmer {
    background: linear-gradient(90deg, rgba(201, 151, 62, 0.1) 25%, rgba(217, 169, 74, 0.2) 37%, rgba(201, 151, 62, 0.1) 63%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite linear;
  }

  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(15, 27, 61, 0.02);
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(201, 151, 62, 0.3);
    border-radius: 10px;
  }
  
  /* Smooth animations fallback for reduced motion */
  @media (prefers-reduced-motion: reduce) {
    * {
      animation-delay: 0s !important;
      animation-duration: 0s !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0s !important;
      scroll-behavior: auto !important;
      transform: none !important;
    }
  }
`

const EASE = [0.16, 1, 0.3, 1] as const

/* ─── Typewriter Effect (Scroll Triggered) ─── */
function Typewriter({ text, className }: { text: string; className?: string }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-55px" })
  const chars = text.split("")

  return (
    <span ref={ref} className={className}>
      {chars.map((char, idx) => (
        <motion.span
          key={idx}
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.02, delay: idx * 0.03 }}
        >
          {char}
        </motion.span>
      ))}
    </span>
  )
}

/* ─── Animated Counters ─── */
function AnimatedNumber({ value, suffix = "", prefix = "" }: { value: number; suffix?: string; prefix?: string }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-50px" })
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!isInView) return
    let start = 0
    const end = value
    const duration = 1.6
    const totalMs = duration * 1000
    const incrementTime = Math.max(Math.floor(totalMs / end), 20)

    const timer = setInterval(() => {
      start += Math.ceil(end / 40)
      if (start >= end) {
        start = end
        clearInterval(timer)
      }
      setCount(start)
    }, incrementTime)

    return () => clearInterval(timer)
  }, [isInView, value])

  return (
    <span ref={ref}>
      {prefix}
      {count}
      {suffix}
    </span>
  )
}

/* ─── Tilt Card Interaction (3D mouse hover tilt) ─── */
function TiltCard({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null)
  const [rotate, setRotate] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return
    const { clientX, clientY } = e
    const { left, top, width, height } = ref.current.getBoundingClientRect()
    const x = (clientX - (left + width / 2)) / (width / 2)
    const y = (clientY - (top + height / 2)) / (height / 2)
    setRotate({ x: -y * 6, y: x * 6 }) // Max 6deg tilt
  }

  const handleMouseLeave = () => {
    setRotate({ x: 0, y: 0 })
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ rotateX: rotate.x, rotateY: rotate.y }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      style={{ transformStyle: "preserve-3d", ...style }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/* ─── Magnetic Button (Micro-Interaction) ─── */
function MagneticButton({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  const ref = useRef<HTMLButtonElement>(null)
  const [pos, setPos] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return
    const { clientX, clientY } = e
    const { left, top, width, height } = ref.current.getBoundingClientRect()
    const x = clientX - (left + width / 2)
    const y = clientY - (top + height / 2)
    setPos({ x: x * 0.2, y: y * 0.2 })
  }

  const handleMouseLeave = () => {
    setPos({ x: 0, y: 0 })
  }

  return (
    <motion.button
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      animate={{ x: pos.x, y: pos.y }}
      transition={{ type: "spring", stiffness: 200, damping: 12, mass: 0.1 }}
      className={className}
    >
      {children}
    </motion.button>
  )
}

/* ─── 3D CSS Browser Mockup ─── */
function Hero3DBrowser() {
  const ref = useRef<HTMLDivElement>(null)
  const [rotate, setRotate] = useState({ x: -10, y: 15 })

  const handleMouseMove = (e: MouseEvent) => {
    const x = (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2)
    const y = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2)
    setRotate({ x: -10 - y * 12, y: 15 + x * 15 })
  }

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div className="relative perspective-[1200px] w-full flex items-center justify-center p-4 sm:p-8 lg:p-0">
      {/* Halo glow */}
      <div className="absolute w-[130%] h-[130%] rounded-full bg-gradient-to-tr from-[#C9973E]/12 via-[#131B35]/0 to-[#C9973E]/4 blur-[120px] pointer-events-none" />

      <motion.div
        ref={ref}
        animate={{ rotateX: rotate.x, rotateY: rotate.y, y: [0, -12, 0] }}
        transition={{
          rotateX: { type: "spring", stiffness: 120, damping: 20 },
          rotateY: { type: "spring", stiffness: 120, damping: 20 },
          y: { repeat: Infinity, duration: 5, ease: "easeInOut" }
        }}
        style={{ transformStyle: "preserve-3d" }}
        className="w-full max-w-[480px] aspect-[4/3] rounded-2xl border border-white/10 bg-[#0B1223]/90 text-white p-5 sm:p-6 shadow-2xl backdrop-blur-md relative"
      >
        {/* Browser window controls */}
        <div className="flex items-center gap-1.5 pb-4 border-b border-white/5 mb-5" style={{ transform: "translateZ(30px)" }}>
          <div className="w-2.5 h-2.5 rounded-full bg-[#EA580C]/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#CA8A04]/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#16A34A]/80" />
          <div className="h-4 w-44 rounded bg-white/5 ml-3 flex items-center px-2 text-[8px] font-mono text-white/30 truncate">
            leclub.ia/sprint-boutique
          </div>
        </div>

        {/* Browser content */}
        <div className="space-y-4 sm:space-y-5" style={{ transform: "translateZ(50px)" }}>
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-mono text-[#D9A94A] font-bold tracking-wider uppercase bg-[#C9973E]/10 px-2 py-0.5 rounded">
              LIVRABLE DU SPRINT
            </span>
            <span className="flex items-center gap-1 text-[8px] font-mono text-emerald-400 font-semibold uppercase bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Boutique Active
            </span>
          </div>

          <div className="space-y-1">
            <h4 className="premium-font-display text-base font-bold text-white tracking-tight">
              E-book Premium : Créer avec l'IA
            </h4>
            <p className="text-[10px] text-zinc-400 leading-relaxed line-clamp-2">
              Le guide pratique de 120 pages pour monétiser vos compétences avec les meilleurs agents autonomes du marché.
            </p>
          </div>

          {/* Pricing container */}
          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.07] flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-[8px] font-semibold text-zinc-500 tracking-wider">PRIX DE VENTE</div>
              <div className="font-mono font-bold text-base text-[#D9A94A]">15 000 FCFA</div>
            </div>
            <div className="px-4 py-2 bg-gradient-to-r from-[#D9A94A] to-[#C9973E] text-[#0B1223] font-bold text-[9px] rounded-lg shadow-md uppercase tracking-wider">
              Acheter maintenant
            </div>
          </div>

          {/* Metric graph simulation */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/5">
            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <div className="text-[7px] text-zinc-500 font-mono tracking-widest uppercase">CONVERSIONS</div>
              <div className="text-sm font-mono font-bold text-white mt-1">12.4%</div>
            </div>
            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <div className="text-[7px] text-zinc-500 font-mono tracking-widest uppercase">CA GÉNÉRÉ</div>
              <div className="text-sm font-mono font-bold text-emerald-400 mt-1">+180 000 FCFA</div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

/* ─── SECTION HEADER HELPER ─── */
function SectionHeader({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <div className="max-w-3xl mb-14 text-center md:text-left">
      <Typewriter
        text={`// ${eyebrow}`}
        className="premium-font-mono text-[10px] font-bold tracking-[0.25em] text-[#C9973E] uppercase mb-4 block"
      />
      <motion.h2
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-20px' }}
        transition={{ duration: 0.8, ease: EASE }}
        className="premium-font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#0F1B3D] leading-[1.15]"
      >
        {title}
      </motion.h2>
      {subtitle && (
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-4 text-sm sm:text-base text-[#0F1B3D]/60 leading-relaxed font-light"
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  )
}

/* ─── FAQ Component ─── */
function FAQAccordionItem({ question, answer, idx }: { question: string; answer: string; idx: number }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: idx * 0.05, ease: EASE }}
      className={`border rounded-xl mb-3 overflow-hidden transition-all duration-300 ${
        isOpen
          ? 'border-[#C9973E]/30 bg-white shadow-lg shadow-[#0B1223]/2'
          : 'border-zinc-200/80 bg-white/70 hover:bg-white hover:border-zinc-300 shadow-xs'
      }`}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left p-6 font-semibold text-base text-[#0F1B3D] transition-colors hover:text-[#C9973E] cursor-pointer"
      >
        <span className="premium-font-display pr-6">{question}</span>
        <div
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-transform duration-300 ${
            isOpen ? 'bg-[#C9973E]/10 text-[#C9973E] rotate-45' : 'bg-zinc-100 text-zinc-500'
          }`}
        >
          <Plus className="h-4 w-4" />
        </div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
          >
            <div className="px-6 pb-6 pt-2 text-sm text-[#0F1B3D]/70 leading-relaxed premium-font-body border-t border-zinc-50">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/* ─── MAIN PAGE ─── */
export function AccompagnementPage() {
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [showStickyCTA, setShowStickyCTA] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  // Initialize Lenis smooth scrolling locally
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
    })

    function raf(time: number) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)

    // Handle scroll for sticky mobile CTA and header states
    const handleScroll = () => {
      if (window.scrollY > 500) {
        setShowStickyCTA(true)
      } else {
        setShowStickyCTA(false)
      }
    }
    window.addEventListener('scroll', handleScroll)

    // Global ambient cursor tracking for parallax layers
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX - window.innerWidth / 2) / 45
      const y = (e.clientY - window.innerHeight / 2) / 45
      setMousePos({ x, y })
    }
    window.addEventListener('mousemove', handleMouseMove)

    return () => {
      lenis.destroy()
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  // Program Timeline scroll tracker
  const timelineContainerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: timelineContainerRef,
    offset: ["start center", "end center"]
  })
  const scaleY = useSpring(scrollYProgress, { stiffness: 100, damping: 30 })

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#0F1B3D] premium-font-body antialiased selection:bg-[#C9973E] selection:text-white pb-10 overflow-hidden relative">
      <style>{styles}</style>

      {/* Grid overlay for texture */}
      <div className="absolute inset-0 premium-grid-overlay pointer-events-none z-0" />

      {/* ── Header ── */}
      <header className="fixed inset-x-0 top-0 z-50 bg-[#FAF8F5]/80 backdrop-blur-md border-b border-zinc-200/40 transition-all duration-300">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-3">
            <BrandLogo size="sm" className="transition-transform hover:scale-[1.02]" />
          </Link>
          <div className="flex items-center gap-4">
            <MagneticButton
              onClick={() => setShowBookingModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#0B1223] to-[#131B35] text-white rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-300 hover:shadow-lg cursor-pointer"
            >
              <span>Réserver ma place →</span>
            </MagneticButton>
          </div>
        </div>
      </header>

      {/* ── HERO SECTION ── */}
      <section className="relative pt-32 pb-24 sm:pt-40 sm:pb-32 overflow-hidden z-10">
        <div className="mx-auto max-w-6xl px-6">
          {/* Isolated Editorial Header */}
          <div className="max-w-4xl mx-auto text-center mb-16 sm:mb-24">
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: EASE }}
              className="premium-font-display text-lg sm:text-2xl font-light text-[#0F1B3D]/70 leading-relaxed italic border-l-2 border-[#C9973E]/30 pl-4 sm:pl-6 text-left max-w-3xl mx-auto"
            >
              « Il y a 2 ans, je n'avais qu'une idée et zéro client. Aujourd'hui, je forme des centaines de personnes à faire pareil grâce à l'IA. »
            </motion.p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 text-center lg:text-left space-y-6 sm:space-y-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: EASE }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#C9973E]/30 bg-[#C9973E]/5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#C9973E] animate-pulse" />
                <span className="premium-font-mono text-[9px] font-bold tracking-[0.15em] text-[#C9973E] uppercase">
                  ✨ SPRINT BUSINESS IA • LIMITÉ À 20 PLACES
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1, ease: EASE }}
                className="premium-font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#0F1B3D] leading-[1.1]"
              >
                5 jours pour créer votre <span className="text-[#C9973E] font-normal italic underline decoration-[#C9973E]/20">produit digital</span>, lancer votre boutique, et savoir enfin comment vendre.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2, ease: EASE }}
                className="text-sm sm:text-base text-[#0F1B3D]/70 leading-relaxed font-light"
              >
                Un accompagnement intensif de 5 jours. Vous repartez avec un produit réel en ligne, une boutique fonctionnelle, et une méthode d'acquisition claire — pas juste des notes de cours.
              </motion.p>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3, ease: EASE }}
                className="flex flex-col sm:flex-row gap-4 pt-2"
              >
                <MagneticButton
                  onClick={() => setShowBookingModal(true)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-[#0B1223] to-[#131B35] text-white rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 hover:scale-[1.02] hover:shadow-lg cursor-pointer"
                >
                  <span>Réserver ma place — 10 000 FCFA →</span>
                </MagneticButton>
              </motion.div>

              {/* Rarity & urgence indicators */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-2 text-[10px] font-mono tracking-widest text-[#0F1B3D]/50 uppercase"
              >
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                  <span className="text-red-600 font-bold">
                    <AnimatedNumber value={4} /> places restantes
                  </span>
                </span>
                <span>•</span>
                <span>Début : vendredi 14 août</span>
                <span>•</span>
                <span className="text-[#C9973E] font-bold">1 mois d'accès Club IA inclus</span>
              </motion.div>
            </div>

            {/* Right Side: 3D Browser Mockup */}
            <div className="lg:col-span-5 flex justify-center">
              <Hero3DBrowser />
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION LE POURQUOI (Narrative pause, somber background, large typo) ── */}
      <section className="py-28 bg-[#0B1223] text-white relative z-10 overflow-hidden">
        {/* Dark theme grid overlay */}
        <div className="absolute inset-0 premium-grid-overlay-dark pointer-events-none z-0" />
        <div className="absolute top-0 right-0 w-[450px] h-[450px] rounded-full bg-[#C9973E]/5 blur-[120px] pointer-events-none" />

        <div className="mx-auto max-w-4xl px-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
            {/* Gamaliel Avatar Left */}
            <div className="md:col-span-4 flex flex-col items-center space-y-4">
              <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                <img
                  src="/gamaliel_portrait.png"
                  alt="Gamaliel"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B1223] via-transparent to-transparent" />
              </div>
              <div className="text-center space-y-0.5">
                <h4 className="premium-font-display font-bold text-sm text-white">Gamaliel</h4>
                <p className="text-[10px] font-mono tracking-widest text-[#C9973E] uppercase">Fondateur Leclub.ia</p>
              </div>
            </div>

            {/* Narrative Content Right */}
            <div className="md:col-span-8 space-y-8 text-center md:text-left">
              <Typewriter
                text="// 00 / Pourquoi je fais ça"
                className="premium-font-mono text-[10px] font-bold tracking-[0.25em] text-[#C9973E] uppercase block"
              />
              <h2 className="premium-font-display text-2xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
                La frustration de voir des talents bloqués par la technique.
              </h2>
              <div className="text-zinc-400 text-sm sm:text-base leading-relaxed space-y-5 font-light">
                <p>
                  Je vois trop de professionnels de la diaspora accumuler des formations théoriques, des tutoriels vidéos et des certifications passives pendant des mois sans jamais rien mettre sur le marché.
                </p>
                <p>
                  La technique paralyse. On redoute l'étape de connexion de Stripe, de configuration d'un domaine ou de création visuelle d'un produit. Résultat : des idées exceptionnelles meurent dans des tiroirs.
                </p>
                <p className="text-white font-medium">
                  Le Sprint Business IA est l'antidote à cela. Une parenthèse de 5 jours de pure exécution. Pas de théorie passive, pas de blabla. On construit, on lance et on cherche les premiers clients.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 01 — LE CONSTAT (Before / After cards comparison) ── */}
      <section className="py-28 bg-[#FAF8F5] relative z-10 border-b border-zinc-200/40">
        <div className="mx-auto max-w-5xl px-6">
          <SectionHeader
            eyebrow="01 / Le constat"
            title="Pourquoi vos projets de produits digitaux restent à l'état d'idées."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12 items-stretch">
            {/* CARD BEFORE (Problem card: Grised, desaturated, red X, status Blocked) */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: EASE }}
              className="p-8 rounded-2xl border border-zinc-200/60 bg-zinc-200/30 backdrop-blur-xs opacity-75 flex flex-col justify-between space-y-8 select-none"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono font-bold tracking-widest text-red-500 uppercase bg-red-50 px-2 py-0.5 rounded">
                    L'APPROCHE CLASSIQUE
                  </span>
                  <div className="flex items-center gap-1.5 text-[8px] font-mono text-red-500 font-semibold bg-red-50 px-2 py-0.5 rounded">
                    <XCircle className="w-3.5 h-3.5 text-red-500" />
                    <span>Statut : Bloqué</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="premium-font-display text-xl font-bold text-[#0F1B3D] opacity-80">
                    L'illusion de la préparation infinie
                  </h3>
                  <p className="text-xs text-[#0F1B3D]/60 leading-relaxed font-light">
                    Vous avez déjà pensé à créer votre propre produit digital. Vous avez peut-être même déjà commencé — un document à moitié rempli, une idée qui traîne, un cours que vous n'avez jamais terminé.
                  </p>
                </div>
              </div>

              <div className="pt-6 border-t border-zinc-200/50 text-[11px] text-[#0F1B3D]/50 font-light italic">
                ✗ Aucun produit en ligne, aucune boutique active, peur technique constante.
              </div>
            </motion.div>

            {/* CARD AFTER (Solution card: High contrast, gold outlines, checkmarks, active) */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: EASE }}
              className="p-8 rounded-2xl border-2 border-[#C9973E]/30 bg-white shadow-xl shadow-[#0F1B3D]/2 flex flex-col justify-between space-y-8 relative overflow-hidden"
            >
              {/* Subtle top gold glow line */}
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#D9A94A] to-[#C9973E]" />

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono font-bold tracking-widest text-[#C9973E] uppercase bg-[#C9973E]/5 px-2 py-0.5 rounded">
                    MÉTHODE SPRINT CLUB IA
                  </span>
                  <div className="flex items-center gap-1.5 text-[8px] font-mono text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Statut : Prêt à vendre</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="premium-font-display text-xl font-bold text-[#0F1B3D]">
                    La force de l'exécution guidée
                  </h3>
                  <p className="text-xs text-[#0F1B3D]/70 leading-relaxed">
                    Le Sprint Business IA élimine toute friction. Pendant 5 jours, vous ne lisez pas de guides théoriques — vous concevez, configurez et mettez en vente votre produit avec l'assistance active de l'IA.
                  </p>
                </div>
              </div>

              <div className="pt-6 border-t border-zinc-100 text-[11px] text-[#0F1B3D] font-semibold flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-[#C9973E] animate-pulse" />
                <span>En 5 jours, nous transformons votre hésitation en système opérationnel.</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── SECTION 02 — L'OFFRE (Connected interactive timeline) ── */}
      <section className="py-28 bg-[#FAF8F5] relative z-10 border-b border-zinc-200/40" id="programme">
        <div className="mx-auto max-w-5xl px-6">
          <SectionHeader
            eyebrow="02 / L'offre"
            title="Un plan d'action structuré sur 5 jours"
            subtitle="Conçu pour ceux qui veulent avancer vite et obtenir des résultats mesurables."
          />

          <div ref={timelineContainerRef} className="relative mt-20 space-y-20">
            {/* Vertical connector line */}
            <div className="absolute left-[24px] top-6 bottom-6 w-0.5 bg-zinc-200 hidden sm:block">
              <motion.div
                style={{ scaleY, transformOrigin: "top" }}
                className="w-full h-full bg-gradient-to-b from-[#D9A94A] to-[#C9973E]"
              />
            </div>

            {[
              {
                day: 'Jour 1-2',
                title: 'Conception & Création du produit avec l\'IA',
                desc: 'Définissez votre offre idéale et générez le produit digital (e-book, template, guide ou mini-formation) en utilisant des prompts IA avancés, sans compétences en écriture ni design.',
                output: 'Un produit digital finalisé, prêt à être livré.',
                icon: FileText,
              },
              {
                day: 'Jour 3',
                title: 'Création du système de vente',
                desc: 'Mise en place de votre page de paiement et de votre boutique automatisée. Configuration des passerelles pour encaisser vos premiers paiements de manière autonome.',
                output: 'Votre boutique en ligne fonctionnelle.',
                icon: ShoppingBag,
              },
              {
                day: 'Jour 4-5',
                title: 'Lancement du système d\'acquisition',
                desc: 'Apprentissage et application directe de notre méthode d\'acquisition client. Nous créons ensemble vos premiers messages et tunnels pour attirer les prospects sans budget publicitaire.',
                output: 'Vos premiers prospects ciblés contactés.',
                icon: TrendingUp,
              },
            ].map((step, idx) => {
              const StepIcon = step.icon
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 25 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.7, delay: idx * 0.05, ease: EASE }}
                  className="flex flex-col sm:flex-row items-start gap-8 relative"
                >
                  {/* Timeline icon dot */}
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="w-12 h-12 rounded-xl border border-[#C9973E]/30 bg-white flex items-center justify-center text-sm font-mono font-bold text-[#C9973E] z-10 shadow-md">
                      <StepIcon className="w-5 h-5 text-[#C9973E]" />
                    </div>
                    <span className="premium-font-display text-sm font-bold tracking-wider uppercase text-[#C9973E] sm:hidden">
                      {step.day}
                    </span>
                  </div>

                  {/* Timeline content */}
                  <TiltCard className="flex-1 p-6 sm:p-8 rounded-2xl bg-white border border-zinc-200/50 shadow-2xs hover:border-[#C9973E]/20 transition-all duration-300">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <span className="text-xs font-mono font-bold tracking-widest text-[#C9973E] uppercase">
                        {step.day}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400">Étape 0{idx + 1}</span>
                    </div>
                    <h3 className="premium-font-display text-xl font-bold text-[#0F1B3D] mb-3">{step.title}</h3>
                    <p className="text-sm text-[#0F1B3D]/70 font-light leading-relaxed mb-4">{step.desc}</p>
                    
                    <div className="inline-flex items-center gap-2 bg-[#FAF8F5] border border-zinc-200/40 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#0F1B3D]/80">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>Livrable : {step.output}</span>
                    </div>
                  </TiltCard>
                </motion.div>
              )
            })}
          </div>

          {/* Bandeau Résultat Final (Allumage Checklist au scroll) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: EASE }}
            className="mt-24 p-8 sm:p-12 rounded-2xl bg-[#0B1223] text-white relative overflow-hidden border border-[#C9973E]/20"
          >
            <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-[#C9973E]/5 blur-3xl pointer-events-none" />
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-[#C9973E]/10 text-[#C9973E] uppercase tracking-wider">
                  RÉSULTAT DU SPRINT
                </span>
                <h3 className="premium-font-display text-2xl sm:text-3xl font-bold text-white leading-tight">
                  À la fin des 5 jours, vous disposez d'un système complet.
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-light">
                  Aucun guide théorique supplémentaire n'est requis. Nous installons la boutique et lançons la campagne d'acquisition en direct à vos côtés.
                </p>
              </div>

              {/* Glowing Checklist */}
              <div className="lg:col-span-5 space-y-3">
                {[
                  "Produit digital prêt à être livré",
                  "Boutique en ligne configurée",
                  "Plan d'acquisition clients activé"
                ].map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.2 + idx * 0.1 }}
                    className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.05] transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#D9A94A]" />
                    <span className="text-xs font-semibold text-zinc-200">{item}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── SECTION VIDEO (Placeholder visually premium browser mockup) ── */}
      <section className="py-24 bg-white relative z-10 border-b border-zinc-200/40">
        <div className="mx-auto max-w-4xl px-6">
          <SectionHeader
            eyebrow="Démo vidéo"
            title="Comment fonctionne l'automatisation IA"
            subtitle="Regardez un aperçu rapide du processus de création de boutique et de génération de produits en accéléré."
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: EASE }}
            className="w-full aspect-video rounded-2xl border border-zinc-200 overflow-hidden shadow-2xl bg-zinc-900 relative"
          >
            {/* Skeleton shimmer poster fallback */}
            <div className="absolute inset-0 premium-shimmer flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-[#C9973E] text-2xl backdrop-blur-md cursor-pointer border border-white/20 hover:scale-105 transition-transform duration-300">
                ▶
              </div>
              <div className="space-y-1">
                <p className="text-white font-bold text-sm">Vidéo de démonstration en cours de création</p>
                <p className="text-white/50 text-[10px] font-mono">DURÉE : 1 MINUTE 30 SECONDES</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── SECTION BONUS (Gold layout / private community access) ── */}
      <section className="py-28 bg-[#FAF8F5] relative z-10 border-b border-zinc-200/40">
        <div className="mx-auto max-w-5xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: EASE }}
            className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-center border border-[#C9973E]/30 rounded-3xl p-8 sm:p-12 bg-gradient-to-br from-white to-[#FAF8F5] relative overflow-hidden shadow-2xl shadow-[#C9973E]/2"
          >
            <div className="absolute -right-36 -bottom-36 w-96 h-96 rounded-full bg-[#C9973E]/5 blur-3xl pointer-events-none" />

            <div className="lg:col-span-2 space-y-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-[#C9973E]/10 text-[#C9973E] uppercase tracking-wider">
                Bonus d'intégration
              </span>
              <h3 className="premium-font-display text-2xl sm:text-3xl font-bold text-[#0F1B3D] leading-tight">
                1 mois d'accès au Club IA offert
              </h3>
              <p className="text-[10px] font-mono tracking-widest text-[#0F1B3D]/40 uppercase">
                Valeur communautaire
              </p>
            </div>

            <div className="lg:col-span-3 text-sm text-[#0F1B3D]/70 leading-relaxed space-y-6 font-light">
              <p>
                Le challenge de 5 jours est un point de départ. Pour vous assurer un suivi à long terme, vous recevez un accès complet pendant 1 mois à notre communauté privée.
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {[
                  "Échanges directs avec les autres créateurs",
                  "Mises à jour régulières sur les outils IA",
                  "Sessions de questions-réponses en direct",
                  "Feedback permanent sur votre projet"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-xs text-[#0F1B3D] font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C9973E]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── SECTION PREUVE SOCIALE (Testimonials with tilt effect) ── */}
      <section className="py-28 bg-white relative z-10 border-b border-zinc-200/40">
        <div className="mx-auto max-w-4xl px-6">
          <SectionHeader
            eyebrow="Témoignages"
            title="Ils ont franchi le pas"
          />

          <TiltCard className="flex flex-col md:flex-row items-center gap-8 md:gap-12 bg-[#FAF8F5] border border-zinc-200/60 p-8 sm:p-12 rounded-3xl relative overflow-hidden shadow-sm">
            {/* Photo Sarah D. avec halo */}
            <div className="relative shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border border-zinc-200 z-10 shadow-lg">
              <div className="absolute inset-0 bg-zinc-100 flex items-center justify-center text-xs font-mono text-zinc-400">
                Sarah D.
              </div>
              <img
                src="/landing/members/patricia-njie.jpg"
                alt="Sarah D."
                className="absolute inset-0 w-full h-full object-cover z-20"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            </div>
            
            <div className="space-y-4 relative z-10">
              <div className="flex gap-0.5 text-[#C9973E]">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-sm">★</span>
                ))}
              </div>
              <p className="premium-font-display text-lg sm:text-xl font-light text-[#0F1B3D] leading-relaxed italic">
                « Avant le challenge, j'avais mon guide PDF prêt depuis 3 mois sur mon ordinateur. En 5 jours, Gamaliel m'a aidée à configurer ma boutique et à lancer mes premiers messages. J'ai fait mes 3 premières ventes la semaine suivante auprès de ma cible. »
              </p>
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-[#0F1B3D]">Sarah D.</p>
                <p className="text-[10px] font-mono tracking-widest text-[#0F1B3D]/50 uppercase">
                  Salariée & Créatrice de contenu (Diaspora, France)
                </p>
              </div>
            </div>
          </TiltCard>
        </div>
      </section>

      {/* ── SECTION 03 — PROFILS (Target audience cards with hover lifts) ── */}
      <section className="py-28 bg-[#FAF8F5] relative z-10 border-b border-zinc-200/40">
        <div className="mx-auto max-w-5xl px-6">
          <SectionHeader
            eyebrow="03 / Profils"
            title="Ce challenge est fait pour vous si..."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
            {[
              {
                title: "Salariés de la diaspora",
                desc: "Vous souhaitez créer un business numérique parallèle concret pour générer des revenus passifs sans quitter votre emploi principal.",
                icon: Briefcase
              },
              {
                title: "Créateurs de contenu",
                desc: "Vous avez une audience ou des compétences clés, mais vous êtes paralysé par la technique pour lancer vos infoproduits.",
                icon: Target
              },
              {
                title: "Freelances & Experts",
                desc: "Vous vendez votre temps et souhaitez packager vos conseils sous forme de templates ou guides automatisés vendus 24/7.",
                icon: Bot
              },
              {
                title: "Débutants Ambitieux",
                desc: "Vous en avez assez des formations théoriques de 40 heures et vous cherchez une méthode 100% axée sur l'exécution immédiate.",
                icon: UserCheck
              }
            ].map((item, idx) => {
              const ProfileIcon = item.icon
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: idx * 0.05, ease: EASE }}
                  className="p-6 rounded-2xl border border-zinc-200/60 bg-white flex flex-col justify-between hover:border-[#C9973E]/30 hover:scale-[1.02] hover:shadow-lg transition-all duration-300 group"
                >
                  <div className="space-y-4">
                    <div className="w-10 h-10 rounded-xl bg-[#C9973E]/10 text-[#C9973E] flex items-center justify-center group-hover:bg-[#C9973E] group-hover:text-white transition-all duration-300">
                      <ProfileIcon className="w-5 h-5" />
                    </div>
                    <h4 className="premium-font-display font-bold text-sm text-[#0F1B3D]">{item.title}</h4>
                    <p className="text-xs text-[#0F1B3D]/60 leading-relaxed font-light">{item.desc}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── SECTION TARIFICATION (Price with counters & real-time checking simulation) ── */}
      <section className="py-28 bg-white relative z-10 border-b border-zinc-200/40" id="tarification">
        <div className="mx-auto max-w-3xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 35 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: EASE }}
            className="p-8 sm:p-14 rounded-3xl bg-[#0B1223] text-white text-center relative overflow-hidden border border-[#C9973E]/20 shadow-2xl shadow-[#C9973E]/3"
          >
            {/* Top gold bar */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#D9A94A] to-[#C9973E]" />

            {/* Glowing spot counter badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-[#C9973E]/10 text-[#C9973E] uppercase tracking-wider mb-6 border border-[#C9973E]/20">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
              <span>Plus que <AnimatedNumber value={4} /> places disponibles</span>
            </div>

            <h3 className="premium-font-display text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
              Rejoignez le Sprint Challenge
            </h3>
            <p className="text-xs text-zinc-400 mt-2 tracking-widest font-mono uppercase">
              Prochaine session : Vendredi 14 Août
            </p>

            <div className="my-10">
              <div className="text-zinc-500 text-xs tracking-wider line-through uppercase mb-1">
                VALEUR RÉELLE : 150 000 FCFA
              </div>
              <div className="text-5xl sm:text-6xl font-extrabold tracking-tight text-white flex items-center justify-center gap-1.5">
                <span className="font-mono">10 000</span>
                <span className="text-2xl font-light text-[#D9A94A]">FCFA</span>
              </div>
              <p className="text-[10px] text-zinc-500 mt-3 font-mono uppercase tracking-wider">
                Un seul paiement • Accompagnement en direct inclus
              </p>
            </div>

            <div className="max-w-md mx-auto space-y-4 mb-10">
              <p className="text-xs text-zinc-400 leading-relaxed font-light">
                Chaque ticket vous donne un accès illimité aux 5 sessions de direct guidées, au groupe d'entraide dédié et à un mois d'accès complet aux outils premium du Club IA.
              </p>
            </div>

            <div className="flex flex-col items-center gap-4">
              <button
                onClick={() => setShowBookingModal(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-10 py-4 bg-gradient-to-r from-[#D9A94A] to-[#C9973E] hover:from-[#C9973E] hover:to-[#D9A94A] text-[#0B1223] rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 hover:scale-[1.02] shadow-lg cursor-pointer"
              >
                <span>Réserver mon ticket d'accès →</span>
              </button>
              <div className="flex items-center justify-center gap-2 text-[10px] font-mono text-zinc-500 tracking-wider uppercase">
                <Lock className="w-3.5 h-3.5 text-[#C9973E]" />
                <span>Paiement 100% sécurisé (Stripe / Mobile Money)</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── SECTION FAQ ── */}
      <section className="py-28 bg-[#FAF8F5] relative z-10 border-b border-zinc-200/40" id="faq">
        <div className="mx-auto max-w-3xl px-6">
          <SectionHeader
            eyebrow="FAQ"
            title="Détails de l'organisation"
          />

          <div className="mt-8">
            {[
              {
                q: "Faut-il avoir des compétences techniques pour participer ?",
                a: "Non, c'est tout l'intérêt du challenge. Nous utilisons des solutions visuelles et des prompts d'IA pour configurer vos pages et générer vos produits sans toucher à une ligne de code.",
              },
              {
                q: "Combien de temps dois-je y consacrer par jour ?",
                a: "Prévoyez environ 1 à 2 heures par jour pour suivre les modules, piloter l'IA et soumettre vos livrables de la journée. Le programme est adapté pour être suivi en parallèle d'une activité salariée.",
              },
              {
                q: "Comment se déroule l'accompagnement ?",
                a: "Le Sprint s'effectue sous forme d'instructions claires distribuées chaque matin dans notre espace membre. Vous travaillez en autonomie guidée et disposez d'un groupe privé pour poser vos questions à tout moment.",
              },
              {
                q: "Puis-je participer si je vis en Afrique ?",
                a: "Oui, le challenge est conçu pour l'ensemble de la diaspora et des résidents francophones. Nous adaptons les options de paiement (Mobile Money local via Chariot ou Stripe) et les stratégies de ciblage marché.",
              },
              {
                q: "Qu'est-ce qui est inclus dans le mois d'accès au Club IA ?",
                a: "Dès l'inscription, vous débloquez vos accès à la communauté privée, notre salon d'échanges quotidiens, nos kits de prompts avancés et nos masterclasses hebdomadaires pour continuer à developper votre offre après le Sprint.",
              }
            ].map((item, idx) => (
              <FAQAccordionItem key={idx} question={item.q} answer={item.a} idx={idx} />
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION CTA FINAL ── */}
      <section className="py-32 bg-[#0B1223] text-white text-center relative z-10 overflow-hidden">
        <div className="absolute inset-0 premium-grid-overlay-dark pointer-events-none z-0" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-[#C9973E]/5 blur-[140px] pointer-events-none" />

        <div className="mx-auto max-w-3xl px-6 relative z-10 space-y-8">
          <Typewriter
            text="// Lancer votre projet aujourd'hui"
            className="premium-font-mono text-[10px] font-bold tracking-[0.25em] text-[#C9973E] uppercase block"
          />
          <h2 className="premium-font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
            Arrêtez de remettre à demain.
          </h2>
          <p className="text-sm text-zinc-400 max-w-md mx-auto leading-relaxed font-light">
            Dans 5 jours, vous disposerez d'un système de vente opérationnel et de votre propre produit digital en ligne. Rejoignez le Sprint Challenge dès aujourd'hui.
          </p>

          <div className="flex flex-col items-center justify-center gap-4">
            <MagneticButton
              onClick={() => setShowBookingModal(true)}
              className="inline-flex items-center gap-3 px-10 py-4 bg-gradient-to-r from-[#D9A94A] to-[#C9973E] text-[#0B1223] rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 hover:scale-[1.02] shadow-lg cursor-pointer"
            >
              <span>Réserver ma place — 10 000 FCFA →</span>
            </MagneticButton>
            <span className="text-[9px] font-mono tracking-widest text-zinc-500 uppercase">
              Plus que 4 places restantes pour cette session
            </span>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-16 text-center mt-12 bg-[#fafafa] border-t border-zinc-200/40 relative z-10">
        <div className="mx-auto max-w-6xl px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <BrandLogo size="sm" display="mark" showSignature={true} />
          
          <div className="flex gap-8 text-[11px] font-mono tracking-wider text-zinc-400 uppercase">
            <a href="#programme" className="hover:text-[#C9973E] transition-colors">Le Programme</a>
            <a href="#tarification" className="hover:text-[#C9973E] transition-colors">Tarifs</a>
            <a href="#faq" className="hover:text-[#C9973E] transition-colors">FAQ</a>
          </div>

          <p className="text-[10px] text-zinc-400/80 font-mono">
            © {new Date().getFullYear()} Le Club IA • Tous droits réservés.
          </p>
        </div>
      </footer>

      {/* ── STICKY MOBILE CTA (Bottom fixed bar) ── */}
      <AnimatePresence>
        {showStickyCTA && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="fixed bottom-0 inset-x-0 z-40 bg-[#FAF8F5]/90 backdrop-blur-md border-t border-zinc-200/80 p-4 sm:hidden flex items-center justify-between shadow-2xl"
          >
            <div className="space-y-0.5">
              <div className="text-[8px] font-mono text-[#C9973E] font-bold">4 PLACES RESTANTES</div>
              <div className="text-base font-bold font-mono text-[#0F1B3D]">10 000 FCFA</div>
            </div>
            <button
              onClick={() => setShowBookingModal(true)}
              className="px-5 py-3 bg-gradient-to-r from-[#0B1223] to-[#131B35] text-white rounded-full text-[10px] font-bold uppercase tracking-wider shadow-md"
            >
              Réserver →
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Booking Modal (Typeform-style wizard checkout) ── */}
      <AnimatePresence>
        {showBookingModal && (
          <BookingModal onClose={() => setShowBookingModal(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─── BOOKING MODAL (WIZARD FLOW / TYPEFORM-STYLE) ─── */
interface WizardQuestion {
  id: 'name' | 'email' | 'country' | 'phone'
  label: string
  subtitle: string
  placeholder: string
  type: 'text' | 'email' | 'tel'
  errorMsg: string
  validation: (val: string) => boolean
}

const WIZARD_QUESTIONS: WizardQuestion[] = [
  {
    id: 'name',
    label: 'Quel est votre nom et prénom ?',
    subtitle: 'Entrez votre identité officielle pour la facturation et le suivi.',
    placeholder: 'Ex : Jean Dupont',
    type: 'text',
    errorMsg: 'Veuillez renseigner votre nom complet.',
    validation: (val) => val.trim().split(' ').filter(Boolean).length >= 1,
  },
  {
    id: 'email',
    label: 'Quelle est votre adresse e-mail ?',
    subtitle: 'Pour vous envoyer le lien d\'accès aux sessions du challenge.',
    placeholder: 'Ex : jean.dupont@gmail.com',
    type: 'email',
    errorMsg: 'Veuillez renseigner une adresse e-mail valide.',
    validation: (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim()),
  },
  {
    id: 'country',
    label: 'Dans quel pays résidez-vous actuellement ?',
    subtitle: 'Pour adapter les passerelles de paiement (Mobile Money, Stripe...).',
    placeholder: 'Ex : Cameroun, Côte d\'Ivoire, France...',
    type: 'text',
    errorMsg: 'Veuillez préciser votre pays de résidence.',
    validation: (val) => val.trim().length >= 2,
  },
  {
    id: 'phone',
    label: 'Quel est votre numéro WhatsApp ?',
    subtitle: 'Indiquez le code pays pour recevoir les rappels en direct.',
    placeholder: 'Ex : +237 690 00 00 00',
    type: 'tel',
    errorMsg: 'Veuillez saisir un numéro de téléphone valide.',
    validation: (val) => val.trim().length >= 7,
  },
]

function BookingModal({ onClose }: { onClose: () => void }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    country: '',
    phone: '',
  })

  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input on change step
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [currentStep, success])

  // Prevent background scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  const currentQuestion = WIZARD_QUESTIONS[currentStep]
  const progressPercent = ((currentStep + 1) / WIZARD_QUESTIONS.length) * 100

  // Key listening for quick submission / navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleNext()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentStep, formData])

  const handleNext = async () => {
    const currentValue = formData[currentQuestion.id]
    
    if (!currentQuestion.validation(currentValue)) {
      toast.error(currentQuestion.errorMsg)
      return
    }

    if (currentStep < WIZARD_QUESTIONS.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      await handleFinalSubmit()
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleFinalSubmit = async () => {
    setLoading(true)
    try {
      const parts = formData.name.trim().split(' ')
      const prenom = parts[0] || ''
      const nom = parts.slice(1).join(' ') || 'Participant'

      // Insert details into Supabase
      const { error } = await supabase.from('accompagnement_candidatures').insert([
        {
          nom: nom,
          prenom: prenom,
          email: formData.email.trim().toLowerCase(),
          telephone: formData.phone.trim(),
          pays: formData.country.trim(),
          projet_type: 'Sprint Business IA',
          projet_ia: 'Sprint Business IA Challenge',
          projet_raison: 'Sprint Business IA Challenge',
          projet_blocage: 'Sprint Business IA Challenge',
          deja_essaie: false,
          deja_essaie_details: 'Inscription Challenge Sprint Business IA',
          statut_actuel: 'Challenge Participant',
          heures_semaine: '10+ heures',
          objectif_12m: 'Lancer un business rentable grâce à l\'IA',
          pret_investir: 'Oui',
          budget: '10000 FCFA',
          candidat_raison: 'Sprint Business IA Challenge Registration',
          score: 20,
          qualified: true,
          is_western: false,
          notes: 'Registration via the sales page wizard'
        }
      ])

      if (error) {
        throw new Error(error.message)
      }

      setSuccess(true)
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } })

      // Generate WhatsApp message and redirect
      const whatsappMsg = `Bonjour Gamaliel, je viens de m'inscrire au Sprint Business IA (Nom : ${formData.name}, Pays : ${formData.country}, WhatsApp : ${formData.phone}). J'aimerais valider ma place.`
      const whatsappUrl = `https://wa.me/33744125798?text=${encodeURIComponent(whatsappMsg)}`

      setTimeout(() => {
        window.open(whatsappUrl, '_blank')
      }, 1500)

    } catch (err: any) {
      console.error(err)
      toast.error('Une erreur est survenue lors de votre inscription. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0B1223]/75 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.96, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.96, y: 20 }}
        transition={{ duration: 0.4, ease: EASE }}
        className="w-full max-w-lg bg-white rounded-3xl overflow-hidden border border-zinc-200 shadow-2xl relative flex flex-col text-[#0F1B3D]"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200/50 flex items-center justify-center transition-colors cursor-pointer z-10"
        >
          <X className="w-4 h-4 text-zinc-500" />
        </button>

        {!success ? (
          <div className="flex flex-col h-full">
            {/* Top Progress Line */}
            <div className="h-1 bg-zinc-100 w-full relative">
              <motion.div
                className="absolute inset-y-0 left-0 bg-[#C9973E]"
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {/* Form Container */}
            <div className="p-8 sm:p-12 flex-1 flex flex-col justify-center min-h-[340px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.35, ease: EASE }}
                  className="space-y-6"
                >
                  <span className="text-[10px] font-mono tracking-widest text-[#C9973E] uppercase font-bold bg-[#C9973E]/10 px-2 py-0.5 rounded">
                    Question {currentStep + 1} sur {WIZARD_QUESTIONS.length}
                  </span>

                  <div className="space-y-2">
                    <h3 className="premium-font-display text-2xl font-bold leading-tight text-[#0F1B3D]">
                      {currentQuestion.label}
                    </h3>
                    <p className="text-xs text-[#0F1B3D]/50">
                      {currentQuestion.subtitle}
                    </p>
                  </div>

                  <div className="pt-2">
                    <input
                      ref={inputRef}
                      type={currentQuestion.type}
                      placeholder={currentQuestion.placeholder}
                      value={formData[currentQuestion.id]}
                      onChange={(e) => setFormData({ ...formData, [currentQuestion.id]: e.target.value })}
                      className="w-full bg-transparent border-b-2 border-zinc-200 focus:border-[#C9973E] py-3 text-lg font-medium outline-none transition-colors placeholder:text-zinc-200"
                      autoFocus
                    />
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Wizard Actions Footer */}
            <div className="px-8 py-5 bg-zinc-50 flex items-center justify-between border-t border-zinc-200/50">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentStep === 0}
                className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#0F1B3D]/50 hover:text-[#0F1B3D] disabled:opacity-30 transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Précédent</span>
              </button>

              <button
                type="button"
                onClick={handleNext}
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#0B1223] hover:bg-[#0B1223]/90 text-white rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Calcul...</span>
                  </>
                ) : (
                  <>
                    <span>{currentStep === WIZARD_QUESTIONS.length - 1 ? 'Finaliser' : 'Continuer'}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#C9973E]" />
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* SUCCESS STATE */
          <div className="p-10 text-center space-y-6">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-2xl border border-emerald-100 shadow-md">
              ✓
            </div>
            <div className="space-y-2">
              <h3 className="premium-font-display text-xl font-bold text-[#0F1B3D]">
                Inscription validée !
              </h3>
              <p className="text-xs text-[#0F1B3D]/60 leading-relaxed max-w-xs mx-auto">
                Félicitations <strong>{formData.name}</strong> ! Vos détails sont enregistrés. Vous allez être redirigé vers WhatsApp pour valider votre place.
              </p>
              <p className="text-[10px] text-[#C9973E] font-bold animate-pulse font-mono uppercase tracking-wider pt-2">
                Redirection WhatsApp en cours...
              </p>
            </div>
            <div className="pt-2">
              <a
                href={`https://wa.me/33744125798?text=${encodeURIComponent(`Bonjour Gamaliel, je viens de m'inscrire au Sprint Business IA (Nom : ${formData.name}, Pays : ${formData.country}, WhatsApp : ${formData.phone}). J'aimerais valider ma place.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#25D366] hover:bg-[#1FAA50] text-white rounded-full text-xs font-bold uppercase tracking-wider transition-all shadow-md"
              >
                <span>Ouvrir WhatsApp</span>
              </a>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
