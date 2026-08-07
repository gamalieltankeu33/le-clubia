import React, { useState, useEffect } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ArrowRight,
  Check,
  ChevronDown,
  Loader2,
  X,
  Sparkles,
  Lock,
  ArrowUpRight,
  TrendingUp,
  ShoppingBag,
  Send,
  Users,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import confetti from 'canvas-confetti'
import { BrandLogo } from '@/components/brand-logo'
import { supabase } from '@/lib/supabase'

export const Route = createFileRoute('/accompagnement')({
  component: AccompagnementPage,
})

/* ─── Typography & Styling Injection ──────────────────────────────── */
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap');
  
  .premium-font-display {
    font-family: 'Space Grotesk', 'Inter', sans-serif;
  }
  .premium-font-body {
    font-family: 'Inter', sans-serif;
  }
  .premium-bg-dark {
    background-color: #0B1D33;
  }
  .premium-border-gold {
    border-color: rgba(201, 162, 75, 0.2);
  }
  .premium-border-gold-active {
    border-color: rgba(201, 162, 75, 0.6);
  }
  .premium-text-gold {
    color: #C9A24B;
  }
  .premium-bg-gold {
    background-color: #C9A24B;
  }
  .premium-shadow-gold {
    box-shadow: 0 0 20px rgba(201, 162, 75, 0.15);
  }
  .premium-shadow-gold-hover:hover {
    box-shadow: 0 0 30px rgba(201, 162, 75, 0.3);
  }
