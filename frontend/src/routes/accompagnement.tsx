import React, { useState, useRef, useEffect } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Loader2,
  X,
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
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: EASE },
})

const slideIn = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 },
  transition: { duration: 0.35, ease: EASE },
}

/* ─── InView Reveal ────────────────────────────────────────────────── */

function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const [isMobile] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches
  )
  if (isMobile) return <div className={className}>{children}</div>
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

/* ─── Form Data ────────────────────────────────────────────────────── */

const PROJET_TYPES = [
  'Je veux lancer mon premier business.',
  "J'ai déjà un business.",
  'Je suis salarié.',
  'Je suis freelance.',
  'Autre.',
]

const STATUTS = [
  'Je pars de zéro.',
  "J'ai une idée.",
  "J'ai commencé.",
  "J'ai déjà des clients.",
]

const HEURES = ['Moins de 5 h', '5 à 10 h', '10 à 20 h', 'Plus de 20 h']

const PRET_OPTIONS = ['Oui', 'Peut-être', 'Non']

const BUDGETS = ['Moins de 500 €', '500 à 1 500 €', '1 500 à 3 000 €', 'Plus de 3 000 €']

/* ─── Page ─────────────────────────────────────────────────────────── */

export function AccompagnementPage() {
  const [showForm, setShowForm] = useState(false)

  const openForm = () => setShowForm(true)

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] antialiased selection:bg-[var(--primary)] selection:text-white">

      {/* ── Header ── */}
      <header className="fixed inset-x-0 top-0 z-50 bg-[var(--background)]/80 backdrop-blur-xl border-b border-[var(--border)]/50">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link to="/" className="flex items-center gap-3">
            <BrandLogo size="sm" className="transition-transform hover:scale-[1.02]" />
          </Link>
          <button
            onClick={openForm}
            className="cta-black group relative overflow-hidden px-5 py-2.5 text-sm cursor-pointer"
          >
            <span className="relative z-10 flex items-center gap-2">
              Candidater
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </span>
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
          </button>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="relative pt-28 pb-16 sm:pt-32 sm:pb-20 overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-32 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-gradient-to-b from-[var(--primary)]/[0.05] to-transparent blur-[100px]" />
        </div>

        <div className="mx-auto max-w-3xl px-5 sm:px-6">
          <motion.p {...fadeUp(0.05)} className="eyebrow mb-6">
            Accompagnement sur-mesure
          </motion.p>

          <motion.h1 {...fadeUp(0.12)} className="font-display text-[2.2rem] sm:text-4xl lg:text-5xl font-bold leading-[1.05] tracking-tight">
            Construisez un business rentable{' '}
            <span className="serif-accent">grâce à l'IA.</span>
          </motion.h1>

          <motion.div {...fadeUp(0.22)} className="mt-6 space-y-4 text-base sm:text-lg leading-relaxed text-[var(--muted-foreground)]">
            <p>
              Passez de l'idée à un véritable business — accompagné, étape par étape.
            </p>
            <p>
              Nous vous aidons à transformer vos compétences, vos idées ou votre expertise en un business moderne grâce à l'IA.
            </p>
            <p className="text-[var(--foreground)] font-medium">
              Vous ne repartez pas avec une simple formation.<br />
              Vous repartez avec un plan clair, un système et un business que vous construisez avec nous.
            </p>
          </motion.div>

          <motion.div {...fadeUp(0.35)} className="mt-8">
            <button
              onClick={openForm}
              className="cta-black cta-black-xl group relative overflow-hidden px-8 py-4 cursor-pointer"
            >
              <span className="relative z-10 flex items-center gap-2">
                Candidater à l'accompagnement
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </span>
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
            </button>
            <p className="mt-3 text-xs uppercase tracking-wide font-medium text-[var(--muted-foreground)]">
              Appel stratégique gratuit · 30 min · Sans engagement
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Ce programme est fait pour vous si… ── */}
      <section className="py-14 sm:py-16 border-t border-[var(--border)]">
        <div className="mx-auto max-w-3xl px-5 sm:px-6">
          <Reveal>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
              Ce programme est peut-être fait pour vous si…
            </h2>
          </Reveal>

          <div className="mt-8 space-y-3">
            {[
              "Vous voulez lancer votre premier business grâce à l'IA.",
              "Vous avez envie de créer une activité qui génère des revenus.",
              "Vous consommez beaucoup de contenu mais vous passez rarement à l'action.",
              "Vous cherchez un accompagnement pour construire un vrai système.",
              "Vous voulez aller beaucoup plus vite en évitant les erreurs.",
            ].map((text, i) => (
              <Reveal key={i} delay={i * 0.06}>
                <div className="flex items-start gap-3 py-3 px-4 rounded-xl border border-[var(--border)] bg-[var(--card)] transition-all hover:border-[var(--primary)]/20">
                  <div className="mt-0.5 w-5 h-5 rounded-full bg-[var(--primary)] text-white flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3" />
                  </div>
                  <p className="text-sm leading-relaxed text-[var(--foreground-soft)]">{text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Le problème ── */}
      <section className="py-14 sm:py-16 bg-[var(--noir)] text-white">
        <div className="mx-auto max-w-3xl px-5 sm:px-6">
          <Reveal>
            <p className="eyebrow text-[var(--bleu-ciel)] mb-4">Le problème</p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight leading-tight">
              Apprendre l'IA ne construit pas un business.
            </h2>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="mt-8 space-y-4 text-[15px] leading-relaxed text-white/60">
              <p>Vous regardez des vidéos.<br />Vous testez des outils.<br />Vous essayez des prompts.<br />Vous accumulez des connaissances.</p>
              <p className="text-white/80 font-medium text-base">Mais votre projet n'avance pas.</p>
              <p>Ce qui manque n'est pas un nouvel outil.</p>
              <p className="text-white font-semibold text-base">
                C'est une méthode. Un plan. Un accompagnement.<br />
                Et quelqu'un qui vous aide à exécuter.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Ce que nous construisons ensemble ── */}
      <section className="py-14 sm:py-16 border-t border-[var(--border)]">
        <div className="mx-auto max-w-3xl px-5 sm:px-6">
          <Reveal>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
              Ce que nous construisons ensemble
            </h2>
            <p className="mt-4 text-base text-[var(--muted-foreground)] leading-relaxed">
              Pendant cet accompagnement, nous travaillons ensemble pour construire votre activité. Concrètement, nous allons :
            </p>
          </Reveal>

          <Reveal delay={0.1}>
            <ul className="mt-6 space-y-2.5">
              {[
                "Définir votre positionnement",
                "Trouver une idée de business adaptée à votre profil",
                "Créer une offre qui répond à un vrai besoin",
                "Construire votre stratégie de contenu",
                "Mettre en place votre système d'acquisition",
                "Utiliser l'IA pour automatiser les tâches répétitives",
                "Créer vos premiers produits digitaux ou services",
                "Lancer votre activité",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-[var(--foreground-soft)]">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[var(--primary)] shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={0.2}>
            <p className="mt-8 text-base font-semibold text-[var(--foreground)]">
              Notre objectif n'est pas que vous connaissiez mieux l'IA.<br />
              Notre objectif est que vous construisiez un business.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── Notre méthode ── */}
      <section className="py-14 sm:py-16 bg-[var(--secondary)]">
        <div className="mx-auto max-w-5xl px-5 sm:px-6">
          <Reveal>
            <p className="eyebrow mb-3">Notre méthode</p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
              Nous avançons ensemble selon un parcours simple.
            </h2>
          </Reveal>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-[var(--border)] rounded-2xl overflow-hidden border border-[var(--border)]">
            {[
              { num: '01', title: 'Clarifier', items: ['Votre marché', 'Votre client', 'Votre offre', 'Votre promesse'] },
              { num: '02', title: 'Construire', items: ['Votre contenu', 'Vos outils', 'Vos automatisations', 'Votre système'] },
              { num: '03', title: 'Lancer', items: ['Votre acquisition', 'Vos ventes', 'Votre offre', 'Votre tunnel'] },
              { num: '04', title: 'Optimiser', items: ['Plus simple', 'Plus rentable', 'Plus efficace'] },
            ].map((step, i) => (
              <Reveal key={step.num} delay={i * 0.08}>
                <div className={`p-7 h-full flex flex-col gap-5 ${i === 3 ? 'bg-[var(--noir)] text-white' : 'bg-[var(--card)]'}`}>
                  <span className={`text-xs font-mono tracking-widest ${i === 3 ? 'text-[var(--bleu-ciel)]' : 'text-[var(--muted-foreground)]'}`}>
                    {step.num}
                  </span>
                  <div>
                    <h3 className={`text-lg font-bold mb-3 ${i === 3 ? 'text-white' : 'text-[var(--foreground)]'}`}>
                      {step.title}
                    </h3>
                    <ul className={`space-y-1.5 text-sm ${i === 3 ? 'text-white/50' : 'text-[var(--muted-foreground)]'}`}>
                      {step.items.map(it => (
                        <li key={it}>{it}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Vous repartez avec ── */}
      <section className="py-14 sm:py-16 border-t border-[var(--border)]">
        <div className="mx-auto max-w-3xl px-5 sm:px-6">
          <Reveal>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
              Vous repartez avec
            </h2>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                "Une offre claire",
                "Un positionnement",
                "Une stratégie de contenu",
                "Votre système d'acquisition",
                "Vos automatisations IA",
                "Votre feuille de route",
                "Les outils adaptés à votre business",
                "Un accompagnement personnalisé",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 py-3 px-4 rounded-xl border border-[var(--border)] bg-[var(--card)]">
                  <CheckCircle2 className="w-4 h-4 text-[var(--primary)] shrink-0" />
                  <span className="text-sm font-medium text-[var(--foreground)]">{item}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Ce programme n'est PAS fait pour vous si… ── */}
      <section className="py-14 sm:py-16 bg-[var(--secondary)]">
        <div className="mx-auto max-w-3xl px-5 sm:px-6">
          <Reveal>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
              Ce programme n'est <span className="text-red-500">PAS</span> fait pour vous si…
            </h2>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="mt-8 space-y-2.5">
              {[
                'Vous cherchez une méthode miracle.',
                "Vous voulez gagner de l'argent sans travailler.",
                'Vous souhaitez simplement apprendre ChatGPT.',
                "Vous n'êtes pas prêt à passer à l'action.",
              ].map((text, i) => (
                <div key={i} className="flex items-start gap-3 py-3 px-4 rounded-xl bg-red-50/60 border border-red-100/80">
                  <X className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                  <span className="text-sm text-[var(--foreground-soft)]">{text}</span>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.2}>
            <p className="mt-6 text-sm font-semibold text-[var(--foreground)]">
              Nous travaillons uniquement avec des personnes qui veulent réellement construire.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── Comment rejoindre ── */}
      <section className="py-14 sm:py-16 border-t border-[var(--border)]">
        <div className="mx-auto max-w-3xl px-5 sm:px-6">
          <Reveal>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
              Comment rejoindre l'accompagnement ?
            </h2>
          </Reveal>

          <div className="mt-8 space-y-6">
            {[
              { num: '1', title: 'Remplissez le formulaire de candidature', desc: 'Quelques questions pour comprendre votre situation et votre projet.' },
              { num: '2', title: 'Nous analysons votre projet', desc: 'Nous étudions chaque candidature individuellement.' },
              { num: '3', title: 'Appel stratégique', desc: 'Si votre profil correspond, nous vous invitons à un appel de 30 minutes.' },
              { num: '4', title: 'La suite adaptée à votre situation', desc: 'Accompagnement premium, Le Club IA, ou une prochaine étape — nous vous orientons vers la solution qui vous donnera le plus de chances de réussir.' },
            ].map((step, i) => (
              <Reveal key={i} delay={i * 0.08}>
                <div className="flex items-start gap-5">
                  <div className="w-9 h-9 rounded-xl bg-[var(--primary)] text-white flex items-center justify-center font-bold text-sm shrink-0">
                    {step.num}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[var(--foreground)]">{step.title}</h3>
                    <p className="text-sm text-[var(--muted-foreground)] mt-1 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Final ── */}
      <section className="py-16 sm:py-20 bg-[var(--noir)] text-white">
        <div className="mx-auto max-w-3xl px-5 sm:px-6 text-center">
          <Reveal>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight leading-tight">
              Candidatez à l'accompagnement
            </h2>
            <p className="mt-4 text-base text-white/50 max-w-xl mx-auto leading-relaxed">
              Notre objectif est de vous proposer la solution qui vous donnera le plus de chances de réussir.
            </p>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="mt-8">
              <button
                onClick={openForm}
                className="inline-flex items-center gap-3 px-8 py-4 bg-white text-[var(--noir)] rounded-2xl text-sm font-bold transition-all hover:bg-white/90 shadow-[0_0_40px_rgba(255,255,255,0.08)] cursor-pointer group"
              >
                Remplir le formulaire de candidature
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
              <p className="mt-4 text-xs text-white/30 uppercase tracking-wide font-medium">
                Places limitées · Profils sélectionnés
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 border-t border-[var(--border)] text-center">
        <p className="text-xs text-[var(--muted-foreground)]">
          © {new Date().getFullYear()} Le Club IA — Accompagnement Business Premium
        </p>
      </footer>

      {/* ── Form Modal ── */}
      <AnimatePresence>
        {showForm && <CandidatureModal onClose={() => setShowForm(false)} />}
      </AnimatePresence>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   Candidature Modal — 4 étapes
   ═══════════════════════════════════════════════════════════════════════ */

function CandidatureModal({ onClose }: { onClose: () => void }) {
  const TOTAL = 4
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const [f, setF] = useState({
    prenom: '',
    nom: '',
    email: '',
    telephone: '',
    pays: 'France',
    projet_type: 'Je veux lancer mon premier business.',
    projet_ia: '',
    projet_raison: '',
    projet_blocage: '',
    deja_essaie: false as boolean,
    deja_essaie_details: '',
    statut_actuel: 'Je pars de zéro.',
    heures_semaine: '5 à 10 h',
    objectif_12m: '',
    pret_investir: 'Oui',
    budget: '500 à 1 500 €',
    candidat_raison: '',
  })

  const set = (k: string, v: any) => setF(p => ({ ...p, [k]: v }))

  // Lock scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  // Escape to close
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape' && !submitted) onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose, submitted])

  const next = () => {
    if (step === 1) {
      if (!f.prenom.trim() || !f.nom.trim() || !f.email.trim() || !f.telephone.trim()) {
        toast.error('Veuillez remplir tous les champs.')
        return
      }
      if (!f.email.includes('@')) { toast.error('Email invalide.'); return }
    }
    if (step === 2) {
      if (!f.projet_ia.trim()) { toast.error('Décrivez ce que vous souhaitez construire.'); return }
      if (!f.projet_raison.trim()) { toast.error('Expliquez pourquoi maintenant.'); return }
      if (!f.projet_blocage.trim()) { toast.error('Quel est votre plus grand blocage ?'); return }
    }
    setStep(s => Math.min(s + 1, TOTAL))
  }

  const prev = () => setStep(s => Math.max(s - 1, 1))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!f.candidat_raison.trim()) {
      toast.error('Dites-nous pourquoi vous seriez un bon candidat.')
      return
    }
    setSubmitting(true)
    try {
      const { error } = await supabase.from('accompagnement_candidatures').insert([{
        nom: f.nom.trim(),
        prenom: f.prenom.trim(),
        email: f.email.trim().toLowerCase(),
        telephone: f.telephone.trim(),
        pays: f.pays.trim(),
        projet_type: f.projet_type,
        projet_ia: f.projet_ia.trim(),
        projet_raison: f.projet_raison.trim(),
        projet_blocage: f.projet_blocage.trim(),
        deja_essaie: f.deja_essaie,
        deja_essaie_details: f.deja_essaie_details.trim() || null,
        statut_actuel: f.statut_actuel,
        heures_semaine: f.heures_semaine,
        objectif_12m: f.objectif_12m.trim() || 'Non précisé',
        pret_investir: f.pret_investir,
        budget: f.budget,
        candidat_raison: f.candidat_raison.trim(),
        status: 'Nouveau',
      }])
      if (error) throw error
      setSubmitted(true)
      confetti({ particleCount: 70, spread: 50, origin: { y: 0.5 } })
      toast.success('Candidature envoyée !')
    } catch {
      toast.error('Erreur, veuillez réessayer.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[100] flex items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget && !submitted) onClose() }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 16 }}
        transition={{ duration: 0.35, ease: EASE }}
        className="relative z-10 w-full max-w-lg mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-[var(--border)]">
          <div>
            <h2 className="text-base font-bold text-[var(--foreground)]">
              {submitted ? 'Candidature envoyée' : 'Candidature à l\'accompagnement'}
            </h2>
            {!submitted && (
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                Étape {step}/{TOTAL}
              </p>
            )}
          </div>
          {!submitted && (
            <button onClick={onClose} className="w-8 h-8 rounded-lg bg-[var(--secondary)] hover:bg-[var(--border)] flex items-center justify-center transition-colors cursor-pointer">
              <X className="w-4 h-4 text-[var(--muted-foreground)]" />
            </button>
          )}
        </div>

        {/* Progress */}
        {!submitted && (
          <div className="px-6 pt-3">
            <div className="h-1 w-full rounded-full bg-[var(--secondary)] overflow-hidden">
              <motion.div
                className="h-full bg-[var(--primary)]"
                animate={{ width: `${(step / TOTAL) * 100}%` }}
                transition={{ duration: 0.3, ease: EASE }}
              />
            </div>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div
                key="done"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="pt-8 pb-4 flex flex-col items-center text-center"
              >
                {/* Success Icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
                  className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5"
                >
                  <CheckCircle2 className="w-8 h-8" />
                </motion.div>

                <h3 className="text-xl font-bold text-[var(--foreground)]">
                  Merci {f.prenom} !
                </h3>
                <p className="mt-2 text-sm text-[var(--muted-foreground)] leading-relaxed max-w-sm">
                  Votre candidature a bien été enregistrée.
                </p>

                {/* Next Steps */}
                <div className="mt-8 w-full space-y-3 text-left">
                  {[
                    { num: '1', text: 'Nous analysons votre candidature', done: true },
                    { num: '2', text: 'Réservez votre appel stratégique maintenant', active: true },
                    { num: '3', text: 'Échangeons ensemble pendant 30 min' },
                  ].map((s, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                        s.done
                          ? 'border-emerald-200 bg-emerald-50/50'
                          : (s as any).active
                            ? 'border-[var(--primary)] bg-[var(--primary)]/[0.04] ring-1 ring-[var(--primary)]/10'
                            : 'border-[var(--border)] bg-[var(--secondary)]/50'
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                        s.done
                          ? 'bg-emerald-500 text-white'
                          : (s as any).active
                            ? 'bg-[var(--primary)] text-white'
                            : 'bg-[var(--border)] text-[var(--muted-foreground)]'
                      }`}>
                        {s.done ? <Check className="w-3.5 h-3.5" /> : s.num}
                      </div>
                      <span className={`text-sm font-medium ${
                        (s as any).active ? 'text-[var(--foreground)]' : 'text-[var(--muted-foreground)]'
                      }`}>{s.text}</span>
                    </div>
                  ))}
                </div>

                {/* Primary CTA — Calendly */}
                <motion.a
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  href="https://calendly.com/ghislaintankeu6/nouvelle-reunion"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-8 w-full flex items-center justify-center gap-3 px-6 py-4 bg-[var(--primary)] hover:bg-[var(--primary-light)] text-white rounded-2xl text-base font-bold transition-all shadow-lg shadow-[var(--primary)]/20 group"
                >
                  <Calendar className="w-5 h-5" />
                  <span>Choisir mon créneau maintenant</span>
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </motion.a>

                <p className="mt-3 text-xs text-[var(--muted-foreground)]">
                  Appel gratuit · 30 min · Sans engagement
                </p>

                {/* Close */}
                <button
                  onClick={onClose}
                  className="mt-6 text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
                >
                  Fermer cette fenêtre
                </button>
              </motion.div>
            ) : (
              <form onSubmit={submit}>

                {/* ── Étape 1 : Informations ── */}
                {step === 1 && (
                  <motion.div key="s1" {...slideIn} className="pt-4 space-y-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">Vos informations</p>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Prénom" value={f.prenom} onChange={v => set('prenom', v)} placeholder="Votre prénom" required />
                      <Field label="Nom" value={f.nom} onChange={v => set('nom', v)} placeholder="Votre nom" required />
                    </div>
                    <Field label="Email" type="email" value={f.email} onChange={v => set('email', v)} placeholder="vous@email.com" required />
                    <Field label="Téléphone (WhatsApp)" type="tel" value={f.telephone} onChange={v => set('telephone', v)} placeholder="+33 6 12 34 56 78" required />
                    <Field label="Pays" value={f.pays} onChange={v => set('pays', v)} placeholder="France" />
                  </motion.div>
                )}

                {/* ── Étape 2 : Votre projet ── */}
                {step === 2 && (
                  <motion.div key="s2" {...slideIn} className="pt-4 space-y-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">Votre projet</p>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-[var(--foreground)]">Quel est votre projet aujourd'hui ?</label>
                      <div className="space-y-1.5">
                        {PROJET_TYPES.map(pt => (
                          <Pill key={pt} selected={f.projet_type === pt} onClick={() => set('projet_type', pt)} label={pt} />
                        ))}
                      </div>
                    </div>

                    <Textarea label="Que souhaitez-vous construire grâce à l'IA ?" value={f.projet_ia} onChange={v => set('projet_ia', v)} placeholder="Décrivez en quelques lignes…" required />
                    <Textarea label="Pourquoi souhaitez-vous lancer ce projet maintenant ?" value={f.projet_raison} onChange={v => set('projet_raison', v)} placeholder="Votre motivation principale…" required />
                    <Textarea label="Quel est aujourd'hui votre plus grand blocage ?" value={f.projet_blocage} onChange={v => set('projet_blocage', v)} placeholder="Ce qui vous empêche d'avancer…" required />
                  </motion.div>
                )}

                {/* ── Étape 3 : Votre situation ── */}
                {step === 3 && (
                  <motion.div key="s3" {...slideIn} className="pt-4 space-y-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">Votre situation</p>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-[var(--foreground)]">Avez-vous déjà essayé de lancer un business ?</label>
                      <div className="flex gap-2">
                        <Pill selected={f.deja_essaie === true} onClick={() => set('deja_essaie', true)} label="Oui" compact />
                        <Pill selected={f.deja_essaie === false} onClick={() => set('deja_essaie', false)} label="Non" compact />
                      </div>
                    </div>

                    {f.deja_essaie && (
                      <Textarea label="Expliquez-nous rapidement" value={f.deja_essaie_details} onChange={v => set('deja_essaie_details', v)} placeholder="Ce que vous avez tenté…" />
                    )}

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-[var(--foreground)]">Où en êtes-vous actuellement ?</label>
                      <div className="space-y-1.5">
                        {STATUTS.map(s => (
                          <Pill key={s} selected={f.statut_actuel === s} onClick={() => set('statut_actuel', s)} label={s} />
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-[var(--foreground)]">Heures disponibles par semaine</label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {HEURES.map(h => (
                          <Pill key={h} selected={f.heures_semaine === h} onClick={() => set('heures_semaine', h)} label={h} compact />
                        ))}
                      </div>
                    </div>

                    <Textarea label="Votre objectif dans les 12 prochains mois" value={f.objectif_12m} onChange={v => set('objectif_12m', v)} placeholder="Ce que vous voulez avoir accompli…" />
                  </motion.div>
                )}

                {/* ── Étape 4 : Engagement ── */}
                {step === 4 && (
                  <motion.div key="s4" {...slideIn} className="pt-4 space-y-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">Votre engagement</p>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-[var(--foreground)]">Êtes-vous prêt à investir dans un accompagnement ?</label>
                      <div className="flex gap-2">
                        {PRET_OPTIONS.map(p => (
                          <Pill key={p} selected={f.pret_investir === p} onClick={() => set('pret_investir', p)} label={p} compact />
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-[var(--foreground)]">Quel budget êtes-vous prêt à investir ?</label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {BUDGETS.map(b => (
                          <Pill key={b} selected={f.budget === b} onClick={() => set('budget', b)} label={b} compact />
                        ))}
                      </div>
                    </div>

                    <Textarea label="Pourquoi pensez-vous être un bon candidat ?" value={f.candidat_raison} onChange={v => set('candidat_raison', v)} placeholder="Ce qui fait que vous êtes prêt à passer à l'action…" required />
                  </motion.div>
                )}

                {/* Nav */}
                <div className="flex items-center justify-between pt-5 mt-5 border-t border-[var(--border)]">
                  {step > 1 ? (
                    <button type="button" onClick={prev} className="inline-flex items-center gap-1 px-4 py-2.5 bg-[var(--secondary)] hover:bg-[var(--border)] rounded-xl text-sm font-medium transition-colors cursor-pointer">
                      <ChevronLeft className="w-4 h-4" /> Retour
                    </button>
                  ) : <div />}

                  {step < TOTAL ? (
                    <button type="button" onClick={next} className="inline-flex items-center gap-1 px-5 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-light)] text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer">
                      Suivant <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--primary)] hover:bg-[var(--primary-light)] text-white rounded-xl text-sm font-bold transition-all cursor-pointer disabled:opacity-50">
                      {submitting ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Envoi…</>
                      ) : (
                        <>Envoyer ma candidature <ArrowRight className="w-4 h-4" /></>
                      )}
                    </button>
                  )}
                </div>
              </form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ─── Composants partagés ──────────────────────────────────────────── */

function Field({ label, value, onChange, placeholder, type = 'text', required = false }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; required?: boolean
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-semibold text-[var(--foreground)]">{label}</label>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} required={required}
        className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--secondary)] border border-[var(--border)] text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent focus:outline-none transition-all placeholder:text-[var(--muted-foreground)]"
      />
    </div>
  )
}

function Textarea({ label, value, onChange, placeholder, required = false }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-semibold text-[var(--foreground)]">{label}</label>
      <textarea
        rows={2} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} required={required}
        className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--secondary)] border border-[var(--border)] text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent focus:outline-none transition-all resize-none placeholder:text-[var(--muted-foreground)]"
      />
    </div>
  )
}

function Pill({ selected, onClick, label, compact = false }: {
  selected: boolean; onClick: () => void; label: string; compact?: boolean
}) {
  return (
    <button
      type="button" onClick={onClick}
      className={`${compact ? 'px-3 py-2 text-xs' : 'px-3.5 py-2.5 text-sm'} rounded-xl border text-left font-medium transition-all cursor-pointer flex items-center justify-between gap-2 ${
        selected
          ? 'border-[var(--primary)] bg-[var(--primary)]/[0.05] text-[var(--foreground)] ring-1 ring-[var(--primary)]/20'
          : 'border-[var(--border)] bg-[var(--card)] text-[var(--foreground-soft)] hover:border-[var(--primary)]/30'
      }`}
    >
      <span>{label}</span>
      {selected && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-4 h-4 rounded-full bg-[var(--primary)] text-white flex items-center justify-center shrink-0">
          <Check className="w-2.5 h-2.5" />
        </motion.div>
      )}
    </button>
  )
}
