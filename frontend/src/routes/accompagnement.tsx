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
  Tag,
  Lightbulb,
  Package,
  Eye,
  Rocket
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

const WHATSAPP_GROUP_URL = 'https://chat.whatsapp.com/LtTDYyQ2YZVERhAEsGTaJX?mode=gi_t'
const FOUNDER_WHATSAPP_NUMBER = '33744125798'
const CHARIOW_PAYMENT_URL = 'https://ekzckmyk.mychariow.shop/prd_wx1lpxcw?draft=true'

export function getWhatsAppConfirmationLink(prenom: string): string {
  const msg = `Bonjour Gamaliel ! Je viens de m'inscrire au Blueprint Business IA (${prenom}). Peux-tu me confirmer si j'ai bien rejoint le groupe VIP WhatsApp ?`
  return `https://wa.me/${FOUNDER_WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`
}

const EASE = [0.16, 1, 0.3, 1] as const

/* ─── Custom CSS Injection (Dark Mode Premium) ─── */
const styles = `
  .premium-font-display {
    font-family: 'Space Grotesk', 'Inter', sans-serif;
  }
  .premium-font-body {
    font-family: 'Inter', sans-serif;
  }
  .premium-font-mono {
    font-family: 'Geist Mono', monospace;
  }

  .text-gradient {
    background: linear-gradient(to right, #60A5FA, #C084FC);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  .text-gradient-gold {
    background: linear-gradient(to right, #FDE047, #F59E0B);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .premium-grid-overlay {
    background-image: 
      linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
    background-size: 40px 40px;
  }

  .glass-card {
    background: rgba(17, 24, 39, 0.7);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5);
  }

  .glass-card:hover {
    border-color: rgba(96, 165, 250, 0.4);
    box-shadow: 0 4px 40px rgba(96, 165, 250, 0.15);
  }

  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #030712;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(96, 165, 250, 0.5);
    border-radius: 10px;
  }
  
  /* Glowing background blobs */
  .glow-blob {
    position: absolute;
    filter: blur(120px);
    z-index: 0;
    opacity: 0.4;
    border-radius: 50%;
    pointer-events: none;
  }
`

