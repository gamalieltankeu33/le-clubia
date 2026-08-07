import React, { useState, useEffect } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  Loader2,
  X,
  MessageSquare,
  Sparkles,
  Clock,
  Users,
  Flame,
  BookOpen,
  ShoppingBag,
  Send,
  Lock,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import confetti from 'canvas-confetti'
import { BrandLogo } from '@/components/brand-logo'
import { supabase } from '@/lib/supabase'

export const Route = createFileRoute('/accompagnement')({
  component: AccompagnementPage,
})

/* ─── Animations ───────────────────────────────────────────────────── */
const EASE = [0.16, 1, 0.3, 1] as const

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-20px' },
  transition: { duration: 0.7, delay, ease: EASE },
})

function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.6, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  )
}

/* ─── FAQ Component ────────────────────────────────────────────────── */
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="border border-[var(--border)] bg-[var(--card)] rounded-2xl overflow-hidden transition-all hover:border-[var(--primary)]/20">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 text-left font-bold text-base text-[var(--foreground)] transition-colors hover:bg-[var(--secondary)]/30 cursor-pointer"
      >
        <span>{question}</span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className="shrink-0 ml-4 w-6 h-6 rounded-full bg-[var(--secondary)] flex items-center justify-center text-[var(--muted-foreground)]"
        >
          <ChevronDown className="w-4 h-4" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
          >
            <div className="px-5 pb-5 pt-1 text-sm text-[var(--muted-foreground)] leading-relaxed border-t border-[var(--border)]/30 bg-[var(--card)]">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─── MAIN PAGE ────────────────────────────────────────────────────── */
