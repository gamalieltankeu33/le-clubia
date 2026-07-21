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
   Typeform-style Candidature — full-screen, one question at a time
   ═══════════════════════════════════════════════════════════════════════ */

type QuestionType = 'text' | 'email' | 'tel' | 'textarea' | 'choice' | 'yesno'

interface Question {
  id: string
  label: string
  subtitle?: string
  type: QuestionType
  placeholder?: string
  options?: string[]
  required?: boolean
  /** If set, this question only shows when the condition is met */
  showIf?: (f: Record<string, any>) => boolean
}

const QUESTIONS: Question[] = [
  { id: 'prenom', label: 'Comment vous appelez-vous ?', subtitle: 'Votre prénom', type: 'text', placeholder: 'Votre prénom', required: true },
  { id: 'nom', label: 'Et votre nom de famille ?', type: 'text', placeholder: 'Votre nom', required: true },
  { id: 'email', label: 'Votre adresse email', subtitle: 'Pour vous recontacter', type: 'email', placeholder: 'vous@email.com', required: true },
  { id: 'telephone', label: 'Votre numéro de téléphone', subtitle: 'WhatsApp de préférence', type: 'tel', placeholder: '+33 6 12 34 56 78', required: true },
  { id: 'pays', label: 'Dans quel pays êtes-vous ?', type: 'text', placeholder: 'France' },
  {
    id: 'projet_type',
    label: 'Quel est votre projet aujourd\'hui ?',
    type: 'choice',
    options: [
      'Je veux lancer mon premier business.',
      "J'ai déjà un business.",
      'Je suis salarié.',
      'Je suis freelance.',
      'Autre.',
    ],
  },
  { id: 'projet_ia', label: 'Que souhaitez-vous construire grâce à l\'IA ?', type: 'textarea', placeholder: 'Décrivez en quelques lignes votre idée ou votre projet…', required: true },
  { id: 'projet_raison', label: 'Pourquoi souhaitez-vous lancer ce projet maintenant ?', type: 'textarea', placeholder: 'Votre motivation principale…', required: true },
  { id: 'projet_blocage', label: 'Quel est aujourd\'hui votre plus grand blocage ?', type: 'textarea', placeholder: 'Ce qui vous empêche d\'avancer…', required: true },
  {
    id: 'deja_essaie',
    label: 'Avez-vous déjà essayé de lancer un business ?',
    type: 'yesno',
  },
  {
    id: 'deja_essaie_details',
    label: 'Expliquez-nous rapidement.',
    subtitle: 'Ce que vous avez tenté',
    type: 'textarea',
    placeholder: 'Décrivez brièvement votre expérience…',
    showIf: (f) => f.deja_essaie === true,
  },
  {
    id: 'statut_actuel',
    label: 'Où en êtes-vous actuellement ?',
    type: 'choice',
    options: ['Je pars de zéro.', "J'ai une idée.", "J'ai commencé.", "J'ai déjà des clients."],
  },
  {
    id: 'heures_semaine',
    label: 'Combien d\'heures pouvez-vous consacrer chaque semaine ?',
    type: 'choice',
    options: ['Moins de 5 h', '5 à 10 h', '10 à 20 h', 'Plus de 20 h'],
  },
  { id: 'objectif_12m', label: 'Quel est votre objectif dans les 12 prochains mois ?', type: 'textarea', placeholder: 'Ce que vous voulez avoir accompli…' },
  {
    id: 'pret_investir',
    label: 'Si nous pouvons vous aider, êtes-vous prêt à investir dans un accompagnement ?',
    type: 'choice',
    options: ['Oui', 'Peut-être', 'Non'],
  },
  {
    id: 'budget',
    label: 'Quel budget êtes-vous prêt à investir ?',
    type: 'choice',
    options: ['Moins de 500 €', '500 à 1 500 €', '1 500 à 3 000 €', 'Plus de 3 000 €'],
  },
  { id: 'candidat_raison', label: 'Pourquoi pensez-vous être un bon candidat pour cet accompagnement ?', type: 'textarea', placeholder: 'Ce qui fait que vous êtes prêt à passer à l\'action…', required: true },
]