/* ─── DARK WORKFLOW ANIMATION ─── */
function LiveWorkflowAnimation() {
  const [activeStep, setActiveStep] = useState(0)

  const steps = [
    { day: 'Jour 1', title: 'Idée & Offre', icon: Lightbulb, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/30' },
    { day: 'Jour 2', title: 'Produit Digital', icon: Package, color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/30' },
    { day: 'Jour 3 & 4', title: 'Visibilité', icon: Eye, color: 'text-pink-400', bg: 'bg-pink-400/10', border: 'border-pink-400/30' },
    { day: 'Jour 5', title: 'Vente', icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/30' }
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="w-full my-12 relative z-10">
      <div className="relative max-w-4xl mx-auto py-6 px-4">
        {/* Background Line */}
        <div className="absolute top-14 inset-x-12 h-1 bg-white/10 rounded-full z-0" />
        
        {/* Active Line */}
        <motion.div
          className="absolute top-14 left-12 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full z-0"
          animate={{ width: `${(activeStep / (steps.length - 1)) * 82}%` }}
          transition={{ duration: 0.8, ease: EASE }}
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
                    scale: isCurrent ? 1.2 : 1,
                    borderColor: isCurrent ? 'rgba(255,255,255,0.4)' : isActive ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
                  }}
                  transition={{ duration: 0.4 }}
                  className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border flex items-center justify-center shadow-lg transition-all ${
                    isCurrent
                      ? `${step.bg} ${step.color} shadow-2xl shadow-${step.color}/20`
                      : isActive
                      ? 'bg-gray-800 text-white'
                      : 'bg-gray-900/50 text-gray-600'
                  }`}
                >
                  <StepIcon className="w-8 h-8" />
                </motion.div>
                
                <span className={`text-sm font-bold mt-5 transition-colors text-center ${
                  isCurrent ? step.color : isActive ? 'text-white' : 'text-gray-500'
                }`}>
                  {step.day}
                </span>
                <span className="text-xs text-gray-400 font-medium hidden md:block text-center mt-1">
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

/* ─── SECTION HEADER ─── */
function SectionHeader({ eyebrow, title, subtitle }: { eyebrow: string; title: string | React.ReactNode; subtitle?: string }) {
  return (
    <div className="max-w-3xl mb-16 text-center mx-auto space-y-4">
      <span className="premium-font-mono text-xs font-bold tracking-[0.3em] text-blue-400 uppercase block">
        {eyebrow}
      </span>
      <motion.h2
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-20px' }}
        transition={{ duration: 0.6, ease: EASE }}
        className="premium-font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight"
      >
        {title}
      </motion.h2>
      {subtitle && (
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="text-base sm:text-lg text-gray-400 leading-relaxed font-normal max-w-2xl mx-auto"
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
      transition={{ duration: 0.5, delay: idx * 0.05, ease: EASE }}
      className={`glass-card rounded-2xl mb-4 overflow-hidden transition-all duration-300 ${
        isOpen ? 'border-blue-500/50 bg-gray-800/80' : ''
      }`}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left p-5 sm:p-6 font-bold text-white transition-colors hover:text-blue-400 cursor-pointer"
      >
        <span className="premium-font-display pr-4 text-base sm:text-lg">{question}</span>
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-transform duration-300 ${
            isOpen ? 'bg-blue-500/20 text-blue-400 rotate-45' : 'bg-white/5 text-gray-400'
          }`}
        >
          <Plus className="h-5 w-5" />
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
            <div className="px-5 sm:px-6 pb-6 pt-1 text-sm sm:text-base text-gray-300 leading-relaxed premium-font-body border-t border-white/5">
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
  const [isPaymentsOpen] = useState(true)

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
      setShowStickyCTA(window.scrollY > 500)
    }
    window.addEventListener('scroll', handleScroll)

    return () => {
      if (lenis) {
        try { lenis.destroy() } catch {}
      }
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#030712] text-white premium-font-body antialiased selection:bg-blue-600 selection:text-white pb-24 sm:pb-0 overflow-hidden relative">
      <style>{styles}</style>

      {/* Grid overlay & Glow blobs */}
      <div className="absolute inset-0 premium-grid-overlay pointer-events-none z-0" />
      <div className="glow-blob w-[500px] h-[500px] bg-blue-600/20 top-[-10%] left-[-10%]" />
      <div className="glow-blob w-[600px] h-[600px] bg-purple-600/20 bottom-[20%] right-[-10%]" />
      <div className="glow-blob w-[400px] h-[400px] bg-emerald-600/10 top-[40%] left-[10%]" />

      {/* ── Navigation Header ── */}
      <header className="fixed inset-x-0 top-0 z-50 bg-[#030712]/80 backdrop-blur-xl border-b border-white/10 transition-all duration-300">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-3">
            {/* White Logo For Dark Mode */}
            <BrandLogo size="sm" className="transition-transform hover:scale-105 filter invert brightness-0 invert-100" />
          </Link>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowBookingModal(true)}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-white hover:bg-gray-200 text-gray-900 rounded-full text-xs font-bold tracking-wide transition-all duration-200 shadow-[0_0_20px_rgba(255,255,255,0.2)] cursor-pointer"
            >
              <span>Rejoindre le VIP</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ── HERO SECTION ── */}
      <section className="relative pt-40 pb-20 sm:pt-48 sm:pb-32 overflow-hidden z-10 flex items-center min-h-[90vh]">
        <div className="mx-auto max-w-5xl px-6 text-center space-y-8">
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="inline-flex items-center gap-2 p-2 px-5 rounded-full bg-blue-500/10 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)] mx-auto"
          >
            <Zap className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-mono font-bold text-blue-400 uppercase tracking-widest">
              SPRINT BLUEPRINT IA
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
            className="premium-font-display text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.1]"
          >
            Bâtissez votre produit digital en <span className="text-gradient">5 jours</span>.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: EASE }}
            className="text-lg sm:text-xl lg:text-2xl text-gray-400 leading-relaxed font-normal max-w-3xl mx-auto"
          >
            Un accompagnement intensif pour passer de l'idée à vos premières ventes. Laissez l'IA accélérer 90% du processus de création et de marketing.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: EASE }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6"
          >
            <button
              onClick={() => setShowBookingModal(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-10 py-5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-full text-sm font-bold uppercase tracking-widest transition-all duration-300 shadow-[0_0_30px_rgba(59,130,246,0.4)] hover:shadow-[0_0_50px_rgba(59,130,246,0.6)] hover:scale-105 cursor-pointer"
            >
              <span>Démarrer le Sprint</span>
              <Rocket className="w-5 h-5" />
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="flex items-center justify-center gap-3 text-xs font-mono font-medium text-gray-500 pt-4 uppercase tracking-wider"
          >
            <span className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-gray-400" />
              18 au 22 Août 2026
            </span>
            <span>•</span>
            <span className="text-blue-400">Limité à 20 places</span>
          </motion.div>
        </div>
      </section>

      {/* ── SECTION 01 — OBJECTIFS ── */}
      <section className="py-24 relative z-10 border-t border-white/5 bg-gray-900/20">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeader
            eyebrow="01 / La Promesse"
            title={
              <>
                Ce que vous accomplissez <br className="hidden sm:block" />
                en <span className="text-gradient">seulement 5 jours</span>
              </>
            }
            subtitle="Oubliez la théorie. Ce challenge est conçu pour livrer un résultat concret : votre produit prêt à être vendu sur le marché."
          />

          <LiveWorkflowAnimation />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
            {[
              { num: "01", title: "Idée & Offre", desc: "Positionnez votre offre digitale (e-book, templates) sur une niche rentable grâce à l'analyse IA.", icon: Lightbulb, color: "text-blue-400" },
              { num: "02", title: "Produit Digital", desc: "Générez la structure et le contenu complet de votre produit en quelques heures avec nos prompts.", icon: Package, color: "text-purple-400" },
              { num: "03", title: "Visibilité", desc: "Déployez une stratégie de contenu magnétique et attirez vos premiers prospects qualifiés.", icon: Eye, color: "text-pink-400" },
              { num: "04", title: "Encaissement", desc: "Lancez votre boutique automatisée et recevez vos paiements (Stripe, Mobile Money) en direct.", icon: TrendingUp, color: "text-emerald-400" },
            ].map((pillar, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1, ease: EASE }}
                className="glass-card p-8 rounded-3xl relative overflow-hidden group flex flex-col justify-between"
              >
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-colors duration-500" />
                <span className="absolute top-6 right-6 font-mono text-5xl font-bold text-white/5 pointer-events-none">
                  {pillar.num}
                </span>

                <div className="space-y-6 relative z-10 pt-2">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-md">
                    <pillar.icon className={`w-7 h-7 ${pillar.color}`} />
                  </div>
                  <div>
                    <h3 className="premium-font-display text-2xl font-bold text-white mb-3">
                      {pillar.title}
                    </h3>
                    <p className="text-gray-400 leading-relaxed text-sm">
                      {pillar.desc}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 02 — PROGRAMME DÉTAILLÉ ── */}
      <section className="py-32 relative z-10 border-t border-white/5" id="programme">
        <div className="mx-auto max-w-5xl px-6">
          <SectionHeader
            eyebrow="02 / Feuille de route"
            title="Un plan d'action chirurgical"
            subtitle="Chaque jour correspond à une étape décisive de votre business. Pas de place pour la procrastination."
          />

          <div className="mt-20 space-y-8 relative before:absolute before:inset-0 before:ml-10 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
            {[
              { day: 'Jour 1', title: "Validation de l'Idée", desc: "Étude de marché express, définition du client cible et formulation d'une offre irrésistible.", out: "Niche et offre validées" },
              { day: 'Jour 2', title: "Création avec l'IA", desc: "Production du contenu du produit digital (textes, visuels, mise en forme) via des instructions IA avancées.", out: "Produit finalisé" },
              { day: 'Jour 3 & 4', title: "Trafic & Acquisition", desc: "Création du funnel de vente, pages de capture, et rédaction des posts de lancement pour réseaux sociaux.", out: "Canaux d'acquisition prêts" },
              { day: 'Jour 5', title: "Boutique & Vente", desc: "Mise en ligne de la boutique, intégration des moyens de paiement et encaissement des premières ventes.", out: "Boutique live et 1ères ventes" },
            ].map((step, idx) => (
              <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-20 h-20 rounded-full border-4 border-[#030712] bg-gray-900 text-white/50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 relative z-10 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                  <span className="font-mono font-bold">{idx + 1}</span>
                </div>
                
                <motion.div
                  initial={{ opacity: 0, x: idx % 2 === 0 ? 30 : -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="w-[calc(100%-5rem)] md:w-[calc(50%-4rem)] glass-card p-8 rounded-3xl"
                >
                  <div className="flex flex-col gap-3">
                    <span className="text-xs font-mono font-bold tracking-widest text-blue-400 uppercase">
                      {step.day}
                    </span>
                    <h3 className="premium-font-display text-2xl font-bold text-white">{step.title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{step.desc}</p>
                    <div className="mt-4 inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-lg text-xs font-bold text-emerald-400 w-max">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{step.out}</span>
                    </div>
                  </div>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION BONUS ── */}
      <section className="py-24 relative z-10 border-t border-white/5 bg-gray-900/30">
        <div className="mx-auto max-w-5xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative rounded-[2.5rem] p-px overflow-hidden"
          >
            {/* Animated gradient border */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 opacity-50 blur-sm" />
            
            <div className="relative glass-card p-10 sm:p-16 rounded-[2.4rem] h-full z-10 flex flex-col md:flex-row gap-10 items-center">
              <div className="flex-1 space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-mono font-bold text-purple-400 uppercase tracking-widest">
                    Bonus Exclusif
                  </span>
                </div>
                <h3 className="premium-font-display text-4xl sm:text-5xl font-bold text-white leading-tight">
                  1 Mois d'accès au <br />
                  <span className="text-gradient">Club IA Offert</span>
                </h3>
                <p className="text-gray-300 text-lg leading-relaxed">
                  L'accompagnement ne s'arrête pas au bout des 5 jours. Rejoignez notre communauté privée pour consolider vos acquis et scaler vos ventes.
                </p>
                <ul className="space-y-4 pt-4">
                  {[
                    "Sessions Q&A hebdomadaires en live",
                    "Veille sur les meilleurs outils IA",
                    "Réseautage avec la communauté",
                    "Accès illimité à la base de connaissances"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-gray-200 font-medium">
                      <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <Check className="w-3 h-3 text-blue-400" />
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="w-full md:w-1/3 flex justify-center">
                 <div className="w-48 h-64 bg-gradient-to-br from-blue-600 to-purple-800 rounded-3xl shadow-2xl rotate-6 transform hover:rotate-0 transition-transform duration-500 border border-white/20 flex flex-col justify-between p-6">
                    <BrandLogo size="sm" display="mark" className="filter brightness-0 invert" />
                    <div className="space-y-2">
                      <div className="text-[10px] font-mono text-white/50 uppercase tracking-widest">Pass Membre</div>
                      <div className="font-bold text-white text-xl">CLUB IA</div>
                    </div>
                 </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── SECTION PRICING & CTA ── */}
      <section className="py-32 relative z-10 border-t border-white/5" id="tarification">
        <div className="mx-auto max-w-4xl px-6 text-center">
          
          <div className="glass-card p-10 sm:p-20 rounded-[3rem] border border-blue-500/30 relative overflow-hidden shadow-[0_0_80px_rgba(59,130,246,0.1)]">
            <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-transparent pointer-events-none" />
            
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 mb-8">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">
                20 places disponibles
              </span>
            </div>

            <h2 className="premium-font-display text-4xl sm:text-6xl font-bold text-white mb-4">
              Rejoignez le Groupe VIP
            </h2>
            <div className="mb-6">
              <span className="text-5xl sm:text-6xl font-bold text-gradient-gold">15 000 FCFA</span>
            </div>
            <p className="text-gray-400 text-lg sm:text-xl max-w-2xl mx-auto mb-12">
              Inscrivez-vous maintenant pour sécuriser votre place pour le prochain sprint. L'accès inclut l'accompagnement complet, les ressources IA et 1 mois offert au Club IA.
            </p>

            <button
              onClick={() => setShowBookingModal(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-4 px-12 py-6 bg-white hover:bg-gray-200 text-gray-900 rounded-full text-sm font-bold uppercase tracking-widest transition-all duration-300 shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:scale-105 cursor-pointer"
            >
              <span>Accéder à la formation</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            
            <p className="mt-8 text-sm text-gray-500 font-mono">
              Paiement sécurisé via Stripe & Mobile Money
            </p>
          </div>
        </div>
      </section>

      {/* ── SECTION FAQ ── */}
      <section className="py-24 relative z-10 border-t border-white/5 bg-gray-900/20" id="faq">
        <div className="mx-auto max-w-3xl px-6">
          <SectionHeader eyebrow="FAQ" title="Questions fréquentes" />
          <div className="mt-12">
            {[
              { q: "Faut-il avoir des compétences techniques ?", a: "Non. Le challenge est pensé pour éliminer la complexité technique. L'IA rédige et structure, et nous utilisons des plateformes no-code intuitives." },
              { q: "Quel type de produit puis-je créer ?", a: "Des e-books, des guides, des templates (Notion, Canva), des checklists ou des mini-formations vidéos simples." },
              { q: "Combien de temps y consacrer par jour ?", a: "Comptez 1h30 à 2h par jour. Le format est pensé pour être compatible avec un emploi salarié." },
              { q: "Comment se déroule l'accompagnement ?", a: "Tout se passe via un groupe WhatsApp VIP fermé. Vous recevez les instructions chaque matin et pouvez poser vos questions 24/7." }
            ].map((item, idx) => (
              <FAQAccordionItem key={idx} question={item.q} answer={item.a} idx={idx} />
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-12 border-t border-white/10 text-center relative z-10">
        <div className="mx-auto max-w-6xl px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <BrandLogo size="sm" display="mark" className="filter brightness-0 invert opacity-50" />
          <div className="flex gap-8 text-xs font-mono tracking-widest text-gray-500 uppercase font-bold">
            <a href="#programme" className="hover:text-white transition-colors">Programme</a>
            <a href="#tarification" className="hover:text-white transition-colors">VIP</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </div>
          <p className="text-xs text-gray-600 font-mono">
            © {new Date().getFullYear()} Blueprint IA. Tous droits réservés.
          </p>
        </div>
      </footer>

      {/* ── STICKY CTA ── */}
      <AnimatePresence>
        {showStickyCTA && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 inset-x-0 z-40 bg-[#030712]/90 backdrop-blur-xl border-t border-white/10 p-4 flex sm:hidden items-center justify-between"
          >
            <div>
              <div className="text-[10px] font-mono text-blue-400 font-bold uppercase tracking-wider">18 - 22 AOÛT</div>
              <div className="text-sm font-bold text-white">SPRINT BLUEPRINT</div>
            </div>
            <button
              onClick={() => setShowBookingModal(true)}
              className="px-6 py-3 bg-white text-gray-900 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg cursor-pointer"
            >
              Rejoindre
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBookingModal && (
          <BookingModal isPaymentsOpen={isPaymentsOpen} onClose={() => setShowBookingModal(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─── BOOKING MODAL (DARK THEME) ─── */
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
    label: 'Quel est votre nom complet ?',
    subtitle: 'Pour votre inscription officielle.',
    placeholder: 'Ex : Jean Dupont',
    type: 'text',
    errorMsg: 'Veuillez renseigner votre nom complet.',
    validation: (val) => val.trim().split(' ').filter(Boolean).length >= 1,
  },
  {
    id: 'email',
    label: 'Quelle est votre adresse e-mail ?',
    subtitle: 'Pour recevoir les accès de la formation.',
    placeholder: 'Ex : jean@mail.com',
    type: 'email',
    errorMsg: 'Veuillez renseigner une adresse e-mail valide.',
    validation: (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim()),
  },
  {
    id: 'country',
    label: 'Quel est votre pays de résidence ?',
    subtitle: 'Pour adapter les moyens de paiements.',
    placeholder: 'Ex : France, Cameroun...',
    type: 'text',
    errorMsg: 'Veuillez préciser votre pays.',
    validation: (val) => val.trim().length >= 2,
  },
  {
    id: 'phone',
    label: 'Votre numéro WhatsApp ?',
    subtitle: 'Pour l\'intégration au groupe VIP.',
    placeholder: 'Ex : +237 690 00 00 00',
    type: 'tel',
    errorMsg: 'Veuillez saisir un numéro valide.',
    validation: (val) => val.trim().length >= 7,
  },
]

function BookingModal({ isPaymentsOpen, onClose }: { isPaymentsOpen: boolean; onClose: () => void }) {
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

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus()
  }, [currentStep, success])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const currentQuestion = WIZARD_QUESTIONS[currentStep]
  const progressPercent = ((currentStep + 1) / WIZARD_QUESTIONS.length) * 100

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
    if (!currentQuestion.validation(formData[currentQuestion.id])) {
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
    if (currentStep > 0) setCurrentStep(prev => prev - 1)
  }

  const handleFinalSubmit = async () => {
    setLoading(true)
    try {
      const parts = formData.name.trim().split(' ')
      const prenom = parts[0] || ''
      const nom = parts.slice(1).join(' ') || 'Participant'
      const redirectDestination = getWhatsAppConfirmationLink(prenom)

      const { error } = await supabase.from('accompagnement_candidatures').insert([
        {
          nom: nom,
          prenom: prenom,
          email: formData.email.trim().toLowerCase(),
          telephone: formData.phone.trim(),
          pays: formData.country.trim(),
          projet_type: 'Blueprint Business IA',
          projet_ia: 'Sprint Business IA - VIP',
          statut_actuel: 'Membre Groupe VIP WhatsApp',
          score: 20,
          qualified: true,
          notes: 'Inscrit via Dark Mode Landing Page'
        }
      ])

      if (error) throw new Error(error.message)

      setSuccess(true)
      confetti({ particleCount: 150, spread: 100, origin: { y: 0.5 }, colors: ['#60A5FA', '#C084FC', '#ffffff'] })

      setTimeout(() => {
        window.location.href = redirectDestination
      }, 2000)

    } catch (err) {
      console.error(err)
      toast.error("Erreur lors de l'inscription.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-lg"
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="w-full max-w-lg glass-card bg-gray-900/90 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col text-white"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors z-10"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>

        {!success ? (
          <div className="flex flex-col h-full">
            {/* Progress */}
            <div className="h-1 bg-white/10 w-full relative">
              <motion.div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-purple-500"
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {/* Form */}
            <div className="p-8 sm:p-12 flex-1 flex flex-col justify-center min-h-[350px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3, ease: EASE }}
                  className="space-y-6"
                >
                  <span className="text-xs font-mono text-blue-400 uppercase font-bold tracking-widest">
                    Étape {currentStep + 1} / {WIZARD_QUESTIONS.length}
                  </span>
                  <div>
                    <h3 className="premium-font-display text-2xl sm:text-3xl font-bold text-white mb-2">
                      {currentQuestion.label}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      {currentQuestion.subtitle}
                    </p>
                  </div>
                  <div className="pt-4">
                    <input
                      ref={inputRef}
                      type={currentQuestion.type}
                      placeholder={currentQuestion.placeholder}
                      value={formData[currentQuestion.id as keyof typeof formData]}
                      onChange={(e) => setFormData({ ...formData, [currentQuestion.id]: e.target.value })}
                      className="w-full bg-transparent border-b-2 border-white/10 focus:border-blue-500 py-3 text-xl font-medium text-white outline-none transition-colors placeholder:text-gray-600"
                    />
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="px-8 py-6 bg-white/5 flex items-center justify-between border-t border-white/10">
              <button
                onClick={handlePrev}
                disabled={currentStep === 0}
                className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                  currentStep === 0 ? 'text-gray-600 cursor-not-allowed' : 'text-gray-300 hover:text-white'
                }`}
              >
                <ChevronLeft className="w-4 h-4" /> Retour
              </button>
              <button
                onClick={handleNext}
                disabled={loading}
                className="flex items-center gap-3 px-8 py-3.5 bg-white text-gray-900 hover:bg-gray-200 rounded-full text-xs font-bold uppercase tracking-widest transition-all"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                  <>
                    <span>{currentStep === WIZARD_QUESTIONS.length - 1 ? 'Terminer' : 'Suivant'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto text-4xl border border-emerald-500/30">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="premium-font-display text-3xl font-bold text-white">
              Inscription confirmée !
            </h3>
            <p className="text-gray-400 text-sm">
              Redirection vers WhatsApp dans un instant...
            </p>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
