import React, { useState, useEffect, useRef } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ArrowRight,
  ChevronDown,
  Loader2,
  X,
  Lock,
  ChevronLeft,
  FileText,
  ShoppingBag,
  TrendingUp,
  Bot,
  UserCheck,
  Briefcase,
  Target,
  Plus,
  CalendarDays,
  ShieldCheck,
  CheckCircle2,
  Zap,
  Sparkles,
  MessageSquare,
  Users,
  CreditCard,
  Clock,
  Check,
  Tag
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import confetti from 'canvas-confetti'
import { BrandLogo } from '@/components/brand-logo'
import { supabase } from '@/lib/supabase'
import Lenis from 'lenis'

export const Route = createFileRoute('/accompagnement')({
  component: AccompagnementPage,
})

const WHATSAPP_GROUP_URL = 'https://chat.whatsapp.com/D8g1c1cWjuK1OIgpDdRWFs?mode=gi_t'
const CHARIOW_PAYMENT_URL = 'https://ekzckmyk.mychariow.shop/prd_wx1lpxcw?draft=true'

// Opening Date: Monday 10 August 2026 at 18:00
const MONDAY_OPENING_DATE = new Date('2026-08-10T18:00:00')
// Closing Date: Tuesday 11 August 2026 at 23:59
const TUESDAY_CLOSING_DATE = new Date('2026-08-11T23:59:59')

/* ─── Custom CSS Injection (Mobile First & Canonical Le Club IA Styling) ─── */
const styles = `
  .premium-font-display {
    font-family: 'Bricolage Grotesque', 'Space Grotesk', 'Inter', sans-serif;
  }
  .premium-font-body {
    font-family: 'Inter', sans-serif;
  }
  .premium-font-mono {
    font-family: 'Geist Mono', monospace;
  }

  /* Signature serif italique Le Club IA (ex: "rentable.", "produit digital.") */
  .serif-accent {
    font-family: 'Instrument Serif', Georgia, serif;
    font-style: italic;
    color: #2563EB;
    letter-spacing: -0.01em;
    font-weight: 400;
  }

  .premium-grid-overlay {
    background-image: 
      linear-gradient(to right, rgba(15, 30, 77, 0.025) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(15, 30, 77, 0.025) 1px, transparent 1px);
    background-size: 32px 32px;
  }
  @media (min-width: 640px) {
    .premium-grid-overlay {
      background-size: 40px 40px;
    }
  }

  .custom-scrollbar::-webkit-scrollbar {
    width: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(15, 30, 77, 0.02);
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(37, 99, 235, 0.3);
    border-radius: 10px;
  }
`

const EASE = [0.16, 1, 0.3, 1] as const

/* ─── TIME LEFT HELPER ─── */
function calculateTimeLeft(targetDate: Date) {
  const difference = +targetDate - +new Date()
  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true }
  }
  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
    isExpired: false
  }
}

/* ─── HIGH-END TIMER COMPONENT (NO EMOJIS, CLEAR 10 000 FCFA FEE BADGE) ─── */
function OfficialCountdownTimer({ isPaymentsOpen }: { isPaymentsOpen: boolean }) {
  const targetDate = isPaymentsOpen ? TUESDAY_CLOSING_DATE : MONDAY_OPENING_DATE
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(targetDate))

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(targetDate))
    }, 1000)
    return () => clearInterval(timer)
  }, [targetDate])

  return (
    <div className="w-full max-w-xl mx-auto my-6 sm:my-8 p-5 sm:p-8 rounded-3xl bg-[#0F1E4D] border border-[#2563EB]/40 shadow-2xl text-white relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-[#2563EB]/20 blur-2xl pointer-events-none" />

      {/* Top Bar with Icon & Explicit Price Tag */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-white/10 relative z-10">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#60A5FA]" />
          <span className="text-[11px] sm:text-xs font-mono font-bold uppercase tracking-wider text-[#60A5FA]">
            {isPaymentsOpen ? 'FERMETURE DES RÉSERVATIONS DANS :' : 'OUVERTURE DES INSCRIPTIONS DANS :'}
          </span>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2563EB]/25 border border-[#2563EB]/50 text-white font-mono text-xs font-bold">
          <Tag className="w-3 h-3 text-[#60A5FA]" />
          <span>Frais : 10 000 FCFA</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 sm:gap-4 text-center relative z-10">
        {/* Jours */}
        <div className="bg-white/10 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-white/10 flex flex-col justify-center">
          <div className="premium-font-display text-2xl sm:text-4xl font-extrabold text-white">
            {String(timeLeft.days).padStart(2, '0')}
          </div>
          <div className="text-[9px] sm:text-[10px] font-mono text-zinc-300 uppercase tracking-widest mt-1">Jours</div>
        </div>
        {/* Heures */}
        <div className="bg-white/10 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-white/10 flex flex-col justify-center">
          <div className="premium-font-display text-2xl sm:text-4xl font-extrabold text-white">
            {String(timeLeft.hours).padStart(2, '0')}
          </div>
          <div className="text-[9px] sm:text-[10px] font-mono text-zinc-300 uppercase tracking-widest mt-1">Heures</div>
        </div>
        {/* Minutes */}
        <div className="bg-white/10 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-white/10 flex flex-col justify-center">
          <div className="premium-font-display text-2xl sm:text-4xl font-extrabold text-white">
            {String(timeLeft.minutes).padStart(2, '0')}
          </div>
          <div className="text-[9px] sm:text-[10px] font-mono text-zinc-300 uppercase tracking-widest mt-1">Minutes</div>
        </div>
        {/* Secondes */}
        <div className="bg-white/10 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-white/10 flex flex-col justify-center">
          <div className="premium-font-display text-2xl sm:text-4xl font-extrabold text-[#60A5FA]">
            {String(timeLeft.seconds).padStart(2, '0')}
          </div>
          <div className="text-[9px] sm:text-[10px] font-mono text-zinc-300 uppercase tracking-widest mt-1">Sec</div>
        </div>
      </div>
    </div>
  )
}