function CandidatureModal({ onClose }: { onClose: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [direction, setDirection] = useState(1) // 1 = forward, -1 = backward
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  const [f, setF] = useState<Record<string, any>>({
    prenom: '',
    nom: '',
    email: '',
    telephone: '',
    pays: 'France',
    projet_type: 'Je veux lancer mon premier business.',
    projet_ia: '',
    projet_raison: '',
    projet_blocage: '',
    deja_essaie: false,
    deja_essaie_details: '',
    statut_actuel: 'Je pars de zéro.',
    heures_semaine: '5 à 10 h',
    objectif_12m: '',
    pret_investir: 'Oui',
    budget: '500 à 1 500 €',
    candidat_raison: '',
  })

  // Filter out conditional questions that shouldn't be shown
  const visibleQuestions = QUESTIONS.filter(q => !q.showIf || q.showIf(f))
  const totalVisible = visibleQuestions.length
  const current = visibleQuestions[currentIndex]
  const isLast = currentIndex === totalVisible - 1
  const progress = ((currentIndex) / totalVisible) * 100

  const set = (k: string, v: any) => setF(p => ({ ...p, [k]: v }))

  // Lock scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  // Auto-focus input on step change
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus()
    }, 400)
    return () => clearTimeout(timer)
  }, [currentIndex])

  // Validate current question
  const validate = (): boolean => {
    if (!current) return true
    const val = f[current.id]

    if (current.type === 'email' && val && !String(val).includes('@')) {
      toast.error('Adresse email invalide.')
      return false
    }
    if (current.required && (val === '' || val === undefined || val === null)) {
      toast.error('Ce champ est requis.')
      return false
    }
    return true
  }

  const goNext = () => {
    if (!validate()) return

    if (isLast) {
      handleSubmit()
      return
    }

    setDirection(1)
    // Find next visible index
    let nextIdx = currentIndex + 1
    while (nextIdx < totalVisible) {
      const q = visibleQuestions[nextIdx]
      if (!q.showIf || q.showIf(f)) break
      nextIdx++
    }
    setCurrentIndex(Math.min(nextIdx, totalVisible - 1))
  }

  const goPrev = () => {
    if (currentIndex === 0) return
    setDirection(-1)
    setCurrentIndex(prev => Math.max(prev - 1, 0))
  }

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitted) onClose()
      if (e.key === 'Enter' && !e.shiftKey && current?.type !== 'textarea') {
        e.preventDefault()
        goNext()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [currentIndex, f, submitted])

  const handleSubmit = async () => {
    if (!f.candidat_raison?.trim()) {
      toast.error('Dites-nous pourquoi vous seriez un bon candidat.')
      return
    }
    setSubmitting(true)
    try {
      const { error } = await supabase.from('accompagnement_candidatures').insert([{
        nom: String(f.nom).trim(),
        prenom: String(f.prenom).trim(),
        email: String(f.email).trim().toLowerCase(),
        telephone: String(f.telephone).trim(),
        pays: String(f.pays).trim() || 'Non précisé',
        projet_type: f.projet_type,
        projet_ia: String(f.projet_ia).trim(),
        projet_raison: String(f.projet_raison).trim(),
        projet_blocage: String(f.projet_blocage).trim(),
        deja_essaie: f.deja_essaie,
        deja_essaie_details: String(f.deja_essaie_details).trim() || null,
        statut_actuel: f.statut_actuel,
        heures_semaine: f.heures_semaine,
        objectif_12m: String(f.objectif_12m).trim() || 'Non précisé',
        pret_investir: f.pret_investir,
        budget: f.budget,
        candidat_raison: String(f.candidat_raison).trim(),
        status: 'Nouveau',
      }])
      if (error) throw error
      setSubmitted(true)
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.5 } })
    } catch {
      toast.error('Erreur, veuillez réessayer.')
    } finally {
      setSubmitting(false)
    }
  }

  // Animation variants
  const variants = {
    enter: (d: number) => ({ y: d > 0 ? 60 : -60, opacity: 0 }),
    center: { y: 0, opacity: 1 },
    exit: (d: number) => ({ y: d > 0 ? -60 : 60, opacity: 0 }),
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-white flex flex-col"
    >
      {/* ── Top bar ── */}
      <div className="shrink-0 px-5 sm:px-8 pt-5 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <BrandLogo size="sm" asLink={false} />
          {!submitted && (
            <span className="text-xs font-mono text-[var(--muted-foreground)] tracking-wide">
              {currentIndex + 1} / {totalVisible}
            </span>
          )}
        </div>
        {!submitted && (
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-[var(--secondary)] hover:bg-[var(--border)] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 text-[var(--muted-foreground)]" />
          </button>
        )}
      </div>

      {/* ── Progress bar ── */}
      {!submitted && (
        <div className="shrink-0 h-1 bg-[var(--secondary)] relative">
          <motion.div
            className="absolute inset-y-0 left-0 bg-[var(--primary)]"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: EASE }}
          />
        </div>
      )}

      {/* ── Main content ── */}
      <div className="flex-1 flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          {submitted ? (
            /* ── Success Screen ── */
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: EASE }}
              className="w-full max-w-md px-6 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.2 }}
                className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-8"
              >
                <CheckCircle2 className="w-10 h-10" />
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--foreground)]"
              >
                Merci {f.prenom} !
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-4 text-base text-[var(--muted-foreground)] leading-relaxed"
              >
                Votre candidature a été enregistrée.<br />
                L'étape suivante : réservez votre appel stratégique.
              </motion.p>

              <motion.a
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
                href="https://calendly.com/ghislaintankeu6/nouvelle-reunion"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-10 w-full flex items-center justify-center gap-3 px-8 py-5 bg-[var(--primary)] hover:bg-[var(--primary-light)] text-white rounded-2xl text-lg font-bold transition-all shadow-lg shadow-[var(--primary)]/20 group"
              >
                <Calendar className="w-6 h-6" />
                <span>Choisir mon créneau</span>
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </motion.a>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="mt-4 text-xs text-[var(--muted-foreground)]"
              >
                Appel gratuit · 30 min · Sans engagement
              </motion.p>

              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                onClick={onClose}
                className="mt-8 text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
              >
                Fermer
              </motion.button>
            </motion.div>
          ) : current ? (
            /* ── Question Screen ── */
            <motion.div
              key={current.id}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: EASE }}
              className="w-full max-w-xl px-6 sm:px-8"
            >
              {/* Question */}
              <p className="text-xs font-mono text-[var(--primary)] tracking-wider uppercase mb-4">
                Question {currentIndex + 1}
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)] leading-snug">
                {current.label}
              </h2>
              {current.subtitle && (
                <p className="mt-2 text-sm text-[var(--muted-foreground)]">{current.subtitle}</p>
              )}

              {/* Input area */}
              <div className="mt-8">
                {/* Text / Email / Tel */}
                {(current.type === 'text' || current.type === 'email' || current.type === 'tel') && (
                  <input
                    ref={inputRef as React.RefObject<HTMLInputElement>}
                    type={current.type}
                    value={f[current.id] || ''}
                    onChange={e => set(current.id, e.target.value)}
                    placeholder={current.placeholder}
                    className="w-full bg-transparent border-b-2 border-[var(--border)] focus:border-[var(--primary)] text-xl sm:text-2xl font-medium py-3 outline-none transition-colors placeholder:text-[var(--muted-foreground)]/40"
                    autoFocus
                  />
                )}

                {/* Textarea */}
                {current.type === 'textarea' && (
                  <textarea
                    ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                    rows={3}
                    value={f[current.id] || ''}
                    onChange={e => set(current.id, e.target.value)}
                    placeholder={current.placeholder}
                    className="w-full bg-transparent border-b-2 border-[var(--border)] focus:border-[var(--primary)] text-lg font-medium py-3 outline-none transition-colors resize-none placeholder:text-[var(--muted-foreground)]/40"
                    autoFocus
                  />
                )}

                {/* Choice */}
                {current.type === 'choice' && current.options && (
                  <div className="space-y-2">
                    {current.options.map((opt, i) => {
                      const isSelected = f[current.id] === opt
                      const letter = String.fromCharCode(65 + i) // A, B, C, D...
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            set(current.id, opt)
                            // Auto-advance after a short delay on choice
                            setTimeout(() => {
                              setDirection(1)
                              setCurrentIndex(prev => Math.min(prev + 1, totalVisible - 1))
                            }, 300)
                          }}
                          className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl border-2 text-left transition-all cursor-pointer group ${
                            isSelected
                              ? 'border-[var(--primary)] bg-[var(--primary)]/[0.04]'
                              : 'border-[var(--border)] hover:border-[var(--primary)]/30 bg-transparent'
                          }`}
                        >
                          <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 transition-all ${
                            isSelected
                              ? 'bg-[var(--primary)] text-white'
                              : 'bg-[var(--secondary)] text-[var(--muted-foreground)] group-hover:bg-[var(--primary)]/10'
                          }`}>
                            {isSelected ? <Check className="w-4 h-4" /> : letter}
                          </span>
                          <span className={`text-base font-medium ${
                            isSelected ? 'text-[var(--foreground)]' : 'text-[var(--foreground-soft)]'
                          }`}>{opt}</span>
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* Yes/No */}
                {current.type === 'yesno' && (
                  <div className="flex gap-3">
                    {[
                      { label: 'Oui', value: true },
                      { label: 'Non', value: false },
                    ].map(opt => {
                      const isSelected = f[current.id] === opt.value
                      return (
                        <button
                          key={opt.label}
                          type="button"
                          onClick={() => {
                            set(current.id, opt.value)
                            setTimeout(() => {
                              setDirection(1)
                              setCurrentIndex(prev => Math.min(prev + 1, totalVisible - 1))
                            }, 300)
                          }}
                          className={`flex-1 flex items-center justify-center gap-3 px-6 py-5 rounded-xl border-2 text-lg font-bold transition-all cursor-pointer ${
                            isSelected
                              ? 'border-[var(--primary)] bg-[var(--primary)]/[0.04] text-[var(--foreground)]'
                              : 'border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--primary)]/30'
                          }`}
                        >
                          <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 transition-all ${
                            isSelected ? 'bg-[var(--primary)] text-white' : 'bg-[var(--secondary)]'
                          }`}>
                            {isSelected ? <Check className="w-4 h-4" /> : opt.label[0]}
                          </span>
                          {opt.label}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Navigation */}
              {current.type !== 'choice' && current.type !== 'yesno' && (
                <div className="mt-8 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={goNext}
                    disabled={submitting}
                    className="inline-flex items-center gap-2 px-7 py-3.5 bg-[var(--primary)] hover:bg-[var(--primary-light)] text-white rounded-xl text-sm font-bold transition-all cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Envoi…</>
                    ) : isLast ? (
                      <>Envoyer ma candidature <ArrowRight className="w-4 h-4" /></>
                    ) : (
                      <>Continuer <ChevronRight className="w-4 h-4" /></>
                    )}
                  </button>

                  {current.type !== 'textarea' && (
                    <span className="text-xs text-[var(--muted-foreground)]">
                      ou appuyez sur <kbd className="px-1.5 py-0.5 rounded bg-[var(--secondary)] border border-[var(--border)] font-mono text-[10px]">Entrée ↵</kbd>
                    </span>
                  )}
                </div>
              )}

              {/* Choice/YesNo also get a continue button for last step or if already selected */}
              {(current.type === 'choice' || current.type === 'yesno') && isLast && (
                <div className="mt-8">
                  <button
                    type="button"
                    onClick={goNext}
                    disabled={submitting}
                    className="inline-flex items-center gap-2 px-7 py-3.5 bg-[var(--primary)] hover:bg-[var(--primary-light)] text-white rounded-xl text-sm font-bold transition-all cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Envoi…</>
                    ) : (
                      <>Envoyer ma candidature <ArrowRight className="w-4 h-4" /></>
                    )}
                  </button>
                </div>
              )}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* ── Bottom nav ── */}
      {!submitted && (
        <div className="shrink-0 px-5 sm:px-8 py-4 border-t border-[var(--border)] flex items-center justify-between">
          <button
            type="button"
            onClick={goPrev}
            disabled={currentIndex === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer disabled:opacity-30 hover:bg-[var(--secondary)]"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Précédent</span>
          </button>

          <div className="flex items-center gap-1">
            {visibleQuestions.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentIndex
                    ? 'w-6 bg-[var(--primary)]'
                    : i < currentIndex
                      ? 'w-1.5 bg-[var(--primary)]/40'
                      : 'w-1.5 bg-[var(--border)]'
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={goNext}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer hover:bg-[var(--secondary)]"
          >
            <span className="hidden sm:inline">{isLast ? 'Envoyer' : 'Suivant'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </motion.div>
  )
}