`

/* ─── Animations Helpers ─────────────────────────────────────────── */
const EASE = [0.16, 1, 0.3, 1] as const

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-20px' },
  transition: { duration: 0.8, delay, ease: EASE },
})

function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.7, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  )
}

/* ─── Animated Counter ───────────────────────────────────────────── */
function Counter({ value, duration = 1.5 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let start = 0
    const end = value
    if (start === end) return

    const totalMiliseconds = duration * 1000
    const incrementTime = Math.max(Math.floor(totalMiliseconds / end), 20)
    
    const timer = setInterval(() => {
      start += 1
      setCount(start)
      if (start === end) clearInterval(timer)
    }, incrementTime)

    return () => clearInterval(timer)
  }, [value, duration])

  return <span>{count}</span>
}

/* ─── FAQ Component ────────────────────────────────────────────────── */
function FAQItem({ question, answer, idx }: { question: string; answer: string; idx: number }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <motion.div
      {...fadeUp(idx * 0.05)}
      className="border-b border-zinc-200 py-6"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left font-semibold text-lg text-[#0B1D33] transition-colors hover:text-[#C9A24B] cursor-pointer"
      >
        <span className="premium-font-display">{question}</span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3, ease: EASE }}
          className="shrink-0 ml-4 text-zinc-400"
        >
          <ChevronDown className="w-5 h-5" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
          >
            <div className="pt-4 text-sm text-[#0B1D33]/70 leading-relaxed premium-font-body">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/* ─── MAIN PAGE ────────────────────────────────────────────────────── */
export function AccompagnementPage() {
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  // Track mouse coordinates for subtle premium hero parallax
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX - window.innerWidth / 2) / 35
      const y = (e.clientY - window.innerHeight / 2) / 35
      setMousePos({ x, y })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#0B1D33] premium-font-body antialiased selection:bg-[#C9A24B] selection:text-white pb-24">
      <style>{styles}</style>

      {/* ── Minimal Header ── */}
      <header className="fixed inset-x-0 top-0 z-50 bg-[#FAFAFA]/70 backdrop-blur-md border-b border-zinc-200/40">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-3">
            <BrandLogo size="sm" className="transition-transform hover:scale-[1.02]" />
          </Link>
          <button
            onClick={() => setShowBookingModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0B1D33] hover:bg-[#0B1D33]/90 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 hover:scale-[1.03] hover:shadow-lg cursor-pointer"
          >
            <span>Réserver ma place</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* ── HERO SECTION ── */}
      <section className="relative pt-32 pb-24 sm:pt-40 sm:pb-32 overflow-hidden border-b border-zinc-200/50">
        {/* Parallax ambient halo */}
        <motion.div
          style={{ x: mousePos.x, y: mousePos.y }}
          className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-gradient-to-b from-[#C9A24B]/8 to-transparent blur-[120px] pointer-events-none"
        />

        <div className="mx-auto max-w-4xl px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#C9A24B]/30 bg-[#C9A24B]/5 mb-8"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#C9A24B]" />
            <span className="text-[10px] font-mono font-bold tracking-[0.15em] text-[#C9A24B] uppercase">
              Sprint Business IA • Limité à 20 Places
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: EASE }}
            className="premium-font-display text-[2.8rem] sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#0B1D33] leading-[1.05] max-w-4xl mx-auto"
          >
            5 jours pour créer votre <span className="premium-text-gold font-normal italic">produit digital</span>, lancer votre boutique, et savoir enfin comment vendre.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: EASE }}
            className="mt-8 text-base sm:text-lg text-[#0B1D33]/70 max-w-2xl mx-auto leading-relaxed"
          >
            Un accompagnement intensif de <span className="text-[#0B1D33] font-bold"><Counter value={5} /> jours</span>. Vous repartez avec un produit réel en ligne, une boutique fonctionnelle, et une méthode d'acquisition claire — pas juste des notes de cours.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: EASE }}
            className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <button
              onClick={() => setShowBookingModal(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#0B1D33] hover:bg-[#0B1D33]/95 text-white rounded-lg text-sm font-semibold tracking-wide transition-all duration-300 hover:scale-[1.02] premium-shadow-gold-hover cursor-pointer"
            >
              <span>Réserver ma place — 10 000 FCFA</span>
              <ArrowRight className="w-4 h-4 text-[#C9A24B]" />
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[10px] font-mono tracking-widest text-[#0B1D33]/60 uppercase"
          >
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C9A24B] animate-ping" />
              <span className="premium-text-gold font-bold">4 places restantes</span>
            </span>
            <span>•</span>
            <span>Début : Vendredi 14 août</span>
            <span>•</span>
            <span>1 mois d'accès Club IA inclus</span>
          </motion.div>
        </div>
      </section>

      {/* ── LE CONSTAT ── */}
      <section className="py-24 bg-white border-b border-zinc-200/50">
        <div className="mx-auto max-w-5xl px-6">
          <SectionHeader
            eyebrow="01 / Le Constat"
            title="Pourquoi vos projets de produits digitaux restent à l'état d'idées."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-12">
            <motion.div {...fadeUp(0.05)} className="space-y-6">
              <div className="w-8 h-8 rounded bg-red-50 text-red-700 flex items-center justify-center font-bold text-xs">
                ✕
              </div>
              <h3 className="premium-font-display text-xl font-bold text-[#0B1D33]">
                L'illusion de la préparation infinie
              </h3>
              <p className="text-sm text-[#0B1D33]/60 leading-relaxed">
                Vous avez déjà pensé à créer votre propre produit digital. Vous avez peut-être même déjà commencé — un document à moitié rempli, une idée qui traîne, un cours que vous n'avez jamais terminé.
              </p>
              <p className="text-sm text-[#0B1D33]/60 leading-relaxed">
                Le problème n'est pas le manque de volonté. C'est que personne ne vous montre, étape par étape, comment franchir le fossé entre <strong>« j'ai une idée »</strong> et <strong>« j'ai mon premier client en ligne. »</strong>
              </p>
            </motion.div>

            <motion.div {...fadeUp(0.15)} className="space-y-6 border-l border-zinc-100 pl-0 md:pl-12">
              <div className="w-8 h-8 rounded bg-[#C9A24B]/10 text-[#C9A24B] flex items-center justify-center font-bold text-xs">
                ✓
              </div>
              <h3 className="premium-font-display text-xl font-bold text-[#0B1D33]">
                La force de l'exécution guidée
              </h3>
              <p className="text-sm text-[#0B1D33]/60 leading-relaxed">
                Le Sprint Business IA élimine toute friction. Pendant 5 jours, vous ne lisez pas de guides théoriques — vous concevez, configurez et mettez en vente votre produit avec l'assistance active de l'IA.
              </p>
              <p className="text-sm text-[#0B1D33]/70 font-semibold leading-relaxed">
                En 5 jours, nous transformons votre hésitation en système opérationnel.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── L'OFFRE (Timeline) ── */}
      <section className="py-24 bg-[#FAFAFA] border-b border-zinc-200/50">
        <div className="mx-auto max-w-4xl px-6">
          <SectionHeader
            eyebrow="02 / L'Offre"
            title="Un plan d'action structuré sur 5 jours"
            subtitle="Conçu pour ceux qui veulent avancer vite et obtenir des résultats mesurables."
          />

          <div className="mt-16 space-y-16 relative">
            <div className="absolute left-[15px] top-4 bottom-4 w-px bg-zinc-200 hidden sm:block" />

            {[
              {
                day: 'Jour 1-2',
                title: 'Conception & Création du produit avec l\'IA',
                desc: 'Définissez votre offre idéale et générez le produit digital (e-book, template, guide ou mini-formation) en utilisant des prompts IA avancés, sans compétences en écriture ni design.',
                output: 'Un produit digital finalisé, prêt à être livré.',
              },
              {
                day: 'Jour 3',
                title: 'Création du système de vente',
                desc: 'Mise en place de votre page de paiement et de votre boutique automatisée. Configuration des passerelles pour encaisser vos premiers paiements de manière autonome.',
                output: 'Votre boutique en ligne en ligne et fonctionnelle.',
              },
              {
                day: 'Jour 4-5',
                title: 'Lancement du système d\'acquisition',
                desc: 'Apprentissage et application directe de notre méthode d\'acquisition client. Nous créons ensemble vos premiers messages et tunnels pour attirer les prospects sans budget publicitaire.',
                output: 'Vos premiers prospects ciblés contactés.',
              },
            ].map((step, idx) => (
              <motion.div
                key={idx}
                {...fadeUp(idx * 0.08)}
                className="flex flex-col sm:flex-row items-start gap-8"
              >
                {/* Visual marker */}
                <div className="flex items-center gap-4 shrink-0">
                  <div className="w-8 h-8 rounded-full border border-[#C9A24B]/30 bg-white flex items-center justify-center text-xs font-mono font-bold text-[#C9A24B] z-10 shadow-sm">
                    0{idx + 1}
                  </div>
                  <span className="premium-font-display text-sm font-bold tracking-wider uppercase text-[#C9A24B] sm:hidden">
                    {step.day}
                  </span>
                </div>

                <div className="space-y-3 flex-1">
                  <div className="hidden sm:flex items-center justify-between">
                    <span className="text-xs font-mono tracking-widest uppercase font-bold text-[#C9A24B]">
                      {step.day}
                    </span>
                  </div>
                  <h3 className="premium-font-display text-xl font-bold text-[#0B1D33]">{step.title}</h3>
                  <p className="text-sm text-[#0B1D33]/60 leading-relaxed max-w-3xl">{step.desc}</p>
                  
                  <div className="inline-flex items-center gap-2 pt-2 text-xs font-semibold text-[#0B1D33]/80">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C9A24B]" />
                    <span>Livrable : {step.output}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            {...fadeUp(0.25)}
            className="mt-20 p-8 rounded-xl bg-[#0B1D33] text-white flex flex-col sm:flex-row items-center justify-between gap-6"
          >
            <div className="space-y-1 text-center sm:text-left">
              <h4 className="premium-font-display text-lg font-bold text-[#C9A24B]">Le résultat final</h4>
              <p className="text-xs text-white/70 max-w-md leading-relaxed">
                À la fin des 5 jours, vous disposez d'un système de vente complet, d'un produit prêt et d'un plan pour acquérir vos clients.
              </p>
            </div>
            <button
              onClick={() => setShowBookingModal(true)}
              className="px-6 py-3 bg-white text-[#0B1D33] hover:bg-zinc-100 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 hover:scale-[1.03]"
            >
              Réserver ma place
            </button>
          </motion.div>
        </div>
      </section>

      {/* ── LE BONUS (Gold Section) ── */}
      <section className="py-24 bg-white border-b border-zinc-200/50">
        <div className="mx-auto max-w-5xl px-6">
          <motion.div
            {...fadeUp(0)}
            className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-center border border-[#C9A24B]/30 rounded-2xl p-8 sm:p-12 bg-gradient-to-br from-[#FAFAFA] to-white relative overflow-hidden"
          >
            {/* Subtle glow background */}
            <div className="absolute -right-32 -bottom-32 w-80 h-80 rounded-full bg-[#C9A24B]/5 blur-3xl pointer-events-none" />

            <div className="lg:col-span-2 space-y-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-[#C9A24B]/10 text-[#C9A24B] uppercase tracking-wider">
                Bonus d'intégration
              </span>
              <h3 className="premium-font-display text-2xl sm:text-3xl font-bold text-[#0B1D33] leading-tight">
                1 mois d'accès au Club IA offert
              </h3>
              <p className="text-xs font-mono tracking-widest text-[#0B1D33]/40 uppercase">
                Valeur communautaire
              </p>
            </div>

            <div className="lg:col-span-3 text-sm text-[#0B1D33]/60 leading-relaxed space-y-6">
              <p>
                Le challenge de 5 jours est un point de départ. Pour vous assurer un suivi à long terme, vous recevez un accès complet pendant 1 mois à notre communauté privée.
              </p>
              <ul className="space-y-3">
                {[
                  "Échanges directs avec les autres créateurs",
                  "Mises à jour régulières sur les outils IA de vente",
                  "Sessions de questions-réponses en direct",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-xs text-[#0B1D33] font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C9A24B]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── POUR QUI ── */}
      <section className="py-24 bg-[#FAFAFA] border-b border-zinc-200/50">
        <div className="mx-auto max-w-4xl px-6">
          <SectionHeader
            eyebrow="03 / Profils"
            title="Ce challenge est fait pour vous si…"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-12">
            {[
              {
                title: "Salarié en quête de revenus",
                desc: "Vous souhaitez lancer un projet parallèle sérieux pour diversifier vos sources de revenus sans quitter votre emploi principal.",
              },
              {
                title: "Créateur bloqué techniquement",
                desc: "Vous possédez une idée claire ou des compétences, mais l'aspect technique ou la création du produit vous paralyse.",
              },
              {
                title: "Entrepreneur en solo lassé",
                desc: "Vous avez tenté de construire des projets seul et vous vous heurtez régulièrement au manque de structure ou de plan.",
              },
              {
                title: "En recherche de concret",
                desc: "Vous refusez les cours théoriques de 40 heures et préférez lancer un système fonctionnel en quelques jours.",
              },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                {...fadeUp(idx * 0.05)}
                className="p-6 rounded-xl border border-zinc-200/60 bg-white flex gap-4 items-start hover:border-[#C9A24B]/30 transition-all duration-300 hover:shadow-sm"
              >
                <div className="w-5 h-5 rounded-full bg-[#C9A24B]/10 text-[#C9A24B] flex items-center justify-center shrink-0 text-[10px] font-bold mt-1">
                  ✓
                </div>
                <div className="space-y-1">
                  <h4 className="premium-font-display font-bold text-sm text-[#0B1D33]">{item.title}</h4>
                  <p className="text-xs text-[#0B1D33]/60 leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRIX + URGENCE ── */}
      <section className="py-24 bg-white border-b border-zinc-200/50">
        <div className="mx-auto max-w-3xl px-6">
          <motion.div
            {...fadeUp(0)}
            className="p-8 sm:p-12 rounded-2xl bg-[#0B1D33] text-white text-center relative overflow-hidden border border-[#C9A24B]/20 premium-shadow-gold"
          >
            {/* Design halo */}
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-[#C9A24B]/5 blur-3xl pointer-events-none" />

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-white/10 text-[#C9A24B] uppercase tracking-wider mb-6">
              Tarif Unique d'Inscription
            </span>

            <h3 className="premium-font-display text-2xl sm:text-4xl font-bold tracking-tight text-white">
              20 places seulement. 5 jours d'action.
            </h3>

            <div className="my-8">
              <div className="text-5xl sm:text-6xl font-extrabold tracking-tight text-white flex items-center justify-center gap-2">
                <span>10 000</span>
                <span className="text-2xl font-normal premium-text-gold">FCFA</span>
              </div>
              <p className="text-xs text-white/50 mt-2 font-mono uppercase tracking-wider">
                Accompagnement live + 1 mois d'accès Club IA
              </p>
            </div>

            <p className="text-sm text-white/70 max-w-md mx-auto leading-relaxed mb-8">
              Les places sont limitées pour garantir un suivi individuel pendant les sessions. Ce n'est pas une rediffusion, c'est du direct interactif.
            </p>

            <button
              onClick={() => setShowBookingModal(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 bg-white hover:bg-zinc-100 text-[#0B1D33] rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 hover:scale-[1.02]"
            >
              <span>Réserver ma place maintenant</span>
              <ArrowRight className="w-4 h-4 text-[#C9A24B]" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* ── FAQ SECTION ── */}
      <section className="py-24 bg-[#FAFAFA] border-b border-zinc-200/50">
        <div className="mx-auto max-w-3xl px-6">
          <div className="max-w-2xl mb-12">
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#C9A24B] font-bold mb-3 block">
              // FAQ
            </span>
            <h2 className="premium-font-display text-3xl font-bold tracking-tight text-[#0B1D33]">
              Détails stratégiques
            </h2>
          </div>

          <div className="divide-y divide-zinc-200 border-t border-zinc-200">
            {[
              {
                q: "Je n'ai jamais créé de produit digital, est-ce que je peux quand même participer ?",
                a: "Oui, c'est précisément l'objectif du challenge. Vous partez de zéro et vous apprenez à structurer votre savoir avec l'IA pour créer un produit viable.",
              },
              {
                q: "Je n'ai pas de compétences techniques, est-ce un problème ?",
                a: "Non. Tous les outils sélectionnés pour le challenge sont no-code et assistés par l'IA. Les processus de mise en ligne sont expliqués pas à pas.",
              },
              {
                q: "Combien de temps dois-je y consacrer par jour ?",
                a: "Prévoyez environ 1 à 2 heures par jour pour assister ou appliquer les méthodes quotidiennes. Le rythme est soutenu pour garantir des résultats rapides.",
              },
              {
                q: "Que se passe-t-il après les 5 jours ?",
                a: "Vous conservez votre produit et votre boutique en ligne. De plus, votre mois d'accès offert au Club IA commence pour vous permettre d'optimiser vos ventes et d'échanger avec d'autres membres.",
              },
            ].map((item, idx) => (
              <FAQItem key={idx} question={item.q} answer={item.a} idx={idx} />
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-28 bg-[#0B1D33] text-white text-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#C9A24B]/5 blur-[120px] pointer-events-none" />

        <div className="mx-auto max-w-3xl px-6 relative z-10 space-y-8">
          <h2 className="premium-font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
            Passez de l'idée au produit concret.
          </h2>
          <p className="text-sm sm:text-base text-white/70 max-w-lg mx-auto leading-relaxed">
            Les places sont limitées à 20 personnes. Ne laissez pas passer l'opportunité de concrétiser votre offre en 5 jours.
          </p>

          <div className="flex flex-col items-center justify-center gap-4">
            <button
              onClick={() => setShowBookingModal(true)}
              className="inline-flex items-center gap-3 px-8 py-4 bg-[#C9A24B] hover:bg-[#C9A24B]/90 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 hover:scale-[1.02] hover:shadow-lg cursor-pointer"
            >
              <span>Réserver ma place — 10 000 FCFA</span>
              <ArrowRight className="w-4 h-4 text-white" />
            </button>
            <span className="text-[10px] font-mono tracking-widest text-white/40 uppercase">
              Encadrement direct par Gamaliel
            </span>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-12 text-center border-t border-zinc-200/50 mt-12 bg-white text-xs text-zinc-400">
        <p>© {new Date().getFullYear()} Le Club IA — Sprint Challenge. Tous droits réservés.</p>
      </footer>

      {/* ── Booking Modal (Form Checkout) ── */}
      <AnimatePresence>
        {showBookingModal && (
          <BookingModal onClose={() => setShowBookingModal(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─── BOOKING MODAL (CHECKOUT FLOW) ────────────────────────────────── */
function BookingModal({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    country: '',
    phone: '',
  })

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim() || !formData.email.trim() || !formData.country.trim() || !formData.phone.trim()) {
      toast.error('Veuillez remplir tous les champs obligatoires.')
      return
    }

    setLoading(true)
    try {
      const parts = formData.name.trim().split(' ')
      const prenom = parts[0] || ''
      const nom = parts.slice(1).join(' ') || 'Participant'

      // Insert registration details into db
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
          notes: 'Registration via the sales page'
        }
      ])

      if (error) {
        throw new Error(error.message)
      }

      setSuccess(true)
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } })

      // Generate WhatsApp redirection URL
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
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0B1D33]/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.96, y: 15 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.96, y: 15 }}
        transition={{ duration: 0.4, ease: EASE }}
        className="w-full max-w-md bg-white rounded-xl p-6 sm:p-8 border border-zinc-200 shadow-2xl relative overflow-hidden text-[#0B1D33]"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-zinc-100 hover:bg-zinc-200/50 flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-4 h-4 text-zinc-500" />
        </button>

        {!success ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-center space-y-1">
              <span className="text-[10px] uppercase tracking-widest font-mono text-[#C9A24B] font-bold">
                Inscription
              </span>
              <h3 className="premium-font-display text-xl font-bold text-[#0B1D33]">
                Rejoindre le Challenge
              </h3>
              <p className="text-xs text-[#0B1D33]/60 max-w-xs mx-auto">
                Remplissez vos détails d'inscription. Vous serez redirigé vers WhatsApp pour finaliser la validation de votre place (10 000 FCFA).
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#0B1D33]/70">
                  Nom et Prénom
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex : Jean Dupont"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[#FAFAFA] border border-zinc-200 focus:border-[#C9A24B] rounded-lg py-2.5 px-3.5 text-sm font-semibold outline-none transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#0B1D33]/70">
                  Adresse E-mail
                </label>
                <input
                  type="email"
                  required
                  placeholder="Ex : jean.dupont@gmail.com"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-[#FAFAFA] border border-zinc-200 focus:border-[#C9A24B] rounded-lg py-2.5 px-3.5 text-sm font-semibold outline-none transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#0B1D33]/70">
                  Votre Pays
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex : France, Cameroun, Sénégal..."
                  value={formData.country}
                  onChange={e => setFormData({ ...formData, country: e.target.value })}
                  className="w-full bg-[#FAFAFA] border border-zinc-200 focus:border-[#C9A24B] rounded-lg py-2.5 px-3.5 text-sm font-semibold outline-none transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#0B1D33]/70">
                  Numéro WhatsApp
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Ex : +33 6 00 00 00 00"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-[#FAFAFA] border border-zinc-200 focus:border-[#C9A24B] rounded-lg py-2.5 px-3.5 text-sm font-semibold outline-none transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-[#0B1D33] hover:bg-[#0B1D33]/90 text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-md transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Enregistrement en cours…</span>
                </>
              ) : (
                <>
                  <span>Confirmer mon inscription</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
            <div className="flex items-center justify-center gap-1.5 text-[9px] text-zinc-400">
              <Lock className="w-3 h-3 text-[#C9A24B]" />
              <span>Validation sur WhatsApp (Mobile Money, Wave, PayPal...)</span>
            </div>
          </form>
        ) : (
          <div className="py-8 text-center space-y-6">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-xl animate-bounce">
              ✓
            </div>
            <div className="space-y-2">
              <h3 className="premium-font-display text-xl font-bold text-[#0B1D33]">
                Inscription validée !
              </h3>
              <p className="text-xs text-[#0B1D33]/60 leading-relaxed max-w-xs mx-auto">
                Félicitations <strong>{formData.name}</strong> ! Vos détails sont enregistrés. Vous allez être redirigé vers WhatsApp pour finaliser la validation.
              </p>
              <p className="text-[10px] text-[#C9A24B] font-bold animate-pulse font-mono uppercase tracking-wider">
                Redirection automatique en cours...
              </p>
            </div>
            <div className="pt-2">
              <a
                href={`https://wa.me/33744125798?text=${encodeURIComponent(`Bonjour Gamaliel, je viens de m'inscrire au Sprint Business IA (Nom : ${formData.name}, Pays : ${formData.country}, WhatsApp : ${formData.phone}). J'aimerais valider ma place.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 bg-[#25D366] hover:bg-[#1FAA50] text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all"
              >
                <span>Ouvrir WhatsApp manuellement</span>
              </a>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

/* ─── SECTION HEADER HELPER ──────────────────────────────────────── */
function SectionHeader({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <div className="max-w-3xl mb-12">
      <motion.p
        {...fadeUp(0)}
        className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#C9A24B] font-bold mb-3 block"
      >
        // {eyebrow}
      </motion.p>
      <motion.h2
        {...fadeUp(0.05)}
        className="premium-font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#0B1D33] leading-[1.15]"
      >
        {title}
      </motion.h2>
      {subtitle && (
        <motion.p
          {...fadeUp(0.1)}
          className="mt-4 text-sm sm:text-base text-[#0B1D33]/60 leading-relaxed"
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  )
}