/* ─── MOBILE-FIRST HIGH-IMPACT PIPELINE STEPPER ANIMATION ─── */
function LiveWorkflowAnimation() {
  const [activeStep, setActiveStep] = useState(0)

  const steps = [
    { day: 'J1 & 2', fullDay: 'Jour 1 & 2', title: 'Idée & Offre', icon: FileText },
    { day: 'J3', fullDay: 'Jour 3', title: 'Boutique', icon: ShoppingBag },
    { day: 'J4', fullDay: 'Jour 4', title: 'Paiements', icon: Lock },
    { day: 'J5', fullDay: 'Jour 5', title: 'Ventes', icon: TrendingUp }
  ]

  // Auto progression loop
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length)
    }, 3500)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="w-full my-6 sm:my-12 relative z-10">
      {/* Horizontal Interactive Timeline Bar */}
      <div className="relative max-w-4xl mx-auto py-2 sm:py-4 px-2 sm:px-4">
        {/* Background Connecting Line */}
        <div className="absolute top-8 sm:top-10 md:top-12 inset-x-8 sm:inset-x-12 md:inset-x-14 h-1.5 sm:h-2 bg-zinc-100 rounded-full z-0" />
        
        {/* Active Animated Progress Line */}
        <motion.div
          className="absolute top-8 sm:top-10 md:top-12 left-8 sm:left-12 md:left-14 h-1.5 sm:h-2 bg-[#2563EB] rounded-full z-0"
          animate={{ width: `${(activeStep / (steps.length - 1)) * 82}%` }}
          transition={{ duration: 0.5, ease: EASE }}
        />

        <div className="grid grid-cols-4 relative z-10">
          {steps.map((step, idx) => {
            const StepIcon = step.icon
            const isActive = idx <= activeStep
            const isCurrent = idx === activeStep
            return (
              <button
                key={idx}
                onClick={() => setActiveStep(idx)}
                className="flex flex-col items-center group cursor-pointer focus:outline-none"
              >
                <motion.div
                  animate={{
                    scale: isCurrent ? 1.15 : 1,
                    backgroundColor: isCurrent ? '#2563EB' : isActive ? '#0F1E4D' : '#FFFFFF',
                    borderColor: isCurrent ? '#2563EB' : isActive ? '#0F1E4D' : '#E5E5E4'
                  }}
                  transition={{ duration: 0.3 }}
                  className={`w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-2xl sm:rounded-3xl border-2 flex items-center justify-center shadow-md transition-shadow ${
                    isCurrent
                      ? 'text-white shadow-xl ring-2 sm:ring-4 ring-[#2563EB]/25'
                      : isActive
                      ? 'text-white'
                      : 'text-zinc-400 bg-white'
                  }`}
                >
                  <StepIcon className="w-5 h-5 sm:w-7 sm:h-7 md:w-8 md:h-8" />
                </motion.div>
                
                <span className={`text-[11px] sm:text-xs md:text-sm font-bold mt-2 sm:mt-4 transition-colors text-center ${
                  isCurrent ? 'text-[#2563EB]' : isActive ? 'text-[#0F1E4D]' : 'text-zinc-400'
                }`}>
                  <span className="sm:hidden">{step.day}</span>
                  <span className="hidden sm:inline">{step.fullDay}</span>
                </span>
                <span className="text-[10px] sm:text-[11px] text-zinc-500 font-medium hidden md:block text-center mt-0.5">
                  {step.title}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ─── SECTION HEADER HELPER ─── */
function SectionHeader({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <div className="max-w-3xl mb-10 sm:mb-14 text-center mx-auto space-y-2 sm:space-y-3">
      <span className="premium-font-mono text-[10px] sm:text-[11px] font-bold tracking-[0.2em] text-[#2563EB] uppercase block">
        {eyebrow}
      </span>
      <motion.h2
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-20px' }}
        transition={{ duration: 0.6, ease: EASE }}
        className="premium-font-display text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#0F1E4D] leading-tight"
      >
        {title}
      </motion.h2>
      {subtitle && (
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="text-xs sm:text-base lg:text-lg text-[#0F1E4D]/70 leading-relaxed font-light max-w-2xl mx-auto"
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
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: idx * 0.05, ease: EASE }}
      className={`border rounded-xl sm:rounded-2xl mb-3 overflow-hidden transition-all duration-200 ${
        isOpen
          ? 'border-[#2563EB]/40 bg-white shadow-md shadow-[#0F1E4D]/3'
          : 'border-zinc-200/80 bg-white hover:border-zinc-300 shadow-2xs'
      }`}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left p-4 sm:p-6 font-semibold text-[#0F1E4D] transition-colors hover:text-[#2563EB] cursor-pointer"
      >
        <span className="premium-font-display pr-4 font-medium text-xs sm:text-base">{question}</span>
        <div
          className={`flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-full transition-transform duration-300 ${
            isOpen ? 'bg-[#2563EB]/10 text-[#2563EB] rotate-45' : 'bg-zinc-100 text-zinc-500'
          }`}
        >
          <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
          >
            <div className="px-4 sm:px-6 pb-4 sm:pb-6 pt-1 text-xs sm:text-sm text-[#0F1E4D]/70 leading-relaxed premium-font-body border-t border-zinc-100">
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
  const [isPaymentsOpen, setIsPaymentsOpen] = useState(false)

  // Check if today is past Monday opening date
  useEffect(() => {
    const checkStatus = () => {
      const now = new Date()
      if (now >= MONDAY_OPENING_DATE) {
        setIsPaymentsOpen(true)
      } else {
        setIsPaymentsOpen(false)
      }
    }
    checkStatus()
    const interval = setInterval(checkStatus, 5000)
    return () => clearInterval(interval)
  }, [])

  // Initialize Lenis smooth scrolling safely
  useEffect(() => {
    let lenis: any = null
    try {
      lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
      })

      function raf(time: number) {
        if (lenis) {
          lenis.raf(time)
          requestAnimationFrame(raf)
        }
      }
      requestAnimationFrame(raf)
    } catch (err) {
      console.warn('Lenis initialization skipped:', err)
    }

    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowStickyCTA(true)
      } else {
        setShowStickyCTA(false)
      }
    }
    window.addEventListener('scroll', handleScroll)

    return () => {
      if (lenis) {
        try {
          lenis.destroy()
        } catch {}
      }
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-[#0F1E4D] premium-font-body antialiased selection:bg-[#2563EB] selection:text-white pb-16 sm:pb-10 overflow-hidden relative">
      <style>{styles}</style>

      {/* Grid overlay for subtle background texture */}
      <div className="absolute inset-0 premium-grid-overlay pointer-events-none z-0" />

      {/* ── Mobile-First Navigation Header ── */}
      <header className="fixed inset-x-0 top-0 z-50 bg-[#FAFAF9]/90 backdrop-blur-md border-b border-zinc-200/60 transition-all duration-300">
        <div className="mx-auto flex h-16 sm:h-20 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2 sm:gap-3">
            <BrandLogo size="sm" className="transition-transform hover:scale-[1.01]" />
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowBookingModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 sm:px-6 sm:py-3 bg-[#0F1E4D] hover:bg-[#1E3A8A] text-white rounded-full text-[11px] sm:text-xs font-semibold tracking-wide transition-all duration-200 shadow-sm cursor-pointer"
            >
              <span>{isPaymentsOpen ? 'Réserver ma place →' : 'Rejoindre VIP →'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── HERO SECTION (MOBILE FIRST & CENTERED WITH SERIF ACCENT) ── */}
      <section className="relative pt-28 pb-12 sm:pt-40 sm:pb-24 overflow-hidden z-10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center space-y-6 sm:space-y-8">
          
          {/* PROMINENT SPRINT DATES BADGE */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="inline-flex flex-col sm:flex-row items-center gap-1.5 sm:gap-3 p-2.5 sm:p-3 px-4 sm:px-6 rounded-2xl sm:rounded-full bg-white border-2 border-[#2563EB]/30 shadow-xs max-w-full"
          >
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-[#2563EB] shrink-0" />
              <span className="text-[10px] sm:text-xs font-mono font-bold text-[#2563EB] uppercase tracking-wider">
                SESSION DÉBUT :
              </span>
            </div>
            <span className="premium-font-display text-xs sm:text-sm font-bold text-[#0F1E4D]">
              Mardi 12 au Samedi 16 Août 2026
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: EASE }}
            className="premium-font-display text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#0F1E4D] leading-[1.15] max-w-3xl mx-auto"
          >
            5 jours pour créer votre <span className="serif-accent">produit digital.</span>, lancer votre boutique, et encaisser vos paiements.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.18, ease: EASE }}
            className="text-xs sm:text-lg lg:text-xl text-[#0F1E4D]/75 leading-relaxed font-light max-w-2xl mx-auto"
          >
            Un accompagnement intensif de 5 jours guidé étape par étape. Vous repartez avec un produit concret en ligne, un système d'encaissement fonctionnel et une méthode d'acquisition claire.
          </motion.p>

          {/* HIGH-IMPACT COUNTDOWN TIMER WITH EXPLICIT PRICE TAG */}
          <OfficialCountdownTimer isPaymentsOpen={isPaymentsOpen} />

          {/* Action Button */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25, ease: EASE }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 sm:pt-4"
          >
            <button
              onClick={() => setShowBookingModal(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 sm:px-10 bg-[#0F1E4D] hover:bg-[#1E3A8A] text-white rounded-full text-xs sm:text-sm font-bold uppercase tracking-wider transition-all duration-200 shadow-xl hover:scale-[1.02] cursor-pointer"
            >
              <span>{isPaymentsOpen ? 'Réserver ma place — 10 000 FCFA' : 'Rejoindre la liste d\'attente (10 000 FCFA)'}</span>
              <ArrowRight className="w-4 h-4 text-[#60A5FA]" />
            </button>
          </motion.div>

          {/* Guarantees */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] sm:text-xs font-medium text-[#0F1E4D]/60 pt-1"
          >
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>{isPaymentsOpen ? '20 places disponibles' : 'Ouverture des inscriptions : Lundi 18h'}</span>
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="text-[#2563EB] font-semibold">1 mois d'accès Club IA offert</span>
          </motion.div>
        </div>
      </section>

      {/* ── SECTION 01 — CE QUE NOUS ACCOMPLISSONS EN 5 JOURS ── */}
      <section className="py-14 sm:py-20 bg-white relative z-10 border-y border-zinc-200/50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeader
            eyebrow="01 / Objectifs & Résultats"
            title="Ce que nous accomplissons en 5 jours"
            subtitle="Pas de théorie inutile. Vous construisez votre système de vente de A à Z avec un guidage direct."
          />

          {/* PURE ANIMATED PROGRESSION STEPPER */}
          <LiveWorkflowAnimation />

          {/* 3 PILLAR CARDS WITH SUBTLE SANS BACKGROUND NUMBERS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mt-10 sm:mt-12 relative">
            {[
              {
                num: "01",
                title: "Création du Produit Digital",
                desc: "Définissez et concevez votre offre (e-book, template, guide pratique ou formation) en utilisant des prompts d'IA structurés.",
                icon: FileText,
              },
              {
                num: "02",
                title: "Boutique & Encaissement",
                desc: "Configuration de votre page de vente et de vos passerelles de paiement (Stripe, Mobile Money) pour encaisser en toute autonomie.",
                icon: ShoppingBag,
              },
              {
                num: "03",
                title: "Plan d'Acquisition Client",
                desc: "Mise en place de votre stratégie de diffusion et d'attraction de prospects qualifiés pour obtenir vos premières ventes rapidement.",
                icon: TrendingUp,
              },
            ].map((pillar, idx) => {
              const PillarIcon = pillar.icon
              return (
                <div key={idx} className="relative group">
                  {idx < 2 && (
                    <div className="hidden md:block absolute -right-6 top-1/2 -translate-y-1/2 z-20 pointer-events-none">
                      <svg className="w-10 h-10 text-[#2563EB]/40" viewBox="0 0 40 40" fill="none">
                        <path d="M 5 20 Q 20 5, 35 20" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" />
                        <polygon points="32,15 38,20 32,25" fill="currentColor" />
                      </svg>
                    </div>
                  )}

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: idx * 0.1, ease: EASE }}
                    className="h-full p-6 sm:p-9 rounded-2xl sm:rounded-3xl border border-zinc-200/80 bg-[#FAFAF9] relative overflow-hidden flex flex-col justify-between hover:border-[#2563EB]/40 hover:shadow-lg transition-all duration-300"
                  >
                    <span className="absolute top-4 right-5 font-mono text-4xl sm:text-5xl font-extrabold text-[#0F1E4D]/[0.025] select-none pointer-events-none">
                      {pillar.num}
                    </span>

                    <div className="space-y-4 sm:space-y-5 relative z-10 pt-1">
                      <div className="flex items-center justify-between">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#2563EB]/10 text-[#2563EB] flex items-center justify-center border border-[#2563EB]/20">
                          <PillarIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <span className="premium-font-mono text-[10px] sm:text-xs font-bold text-[#2563EB] bg-white px-2.5 py-1 rounded-full border border-zinc-200/60 shadow-2xs">
                          Phase {pillar.num}
                        </span>
                      </div>

                      <h3 className="premium-font-display text-lg sm:text-xl font-bold text-[#0F1E4D]">
                        {pillar.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-[#0F1E4D]/75 leading-relaxed font-light">
                        {pillar.desc}
                      </p>
                    </div>
                  </motion.div>
                </div>
              )
            })}
          </div>

        </div>
      </section>

      {/* ── SECTION 02 — UN PLAN D'ACTION STRUCTURÉ SUR 5 JOURS ── */}
      <section className="py-16 sm:py-24 bg-[#FAFAF9] relative z-10 border-b border-zinc-200/50" id="programme">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <SectionHeader
            eyebrow="02 / Programme détaillé"
            title="Un plan d'action structuré"
            subtitle="Suivez une feuille de route rythmée avec des livrables clairs à chaque étape."
          />

          <div className="mt-10 sm:mt-16 space-y-6 sm:space-y-8 relative">
            {[
              {
                num: "01",
                day: 'Jour 1 & 2',
                title: 'Conception & Génération du Produit Digital',
                desc: 'Définissez votre offre idéale et générez votre produit digital (guide PDF, templates, ou supports de cours) grâce à une série de prompts d\'IA ciblés.',
                output: 'Produit digital finalisé & rédigé',
                icon: FileText,
              },
              {
                num: "02",
                day: 'Jour 3',
                title: 'Configuration de la Boutique & des Paiements',
                desc: 'Mise en place de votre page de paiement autonome. Liaison des moyens de paiement (Mobile Money, Stripe) pour automatiser la livraison du produit.',
                output: 'Boutique & paiement 100% opérationnels',
                icon: ShoppingBag,
              },
              {
                num: "03",
                day: 'Jour 4 & 5',
                title: 'Lancement de l\'Acquisition & Premiers Prospects',
                desc: 'Déploiement de votre stratégie de diffusion sur votre réseau et vos canaux de communication. Approche directe des premiers clients intéressés.',
                output: 'Campagne lancée & premiers prospects',
                icon: TrendingUp,
              },
            ].map((step, idx) => {
              const StepIcon = step.icon
              return (
                <div key={idx} className="relative">
                  {idx < 2 && (
                    <div className="hidden sm:flex justify-center my-2 relative z-20">
                      <svg className="w-12 h-10 text-[#2563EB]/50" viewBox="0 0 50 40" fill="none">
                        <path d="M 25 0 Q 38 20, 25 35" stroke="currentColor" strokeWidth="2.5" strokeDasharray="4 3" />
                        <polygon points="19,30 25,38 31,30" fill="currentColor" />
                      </svg>
                    </div>
                  )}

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: idx * 0.08, ease: EASE }}
                    className="p-6 sm:p-10 rounded-2xl sm:rounded-3xl bg-white border border-zinc-200/80 shadow-sm relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 hover:border-[#2563EB]/40 hover:shadow-md transition-all"
                  >
                    <span className="font-mono absolute top-4 right-6 text-4xl sm:text-6xl font-extrabold text-[#0F1E4D]/[0.025] select-none pointer-events-none">
                      {step.num}
                    </span>

                    <div className="flex items-start gap-4 sm:gap-6 relative z-10">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-[#2563EB]/10 border border-[#2563EB]/20 flex items-center justify-center shrink-0">
                        <StepIcon className="w-6 h-6 sm:w-7 sm:h-7 text-[#2563EB]" />
                      </div>
                      <div className="space-y-1.5 sm:space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] sm:text-xs font-mono font-bold tracking-widest text-[#2563EB] uppercase bg-[#2563EB]/10 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full border border-[#2563EB]/20">
                            {step.day}
                          </span>
                          <span className="text-[10px] sm:text-xs font-mono text-zinc-400 font-medium">Étape 0{idx + 1}</span>
                        </div>
                        <h3 className="premium-font-display text-lg sm:text-2xl font-bold text-[#0F1E4D]">{step.title}</h3>
                        <p className="text-xs sm:text-sm text-[#0F1E4D]/75 font-light leading-relaxed max-w-2xl">{step.desc}</p>
                      </div>
                    </div>

                    <div className="inline-flex items-center gap-2 bg-[#FAFAF9] border border-zinc-200/80 px-3.5 py-2 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-semibold text-[#0F1E4D] shrink-0 relative z-10 shadow-2xs">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>{step.output}</span>
                    </div>
                  </motion.div>
                </div>
              )
            })}
          </div>

          {/* Banner Résultat */}
          <div className="mt-12 sm:mt-16 p-6 sm:p-12 rounded-2xl sm:rounded-3xl bg-[#0F1E4D] text-white border border-[#2563EB]/30 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl text-center sm:text-left">
            <div className="space-y-2">
              <span className="text-[9px] sm:text-[10px] font-mono font-bold text-[#60A5FA] uppercase tracking-widest bg-[#60A5FA]/15 px-3 py-1 rounded-full">
                OBJECTIF DU SPRINT
              </span>
              <h3 className="premium-font-display text-xl sm:text-3xl font-bold text-white">
                À la fin des 5 jours, votre boutique est en ligne.
              </h3>
              <p className="text-xs sm:text-sm text-zinc-300 font-light">
                Vous possédez un système autonome et prêt à encaisser des paiements.
              </p>
            </div>
            <button
              onClick={() => setShowBookingModal(true)}
              className="w-full sm:w-auto px-8 py-4 bg-[#2563EB] hover:bg-[#1E3A8A] text-white rounded-full text-xs font-bold uppercase tracking-wider transition-all shrink-0 cursor-pointer shadow-lg"
            >
              {isPaymentsOpen ? 'Réserver ma place (10 000 FCFA) →' : 'Rejoindre le groupe VIP (10 000 FCFA) →'}
            </button>
          </div>
        </div>
      </section>

      {/* ── SECTION BONUS ── */}
      <section className="py-16 sm:py-24 bg-white relative z-10 border-b border-zinc-200/50">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="border border-[#2563EB]/30 rounded-2xl sm:rounded-3xl p-6 sm:p-12 bg-gradient-to-br from-white to-[#FAFAF9] shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 sm:gap-8 items-center">
              <div className="lg:col-span-2 space-y-2 sm:space-y-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-mono font-bold bg-[#2563EB]/10 text-[#2563EB] uppercase tracking-wider">
                  BONUS INCLUS
                </span>
                <h3 className="premium-font-display text-xl sm:text-3xl font-bold text-[#0F1E4D] leading-tight">
                  1 mois d'accès au Club IA offert
                </h3>
                <p className="text-[10px] sm:text-xs font-mono text-zinc-400 uppercase tracking-wider">
                  Communauté & Suivi post-sprint
                </p>
              </div>

              <div className="lg:col-span-3 text-xs sm:text-sm text-[#0F1E4D]/75 leading-relaxed space-y-4 font-light">
                <p>
                  Pour vous assurer un suivi régulier après la fin du challenge, votre inscription inclut 1 mois complet d'accès à notre communauté privée.
                </p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 pt-1">
                  {[
                    "Échanges avec d'autres entrepreneurs",
                    "Mises à jour sur les meilleurs outils IA",
                    "Sessions de Q&A hebdomadaires",
                    "Feedback sur vos premières ventes"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-[#0F1E4D] font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 03 — POUR QUI EST CE CHALLENGE ── */}
      <section className="py-16 sm:py-24 bg-[#FAFAF9] relative z-10 border-b border-zinc-200/50">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <SectionHeader
            eyebrow="03 / Public visé"
            title="Ce challenge est fait pour vous si..."
            subtitle="Un format spécialement adapté aux personnes qui manquent de temps ou bloquent sur la partie technique."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-10 sm:mt-12">
            {[
              {
                num: "01",
                title: "Salariés & Actifs",
                desc: "Vous souhaitez créer une activité numérique parallèle sans compromettre votre emploi principal.",
                icon: Briefcase
              },
              {
                num: "02",
                title: "Créateurs & Formateurs",
                desc: "Vous possédez une expertise mais hésitez encore à la packager et à la vendre en ligne.",
                icon: Target
              },
              {
                num: "03",
                title: "Freelances & Experts",
                desc: "Vous cherchez à diversifier vos revenus en vendant des templates, e-books ou méthodes automatisées.",
                icon: Bot
              },
              {
                num: "04",
                title: "Débutants Ambitieux",
                desc: "Vous privilégiez la pratique immédiate aux longs cours théoriques.",
                icon: UserCheck
              }
            ].map((item, idx) => {
              const ProfileIcon = item.icon
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.05, ease: EASE }}
                  className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-zinc-200/80 bg-white flex flex-col justify-between hover:border-[#2563EB]/40 hover:shadow-md transition-all duration-200 relative overflow-hidden"
                >
                  <span className="font-mono absolute top-3 right-4 text-4xl sm:text-5xl font-extrabold text-[#0F1E4D]/[0.025] select-none pointer-events-none">
                    {item.num}
                  </span>
                  <div className="space-y-3 sm:space-y-4 relative z-10">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#2563EB]/10 text-[#2563EB] flex items-center justify-center">
                      <ProfileIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <h4 className="premium-font-display font-bold text-sm sm:text-base text-[#0F1E4D]">{item.title}</h4>
                    <p className="text-xs text-[#0F1E4D]/75 leading-relaxed font-light">{item.desc}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── SECTION TARIFICATION (ACCÈS VIP LISTE D'ATTENTE OU PAIEMENT DIRECT) ── */}
      <section className="py-16 sm:py-24 bg-white relative z-10 border-b border-zinc-200/50" id="tarification">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="p-6 sm:p-14 rounded-2xl sm:rounded-3xl bg-[#0F1E4D] text-white text-center relative overflow-hidden border border-[#2563EB]/30 shadow-xl">
            
            {/* Session highlight pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-mono font-bold bg-[#2563EB]/20 text-[#60A5FA] uppercase tracking-wider mb-6 border border-[#2563EB]/30 max-w-full">
              <CalendarDays className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#60A5FA] shrink-0" />
              <span>{isPaymentsOpen ? 'Paiements ouverts ! Sprint : 12 - 16 Août' : 'Ouverture Lundi 18h • Sprint : 12 - 16 Août'}</span>
            </div>

            <h3 className="premium-font-display text-2xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
              {isPaymentsOpen ? 'Réservez votre ticket d\'accès' : 'Rejoignez le Groupe WhatsApp VIP'}
            </h3>
            <p className="text-xs sm:text-sm text-zinc-300 mt-2 font-light max-w-md mx-auto">
              {isPaymentsOpen
                ? 'Accès complet aux 5 jours d\'accompagnement direct et au groupe d\'entraide dédié.'
                : 'Les places sont limitées à 20 participants. Le tarif est de 10 000 FCFA pour l\'ensemble du challenge.'}
            </p>

            {/* REFINED DISPLAY PRICE FONT */}
            <div className="my-8 sm:my-10">
              <div className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white flex items-center justify-center gap-2 sm:gap-3">
                <span className="premium-font-display font-extrabold text-white tracking-tight">10 000</span>
                <span className="text-xl sm:text-3xl font-bold text-[#60A5FA] premium-font-display">FCFA</span>
              </div>
              <p className="text-[10px] sm:text-xs text-zinc-400 mt-2.5 font-mono uppercase tracking-wider">
                {isPaymentsOpen ? 'Tarif unique • Paiement sécurisé' : 'Tarif unique • Ouverture des paiements Lundi'}
              </p>
            </div>

            <div className="flex flex-col items-center gap-3 sm:gap-4">
              <button
                onClick={() => setShowBookingModal(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 sm:px-10 bg-[#2563EB] hover:bg-[#1E3A8A] text-white rounded-full text-xs sm:text-sm font-bold uppercase tracking-wider transition-all duration-200 shadow-lg cursor-pointer hover:scale-[1.02]"
              >
                <span>{isPaymentsOpen ? 'Réserver mon ticket (10 000 FCFA) →' : 'Rejoindre la liste VIP (10 000 FCFA) →'}</span>
              </button>
              <div className="flex items-center justify-center gap-2 text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                <Lock className="w-3.5 h-3.5 text-[#60A5FA]" />
                <span>Paiement sécurisé (Stripe & Mobile Money)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION FAQ ── */}
      <section className="py-16 sm:py-24 bg-[#FAFAF9] relative z-10 border-b border-zinc-200/50" id="faq">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <SectionHeader
            eyebrow="FAQ"
            title="Questions fréquentes"
          />

          <div className="mt-6 sm:mt-8">
            {[
              {
                q: "Quel est le tarif de participation au challenge ?",
                a: "L'inscription au challenge intensif de 5 jours coûte 10 000 FCFA (tarif unique tout inclus, incluant 1 mois d'accès au Club IA).",
              },
              {
                q: "Faut-il avoir des compétences techniques pour participer ?",
                a: "Non. Le challenge est spécialement conçu pour éliminer la complexité technique. Nous utilisons des outils simples et des instructions claires pour configurer vos pages.",
              },
              {
                q: "Quand ouvrent officiellement les inscriptions ?",
                a: "Les inscriptions et paiements ouvrent officiellement ce Lundi. En rejoignant le groupe WhatsApp VIP aujourd'hui, vous recevrez votre lien de réservation en avant-première.",
              },
              {
                q: "Combien de temps dois-je consacrer chaque jour ?",
                a: "Comptez environ 1 à 2 heures par jour pour suivre les instructions et appliquer les exercices. C'est parfaitement compatible avec une activité salariée.",
              },
              {
                q: "Puis-je participer depuis l'Afrique ou l'Europe ?",
                a: "Oui. Le programme est accessible partout et nous acceptons les paiements par Mobile Money (Orange Money, Wave, MTN...) ainsi que par carte bancaire (Stripe).",
              }
            ].map((item, idx) => (
              <FAQAccordionItem key={idx} question={item.q} answer={item.a} idx={idx} />
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION CTA FINAL ── */}
      <section className="py-20 sm:py-28 bg-[#0F1E4D] text-white text-center relative z-10 overflow-hidden">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 relative z-10 space-y-4 sm:space-y-6">
          <span className="premium-font-mono text-[9px] sm:text-[10px] font-bold tracking-[0.2em] text-[#60A5FA] uppercase block">
            PASSEZ À L'ACTION
          </span>
          <h2 className="premium-font-display text-2xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
            Prêt à <span className="serif-accent">passer le cap ?</span>
          </h2>
          <p className="text-xs sm:text-sm text-zinc-300 max-w-md mx-auto leading-relaxed font-light">
            Dans 5 jours, vous disposerez d'un système de vente prêt à l'emploi. L'inscription est de 10 000 FCFA.
          </p>

          <div className="pt-2 sm:pt-4 flex flex-col items-center justify-center gap-3">
            <button
              onClick={() => setShowBookingModal(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 sm:px-10 bg-[#2563EB] hover:bg-[#1E3A8A] text-white rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-lg cursor-pointer"
            >
              <span>{isPaymentsOpen ? 'Réserver ma place — 10 000 FCFA →' : 'Rejoindre la liste VIP (10 000 FCFA) →'}</span>
            </button>
            <span className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase">
              Prochaine session : Mardi 12 au Samedi 16 Août 2026
            </span>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 sm:py-12 text-center bg-[#FAFAF9] border-t border-zinc-200/50 relative z-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
          <BrandLogo size="sm" display="mark" showSignature={true} />
          
          <div className="flex gap-6 sm:gap-8 text-[10px] sm:text-[11px] font-mono tracking-wider text-zinc-500 uppercase">
            <a href="#programme" className="hover:text-[#2563EB] transition-colors">Programme</a>
            <a href="#tarification" className="hover:text-[#2563EB] transition-colors">Tarif</a>
            <a href="#faq" className="hover:text-[#2563EB] transition-colors">FAQ</a>
          </div>

          <p className="text-[10px] text-zinc-400 font-mono">
            © {new Date().getFullYear()} Le Club IA • Tous droits réservés.
          </p>
        </div>
      </footer>

      {/* ── STICKY MOBILE CTA ── */}
      <AnimatePresence>
        {showStickyCTA && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-zinc-200 p-3.5 sm:hidden flex items-center justify-between shadow-xl"
          >
            <div className="space-y-0.5">
              <div className="text-[9px] font-mono text-[#2563EB] font-bold uppercase">12 - 16 AOÛT</div>
              <div className="text-sm font-bold font-mono text-[#0F1E4D]">10 000 FCFA</div>
            </div>
            <button
              onClick={() => setShowBookingModal(true)}
              className="px-5 py-3 bg-[#0F1E4D] text-white rounded-full text-[10px] font-bold uppercase tracking-wider shadow-md cursor-pointer"
            >
              {isPaymentsOpen ? 'Réserver →' : 'Rejoindre VIP →'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Booking Modal (Wizard Checkout with Explicit 10 000 FCFA Price Confirmation Step) ── */}
      <AnimatePresence>
        {showBookingModal && (
          <BookingModal isPaymentsOpen={isPaymentsOpen} onClose={() => setShowBookingModal(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─── BOOKING MODAL WITH EXPLICIT 10 000 FCFA CONFIRMATION STEP ─── */
interface WizardQuestion {
  id: 'price_confirm' | 'name' | 'email' | 'country' | 'phone'
  label: string
  subtitle: string
  placeholder: string
  type: 'confirm' | 'text' | 'email' | 'tel'
  errorMsg: string
  validation: (val: string) => boolean
}

const WIZARD_QUESTIONS: WizardQuestion[] = [
  {
    id: 'price_confirm',
    label: 'Confirmation du tarif de participation',
    subtitle: 'La participation au Challenge Sprint Business IA (5 jours intensifs + 1 mois de Club IA) est de 10 000 FCFA.',
    placeholder: '',
    type: 'confirm',
    errorMsg: 'Veuillez accepter le tarif pour continuer.',
    validation: (val) => val === 'accepted',
  },
  {
    id: 'name',
    label: 'Quel est votre nom et prénom ?',
    subtitle: 'Entrez votre identité officielle pour votre inscription au challenge.',
    placeholder: 'Ex : Jean Dupont',
    type: 'text',
    errorMsg: 'Veuillez renseigner votre nom complet.',
    validation: (val) => val.trim().split(' ').filter(Boolean).length >= 1,
  },
  {
    id: 'email',
    label: 'Quelle est votre adresse e-mail ?',
    subtitle: 'Pour vous envoyer les accès aux sessions du challenge.',
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

function BookingModal({ isPaymentsOpen, onClose }: { isPaymentsOpen: boolean; onClose: () => void }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  
  const [formData, setFormData] = useState({
    price_confirm: 'accepted',
    name: '',
    email: '',
    country: '',
    phone: '',
  })

  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (inputRef.current && WIZARD_QUESTIONS[currentStep].type !== 'confirm') {
      inputRef.current.focus()
    }
  }, [currentStep, success])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  const currentQuestion = WIZARD_QUESTIONS[currentStep]
  const progressPercent = ((currentStep + 1) / WIZARD_QUESTIONS.length) * 100

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && currentQuestion.type !== 'confirm') {
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

      const redirectDestination = isPaymentsOpen ? CHARIOW_PAYMENT_URL : WHATSAPP_GROUP_URL

      const { error } = await supabase.from('accompagnement_candidatures').insert([
        {
          nom: nom,
          prenom: prenom,
          email: formData.email.trim().toLowerCase(),
          telephone: formData.phone.trim(),
          pays: formData.country.trim(),
          projet_type: 'Sprint Business IA',
          projet_ia: isPaymentsOpen ? 'Sprint Business IA - Direct Checkout' : 'Sprint Business IA - VIP Waiting Group',
          projet_raison: 'Sprint Business IA Challenge',
          projet_blocage: isPaymentsOpen ? 'Paiement direct Chariow' : 'Attente ouverture Lundi 18h',
          deja_essaie: false,
          deja_essaie_details: isPaymentsOpen ? 'Redirection Chariow' : 'Groupe WhatsApp d\'attente VIP',
          statut_actuel: isPaymentsOpen ? 'Paiement en cours' : 'Liste d\'attente VIP WhatsApp',
          heures_semaine: '10+ heures',
          objectif_12m: 'Lancer un business rentable grâce à l\'IA',
          pret_investir: 'Oui (10 000 FCFA confirme)',
          budget: '10 000 FCFA',
          candidat_raison: 'Sprint Business IA Registration',
          score: 20,
          qualified: true,
          is_western: false,
          notes: isPaymentsOpen ? 'Redirigé vers Chariow Checkout' : 'Inscrit sur la liste d\'attente VIP WhatsApp (Tarif 10k confirme)'
        }
      ])

      if (error) {
        throw new Error(error.message)
      }

      setSuccess(true)
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } })

      // Auto redirect after 1.5 seconds to WhatsApp Group or Chariow Checkout
      setTimeout(() => {
        window.location.href = redirectDestination
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
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-[#0F1E4D]/75 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.96, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.96, y: 20 }}
        transition={{ duration: 0.35, ease: EASE }}
        className="w-full max-w-lg bg-white rounded-2xl sm:rounded-3xl overflow-hidden border border-zinc-200 shadow-2xl relative flex flex-col text-[#0F1E4D]"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200/60 flex items-center justify-center transition-colors cursor-pointer z-10"
        >
          <X className="w-4 h-4 text-zinc-500" />
        </button>

        {!success ? (
          <div className="flex flex-col h-full">
            {/* Top Progress Line */}
            <div className="h-1 bg-zinc-100 w-full relative">
              <motion.div
                className="absolute inset-y-0 left-0 bg-[#2563EB]"
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {/* Form Container */}
            <div className="p-6 sm:p-12 flex-1 flex flex-col justify-center min-h-[300px] sm:min-h-[340px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  transition={{ duration: 0.3, ease: EASE }}
                  className="space-y-5 sm:space-y-6"
                >
                  <span className="text-[10px] font-mono tracking-widest text-[#2563EB] uppercase font-bold bg-[#2563EB]/10 px-2.5 py-1 rounded-md">
                    Étape {currentStep + 1} sur {WIZARD_QUESTIONS.length}
                  </span>

                  <div className="space-y-1.5 sm:space-y-2">
                    <h3 className="premium-font-display text-xl sm:text-2xl font-bold leading-tight text-[#0F1E4D]">
                      {currentQuestion.label}
                    </h3>
                    <p className="text-xs text-[#0F1E4D]/70 leading-relaxed font-light">
                      {currentQuestion.subtitle}
                    </p>
                  </div>

                  {/* PRICE CONFIRMATION STEP WITH OUI / NON BUTTONS */}
                  {currentQuestion.type === 'confirm' ? (
                    <div className="pt-3 space-y-3">
                      <div className="p-4 rounded-2xl bg-[#2563EB]/5 border border-[#2563EB]/20 flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#0F1E4D]">Tarif du Challenge (5 Jours)</span>
                        <span className="premium-font-display text-lg font-extrabold text-[#2563EB]">10 000 FCFA</span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, price_confirm: 'accepted' })
                            setCurrentStep(1)
                          }}
                          className="w-full flex items-center justify-center gap-2 p-3.5 bg-[#2563EB] hover:bg-[#1E3A8A] text-white rounded-2xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md"
                        >
                          <Check className="w-4 h-4 text-emerald-300" />
                          <span>Oui, je confirme</span>
                        </button>
                        
                        <button
                          type="button"
                          onClick={onClose}
                          className="w-full flex items-center justify-center gap-2 p-3.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-2xl text-xs font-semibold transition-all cursor-pointer"
                        >
                          <span>Non, annuler</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-1 sm:pt-2">
                      <input
                        ref={inputRef}
                        type={currentQuestion.type}
                        placeholder={currentQuestion.placeholder}
                        value={formData[currentQuestion.id as keyof typeof formData]}
                        onChange={(e) => setFormData({ ...formData, [currentQuestion.id]: e.target.value })}
                        className="w-full bg-transparent border-b-2 border-zinc-200 focus:border-[#2563EB] py-2.5 sm:py-3 text-base sm:text-lg font-medium outline-none transition-colors placeholder:text-zinc-300"
                        autoFocus
                      />
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Wizard Actions Footer */}
            {currentQuestion.type !== 'confirm' && (
              <div className="px-6 py-4 sm:px-8 sm:py-5 bg-zinc-50 flex items-center justify-between border-t border-zinc-200/60">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#0F1E4D]/50 hover:text-[#0F1E4D] transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Précédent</span>
                </button>

                <button
                  type="button"
                  onClick={handleNext}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 bg-[#0F1E4D] hover:bg-[#1E3A8A] text-white rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Enregistrement...</span>
                    </>
                  ) : (
                    <>
                      <span>
                        {currentStep === WIZARD_QUESTIONS.length - 1
                          ? (isPaymentsOpen ? 'Procéder au paiement' : 'Rejoindre le groupe VIP')
                          : 'Continuer'}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#60A5FA]" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        ) : (
          /* REDIRECT SUCCESS STATE */
          <div className="p-8 sm:p-10 text-center space-y-5 sm:space-y-6">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-2xl sm:text-3xl border border-emerald-100 shadow-md">
              ✓
            </div>
            <div className="space-y-2">
              <h3 className="premium-font-display text-lg sm:text-xl font-bold text-[#0F1E4D]">
                {isPaymentsOpen ? 'Informations enregistrées !' : 'Place pré-réservée avec succès !'}
              </h3>
              <p className="text-xs text-[#0F1E4D]/75 leading-relaxed max-w-xs mx-auto font-light">
                Félicitations <strong>{formData.name}</strong> ! Tarif validé (10 000 FCFA).{' '}
                {isPaymentsOpen
                  ? 'Redirection automatique vers la page de paiement sécurisée Chariow...'
                  : 'Les ouvertures officielles débutent Lundi à 18h. Rejoignez le groupe WhatsApp d\'attente VIP pour recevoir votre lien prioritaire.'}
              </p>
              <p className="text-[10px] text-[#2563EB] font-bold animate-pulse font-mono uppercase tracking-wider pt-2">
                Redirection automatique en cours...
              </p>
            </div>
            <div className="pt-1 sm:pt-2">
              {isPaymentsOpen ? (
                <a
                  href={CHARIOW_PAYMENT_URL}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 sm:px-8 sm:py-4 bg-[#2563EB] hover:bg-[#1E3A8A] text-white rounded-full text-xs font-bold uppercase tracking-wider transition-all shadow-lg hover:scale-[1.02]"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Payer mon ticket (10 000 FCFA) →</span>
                </a>
              ) : (
                <a
                  href={WHATSAPP_GROUP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 sm:px-8 sm:py-4 bg-[#25D366] hover:bg-[#1FAA50] text-white rounded-full text-xs font-bold uppercase tracking-wider transition-all shadow-lg hover:scale-[1.02]"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Rejoindre le Groupe WhatsApp VIP →</span>
                </a>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