export function AccompagnementPage() {
  const [showBookingModal, setShowBookingModal] = useState(false)

  const openBooking = () => {
    setShowBookingModal(true)
  }

  // Calculate spots left dynamically just for visual urgency simulation
  const [spotsLeft, setSpotsLeft] = useState(4)
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate real-time reservations
      setSpotsLeft(prev => (prev > 2 ? prev - 1 : prev))
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] antialiased selection:bg-[var(--primary)] selection:text-white pb-16">
      
      {/* ── Fixed Header ── */}
      <header className="fixed inset-x-0 top-0 z-50 bg-[var(--background)]/80 backdrop-blur-xl border-b border-[var(--border)]/50">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link to="/" className="flex items-center gap-3">
            <BrandLogo size="sm" className="transition-transform hover:scale-[1.02]" />
          </Link>
          <button
            onClick={openBooking}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--noir)] hover:bg-[var(--noir-soft)] text-white rounded-xl text-sm font-bold shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-all cursor-pointer group"
          >
            <span>Je réserve ma place</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </header>

      {/* ── HERO SECTION ── */}
      <section className="relative pt-32 pb-20 sm:pt-36 sm:pb-28 overflow-hidden bg-gradient-to-b from-[var(--secondary)]/40 to-transparent">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-40 left-1/2 h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-gradient-to-b from-[var(--primary)]/[0.06] to-transparent blur-[120px]" />
          <div className="absolute top-20 right-10 h-[300px] w-[300px] rounded-full bg-[var(--bleu-ciel)]/[0.04] blur-[80px]" />
        </div>

        <div className="mx-auto max-w-4xl px-5 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--primary)]/5 border border-[var(--primary)]/10 mb-6"
          >
            <Sparkles className="w-4 h-4 text-[var(--bleu-ciel-deep)] animate-pulse" />
            <span className="text-xs font-bold text-[var(--primary)] tracking-wide uppercase">
              Sprint Business IA • Challenge Intensif
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: EASE }}
            className="font-display text-[2.5rem] sm:text-5xl lg:text-6xl font-extrabold leading-[1.05] tracking-tight text-[var(--noir)]"
          >
            5 jours pour créer votre <span className="serif-accent italic text-[var(--primary-light)]">produit digital</span>, lancer votre boutique, et savoir enfin comment vendre.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: EASE }}
            className="mt-6 text-base sm:text-lg lg:text-xl text-[var(--muted-foreground)] max-w-3xl mx-auto leading-relaxed"
          >
            Un accompagnement intensif limité à <strong className="text-[var(--foreground)]">20 personnes</strong>. Vous repartez avec un produit réel, une boutique en ligne fonctionnelle, et une méthode claire pour vendre — pas juste des notes de cours.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: EASE }}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6"
          >
            <button
              onClick={openBooking}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-5 bg-[var(--noir)] hover:bg-[var(--noir-soft)] text-white rounded-2xl text-base font-bold transition-all hover:scale-[1.02] shadow-[0_8px_30px_rgba(0,0,0,0.15)] cursor-pointer group"
            >
              <span>Je réserve ma place — 10 000 FCFA</span>
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs uppercase tracking-wider font-semibold text-[var(--muted-foreground)]"
          >
            <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200/50">
              <Flame className="w-3.5 h-3.5 fill-current animate-bounce" />
              <span>{spotsLeft} places restantes seulement</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[var(--primary)]" />
              <span>Départ : Vendredi 14 août</span>
            </div>
            <div className="flex items-center gap-1.5 text-[var(--foreground)]">
              <GiftBadge />
              <span className="ml-1.5">1 mois d'accès Club IA offert</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── LE CONSTAT ── */}
      <section className="py-20 bg-white border-y border-[var(--border)]/60 relative">
        <div className="mx-auto max-w-4xl px-5">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[var(--noir)]">
              Le Grand Constat
            </h2>
            <p className="mt-3 text-sm uppercase tracking-widest font-mono text-[var(--muted-foreground)]">
              Pourquoi la plupart des projets n'aboutissent jamais ?
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {/* The problem */}
            <motion.div
              {...fadeUp(0.05)}
              className="p-8 rounded-3xl border border-red-100 bg-red-50/20 flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-bold mb-6">
                  ✕
                </div>
                <h3 className="text-xl font-bold text-red-950 mb-4">Le cycle de l'attente infinie</h3>
                <p className="text-sm text-red-900/70 leading-relaxed mb-4">
                  Vous avez déjà pensé à créer votre propre produit digital. Vous avez peut-être même déjà commencé — un document à moitié rempli, une idée qui traîne, un cours que vous n'avez jamais terminé.
                </p>
                <p className="text-sm text-red-900/70 leading-relaxed">
                  Le problème n'est pas l'envie. Le problème, c'est que personne ne vous a jamais montré, étape par étape, comment aller de <strong>"j'ai une idée"</strong> à <strong>"j'ai un produit en ligne et un premier client."</strong>
                </p>
              </div>
              <div className="mt-8 pt-6 border-t border-red-100/50 text-xs font-semibold text-red-800 uppercase tracking-wider">
                Résultat : procrastination & frustration
              </div>
            </motion.div>

            {/* The solution */}
            <motion.div
              {...fadeUp(0.15)}
              className="p-8 rounded-3xl border border-[var(--primary)]/10 bg-[var(--primary)]/[0.02] flex flex-col justify-between shadow-[0_10px_30px_rgba(15,30,77,0.02)]"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-[var(--primary)] text-white flex items-center justify-center mb-6">
                  <Check className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-[var(--primary)] mb-4">Le Sprint Business IA</h3>
                <p className="text-sm text-[var(--foreground-soft)] leading-relaxed mb-4">
                  C'est exactement ce que le Sprint Business IA règle. <strong>En 5 jours chronométrés.</strong>
                </p>
                <p className="text-sm text-[var(--foreground-soft)] leading-relaxed">
                  Pas de blabla théorique inutile, pas de vidéos interminables à regarder plus tard. Nous concevons, nous mettons en ligne, et nous lançons la machine commerciale ensemble.
                </p>
              </div>
              <div className="mt-8 pt-6 border-t border-[var(--border)]/60 text-xs font-bold text-[var(--bleu-ciel-deep)] uppercase tracking-wider">
                Résultat : un produit en ligne en 5 jours
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── L'OFFRE (Timeline) ── */}
      <section className="py-20 relative">
        <div className="mx-auto max-w-4xl px-5">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-mono text-[var(--primary)] tracking-widest uppercase font-bold bg-[var(--primary)]/5 px-3.5 py-1 rounded-full">
              Le Programme
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[var(--noir)] mt-4">
              Le Sprint Business IA, c'est quoi ?
            </h2>
            <p className="mt-3 text-base text-[var(--muted-foreground)] leading-relaxed">
              Un accompagnement de 5 jours, en groupe restreint, où je vous guide personnellement pour :
            </p>
          </div>

          {/* Timeline track */}
          <div className="space-y-6 relative">
            <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-[var(--border)] hidden sm:block" />

            {[
              {
                days: 'Jour 1-2',
                title: 'Créer votre produit digital',
                desc: 'Vous définissez et vous construisez votre produit avec l\'intelligence artificielle, sans avoir besoin de compétences techniques.',
                icon: <Sparkles className="w-5 h-5" />,
                badge: 'IA & Création de contenu',
              },
              {
                days: 'Jour 3',
                title: 'Monter votre boutique en ligne',
                desc: 'Votre produit est mis en ligne sur une plateforme de vente fluide et moderne, prêt à recevoir des paiements.',
                icon: <ShoppingBag className="w-5 h-5" />,
                badge: 'Mise en ligne & Systèmes',
              },
              {
                days: 'Jour 4-5',
                title: 'Apprendre à vendre',
                desc: 'Je vous montre exactement comment trouver et convaincre vos premiers clients. Pas de théorie : une méthode concrète que vous appliquez immédiatement.',
                icon: <Send className="w-5 h-5" />,
                badge: 'Acquisition client & Ventes',
              },
            ].map((step, idx) => (
              <motion.div
                key={idx}
                {...fadeUp(idx * 0.08)}
                className="flex flex-col sm:flex-row items-start gap-6 bg-white border border-[var(--border)]/60 rounded-3xl p-6 sm:p-8 hover:shadow-[0_8px_24px_rgba(0,0,0,0.02)] transition-shadow"
              >
                <div className="w-12 h-12 rounded-2xl bg-[var(--secondary)] text-[var(--primary)] flex items-center justify-center shrink-0 font-bold z-10">
                  {step.icon}
                </div>
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2 justify-between">
                    <span className="text-xs font-mono text-[var(--bleu-ciel-deep)] font-bold uppercase tracking-wider">
                      {step.days}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-[var(--secondary)] text-[var(--muted-foreground)]">
                      {step.badge}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-[var(--foreground)]">{step.title}</h3>
                  <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            {...fadeUp(0.2)}
            className="mt-12 p-6 sm:p-8 rounded-3xl bg-[var(--noir)] text-white text-center space-y-4"
          >
            <h4 className="text-xl font-bold text-[var(--bleu-ciel)]">
              Le résultat à la fin des 5 jours :
            </h4>
            <p className="text-sm text-zinc-300 max-w-xl mx-auto leading-relaxed">
              À la fin des 5 jours, vous n'avez pas juste "appris des choses". Vous avez un <strong>produit en ligne</strong>, une <strong>boutique fonctionnelle</strong>, et un <strong>plan de vente clair</strong>.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── LE BONUS (Gold theme) ── */}
      <section className="py-16 bg-gradient-to-r from-amber-500/5 via-amber-500/[0.02] to-amber-500/5 border-y border-amber-200/30">
        <div className="mx-auto max-w-4xl px-5">
          <motion.div
            {...fadeUp(0)}
            className="grid grid-cols-1 md:grid-cols-5 gap-8 items-center bg-white border border-amber-200 rounded-3xl p-8 sm:p-10 shadow-[0_15px_40px_rgba(212,175,55,0.05)]"
          >
            <div className="md:col-span-2 text-center md:text-left space-y-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-[var(--or)]" /> Cadeau Offert
              </span>
              <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-[var(--or-deep)] leading-tight">
                Le Super Bonus
              </h3>
              <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-widest font-mono">
                Valeur inestimable
              </p>
            </div>

            <div className="md:col-span-3 text-sm text-[var(--foreground-soft)] leading-relaxed space-y-4">
              <p className="font-bold text-base text-[var(--noir)]">
                1 mois d'accès complet au Club IA
              </p>
              <p>
                Rejoignez notre communauté fermée pour continuer à apprendre à utiliser les outils d'intelligence artificielle pour développer votre activité bien après la fin du Sprint.
              </p>
              <div className="flex items-center gap-2 text-amber-800 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 text-[var(--or)]" />
                <span>Réseau, ressources, prompts et suivi inclus.</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── POUR QUI ── */}
      <section className="py-20 relative bg-white">
        <div className="mx-auto max-w-4xl px-5">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[var(--noir)]">
              Ce Sprint est fait pour vous si…
            </h2>
            <p className="mt-3 text-sm text-[var(--muted-foreground)] uppercase tracking-wider font-mono">
              Vérifiez si vous correspondez au profil recherché :
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              {
                title: 'Salariés déterminés',
                desc: 'Vous voulez lancer un revenu complémentaire sérieux sans tout quitter du jour au lendemain.',
              },
              {
                title: 'Créateurs bloqués',
                desc: 'Vous avez une idée de produit digital, mais vous ne savez pas par où commencer techniquement.',
              },
              {
                title: 'Débutants solitaires',
                desc: 'Vous avez déjà essayé d\'avancer seul et vous vous êtes arrêté ou découragé en cours de route.',
              },
              {
                title: 'Recherche d\'efficacité',
                desc: 'Vous voulez un résultat concret et mesurable en quelques jours, pas dans 6 mois.',
              },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                {...fadeUp(idx * 0.05)}
                className="p-6 rounded-2xl border border-[var(--border)]/70 bg-[var(--background)] flex gap-4 items-start"
              >
                <div className="w-6 h-6 rounded-full bg-[var(--primary)] text-white flex items-center justify-center shrink-0 text-xs font-bold mt-1">
                  ✓
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-[var(--foreground)]">{item.title}</h4>
                  <p className="text-xs sm:text-sm text-[var(--muted-foreground)] leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRIX + URGENCE ── */}
      <section className="py-20 relative bg-gradient-to-b from-transparent to-[var(--secondary)]/40">
        <div className="mx-auto max-w-3xl px-5">
          <motion.div
            {...fadeUp(0)}
            className="relative overflow-hidden bg-[var(--noir)] text-white rounded-3xl p-8 sm:p-12 text-center border border-zinc-800 shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
          >
            {/* Background design accents */}
            <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
              <div className="absolute top-0 right-0 h-[250px] w-[250px] rounded-full bg-[var(--primary-light)]/[0.15] blur-[50px]" />
              <div className="absolute bottom-0 left-0 h-[200px] w-[200px] rounded-full bg-amber-500/[0.08] blur-[40px]" />
            </div>

            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-zinc-800 text-zinc-300 border border-zinc-700 uppercase tracking-widest mb-6">
              Tarif unique de lancement
            </span>

            <h3 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight">
              20 places. 5 jours. Un prix symbolique.
            </h3>

            {/* Price tag */}
            <div className="my-8">
              <div className="text-5xl sm:text-6xl font-black text-white tracking-tight flex items-center justify-center gap-2">
                <span>10 000</span>
                <span className="text-2xl sm:text-3xl text-[var(--bleu-ciel)] font-bold">FCFA</span>
              </div>
              <p className="text-xs text-zinc-400 mt-2">
                Paiement unique · Aucun frais caché · 1 mois d'accès Club IA inclus
              </p>
            </div>

            <p className="text-sm text-zinc-300 max-w-lg mx-auto leading-relaxed mb-8">
              Les places sont limitées à <strong>20 personnes</strong> pour que je puisse accompagner chacun personnellement. Ce n'est pas une formation pré-enregistrée, c'est du direct interactif.
            </p>

            <button
              onClick={openBooking}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-5 bg-white text-zinc-950 hover:bg-zinc-100 rounded-2xl text-base font-bold transition-all hover:scale-[1.02] shadow-[0_8px_24px_rgba(255,255,255,0.1)] cursor-pointer"
            >
              <span>Je réserve ma place maintenant</span>
              <ArrowRight className="w-5 h-5 text-zinc-950" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* ── FAQ SECTION ── */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-3xl px-5">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="font-display text-3xl font-bold tracking-tight text-[var(--noir)]">
              Des questions sur le Sprint ?
            </h2>
            <p className="mt-2 text-sm text-[var(--muted-foreground)] uppercase tracking-wider font-mono">
              Tout ce que vous devez savoir avant de nous rejoindre :
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "Je n'ai jamais créé de produit digital, est-ce que je peux quand même participer ?",
                a: "Oui, c'est justement pour ça que le Sprint existe. Vous partez de zéro, et vous repartez avec un produit structuré et fonctionnel en ligne.",
              },
              {
                q: "Je n'ai pas de compétences techniques, est-ce un problème ?",
                a: "Non. Tout est fait avec l'intelligence artificielle en no-code, étape par étape, en suivant des outils simples d'accès.",
              },
              {
                q: "Combien de temps dois-je y consacrer par jour ?",
                a: "Prévoyez un temps dédié chaque jour pendant les 5 jours (environ 1h à 2h par jour). Le Sprint est intensif pour vous garantir un résultat rapide sans traîner en longueur.",
              },
              {
                q: "Que se passe-t-il après les 5 jours ?",
                a: "Vous gardez votre produit digital, votre boutique en ligne fonctionnelle, et vous continuez avec 1 mois d'accès au Club IA offert pour échanger et aller plus loin avec notre communauté.",
              },
            ].map((item, idx) => (
              <FAQItem key={idx} question={item.q} answer={item.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-24 bg-[var(--noir)] text-white text-center relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute top-1/2 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--primary)]/[0.2] blur-[100px]" />
        </div>

        <div className="mx-auto max-w-3xl px-5 relative z-10 space-y-8">
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
            Passez de l'idée au produit en 5 jours.
          </h2>
          <p className="text-base sm:text-lg text-zinc-400 max-w-xl mx-auto leading-relaxed">
            Les places sont limitées à 20 personnes. Ne laissez pas passer l'occasion de transformer votre idée en produit réel cette semaine.
          </p>

          <div className="flex flex-col items-center justify-center gap-4">
            <button
              onClick={openBooking}
              className="inline-flex items-center gap-3 px-8 py-5 bg-[var(--bleu-ciel)] hover:bg-[var(--bleu-ciel-soft)] text-zinc-950 rounded-2xl text-base font-bold transition-all hover:scale-[1.02] shadow-[0_8px_30px_rgba(96,165,250,0.2)] cursor-pointer group"
            >
              <span>Je réserve ma place — 10 000 FCFA</span>
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </button>
            <span className="text-xs uppercase tracking-widest text-zinc-500 font-mono">
              ⚡ Accompagnement en direct par Ghislain
            </span>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-12 text-center border-t border-[var(--border)]/30 mt-12 bg-white">
        <p className="text-xs text-[var(--muted-foreground)]">
          © {new Date().getFullYear()} Le Club IA — Sprint Challenge. Tous droits réservés.
        </p>
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

/* ─── GIFT BADGE COMPONENT ────────────────────────────────────────── */
function GiftBadge() {
  return (
    <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide">
      Bonus
    </span>
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

  // Prevent scroll when modal is open
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

      // Insert record to accompagnement_candidatures
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

      // Success flow
      setSuccess(true)
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } })

      // Generate WhatsApp link and trigger redirect after a small delay
      const whatsappMsg = `Bonjour Ghislain, je viens de m'inscrire au Sprint Business IA (Nom : ${formData.name}, Pays : ${formData.country}, WhatsApp : ${formData.phone}). J'aimerais valider ma place.`
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
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        transition={{ duration: 0.3, ease: EASE }}
        className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 border border-[var(--border)] shadow-2xl relative overflow-hidden"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-xl bg-[var(--secondary)] hover:bg-[var(--border)]/50 flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-4 h-4 text-[var(--muted-foreground)]" />
        </button>

        {!success ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-center space-y-2">
              <span className="text-[10px] uppercase tracking-widest font-mono text-[var(--bleu-ciel-deep)] font-bold">
                Réservation de place
              </span>
              <h3 className="font-display text-2xl font-extrabold text-[var(--noir)]">
                Rejoindre le Challenge
              </h3>
              <p className="text-xs text-[var(--muted-foreground)] max-w-sm mx-auto">
                Remplissez les détails ci-dessous pour réserver votre place. Vous serez ensuite dirigé vers WhatsApp pour finaliser le règlement de 10 000 FCFA.
              </p>
            </div>

            <div className="space-y-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--foreground-soft)]">
                  Nom et Prénom
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex : Jean Dupont"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[var(--secondary)]/50 border border-[var(--border)] focus:border-[var(--primary)] rounded-xl py-3 px-4 text-sm font-semibold outline-none transition-colors"
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--foreground-soft)]">
                  Adresse E-mail
                </label>
                <input
                  type="email"
                  required
                  placeholder="Ex : jean.dupont@gmail.com"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-[var(--secondary)]/50 border border-[var(--border)] focus:border-[var(--primary)] rounded-xl py-3 px-4 text-sm font-semibold outline-none transition-colors"
                />
              </div>

              {/* Country */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--foreground-soft)]">
                  Votre Pays
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex : Cameroun, Côte d'Ivoire, France..."
                  value={formData.country}
                  onChange={e => setFormData({ ...formData, country: e.target.value })}
                  className="w-full bg-[var(--secondary)]/50 border border-[var(--border)] focus:border-[var(--primary)] rounded-xl py-3 px-4 text-sm font-semibold outline-none transition-colors"
                />
              </div>

              {/* WhatsApp phone number */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--foreground-soft)]">
                  Numéro WhatsApp (avec code pays)
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Ex : +237 690 00 00 00"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-[var(--secondary)]/50 border border-[var(--border)] focus:border-[var(--primary)] rounded-xl py-3 px-4 text-sm font-semibold outline-none transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-4 bg-[var(--noir)] hover:bg-[var(--noir-soft)] text-white rounded-2xl text-sm font-bold shadow-lg transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Enregistrement en cours…</span>
                </>
              ) : (
                <>
                  <span>Confirmer et réserver ma place</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
            <div className="flex items-center justify-center gap-2 text-[10px] text-[var(--muted-foreground)]">
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              <span>Paiement sécurisé sur WhatsApp (Mobile Money / Wave / Paypal)</span>
            </div>
          </form>
        ) : (
          /* SUCCESS STATE */
          <div className="py-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-2xl animate-bounce">
              ✓
            </div>
            <div className="space-y-2">
              <h3 className="font-display text-2xl font-extrabold text-zinc-900">
                Inscription enregistrée !
              </h3>
              <p className="text-sm text-[var(--muted-foreground)] leading-relaxed max-w-sm mx-auto">
                Félicitations <strong>{formData.name}</strong> ! Votre pré-inscription pour le challenge de 5 jours est réussie.
              </p>
              <p className="text-xs text-[var(--bleu-ciel-deep)] font-semibold animate-pulse">
                Redirection automatique vers WhatsApp pour réserver votre place...
              </p>
            </div>
            <div className="pt-2">
              <a
                href={`https://wa.me/33744125798?text=${encodeURIComponent(`Bonjour Ghislain, je viens de m'inscrire au Sprint Business IA (Nom : ${formData.name}, Pays : ${formData.country}, WhatsApp : ${formData.phone}). J'aimerais valider ma place.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#25D366] hover:bg-[#1FAA50] text-white rounded-xl text-sm font-bold transition-all shadow-[0_4px_12px_rgba(37,211,102,0.2)]"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Ouvrir WhatsApp manuellement</span>
              </a>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
