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
  Zap,
  FileText,
  ShoppingBag,
  TrendingUp,
  Bot,
  UserCheck,
  Briefcase,
  Target,
  Plus,
  CalendarDays,
  Clock,
  ShieldCheck,
  CheckCircle2
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

/* ─── Custom CSS Injection (Clean typography, sleek layout) ─── */
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
      linear-gradient(to right, rgba(15, 27, 61, 0.025) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(15, 27, 61, 0.025) 1px, transparent 1px);
    background-size: 40px 40px;
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
`

const EASE = [0.16, 1, 0.3, 1] as const

/* ─── 3D CSS Browser Mockup ─── */
function HeroBrowserMockup() {
  return (
    <div className="relative w-full flex items-center justify-center p-2 sm:p-4">
      {/* Subtle ambient glow */}
      <div className="absolute w-[110%] h-[110%] rounded-3xl bg-gradient-to-tr from-[#C9973E]/10 via-transparent to-zinc-200/20 blur-2xl pointer-events-none" />

      <div className="w-full max-w-[500px] rounded-2xl border border-zinc-200/90 bg-[#0B1223] text-white p-5 sm:p-7 shadow-2xl relative overflow-hidden">
        {/* Browser window top bar */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#FF5F56]" />
            <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
            <div className="w-3 h-3 rounded-full bg-[#27C93F]" />
            <div className="h-5 w-48 rounded-md bg-white/10 ml-3 flex items-center px-2.5 text-[10px] font-mono text-white/50 truncate">
              leclub.ia/sprint-boutique
            </div>
          </div>
          <span className="text-[9px] font-mono text-[#D9A94A] font-semibold tracking-wider uppercase bg-[#C9973E]/15 px-2.5 py-0.5 rounded-full border border-[#C9973E]/30">
            En direct
          </span>
        </div>

        {/* Browser content preview */}
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest font-medium">
              VOTRE LIVRABLE APRÈS 5 JOURS
            </span>
            <span className="flex items-center gap-1.5 text-[9px] font-mono text-emerald-400 font-semibold uppercase bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Boutique Active
            </span>
          </div>

          <div className="space-y-1.5">
            <h4 className="premium-font-display text-lg font-bold text-white tracking-tight">
              E-book & Kit Pratique : Monétiser l'IA
            </h4>
            <p className="text-xs text-zinc-400 leading-relaxed font-light">
              Produit digital conçu, paginé et configuré avec les méthodes du Sprint.
            </p>
          </div>

          {/* Pricing container */}
          <div className="p-4 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-[9px] font-semibold text-zinc-400 tracking-wider">PRIX DE VENTE DE VOTRE OFFRE</div>
              <div className="font-mono font-bold text-lg text-[#D9A94A]">15 000 FCFA</div>
            </div>
            <div className="px-4 py-2 bg-[#C9973E] text-[#0B1223] font-bold text-[10px] rounded-lg shadow-md uppercase tracking-wider">
              Acheter en 1 clic
            </div>
          </div>

          {/* Metric graph simulation */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10">
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
              <div className="text-[8px] text-zinc-400 font-mono tracking-widest uppercase">STATUT SYSTEME</div>
              <div className="text-xs font-mono font-bold text-emerald-400 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Opérationnel</span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
              <div className="text-[8px] text-zinc-400 font-mono tracking-widest uppercase">ENCAISSEMENT</div>
              <div className="text-xs font-mono font-bold text-white mt-1">Stripe & Mobile Money</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── SECTION HEADER HELPER ─── */
function SectionHeader({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <div className="max-w-3xl mb-12 text-center mx-auto">
      <span className="premium-font-mono text-[11px] font-bold tracking-[0.2em] text-[#C9973E] uppercase mb-3 block">
        {eyebrow}
      </span>
      <motion.h2
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-20px' }}
        transition={{ duration: 0.6, ease: EASE }}
        className="premium-font-display text-2xl sm:text-4xl font-bold tracking-tight text-[#0F1B3D] leading-tight"
      >
        {title}
      </motion.h2>
      {subtitle && (
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mt-3 text-sm sm:text-base text-[#0F1B3D]/65 leading-relaxed font-light"
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
      className={`border rounded-2xl mb-3 overflow-hidden transition-all duration-200 ${
        isOpen
          ? 'border-[#C9973E]/40 bg-white shadow-md shadow-[#0B1223]/3'
          : 'border-zinc-200/80 bg-white hover:border-zinc-300 shadow-2xs'
      }`}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left p-6 font-semibold text-base text-[#0F1B3D] transition-colors hover:text-[#C9973E] cursor-pointer"
      >
        <span className="premium-font-display pr-6 font-medium text-sm sm:text-base">{question}</span>
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
            transition={{ duration: 0.3, ease: EASE }}
          >
            <div className="px-6 pb-6 pt-1 text-xs sm:text-sm text-[#0F1B3D]/70 leading-relaxed premium-font-body border-t border-zinc-100">
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

    const handleScroll = () => {
      if (window.scrollY > 500) {
        setShowStickyCTA(true)
      } else {
        setShowStickyCTA(false)
      }
    }
    window.addEventListener('scroll', handleScroll)

    return () => {
      lenis.destroy()
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#0F1B3D] premium-font-body antialiased selection:bg-[#C9973E] selection:text-white pb-10 overflow-hidden relative">
      <style>{styles}</style>

      {/* Grid overlay for subtle background texture */}
      <div className="absolute inset-0 premium-grid-overlay pointer-events-none z-0" />

      {/* ── Navigation Header ── */}
      <header className="fixed inset-x-0 top-0 z-50 bg-[#FAF8F5]/85 backdrop-blur-md border-b border-zinc-200/50 transition-all duration-300">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-3">
            <BrandLogo size="sm" className="transition-transform hover:scale-[1.01]" />
          </Link>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowBookingModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#0B1223] hover:bg-[#131B35] text-white rounded-full text-xs font-semibold tracking-wide transition-all duration-200 shadow-sm hover:shadow cursor-pointer"
            >
              <span>Réserver ma place →</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── HERO SECTION ── */}
      <section className="relative pt-28 pb-20 sm:pt-36 sm:pb-28 overflow-hidden z-10">
        <div className="mx-auto max-w-6xl px-6">
          
          {/* Refined Quote Header */}
          <div className="max-w-3xl mx-auto text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center justify-center gap-2 mb-3">
              <span className="h-[1px] w-6 bg-[#C9973E]/40" />
              <span className="text-[10px] font-mono font-semibold tracking-[0.2em] text-[#C9973E] uppercase">
                MOTIVATION & VISION
              </span>
              <span className="h-[1px] w-6 bg-[#C9973E]/40" />
            </div>
            <p className="premium-font-display text-base sm:text-xl font-light text-[#0F1B3D]/80 leading-relaxed italic max-w-2xl mx-auto">
              « Passer de l'idée à la première vente en quelques jours grâce à l'IA, sans se perdre dans la technique. »
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left Column: Headline, Dates, Action */}
            <div className="lg:col-span-7 text-center lg:text-left space-y-6 sm:space-y-8">
              
              {/* PROMINENT SPRINT DATES BADGE */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: EASE }}
                className="inline-flex flex-wrap items-center gap-3 p-2.5 pr-5 rounded-2xl bg-white border-2 border-[#C9973E]/40 shadow-sm text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-[#C9973E]/10 text-[#C9973E] flex items-center justify-center shrink-0">
                  <CalendarDays className="w-5 h-5 text-[#C9973E]" />
                </div>
                <div className="space-y-0.5">
                  <div className="text-[10px] font-mono font-bold text-[#C9973E] uppercase tracking-wider">
                    PROCHAINE SESSION EN DIRECT
                  </div>
                  <div className="text-sm font-bold text-[#0F1B3D] premium-font-display">
                    Vendredi 14 au Mardi 18 Août 2026
                  </div>
                </div>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1, ease: EASE }}
                className="premium-font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#0F1B3D] leading-[1.12]"
              >
                5 jours pour créer votre <span className="text-[#C9973E]">produit digital</span>, lancer votre boutique, et encaisser vos premières ventes.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.18, ease: EASE }}
                className="text-base text-[#0F1B3D]/70 leading-relaxed font-light"
              >
                Un accompagnement intensif de 5 jours guidé étape par étape. Vous repartez avec un produit concret en ligne, un système d'encaissement fonctionnel et une méthode d'acquisition claire.
              </motion.p>

              {/* Action Button & Security */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.25, ease: EASE }}
                className="flex flex-col sm:flex-row items-center gap-4 pt-2"
              >
                <button
                  onClick={() => setShowBookingModal(true)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#0B1223] hover:bg-[#131B35] text-white rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-lg hover:shadow-xl cursor-pointer"
                >
                  <span>Réserver ma place — 10 000 FCFA</span>
                  <ArrowRight className="w-4 h-4 text-[#C9973E]" />
                </button>
              </motion.div>

              {/* Guarantees / Highlights */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35, duration: 0.5 }}
                className="flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-2 text-xs font-medium text-[#0F1B3D]/60 pt-2"
              >
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Session limitée à 20 participants</span>
                </span>
                <span>•</span>
                <span className="text-[#C9973E] font-semibold">1 mois d'accès Club IA offert</span>
              </motion.div>
            </div>

            {/* Right Column: Clean Browser Mockup */}
            <div className="lg:col-span-5 flex justify-center">
              <HeroBrowserMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 01 — OBJECTIFS DU SPRINT ── */}
      <section className="py-24 bg-white relative z-10 border-y border-zinc-200/50">
        <div className="mx-auto max-w-5xl px-6">
          <SectionHeader
            eyebrow="01 / Méthode & Objectifs"
            title="Ce que nous accomplissons ensemble en 5 jours"
            subtitle="Fini la théorie passive. Nous nous concentrons uniquement sur ce qui produit des résultats concrets."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            {[
              {
                num: "01",
                title: "Création du produit digital",
                desc: "Définissez et concevez votre offre (e-book, template, guide pratique ou mini-formation) en utilisant des prompts d'IA structurés.",
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
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.08, ease: EASE }}
                  className="p-8 rounded-2xl border border-zinc-200/80 bg-[#FAF8F5] flex flex-col justify-between hover:border-[#C9973E]/40 hover:shadow-md transition-all duration-300"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-[#C9973E]/10 text-[#C9973E] flex items-center justify-center">
                        <PillarIcon className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-mono font-bold text-zinc-400">{pillar.num}</span>
                    </div>
                    <h3 className="premium-font-display text-lg font-bold text-[#0F1B3D]">
                      {pillar.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#0F1B3D]/70 leading-relaxed font-light">
                      {pillar.desc}
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── SECTION 02 — LE PROGRAMME SUR 5 JOURS ── */}
      <section className="py-24 bg-[#FAF8F5] relative z-10 border-b border-zinc-200/50" id="programme">
        <div className="mx-auto max-w-5xl px-6">
          <SectionHeader
            eyebrow="02 / Le Programme"
            title="Un plan d'action structuré jour par jour"
            subtitle="Chaque jour correspond à une étape précise avec un livrable opérationnel."
          />

          <div className="mt-12 space-y-6">
            {[
              {
                day: 'Jour 1 & 2',
                title: 'Conception & Génération du Produit Digital',
                desc: 'Définissez votre offre idéale et générez votre produit digital (guide PDF, templates, ou supports de cours) grâce à une série de prompts d\'IA ciblés.',
                output: 'Un produit digital terminé et prêt à être distribué.',
                icon: FileText,
              },
              {
                day: 'Jour 3',
                title: 'Configuration de la Boutique & des Paiements',
                desc: 'Mise en place de votre page de paiement autonome. Liaison des moyens de paiement (Mobile Money, Stripe) pour automatiser la livraison du produit.',
                output: 'Votre page de vente et boutique 100% fonctionnelles.',
                icon: ShoppingBag,
              },
              {
                day: 'Jour 4 & 5',
                title: 'Lancement de l\'Acquisition & Premiers Prospects',
                desc: 'Déploiement de votre stratégie de diffusion sur votre réseau et vos canaux de communication. Approche directe des premiers clients intéressés.',
                output: 'Vos premiers prospects ciblés engagés.',
                icon: TrendingUp,
              },
            ].map((step, idx) => {
              const StepIcon = step.icon
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.08, ease: EASE }}
                  className="p-7 sm:p-8 rounded-2xl bg-white border border-zinc-200/80 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 hover:border-[#C9973E]/30 transition-all"
                >
                  <div className="flex items-start gap-5">
                    <div className="w-12 h-12 rounded-xl bg-[#C9973E]/10 border border-[#C9973E]/20 flex items-center justify-center shrink-0">
                      <StepIcon className="w-6 h-6 text-[#C9973E]" />
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-xs font-mono font-bold tracking-widest text-[#C9973E] uppercase">
                        {step.day}
                      </span>
                      <h3 className="premium-font-display text-xl font-bold text-[#0F1B3D]">{step.title}</h3>
                      <p className="text-xs sm:text-sm text-[#0F1B3D]/70 font-light leading-relaxed max-w-2xl">{step.desc}</p>
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-2 bg-[#FAF8F5] border border-zinc-200/60 px-3.5 py-2 rounded-xl text-xs font-medium text-[#0F1B3D] shrink-0">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>{step.output}</span>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Banner Résultat */}
          <div className="mt-14 p-8 sm:p-10 rounded-2xl bg-[#0B1223] text-white border border-[#C9973E]/20 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center sm:text-left">
              <span className="text-[10px] font-mono font-bold text-[#C9973E] uppercase tracking-widest">
                RÉSULTAT GARANTI
              </span>
              <h3 className="premium-font-display text-xl sm:text-2xl font-bold text-white">
                À la fin des 5 jours, votre système est en ligne.
              </h3>
              <p className="text-xs text-zinc-400 font-light">
                Vous n'avez plus besoin d'accumuler des vidéos théoriques : vous possédez une boutique active.
              </p>
            </div>
            <button
              onClick={() => setShowBookingModal(true)}
              className="px-6 py-3 bg-[#C9973E] hover:bg-[#D9A94A] text-[#0B1223] rounded-full text-xs font-bold uppercase tracking-wider transition-all shrink-0 cursor-pointer"
            >
              Rejoindre la session →
            </button>
          </div>
        </div>
      </section>

      {/* ── SECTION BONUS ── */}
      <section className="py-24 bg-white relative z-10 border-b border-zinc-200/50">
        <div className="mx-auto max-w-5xl px-6">
          <div className="border border-[#C9973E]/30 rounded-3xl p-8 sm:p-12 bg-gradient-to-br from-white to-[#FAF8F5] shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-center">
              <div className="lg:col-span-2 space-y-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-[#C9973E]/10 text-[#C9973E] uppercase tracking-wider">
                  BONUS INCLUS
                </span>
                <h3 className="premium-font-display text-2xl sm:text-3xl font-bold text-[#0F1B3D] leading-tight">
                  1 mois d'accès au Club IA offert
                </h3>
                <p className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                  Communauté & Accompagnement continu
                </p>
              </div>

              <div className="lg:col-span-3 text-sm text-[#0F1B3D]/70 leading-relaxed space-y-4 font-light">
                <p>
                  Pour vous assurer un suivi régulier après la fin du challenge, votre inscription inclut 1 mois complet d'accès à notre communauté francophone.
                </p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {[
                    "Échanges avec d'autres entrepreneurs",
                    "Mises à jour sur les meilleurs outils IA",
                    "Sessions de Q&A hebdomadaires",
                    "Feedback sur vos premières ventes"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2.5 text-xs text-[#0F1B3D] font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C9973E]" />
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
      <section className="py-24 bg-[#FAF8F5] relative z-10 border-b border-zinc-200/50">
        <div className="mx-auto max-w-5xl px-6">
          <SectionHeader
            eyebrow="03 / Public visé"
            title="Ce challenge est fait pour vous si..."
            subtitle="Un format spécialement adapté aux personnes qui manquent de temps ou bloquent sur la partie technique."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
            {[
              {
                title: "Salariés & Actifs",
                desc: "Vous souhaitez créer une activité numérique parallèle sans compromettre votre emploi principal.",
                icon: Briefcase
              },
              {
                title: "Créateurs & Formateurs",
                desc: "Vous possédez une expertise mais hésitez encore à la packager et à la vendre en ligne.",
                icon: Target
              },
              {
                title: "Freelances & Experts",
                desc: "Vous cherchez à diversifier vos revenus en vendant des templates, e-books ou méthodes automatisées.",
                icon: Bot
              },
              {
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
                  className="p-6 rounded-2xl border border-zinc-200/80 bg-white flex flex-col justify-between hover:border-[#C9973E]/30 hover:shadow-md transition-all duration-200"
                >
                  <div className="space-y-4">
                    <div className="w-10 h-10 rounded-xl bg-[#C9973E]/10 text-[#C9973E] flex items-center justify-center">
                      <ProfileIcon className="w-5 h-5" />
                    </div>
                    <h4 className="premium-font-display font-bold text-base text-[#0F1B3D]">{item.title}</h4>
                    <p className="text-xs text-[#0F1B3D]/70 leading-relaxed font-light">{item.desc}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── SECTION TARIFICATION ── */}
      <section className="py-24 bg-white relative z-10 border-b border-zinc-200/50" id="tarification">
        <div className="mx-auto max-w-3xl px-6">
          <div className="p-8 sm:p-12 rounded-3xl bg-[#0B1223] text-white text-center relative overflow-hidden border border-[#C9973E]/30 shadow-xl">
            
            {/* Session highlight pill */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-mono font-bold bg-[#C9973E]/15 text-[#D9A94A] uppercase tracking-wider mb-6 border border-[#C9973E]/30">
              <CalendarDays className="w-4 h-4 text-[#D9A94A]" />
              <span>Session du 14 au 18 Août 2026</span>
            </div>

            <h3 className="premium-font-display text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
              Réservez votre ticket d'accès
            </h3>
            <p className="text-xs text-zinc-400 mt-2 font-light max-w-md mx-auto">
              Accès complet aux 5 jours d'accompagnement direct et au groupe d'entraide dédié.
            </p>

            <div className="my-8">
              <div className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white flex items-center justify-center gap-2">
                <span className="font-mono">10 000</span>
                <span className="text-2xl font-light text-[#D9A94A]">FCFA</span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-2 font-mono uppercase tracking-wider">
                Tarif unique • Aucun frais caché
              </p>
            </div>

            <div className="flex flex-col items-center gap-4">
              <button
                onClick={() => setShowBookingModal(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-10 py-4 bg-[#C9973E] hover:bg-[#D9A94A] text-[#0B1223] rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-lg cursor-pointer"
              >
                <span>Réserver mon ticket d'accès →</span>
              </button>
              <div className="flex items-center justify-center gap-2 text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                <Lock className="w-3.5 h-3.5 text-[#C9973E]" />
                <span>Paiement sécurisé (Stripe & Mobile Money)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION FAQ ── */}
      <section className="py-24 bg-[#FAF8F5] relative z-10 border-b border-zinc-200/50" id="faq">
        <div className="mx-auto max-w-3xl px-6">
          <SectionHeader
            eyebrow="FAQ"
            title="Questions fréquentes"
          />

          <div className="mt-8">
            {[
              {
                q: "Faut-il avoir des compétences techniques pour participer ?",
                a: "Non. Le challenge est spécialement conçu pour éliminer la complexité technique. Nous utilisons des outils simples et des instructions claires pour configurer vos pages.",
              },
              {
                q: "Combien de temps dois-je consacrer chaque jour ?",
                a: "Comptez environ 1 à 2 heures par jour pour suivre les instructions et appliquer les exercices. C'est parfaitement compatible avec une activité salariée.",
              },
              {
                q: "Comment se déroulent les sessions ?",
                a: "Les instructions et guides pas à pas sont partagés chaque jour dans l'espace membre, accompagnés d'un canal d'entraide pour poser vos questions en direct.",
              },
              {
                q: "Puis-je participer depuis l'Afrique ou l'Europe ?",
                a: "Oui. Le programme est accessible partout et nous acceptons les paiements par Mobile Money (Orange Money, Wave, MTN...) ainsi que par carte bancaire (Stripe).",
              },
              {
                q: "Qu'est-ce qui est inclus dans le mois d'accès au Club IA ?",
                a: "Vous bénéficiez d'un accès illimité à la communauté privée, aux salons de discussion, à nos guides de prompts avancés et aux sessions de suivi hebdomadaires.",
              }
            ].map((item, idx) => (
              <FAQAccordionItem key={idx} question={item.q} answer={item.a} idx={idx} />
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION CTA FINAL ── */}
      <section className="py-28 bg-[#0B1223] text-white text-center relative z-10 overflow-hidden">
        <div className="mx-auto max-w-3xl px-6 relative z-10 space-y-6">
          <span className="premium-font-mono text-[10px] font-bold tracking-[0.2em] text-[#C9973E] uppercase block">
            PASSEZ À L'ACTION
          </span>
          <h2 className="premium-font-display text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
            Prêt à lancer votre produit digital ?
          </h2>
          <p className="text-sm text-zinc-400 max-w-md mx-auto leading-relaxed font-light">
            Dans 5 jours, vous disposerez d'un système de vente prêt à l'emploi. Rejoignez la session en direct.
          </p>

          <div className="pt-4 flex flex-col items-center justify-center gap-3">
            <button
              onClick={() => setShowBookingModal(true)}
              className="inline-flex items-center gap-3 px-10 py-4 bg-[#C9973E] hover:bg-[#D9A94A] text-[#0B1223] rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-lg cursor-pointer"
            >
              <span>Réserver ma place — 10 000 FCFA →</span>
            </button>
            <span className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase">
              Prochaine session : 14 — 18 Août 2026
            </span>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-12 text-center bg-[#FAF8F5] border-t border-zinc-200/50 relative z-10">
        <div className="mx-auto max-w-6xl px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <BrandLogo size="sm" display="mark" showSignature={true} />
          
          <div className="flex gap-8 text-[11px] font-mono tracking-wider text-zinc-500 uppercase">
            <a href="#programme" className="hover:text-[#C9973E] transition-colors">Programme</a>
            <a href="#tarification" className="hover:text-[#C9973E] transition-colors">Tarif</a>
            <a href="#faq" className="hover:text-[#C9973E] transition-colors">FAQ</a>
          </div>

          <p className="text-[10px] text-zinc-400 font-mono">
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
            transition={{ duration: 0.3, ease: EASE }}
            className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-zinc-200 p-4 sm:hidden flex items-center justify-between shadow-xl"
          >
            <div className="space-y-0.5">
              <div className="text-[9px] font-mono text-[#C9973E] font-bold uppercase">14 - 18 AOÛT</div>
              <div className="text-base font-bold font-mono text-[#0F1B3D]">10 000 FCFA</div>
            </div>
            <button
              onClick={() => setShowBookingModal(true)}
              className="px-5 py-3 bg-[#0B1223] text-white rounded-full text-[10px] font-bold uppercase tracking-wider shadow-md"
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

  useEffect(() => {
    if (inputRef.current) {
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
        transition={{ duration: 0.35, ease: EASE }}
        className="w-full max-w-lg bg-white rounded-3xl overflow-hidden border border-zinc-200 shadow-2xl relative flex flex-col text-[#0F1B3D]"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200/60 flex items-center justify-center transition-colors cursor-pointer z-10"
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
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  transition={{ duration: 0.3, ease: EASE }}
                  className="space-y-6"
                >
                  <span className="text-[10px] font-mono tracking-widest text-[#C9973E] uppercase font-bold bg-[#C9973E]/10 px-2.5 py-1 rounded-md">
                    Question {currentStep + 1} sur {WIZARD_QUESTIONS.length}
                  </span>

                  <div className="space-y-2">
                    <h3 className="premium-font-display text-2xl font-bold leading-tight text-[#0F1B3D]">
                      {currentQuestion.label}
                    </h3>
                    <p className="text-xs text-[#0F1B3D]/60">
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
                      className="w-full bg-transparent border-b-2 border-zinc-200 focus:border-[#C9973E] py-3 text-lg font-medium outline-none transition-colors placeholder:text-zinc-300"
                      autoFocus
                    />
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Wizard Actions Footer */}
            <div className="px-8 py-5 bg-zinc-50 flex items-center justify-between border-t border-zinc-200/60">
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
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#0B1223] hover:bg-[#131B35] text-white rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Traitement...</span>
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
                Inscription enregistrée !
              </h3>
              <p className="text-xs text-[#0F1B3D]/60 leading-relaxed max-w-xs mx-auto">
                Félicitations <strong>{formData.name}</strong> ! Votre place pour le Sprint est pré-réservée. Redirection vers WhatsApp...
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
