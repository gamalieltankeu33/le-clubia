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
  MessageSquare,
  TrendingUp,
  Award,
  Sparkles,
  Mail,
  ShieldCheck,
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
              Lancer le diagnostic
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
            Diagnostic Business IA
          </motion.p>

          <motion.h1 {...fadeUp(0.12)} className="font-display text-[2.2rem] sm:text-4xl lg:text-5xl font-bold leading-[1.05] tracking-tight">
            Découvrez votre potentiel business{' '}
            <span className="serif-accent">grâce à l'IA.</span>
          </motion.h1>

          <motion.div {...fadeUp(0.22)} className="mt-6 space-y-4 text-base sm:text-lg leading-relaxed text-[var(--muted-foreground)]">
            <p>
              Évaluez vos compétences, vos objectifs et votre préparation entrepreneuriale en 3 minutes.
            </p>
            <p>
              Ce diagnostic rapide et interactif analyse votre psychologie d'entrepreneur, détermine votre score d'éligibilité et vous fournit un plan d'action personnalisé envoyé directement par e-mail.
            </p>
            <p className="text-[var(--foreground)] font-medium">
              Notre objectif est d'identifier si vous êtes prêt à lancer un business sérieux grâce à l'IA et de vous proposer la meilleure orientation.
            </p>
          </motion.div>

          <motion.div {...fadeUp(0.35)} className="mt-8">
            <button
              onClick={openForm}
              className="cta-black cta-black-xl group relative overflow-hidden px-8 py-4 cursor-pointer"
            >
              <span className="relative z-10 flex items-center gap-2">
                Lancer mon diagnostic IA
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </span>
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
            </button>
            <p className="mt-3 text-xs uppercase tracking-wide font-medium text-[var(--muted-foreground)]">
              Diagnostic 100% gratuit · Analyse instantanée · Rapport envoyé par mail
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Ce diagnostic est fait pour vous si… ── */}
      <section className="py-14 sm:py-16 border-t border-[var(--border)]">
        <div className="mx-auto max-w-3xl px-5 sm:px-6">
          <Reveal>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
              Ce diagnostic gratuit est fait pour vous si…
            </h2>
          </Reveal>

          <div className="mt-8 space-y-3">
            {[
              "Vous voulez valider la viabilité de votre idée de business grâce à l'IA.",
              "Vous souhaitez comprendre vos blocages actuels pour passer à l'action.",
              "Vous cherchez à savoir si vous êtes éligible à un accompagnement sur-mesure.",
              "Vous voulez obtenir une note précise sur votre profil psychologique d'entrepreneur.",
              "Vous cherchez un plan clair et structuré pour lancer votre activité.",
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
              Si vous êtes qualifié(e) : Ce que nous construisons ensemble
            </h2>
            <p className="mt-4 text-base text-[var(--muted-foreground)] leading-relaxed">
              Pour les profils les plus sérieux détectés par le diagnostic, nous proposons un accompagnement premium où nous travaillons ensemble pour construire votre activité. Concrètement, nous allons :
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

      {/* ── Comment fonctionne le diagnostic ? ── */}
      <section className="py-14 sm:py-16 border-t border-[var(--border)]">
        <div className="mx-auto max-w-3xl px-5 sm:px-6">
          <Reveal>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
              Comment fonctionne le diagnostic ?
            </h2>
          </Reveal>

          <div className="mt-8 space-y-6">
            {[
              { num: '1', title: 'Répondez au diagnostic en ligne', desc: '11 questions simples à choix multiples pour analyser votre profil en 3 minutes.' },
              { num: '2', title: 'Obtenez votre score instantanément', desc: 'Une note sur 20 et une évaluation de votre maturité entrepreneuriale s\'affichent.' },
              { num: '3', title: 'Rapport complet par e-mail', desc: 'Nous vous envoyons vos forces, axes d\'amélioration et recommandations personnalisées.' },
              { num: '4', title: 'Accompagnement (Profils Cibles)', desc: 'Si vos résultats indiquent un profil sérieux et éligible, vous débloquerez un lien de discussion direct sur WhatsApp.' },
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
              Découvrez votre score Business IA dès maintenant
            </h2>
            <p className="mt-4 text-base text-white/50 max-w-xl mx-auto leading-relaxed">
              Ne restez pas dans le doute. Évaluez votre profil et recevez vos recommandations personnalisées.
            </p>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="mt-8">
              <button
                onClick={openForm}
                className="inline-flex items-center gap-3 px-8 py-4 bg-white text-[var(--noir)] rounded-2xl text-sm font-bold transition-all hover:bg-white/90 shadow-[0_0_40px_rgba(255,255,255,0.08)] cursor-pointer group"
              >
                Lancer mon diagnostic gratuit
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
              <p className="mt-4 text-xs text-white/30 uppercase tracking-wide font-medium">
                Analyse IA instantanée · Rapport complet par mail
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 border-t border-[var(--border)] text-center">
        <p className="text-xs text-[var(--muted-foreground)]">
          © {new Date().getFullYear()} Le Club IA — Diagnostic & Accompagnement
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

/* ═══════════════════════════════════════════════════════════════════════
   Sleek Diagnostic Wizard — full-screen, choice-based, AI-evaluated
   ═══════════════════════════════════════════════════════════════════════ */

type QuestionType = 'text' | 'email' | 'tel' | 'choice'

interface Question {
  id: string
  label: string
  subtitle?: string
  type: QuestionType
  placeholder?: string
  options?: string[]
  required?: boolean
}

const QUESTIONS: Question[] = [
  { id: 'prenom', label: 'Quel est votre prénom ?', type: 'text', placeholder: 'Votre prénom', required: true },
  { id: 'nom', label: 'Quel est votre nom de famille ?', type: 'text', placeholder: 'Votre nom', required: true },
  { id: 'email', label: 'Quelle est votre adresse email ?', subtitle: 'Pour vous envoyer le rapport d\'analyse complet', type: 'email', placeholder: 'vous@email.com', required: true },
  { id: 'telephone', label: 'Votre numéro de téléphone (WhatsApp)', subtitle: 'Pour échanger en direct si votre profil est qualifié', type: 'tel', placeholder: '+33 6 12 34 56 78', required: true },
  { id: 'pays', label: 'Dans quel pays résidez-vous ?', subtitle: 'Exemple : France, Canada, Belgique...', type: 'text', placeholder: 'France', required: true },
  {
    id: 'experience',
    label: 'Quelle est votre expérience actuelle en business ?',
    type: 'choice',
    options: [
      'Je pars de zéro (jamais lancé de business).',
      "J'ai déjà essayé mais sans grand succès.",
      'Je suis freelance ou salarié et je veux me lancer.',
      "J'ai déjà un business actif et je veux l'accélérer."
    ]
  },
  {
    id: 'motivation',
    label: 'Pourquoi souhaitez-vous lancer ce business maintenant ?',
    type: 'choice',
    options: [
      'Créer une vraie liberté géographique et financière.',
      'Automatiser des tâches répétitives et gagner du temps.',
      "Explorer l'IA par simple curiosité.",
      'Gagner beaucoup d\'argent rapidement sans trop d\'efforts.'
    ]
  },
  {
    id: 'temps',
    label: 'Combien d\'heures par semaine pouvez-vous y consacrer ?',
    type: 'choice',
    options: [
      'Moins de 5 heures par semaine.',
      '5 à 10 heures par semaine.',
      '10 à 20 heures par semaine.',
      'Plus de 20 heures par semaine (Investissement maximal).'
    ]
  },
  {
    id: 'budget',
    label: 'Quel budget êtes-vous prêt à investir pour lancer votre business ?',
    type: 'choice',
    options: [
      'Moins de 500 €.',
      '500 à 1 500 €.',
      '1 500 à 3 000 €.',
      'Plus de 3 000 €.'
    ]
  },
  {
    id: 'autonomie',
    label: 'Face à un problème technique ou un blocage, que faites-vous ?',
    type: 'choice',
    options: [
      "Je cherche des solutions par moi-même et j'avance.",
      "J'abandonne rapidement ou je remets à plus tard.",
      "Je préfère qu'on fasse le travail à ma place."
    ]
  },
  {
    id: 'projet_type',
    label: 'Quel type d\'activité souhaitez-vous créer grâce à l\'IA ?',
    type: 'choice',
    options: [
      'Agence de services IA / Conseil Freelance.',
      'Création de produits digitaux / Formations.',
      'E-commerce ou application SaaS avec IA.',
      'Je n\'ai pas encore d\'idée claire.'
    ]
  }
]

function CircularScore({ score, color }: { score: number; color: string }) {
  const percentage = (score / 20) * 100
  const radius = 54
  const strokeWidth = 8
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div className="relative flex items-center justify-center w-36 h-36 mx-auto">
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx="72"
          cy="72"
          r={radius}
          stroke="var(--secondary)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <motion.circle
          cx="72"
          cy="72"
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-3xl font-extrabold tracking-tighter" style={{ color }}>
          {score}
        </span>
        <span className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider mt-0.5">
          Sur 20
        </span>
      </div>
    </div>
  )
}

function CandidatureModal({ onClose }: { onClose: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [direction, setDirection] = useState(1)
  const inputRef = useRef<HTMLInputElement>(null)

  const [f, setF] = useState<Record<string, string>>({
    prenom: '',
    nom: '',
    email: '',
    telephone: '',
    pays: '',
    experience: '',
    motivation: '',
    temps: '',
    budget: '',
    autonomie: '',
    projet_type: '',
  })

  const totalVisible = QUESTIONS.length
  const current = QUESTIONS[currentIndex]
  const isLast = currentIndex === totalVisible - 1
  const progress = ((currentIndex) / totalVisible) * 100

  const set = (k: string, v: string) => setF(p => ({ ...p, [k]: v }))

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus()
    }, 400)
    return () => clearTimeout(timer)
  }, [currentIndex])

  const validate = (): boolean => {
    if (!current) return true
    const val = f[current.id]

    if (current.type === 'email' && val && !String(val).includes('@')) {
      toast.error('Adresse email invalide.')
      return false
    }
    if (current.required && (!val || val.trim() === '')) {
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
    setCurrentIndex(prev => Math.min(prev + 1, totalVisible - 1))
  }

  const goPrev = () => {
    if (currentIndex === 0) return
    setDirection(-1)
    setCurrentIndex(prev => Math.max(prev - 1, 0))
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitted) onClose()
      if (e.key === 'Enter' && !e.shiftKey && current?.type !== 'choice') {
        e.preventDefault()
        goNext()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [currentIndex, f, submitted])

  const handleSubmit = async () => {
    // Final validation
    for (const q of QUESTIONS) {
      if (q.required && (!f[q.id] || f[q.id].trim() === '')) {
        toast.error(`Le champ "${q.label}" est requis.`);
        return
      }
    }

    setSubmitting(true)
    try {
      const { data, error } = await supabase.functions.invoke('submit-diagnostic', {
        body: {
          prenom: f.prenom,
          nom: f.nom,
          email: f.email,
          telephone: f.telephone,
          pays: f.pays,
          experience: f.experience,
          motivation: f.motivation,
          temps: f.temps,
          budget: f.budget,
          autonomie: f.autonomie,
          projet_type: f.projet_type,
        }
      })

      if (error || !data || !data.ok) {
        throw new Error(error?.message || 'Erreur lors de la soumission')
      }

      setResult(data)
      setSubmitted(true)
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.5 } })
    } catch (err: any) {
      console.error(err)
      toast.error('Une erreur est survenue lors du calcul de votre diagnostic. Réessayez.')
    } finally {
      setSubmitting(false)
    }
  }

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
      className="fixed inset-0 z-[100] bg-[var(--background)] flex flex-col font-sans"
    >
      {/* Top bar */}
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

      {/* Progress bar */}
      {!submitted && (
        <div className="shrink-0 h-1 bg-[var(--secondary)] relative">
          <motion.div
            className="absolute inset-y-0 left-0 bg-[var(--primary)]"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center overflow-y-auto px-4 py-8">
        <AnimatePresence mode="wait" custom={direction}>
          {submitted && result ? (
            /* ── SUCCESS RESULTS SCREEN ── */
            <motion.div
              key="results"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-2xl bg-[var(--card)] border border-[var(--border)]/60 rounded-3xl p-6 sm:p-10 shadow-xl space-y-8"
            >
              {/* Header Title */}
              <div className="text-center space-y-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--secondary)] border border-[var(--border)]">
                  <Sparkles className="w-3.5 h-3.5 text-[var(--primary)]" />
                  Diagnostic Analyse Terminé
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--foreground)]">
                  Résultats de {f.prenom}
                </h2>
              </div>

              {/* Score and status card */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-center p-6 rounded-2xl bg-[var(--secondary)]/40 border border-[var(--border)]/50">
                <div className="md:col-span-2 text-center">
                  <CircularScore score={result.score} color={result.profileColor} />
                </div>
                <div className="md:col-span-3 space-y-3 text-center md:text-left">
                  <div className="flex flex-col md:flex-row items-center gap-2">
                    <span
                      className="px-3.5 py-1 rounded-lg text-xs font-bold text-white uppercase tracking-wider"
                      style={{ backgroundColor: result.profileColor }}
                    >
                      {result.profileTitle}
                    </span>
                    {result.isWestern && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                        <ShieldCheck className="w-3.5 h-3.5" /> Zone Occidentale
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold flex items-center justify-center md:justify-start gap-1.5 text-[var(--foreground)]">
                    <Award className="w-5 h-5 text-[var(--primary)]" /> Profil Évalué par IA
                  </h3>
                  <p className="text-sm text-[var(--foreground-soft)] leading-relaxed">
                    {result.evaluation}
                  </p>
                </div>
              </div>

              {/* Recommendations */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-[var(--foreground)] uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-[var(--primary)]" /> Recommandations Personnalisées
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  {result.recommendations?.map((rec: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-3 p-4 rounded-xl bg-[var(--card)] border border-[var(--border)] hover:border-[var(--primary)]/20 transition-all">
                      <div className="w-6 h-6 rounded-full bg-[var(--secondary)] text-[var(--primary)] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <p className="text-sm text-[var(--foreground-soft)] leading-relaxed">
                        {rec}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notification note */}
              <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-50/50 border border-blue-100 text-blue-700">
                <Mail className="w-5 h-5 shrink-0" />
                <p className="text-xs font-medium">
                  Le rapport complet de votre diagnostic IA ainsi que votre feuille de route ont été envoyés à l'adresse <strong>{f.email}</strong>.
                </p>
              </div>

              {/* ACTION CARD (WhatsApp vs Community) */}
              <div className="p-6 sm:p-8 rounded-2xl bg-zinc-950 text-white text-center space-y-6">
                {result.qualified ? (
                  <>
                    <div className="space-y-2">
                      <h4 className="text-xl font-bold text-[var(--bleu-ciel)] flex items-center justify-center gap-2">
                        💬 Discuter d'un accompagnement
                      </h4>
                      <p className="text-sm text-zinc-400 max-w-lg mx-auto leading-relaxed">
                        Si tu souhaites discuter d'un accompagnement avec moi pour lancer ton business en ligne grâce à l'IA, clique ci-dessous pour qu'on en parle en direct sur WhatsApp. Nous verrons ensemble s'il est possible qu'on travaille ensemble (je te le dirai si ce n'est pas possible).
                      </p>
                    </div>
                    <a
                      href={`https://wa.me/33744125798?text=${encodeURIComponent(`Bonjour Ghislain, je viens de passer le diagnostic IA (Mon score : ${result.score}/20). J'aimerais échanger sur mon projet d'accompagnement.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-8 py-4 bg-[#25D366] hover:bg-[#1FAA50] text-white rounded-xl text-base font-bold transition-all shadow-[0_8px_20px_rgba(37,211,102,0.25)] hover:scale-[1.02] cursor-pointer"
                    >
                      <MessageSquare className="w-5 h-5" />
                      <span>Discuter sur WhatsApp</span>
                    </a>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <h4 className="text-xl font-bold text-zinc-200">
                        🌱 Prochaine étape conseillée
                      </h4>
                      <p className="text-sm text-zinc-400 max-w-lg mx-auto leading-relaxed">
                        Pour progresser à votre rythme et développer vos compétences sans investissement premium, nous vous recommandons de rejoindre la communauté Le Club IA.
                      </p>
                    </div>
                    <Link
                      to="/"
                      className="inline-flex items-center gap-2 px-8 py-4 bg-white text-zinc-950 hover:bg-zinc-100 rounded-xl text-base font-bold transition-all hover:scale-[1.02] cursor-pointer"
                    >
                      <span>Découvrir la communauté</span>
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                  </>
                )}
              </div>

              <div className="text-center pt-2">
                <button
                  onClick={onClose}
                  className="text-sm font-semibold text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
                >
                  Fermer le diagnostic
                </button>
              </div>
            </motion.div>
          ) : current ? (
            /* ── QUESTION WIZARD SCREEN ── */
            <motion.div
              key={current.id}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="w-full max-w-xl px-4"
            >
              <p className="text-xs font-mono text-[var(--primary)] tracking-widest uppercase mb-3">
                Étape {currentIndex + 1} sur {totalVisible}
              </p>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--foreground)] leading-snug">
                {current.label}
              </h2>
              {current.subtitle && (
                <p className="mt-2 text-sm text-[var(--muted-foreground)]">{current.subtitle}</p>
              )}

              {/* Input section */}
              <div className="mt-8">
                {/* Standard inputs */}
                {(current.type === 'text' || current.type === 'email' || current.type === 'tel') && (
                  <input
                    ref={inputRef}
                    type={current.type}
                    value={f[current.id] || ''}
                    onChange={e => set(current.id, e.target.value)}
                    placeholder={current.placeholder}
                    className="w-full bg-transparent border-b-2 border-[var(--border)] focus:border-[var(--primary)] text-xl sm:text-2xl font-semibold py-3 outline-none transition-colors placeholder:text-[var(--muted-foreground)]/30"
                    autoFocus
                  />
                )}

                {/* Multiple choice visual cards */}
                {current.type === 'choice' && current.options && (
                  <div className="grid grid-cols-1 gap-2.5">
                    {current.options.map((opt, i) => {
                      const isSelected = f[current.id] === opt
                      const letter = String.fromCharCode(65 + i)
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            set(current.id, opt)
                            setTimeout(() => {
                              setDirection(1)
                              setCurrentIndex(prev => Math.min(prev + 1, totalVisible - 1))
                            }, 350)
                          }}
                          className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl border-2 text-left transition-all cursor-pointer group ${
                            isSelected
                              ? 'border-[var(--primary)] bg-[var(--primary)]/[0.04]'
                              : 'border-[var(--border)] hover:border-[var(--primary)]/30 bg-transparent'
                          }`}
                        >
                          <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 transition-all ${
                            isSelected
                              ? 'bg-[var(--primary)] text-white'
                              : 'bg-[var(--secondary)] text-[var(--muted-foreground)] group-hover:bg-[var(--primary)]/10'
                          }`}>
                            {isSelected ? <Check className="w-4 h-4" /> : letter}
                          </span>
                          <span className={`text-sm sm:text-base font-semibold ${
                            isSelected ? 'text-[var(--foreground)]' : 'text-[var(--foreground-soft)]'
                          }`}>{opt}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Actions */}
              {current.type !== 'choice' && (
                <div className="mt-8 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={goNext}
                    disabled={submitting}
                    className="inline-flex items-center gap-2 px-7 py-3.5 bg-[var(--primary)] hover:bg-[var(--primary-light)] text-white rounded-xl text-sm font-bold transition-all cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Analyse en cours…</>
                    ) : isLast ? (
                      <>Finaliser le diagnostic <ArrowRight className="w-4 h-4" /></>
                    ) : (
                      <>Continuer <ChevronRight className="w-4 h-4" /></>
                    )}
                  </button>
                  <span className="text-xs text-[var(--muted-foreground)] hidden sm:inline">
                    ou appuyez sur <kbd className="px-1.5 py-0.5 rounded bg-[var(--secondary)] border border-[var(--border)] font-mono text-[10px]">Entrée ↵</kbd>
                  </span>
                </div>
              )}

              {current.type === 'choice' && isLast && (
                <div className="mt-8">
                  <button
                    type="button"
                    onClick={goNext}
                    disabled={submitting}
                    className="inline-flex items-center gap-2 px-7 py-3.5 bg-[var(--primary)] hover:bg-[var(--primary-light)] text-white rounded-xl text-sm font-bold transition-all cursor-pointer disabled:opacity-50 animate-pulse"
                  >
                    {submitting ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Calcul du score…</>
                    ) : (
                      <>Obtenir mon diagnostic <ArrowRight className="w-4 h-4" /></>
                    )}
                  </button>
                </div>
              )}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Bottom nav */}
      {!submitted && (
        <div className="shrink-0 px-5 sm:px-8 py-4 border-t border-[var(--border)] flex items-center justify-between">
          <button
            type="button"
            onClick={goPrev}
            disabled={currentIndex === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer disabled:opacity-30 hover:bg-[var(--secondary)] text-[var(--foreground-soft)]"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Précédent</span>
          </button>

          <div className="flex items-center gap-1">
            {QUESTIONS.map((_, i) => (
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
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer hover:bg-[var(--secondary)] text-[var(--foreground-soft)]"
          >
            <span>{isLast ? 'Terminer' : 'Suivant'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </motion.div>
  )
}


