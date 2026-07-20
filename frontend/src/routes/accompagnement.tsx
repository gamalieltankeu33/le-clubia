import { useEffect, useState, useMemo } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle,
  HelpCircle,
  Info,
  Loader2,
  Sparkles,
  User,
  Mail,
  Phone,
  Globe,
  Briefcase,
  AlertCircle,
  Calendar,
  Layers,
  ChevronRight,
  ChevronLeft,
  Settings,
  TrendingUp,
  Cpu,
  Target,
  Zap,
  ShieldCheck,
  Play,
  Pause,
  Award,
  Flame,
  Bot,
  Compass,
  Rocket,
  Sliders,
  Database,
  Code
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import confetti from 'canvas-confetti'
import { BrandLogo } from '@/components/brand-logo'
import { supabase } from '@/lib/supabase'

export const Route = createFileRoute('/accompagnement')({
  component: AccompagnementPage,
})

// Options pour les questions à choix multiples
const PROJET_TYPES = [
  { value: 'Je veux lancer mon premier business', label: 'Je veux lancer mon premier business' },
  { value: "J'ai déjà un business", label: "J'ai déjà un business" },
  { value: 'Je suis salarié', label: 'Je suis salarié' },
  { value: 'Je suis freelance', label: 'Je suis freelance' },
  { value: 'Autre', label: 'Autre' },
]

const STATUTS_ACTUELS = [
  { value: 'Je pars de zéro', label: 'Je pars de zéro' },
  { value: "J'ai une idée", label: "J'ai une idée" },
  { value: "J'ai commencé", label: "J'ai commencé" },
  { value: "J'ai déjà des clients", label: "J'ai déjà des clients" },
]

const HEURES_SEMAINE_OPTIONS = [
  { value: 'moins de 5 h', label: 'Moins de 5 heures / semaine' },
  { value: '5 à 10 h', label: '5 à 10 heures / semaine' },
  { value: '10 à 20 h', label: '10 à 20 heures / semaine' },
  { value: 'plus de 20 h', label: 'Plus de 20 heures / semaine' },
]

const PRET_INVESTIR_OPTIONS = [
  { value: 'Oui', label: 'Oui, prêt à passer à l\'action' },
  { value: 'Peut-être', label: 'Peut-être, selon l\'échange' },
  { value: 'Non', label: 'Non, pas pour le moment' },
]

const BUDGET_OPTIONS = [
  { value: 'Moins de 500 €', label: 'Moins de 500 €' },
  { value: '500 à 1 500 €', label: '500 à 1 500 €' },
  { value: '1 500 à 3 000 €', label: '1 500 à 3 000 €' },
  { value: 'Plus de 3 000 €', label: 'Plus de 3 000 €' },
]

// Données des phases de la méthode (Expérience Jour par Jour / Étape par Étape)
const METHOD_STEPS = [
  {
    id: 'step-1',
    stepNumber: '01',
    name: 'Clarifier',
    subtitle: 'Marché, Client, Offre & Promesse',
    tagline: 'Construire des fondations solides avant d\'écrire la moindre ligne de code ou de prompt.',
    duration: 'Semaine 1 — Clarté Totale',
    points: [
      'Analyse de votre profil & identification de votre angle d\'attaque unique.',
      'Étude de marché ciblée & définition de l\'Avatar Client idéal.',
      'Création d\'une offre irrésistible à haute valeur ajoutée.',
      'Rédaction de votre promesse de vente claire et percutante.'
    ],
    mockupType: 'blueprint',
    previewBadge: 'Phase 1 : Fondations & Offre',
    stats: [
      { label: 'Taux de clarté', val: '100%' },
      { label: 'Livrables', val: 'Feuille de Route' }
    ]
  },
  {
    id: 'step-2',
    stepNumber: '02',
    name: 'Construire',
    subtitle: 'Contenu, Outils & Automatisations IA',
    tagline: 'Transformer votre savoir-faire en un système automatisé grâce aux meilleurs outils d\'IA.',
    duration: 'Semaine 2 — Architecture IA',
    points: [
      'Création de votre matrice de contenu avec l\'assistance d\'agents IA.',
      'Mise en place de vos automatisations (Prompts custom, Make, OpenAI API).',
      'Création de vos produits digitaux ou services packagés.',
      'Configuration de vos outils d\'acquisition et de capture de leads.'
    ],
    mockupType: 'ai-system',
    previewBadge: 'Phase 2 : Moteur d\'IA & Automatisations',
    stats: [
      { label: 'Gain de temps', val: '80%' },
      { label: 'Automatisations', val: 'Système Opérationnel' }
    ]
  },
  {
    id: 'step-3',
    stepNumber: '03',
    name: 'Lancer',
    subtitle: 'Acquisition, Ventes & Tunnel',
    tagline: 'Activer le système d\'acquisition pour générer vos premiers prospects qualifiés et conclure vos ventes.',
    duration: 'Semaine 3 — Mise sur le Marché',
    points: [
      'Déploiement de votre stratégie de contenu d\'attraction.',
      'Lancement de votre tunnel de conversion optimisé.',
      'Mise en pratique du script de conversion / diagnostic.',
      'Génération des premiers prospects qualifiés.'
    ],
    mockupType: 'funnel',
    previewBadge: 'Phase 3 : Tunnel & Premières Ventes',
    stats: [
      { label: 'Convertisseurs', val: 'Active' },
      { label: 'Acquisition', val: 'En direct' }
    ]
  },
  {
    id: 'step-4',
    stepNumber: '04',
    name: 'Optimiser',
    subtitle: 'Simplification, Rentabilité & Scaling',
    tagline: 'Analyser les retours réels, éliminer le superflu et scaler un business rentable et fluide.',
    duration: 'Semaine 4 & Continu — Évolutivité',
    points: [
      'Analyse des conversions et ajustement des messages.',
      'Délégation des tâches répétitives aux assistants IA.',
      'Simplification des processus pour maximiser la marge nette.',
      'Accompagnement continu et ajustements personnalisés.'
    ],
    mockupType: 'scaling',
    previewBadge: 'Phase 4 : Optimisation & Rentrabilité',
    stats: [
      { label: 'Efficacité', val: 'Max' },
      { label: 'Posture', val: 'Fondateur IA' }
    ]
  }
]

function AccompagnementPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // Stepper interactif (Notre méthode)
  const [activeStepIndex, setActiveStepIndex] = useState(0)
  const [autoPlay, setAutoPlay] = useState(true)

  // Auto-play du Stepper (Inspiration Framer / Elliott Pierret)
  useEffect(() => {
    if (!autoPlay) return
    const timer = setInterval(() => {
      setActiveStepIndex((prev) => (prev + 1) % METHOD_STEPS.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [autoPlay])

  // Formulaire state
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    pays: '',
    projet_type: '',
    projet_ia: '',
    projet_raison: '',
    projet_blocage: '',
    deja_essaie: null as boolean | null,
    deja_essaie_details: '',
    statut_actuel: '',
    heures_semaine: '',
    objectif_12m: '',
    pret_investir: '',
    budget: '',
    candidat_raison: '',
  })

  // Gestion des champs text/select/radio
  const handleChange = (field: keyof typeof formData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // Smooth scroll
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  // Validation par étape
  const isStepValid = (currentStep: number) => {
    if (currentStep === 1) {
      return (
        formData.nom.trim() !== '' &&
        formData.prenom.trim() !== '' &&
        formData.email.trim() !== '' &&
        formData.telephone.trim() !== '' &&
        formData.pays.trim() !== ''
      )
    }
    if (currentStep === 2) {
      const basicValid =
        formData.projet_type !== '' &&
        formData.projet_ia.trim() !== '' &&
        formData.projet_raison.trim() !== '' &&
        formData.projet_blocage.trim() !== '' &&
        formData.deja_essaie !== null &&
        formData.statut_actuel !== ''

      if (formData.deja_essaie === true) {
        return basicValid && formData.deja_essaie_details.trim() !== ''
      }
      return basicValid
    }
    if (currentStep === 3) {
      return (
        formData.heures_semaine !== '' &&
        formData.objectif_12m.trim() !== '' &&
        formData.pret_investir !== '' &&
        formData.budget !== '' &&
        formData.candidat_raison.trim() !== ''
      )
    }
    return false
  }

  // Soumission finale
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isStepValid(3)) {
      toast.error('Veuillez remplir tous les champs obligatoires.')
      return
    }

    setIsSubmitting(true)

    try {
      const { error } = await supabase
        .from('accompagnement_candidatures')
        .insert({
          nom: formData.nom,
          prenom: formData.prenom,
          email: formData.email,
          telephone: formData.telephone,
          pays: formData.pays,
          projet_type: formData.projet_type,
          projet_ia: formData.projet_ia,
          projet_raison: formData.projet_raison,
          projet_blocage: formData.projet_blocage,
          deja_essaie: formData.deja_essaie === true,
          deja_essaie_details: formData.deja_essaie === true ? formData.deja_essaie_details : null,
          statut_actuel: formData.statut_actuel,
          heures_semaine: formData.heures_semaine,
          objectif_12m: formData.objectif_12m,
          pret_investir: formData.pret_investir,
          budget: formData.budget,
          candidat_raison: formData.candidat_raison,
        })

      if (error) throw error

      setSubmitted(true)
      // Confettis de succès !
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.6 },
      })
      toast.success('Votre candidature a été soumise avec succès !')
    } catch (err: any) {
      console.error('Erreur lors de la soumission de la candidature:', err)
      toast.error('Erreur lors de la soumission de votre candidature. Veuillez réessayer.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Scroll automatique au haut du formulaire quand on change d'étape
  useEffect(() => {
    if (step > 1 && !submitted) {
      const formEl = document.getElementById('qualification-form-section')
      if (formEl) {
        formEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
  }, [step])

  const activeMethod = METHOD_STEPS[activeStepIndex]

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#030712] text-white selection:bg-[var(--accent)] selection:text-black">
      {/* Halos cinématiques et grilles dynamiques de fond */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-48 left-1/2 h-[1100px] w-[1100px] -translate-x-1/2 rounded-full bg-gradient-to-b from-[#0F1E4D]/40 via-[var(--accent)]/10 to-transparent blur-[160px]" />
        <div className="absolute right-[-10%] top-[30%] h-[700px] w-[700px] rounded-full bg-[var(--accent)]/10 blur-[150px]" />
        <div className="absolute left-[-10%] top-[60%] h-[800px] w-[800px] rounded-full bg-[var(--primary)]/20 blur-[160px]" />
        {/* Fine grille en overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      </div>

      {/* Header premium */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#030712]/85 backdrop-blur-2xl transition-all duration-300">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-3">
            <BrandLogo size="md" variant="inverse" />
            <span className="font-display text-lg font-bold tracking-tight text-white">Le Club IA</span>
          </Link>

          <nav className="flex items-center gap-6 sm:gap-8">
            <Link
              to="/"
              className="text-sm font-medium text-gray-400 transition-colors hover:text-white"
            >
              Le Club IA
            </Link>
            <button
              onClick={() => scrollToSection('qualifier')}
              className="hidden text-sm font-medium text-gray-400 transition-colors hover:text-white sm:inline-block"
            >
              Candidater
            </button>
            <Link
              to="/auth"
              className="rounded-full bg-white/10 border border-white/15 px-5 py-2 text-xs font-semibold text-white transition-all hover:bg-white/20 hover:border-white/30"
            >
              Espace Membre
            </Link>
          </nav>
        </div>
      </header>

      <main className="pt-20">
        {/* ================= HERO SECTION ================= */}
        <section className="relative px-6 py-20 lg:py-32">
          <div className="mx-auto max-w-5xl text-center">
            {/* Tagline d'élite avec animation pulsing */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2.5 rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[var(--accent)] shadow-sm shadow-[var(--accent)]/20"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent)] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--accent)]" />
              </span>
              Accompagnement Business Premium 1-on-1 & Cohorte
            </motion.div>

            {/* Titre Principal */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mt-8 font-display text-5xl font-black leading-[1.05] tracking-tight sm:text-6xl md:text-7xl lg:text-8xl"
            >
              Construisez un business <br />
              <span className="bg-gradient-to-r from-white via-[var(--accent)] to-blue-400 bg-clip-text text-transparent">
                rentable
              </span>{' '}
              grâce à l'IA.
            </motion.h1>

            {/* Sous-titres */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mx-auto mt-8 max-w-3xl text-xl leading-relaxed text-gray-300 sm:text-2xl"
            >
              Passez de l'idée à un véritable business accompagné, étape par étape.
              Nous vous aidons à transformer vos compétences, vos idées ou votre expertise en un business moderne grâce à l'IA.
            </motion.p>

            {/* Note d'impact */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="mx-auto mt-10 max-w-2xl rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-gray-300 backdrop-blur-md"
            >
              ⚡ <span className="font-bold text-white">Vous ne repartez pas avec une simple formation.</span> Vous repartez avec un plan clair, un système automatisé et un business opérationnel que vous construisez avec nous.
            </motion.div>

            {/* CTA Hero */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row"
            >
              <button
                onClick={() => scrollToSection('qualifier')}
                className="group relative flex items-center gap-3 rounded-full bg-white px-9 py-4 text-base font-bold text-black transition-all hover:scale-105 hover:bg-gray-100 hover:shadow-xl hover:shadow-blue-500/20"
              >
                Candidatez à l'accompagnement
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>
            </motion.div>

            {/* Barre de stats / garanties */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-16 grid grid-cols-2 gap-4 border-t border-white/10 pt-10 sm:grid-cols-4"
            >
              {[
                { label: 'Accompagnement', val: '100% Personnalisé' },
                { label: 'Méthode', val: '0 Théorie, 100% Action' },
                { label: 'Parcours', val: '4 Phases Structurées' },
                { label: 'Objectif', val: 'Système Opérationnel' },
              ].map((stat, idx) => (
                <div key={idx} className="p-3 text-center">
                  <div className="font-display text-lg font-extrabold text-white sm:text-xl">{stat.val}</div>
                  <div className="mt-1 text-xs text-gray-400 font-medium">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ================= CE PROGRAMME EST FAIT POUR VOUS SI ================= */}
        <section className="border-y border-white/10 bg-white/[0.01] px-6 py-20">
          <div className="mx-auto max-w-4xl">
            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400">
                <Target className="h-3.5 w-3.5" />
                Qualification du profil
              </span>
              <h2 className="mt-4 font-display text-3xl font-bold sm:text-4xl">
                Ce programme est peut-être fait pour vous si...
              </h2>
            </div>
            <div className="mt-12 grid gap-5 sm:grid-cols-2">
              {[
                "Vous voulez lancer votre premier business grâce à l'IA.",
                "Vous avez envie de créer une activité qui génère des revenus.",
                "Vous consommez beaucoup de contenu mais vous passez rarement à l'action.",
                "Vous cherchez un accompagnement pour construire un vrai système.",
                "Vous voulez aller beaucoup plus vite en évitant les erreurs."
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-md transition-all hover:border-[var(--accent)]/40 hover:bg-white/[0.04]"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/15 text-[var(--accent)]">
                    <Check className="h-4 w-4" />
                  </div>
                  <p className="text-sm font-medium text-gray-300 leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================= LE PROBLÈME VS LA SOLUTION ================= */}
        <section className="px-6 py-20 lg:py-28">
          <div className="mx-auto max-w-5xl">
            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-400">
                <AlertCircle className="h-3.5 w-3.5" />
                Le Constat Brutal
              </span>
              <h2 className="mt-4 font-display text-4xl font-extrabold sm:text-5xl">
                Le Problème
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-300">
                Aujourd'hui, il est facile d'apprendre l'IA. <br />
                <span className="font-bold text-white">Mais apprendre l'IA ne construit pas un business.</span>
              </p>
            </div>

            <div className="mt-14 grid gap-8 lg:grid-cols-2">
              {/* Sans méthode */}
              <div className="rounded-3xl border border-red-500/20 bg-gradient-to-b from-[#1C0A0E] to-[#0A0305] p-8 shadow-2xl">
                <div className="flex items-center justify-between border-b border-red-500/20 pb-4">
                  <h3 className="font-display text-xl font-bold text-red-400">Sans méthode & Seul</h3>
                  <span className="rounded-full bg-red-500/20 px-3 py-1 text-xs font-bold text-red-400">Spirale de la distraction</span>
                </div>
                <div className="mt-6 space-y-4">
                  {[
                    "Vous regardez des dizaines de vidéos sans avancer.",
                    "Vous testez des outils sans stratégie globale.",
                    "Vous accumulez des connaissances théoriques.",
                    "Vous essayez des prompts au hasard sans résultats.",
                    "Votre projet stagne et vous perdez votre motivation."
                  ].map((text, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500/20 text-red-400 text-xs font-bold mt-0.5">
                        ✕
                      </div>
                      <span className="text-sm text-gray-400">{text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Avec l'accompagnement */}
              <div className="rounded-3xl border border-[var(--accent)]/30 bg-gradient-to-b from-[#0F1E4D]/80 to-[#030712] p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[var(--accent)]/20 blur-2xl" />
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <h3 className="font-display text-xl font-bold text-white">Avec l'Accompagnement Premium</h3>
                  <span className="rounded-full bg-[var(--accent)]/20 px-3 py-1 text-xs font-bold text-[var(--accent)]">Système d'Exécution</span>
                </div>
                <div className="mt-6 space-y-4">
                  {[
                    "Une méthode claire pas à pas de A à Z.",
                    "Un plan d'action hebdomadaire sans devinette.",
                    "Un accompagnement & retour régulier sur votre travail.",
                    "Des automatisations IA sur-mesure installées.",
                    "Un business concrètement lancé sur le marché."
                  ].map((text, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/20 text-[var(--accent)] text-xs font-bold mt-0.5">
                        ✓
                      </div>
                      <span className="text-sm text-gray-200 font-medium">{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= CE QUE NOUS CONSTRUISONS ENSEMBLE ================= */}
        <section className="border-t border-white/10 bg-white/[0.005] px-6 py-20">
          <div className="mx-auto max-w-5xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent)]/10 px-3 py-1 text-xs font-semibold text-[var(--accent)]">
              <Workflow className="h-3.5 w-3.5" />
              Livrables concréts
            </span>
            <h2 className="mt-4 font-display text-3xl font-bold sm:text-4xl lg:text-5xl">
              Ce que nous construisons ensemble
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-gray-300">
              Pendant cet accompagnement, nous travaillons ensemble pour construire votre activité. Concrètement, nous allons :
            </p>

            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: Target, title: "1. Positionnement", desc: "Définir votre positionnement unique et rentable." },
                { icon: Sparkles, title: "2. Idée de Business", desc: "Trouver l'idée adaptée à vos compétences." },
                { icon: Briefcase, title: "3. Offre Irrésistible", desc: "Créer une offre packagée qui répond à un vrai besoin." },
                { icon: Compass, title: "4. Stratégie de Contenu", desc: "Attirer naturellement vos futurs clients." },
                { icon: Zap, title: "5. Système d'Acquisition", desc: "Mettre en place votre tunnel de conversion." },
                { icon: Cpu, title: "6. Automatisations IA", desc: "Déléguer les tâches répétitives à des agents IA." },
                { icon: Database, title: "7. Produits Digitaux", desc: "Créer vos premiers services ou offres." },
                { icon: Rocket, title: "8. Lancement Officiel", desc: "Lancer concrètement votre activité." }
              ].map((item, idx) => {
                const IconComponent = item.icon
                return (
                  <div
                    key={idx}
                    className="group relative rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-left backdrop-blur-md transition-all duration-300 hover:scale-[1.02] hover:border-[var(--accent)]/40 hover:bg-white/[0.05]"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-[var(--accent)] transition-colors group-hover:bg-[var(--accent)] group-hover:text-black">
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <h4 className="mt-4 font-display text-base font-bold text-white">{item.title}</h4>
                    <p className="mt-2 text-xs text-gray-400 leading-relaxed">{item.desc}</p>
                  </div>
                )
              })}
            </div>

            <div className="mt-12 inline-flex items-center gap-3 rounded-2xl border border-[var(--accent)]/30 bg-[var(--accent)]/[0.05] px-6 py-4 text-sm font-semibold text-[var(--accent)] shadow-lg shadow-[var(--accent)]/5">
              🎯 <span className="text-white">Notre objectif n'est pas que vous connaissiez mieux l'IA. Notre objectif est que vous construisiez un business.</span>
            </div>
          </div>
        </section>

        {/* ================= NOTRE MÉTHODE (EXPÉRIENCE INTERACTIVE INSPIRÉE D'ELLIOTT PIERRET) ================= */}
        <section className="px-6 py-20 lg:py-28 relative">
          <div className="mx-auto max-w-6xl">
            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent)]/10 px-3 py-1 text-xs font-semibold text-[var(--accent)]">
                <Sliders className="h-3.5 w-3.5" />
                Le Parcours d'Accompagnement
              </span>
              <h2 className="mt-4 font-display text-4xl font-extrabold sm:text-5xl">
                Notre Méthode en 4 Phases
              </h2>
              <p className="mt-4 text-gray-300">
                Cliquez ou parcourez les étapes pour découvrir exactement ce que nous accomplissons ensemble à chaque phase.
              </p>

              {/* Toggle Auto-play */}
              <div className="mt-6 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-gray-400">
                <span>Défilement automatique</span>
                <button
                  type="button"
                  onClick={() => setAutoPlay(!autoPlay)}
                  className={`flex h-5 w-9 items-center rounded-full p-0.5 transition-colors ${
                    autoPlay ? 'bg-[var(--accent)]' : 'bg-white/20'
                  }`}
                >
                  <div
                    className={`h-4 w-4 rounded-full bg-black transition-transform ${
                      autoPlay ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Composant Stepper Interactif */}
            <div className="mt-16 grid gap-8 lg:grid-cols-12 lg:items-start">
              {/* Colonne gauche : Liste des étapes */}
              <div className="lg:col-span-5 space-y-3">
                {METHOD_STEPS.map((stepItem, idx) => {
                  const isActive = idx === activeStepIndex
                  return (
                    <button
                      key={stepItem.id}
                      type="button"
                      onClick={() => {
                        setActiveStepIndex(idx)
                        setAutoPlay(false)
                      }}
                      className={`group relative flex w-full items-center justify-between rounded-2xl border p-5 text-left transition-all duration-300 ${
                        isActive
                          ? 'border-[var(--accent)] bg-gradient-to-r from-[#0F1E4D] via-[#0A1435] to-[#030712] shadow-xl shadow-[var(--accent)]/10'
                          : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <span className={`font-display text-2xl font-black ${
                          isActive ? 'text-[var(--accent)]' : 'text-gray-600 group-hover:text-gray-400'
                        }`}>
                          {stepItem.stepNumber}
                        </span>
                        <div>
                          <div className={`font-display text-lg font-bold ${isActive ? 'text-white' : 'text-gray-300'}`}>
                            {stepItem.name}
                          </div>
                          <div className="text-xs text-gray-400">{stepItem.subtitle}</div>
                        </div>
                      </div>

                      <ChevronRight className={`h-5 w-5 transition-transform ${
                        isActive ? 'text-[var(--accent)] translate-x-1' : 'text-gray-600'
                      }`} />

                      {/* Barre de progression animée pour l'élément actif */}
                      {isActive && autoPlay && (
                        <motion.div
                          key={`progress-${idx}`}
                          initial={{ width: '0%' }}
                          animate={{ width: '100%' }}
                          transition={{ duration: 6, ease: 'linear' }}
                          className="absolute bottom-0 left-0 h-0.5 rounded-full bg-[var(--accent)]"
                        />
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Colonne droite : Carte détaillée dynamique (Framer Motion) */}
              <div className="lg:col-span-7">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeMethod.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.4 }}
                    className="relative rounded-3xl border border-white/15 bg-gradient-to-br from-[#0B1536] via-[#060D24] to-[#030712] p-8 shadow-2xl backdrop-blur-xl"
                  >
                    {/* Header carte */}
                    <div className="flex items-center justify-between border-b border-white/10 pb-5">
                      <span className="rounded-full bg-[var(--accent)]/15 px-3.5 py-1 text-xs font-bold text-[var(--accent)] uppercase tracking-wider">
                        {activeMethod.previewBadge}
                      </span>
                      <span className="text-xs font-semibold text-gray-400">
                        {activeMethod.duration}
                      </span>
                    </div>

                    {/* Titre & Description */}
                    <h3 className="mt-6 font-display text-3xl font-extrabold text-white">
                      Étape {activeMethod.stepNumber} — {activeMethod.name}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-gray-300">
                      {activeMethod.tagline}
                    </p>

                    {/* Points d'action */}
                    <div className="mt-8 space-y-3">
                      <div className="text-xs font-bold uppercase tracking-wider text-gray-400">Objectifs & Livrables :</div>
                      {activeMethod.points.map((pt, pIdx) => (
                        <div key={pIdx} className="flex items-start gap-3 rounded-xl bg-white/5 p-3.5 border border-white/5">
                          <Check className="h-4 w-4 shrink-0 text-[var(--accent)] mt-0.5" />
                          <span className="text-xs text-gray-200 font-medium leading-relaxed">{pt}</span>
                        </div>
                      ))}
                    </div>

                    {/* Preview Widget simulé */}
                    <div className="mt-8 rounded-2xl bg-black/40 p-5 border border-white/10 flex items-center justify-between">
                      {activeMethod.stats.map((st, sIdx) => (
                        <div key={sIdx} className="text-center flex-1 border-r border-white/10 last:border-r-0">
                          <div className="text-xs text-gray-400">{st.label}</div>
                          <div className="mt-1 font-display text-base font-bold text-[var(--accent)]">{st.val}</div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </section>

        {/* ================= LIVRABLES & ANTI-PERSONA ================= */}
        <section className="border-t border-white/10 bg-white/[0.005] px-6 py-20">
          <div className="mx-auto max-w-5xl">
            <div className="grid gap-8 lg:grid-cols-2">
              {/* Vous repartez avec */}
              <div className="rounded-3xl border border-white/10 bg-[#081028] p-8 shadow-2xl backdrop-blur-md">
                <h3 className="font-display text-2xl font-bold text-white flex items-center gap-2">
                  <CheckCircle className="h-6 w-6 text-[var(--accent)]" />
                  Vous repartez avec :
                </h3>
                <div className="mt-8 space-y-3.5">
                  {[
                    "Une offre claire et vendable.",
                    "Un positionnement de marché unique.",
                    "Une stratégie de contenu prêt-à-publier.",
                    "Votre système d'acquisition automatisé.",
                    "Vos agents & automatisations IA configurés.",
                    "Votre feuille de route d'exécution.",
                    "Les outils adaptés à votre business.",
                    "Un accompagnement personnalisé continu."
                  ].map((text, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent)]/20 text-[var(--accent)]">
                        <Check className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-sm text-gray-200 font-medium">{text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pas fait pour vous si */}
              <div className="rounded-3xl border border-red-500/20 bg-[#1A0A0F] p-8 shadow-2xl backdrop-blur-md">
                <h3 className="font-display text-2xl font-bold text-red-400 flex items-center gap-2">
                  <AlertCircle className="h-6 w-6 text-red-400" />
                  Ce programme n'est PAS pour vous si...
                </h3>
                <div className="mt-8 space-y-4">
                  {[
                    "Vous cherchez une méthode miracle ou de l'argent facile.",
                    "Vous voulez gagner de l'argent sans travailler.",
                    "Vous souhaitez simplement apprendre des prompts ChatGPT basiques.",
                    "Vous n'êtes pas prêt à passer concrètement à l'action."
                  ].map((text, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500/20 text-red-400 font-bold text-xs mt-0.5">
                        ✕
                      </div>
                      <span className="text-sm text-gray-300 font-medium leading-relaxed">{text}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-8 rounded-xl bg-white/5 p-4 text-xs text-gray-400 text-center border border-white/5">
                  ⚠️ Nous travaillons uniquement avec des personnes déterminées qui veulent réellement construire.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= COMMENT REJOINDRE ================= */}
        <section className="px-6 py-20 lg:py-28">
          <div className="mx-auto max-w-4xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400">
              <Calendar className="h-3.5 w-3.5" />
              Processus d'Admission
            </span>
            <h2 className="mt-4 font-display text-3xl font-bold sm:text-4xl">
              Comment rejoindre l'accompagnement ?
            </h2>
            <p className="mt-4 text-gray-300">
              Un processus simple et sélectif pour vous proposer la solution adaptée.
            </p>

            <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 text-left">
              {[
                { num: "01", title: "Candidature", desc: "Remplissez le formulaire de qualification en bas de page." },
                { num: "02", title: "Analyse", desc: "Nous étudions votre profil et votre projet sous 24h à 48h." },
                { num: "03", title: "Appel", desc: "Si retenu, nous vous invitons à un appel stratégique gratuit." },
                { num: "04", title: "Orientation", desc: "Recommandation de la solution la plus adaptée à vos objectifs." }
              ].map((stepItem, idx) => (
                <div key={idx} className="rounded-2xl border border-white/10 bg-[#091129] p-6 backdrop-blur-md">
                  <div className="font-display text-xs font-bold text-[var(--accent)] uppercase tracking-wider">Étape {stepItem.num}</div>
                  <h4 className="mt-2 font-display text-lg font-bold text-white">{stepItem.title}</h4>
                  <p className="mt-3 text-xs text-gray-400 leading-relaxed">{stepItem.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-12">
              <button
                onClick={() => scrollToSection('qualifier')}
                className="inline-flex items-center gap-3 rounded-full bg-white px-9 py-4 text-base font-bold text-black transition-all hover:scale-105 hover:bg-gray-100"
              >
                Candidatez à l'accompagnement
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </section>

        {/* ================= FORMULAIRE DE QUALIFICATION ================= */}
        <section id="qualifier" className="border-t border-white/10 bg-[#020612] px-6 py-20 lg:py-28">
          <div className="mx-auto max-w-3xl" id="qualification-form-section">
            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent)]/15 px-3 py-1 text-xs font-semibold text-[var(--accent)]">
                <Target className="h-3.5 w-3.5" />
                Candidature Ouverte
              </span>
              <h2 className="mt-4 font-display text-4xl font-black sm:text-5xl">
                Candidatez à l'accompagnement
              </h2>
              <p className="mt-4 text-gray-400">
                Prenez 5 minutes pour répondre sincèrement. Ce formulaire nous permet de sélectionner les candidats ayant les meilleures chances de réussite.
              </p>
            </div>

            <div className="mt-12 rounded-3xl border border-white/15 bg-white/[0.02] p-6 sm:p-10 shadow-2xl backdrop-blur-2xl">
              <AnimatePresence mode="wait">
                {!submitted ? (
                  <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Indicateur de Progression */}
                    <div>
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>Étape {step} sur 3</span>
                        <span className="font-bold text-white">
                          {step === 1 && "Coordonnées de contact"}
                          {step === 2 && "Votre projet & expérience"}
                          {step === 3 && "Objectifs & capacité d'investissement"}
                        </span>
                      </div>
                      <div className="mt-3 h-2 w-full rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 via-[var(--accent)] to-cyan-400 transition-all duration-500"
                          style={{ width: `${(step / 3) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* ÉTAPE 1 : COORDONNÉES */}
                    {step === 1 && (
                      <motion.div
                        key="step-1"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                      >
                        <h3 className="font-display text-xl font-bold border-b border-white/10 pb-3">1. Informations personnelles</h3>
                        
                        <div className="grid gap-6 sm:grid-cols-2">
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">Prénom *</label>
                            <div className="relative">
                              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-500">
                                <User className="h-4 w-4" />
                              </span>
                              <input
                                type="text"
                                required
                                value={formData.prenom}
                                onChange={(e) => handleChange('prenom', e.target.value)}
                                className="w-full rounded-xl border border-white/15 bg-white/5 py-3.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
                                placeholder="Votre prénom"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">Nom *</label>
                            <div className="relative">
                              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-500">
                                <User className="h-4 w-4" />
                              </span>
                              <input
                                type="text"
                                required
                                value={formData.nom}
                                onChange={(e) => handleChange('nom', e.target.value)}
                                className="w-full rounded-xl border border-white/15 bg-white/5 py-3.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
                                placeholder="Votre nom"
                              />
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">Adresse Email *</label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-500">
                              <Mail className="h-4 w-4" />
                            </span>
                            <input
                              type="email"
                              required
                              value={formData.email}
                              onChange={(e) => handleChange('email', e.target.value)}
                              className="w-full rounded-xl border border-white/15 bg-white/5 py-3.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
                              placeholder="votre.email@exemple.com"
                            />
                          </div>
                        </div>

                        <div className="grid gap-6 sm:grid-cols-2">
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">Téléphone (avec indicatif) *</label>
                            <div className="relative">
                              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-500">
                                <Phone className="h-4 w-4" />
                              </span>
                              <input
                                type="tel"
                                required
                                value={formData.telephone}
                                onChange={(e) => handleChange('telephone', e.target.value)}
                                className="w-full rounded-xl border border-white/15 bg-white/5 py-3.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
                                placeholder="+33 6 12 34 56 78"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">Pays de résidence *</label>
                            <div className="relative">
                              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-500">
                                <Globe className="h-4 w-4" />
                              </span>
                              <input
                                type="text"
                                required
                                value={formData.pays}
                                onChange={(e) => handleChange('pays', e.target.value)}
                                className="w-full rounded-xl border border-white/15 bg-white/5 py-3.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
                                placeholder="France, Sénégal, Canada..."
                              />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* ÉTAPE 2 : VOTRE PROJET */}
                    {step === 2 && (
                      <motion.div
                        key="step-2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                      >
                        <h3 className="font-display text-xl font-bold border-b border-white/10 pb-3">2. Votre projet & situation</h3>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-3">Quel est votre projet aujourd'hui ? *</label>
                          <div className="grid gap-3 sm:grid-cols-2">
                            {PROJET_TYPES.map((option) => (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => handleChange('projet_type', option.value)}
                                className={`flex items-center gap-3 rounded-xl border p-4 text-left text-sm transition-all ${
                                  formData.projet_type === option.value
                                    ? 'border-[var(--accent)] bg-[var(--accent)]/15 text-white font-bold'
                                    : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10'
                                }`}
                              >
                                <span className={`h-4.5 w-4.5 rounded-full border flex items-center justify-center shrink-0 ${
                                  formData.projet_type === option.value
                                    ? 'border-[var(--accent)] bg-[var(--accent)]'
                                    : 'border-gray-500'
                                }`}>
                                  {formData.projet_type === option.value && <span className="h-2 w-2 rounded-full bg-black" />}
                                </span>
                                {option.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">
                            Que souhaitez-vous construire grâce à l'IA ? *
                          </label>
                          <textarea
                            required
                            rows={3}
                            value={formData.projet_ia}
                            onChange={(e) => handleChange('projet_ia', e.target.value)}
                            className="w-full rounded-xl border border-white/15 bg-white/5 p-4 text-sm text-white placeholder-gray-500 focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
                            placeholder="Décrivez en quelques phrases le produit, le service ou l'activité automatisée que vous imaginez..."
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">
                            Pourquoi souhaitez-vous lancer ce projet maintenant ? *
                          </label>
                          <textarea
                            required
                            rows={3}
                            value={formData.projet_raison}
                            onChange={(e) => handleChange('projet_raison', e.target.value)}
                            className="w-full rounded-xl border border-white/15 bg-white/5 p-4 text-sm text-white placeholder-gray-500 focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
                            placeholder="Motivation personnelle, transition de carrière, opportunité..."
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">
                            Quel est aujourd'hui votre plus grand blocage ? *
                          </label>
                          <textarea
                            required
                            rows={3}
                            value={formData.projet_blocage}
                            onChange={(e) => handleChange('projet_blocage', e.target.value)}
                            className="w-full rounded-xl border border-white/15 bg-white/5 p-4 text-sm text-white placeholder-gray-500 focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
                            placeholder="Manque de temps, technique, acquisition clients, clarté..."
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-3">
                            Avez-vous déjà essayé de lancer un business ? *
                          </label>
                          <div className="flex gap-4">
                            {[
                              { label: 'Oui', value: true },
                              { label: 'Non', value: false },
                            ].map((opt) => (
                              <button
                                key={opt.label}
                                type="button"
                                onClick={() => handleChange('deja_essaie', opt.value)}
                                className={`flex-1 rounded-xl border p-4 text-center text-sm transition-all font-bold ${
                                  formData.deja_essaie === opt.value
                                    ? 'border-[var(--accent)] bg-[var(--accent)]/15 text-white'
                                    : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10'
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {formData.deja_essaie === true && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="space-y-2"
                          >
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">
                              Expliquez-nous rapidement ce que vous avez essayé *
                            </label>
                            <textarea
                              required
                              rows={2}
                              value={formData.deja_essaie_details}
                              onChange={(e) => handleChange('deja_essaie_details', e.target.value)}
                              className="w-full rounded-xl border border-white/15 bg-white/5 p-4 text-sm text-white placeholder-gray-500 focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
                              placeholder="Quel business, quels résultats, pourquoi cela n'a pas marché ?"
                            />
                          </motion.div>
                        )}

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-3">Où en êtes-vous actuellement ? *</label>
                          <div className="grid gap-3 sm:grid-cols-2">
                            {STATUTS_ACTUELS.map((option) => (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => handleChange('statut_actuel', option.value)}
                                className={`flex items-center gap-3 rounded-xl border p-4 text-left text-sm transition-all ${
                                  formData.statut_actuel === option.value
                                    ? 'border-[var(--accent)] bg-[var(--accent)]/15 text-white font-bold'
                                    : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10'
                                }`}
                              >
                                <span className={`h-4.5 w-4.5 rounded-full border flex items-center justify-center shrink-0 ${
                                  formData.statut_actuel === option.value
                                    ? 'border-[var(--accent)] bg-[var(--accent)]'
                                    : 'border-gray-500'
                                }`}>
                                  {formData.statut_actuel === option.value && <span className="h-2 w-2 rounded-full bg-black" />}
                                </span>
                                {option.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* ÉTAPE 3 : OBJECTIFS & BUDGET */}
                    {step === 3 && (
                      <motion.div
                        key="step-3"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                      >
                        <h3 className="font-display text-xl font-bold border-b border-white/10 pb-3">3. Engagement & Budget</h3>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-3">
                            Combien d'heures pouvez-vous consacrer chaque semaine à votre projet ? *
                          </label>
                          <div className="grid gap-3 sm:grid-cols-2">
                            {HEURES_SEMAINE_OPTIONS.map((option) => (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => handleChange('heures_semaine', option.value)}
                                className={`flex items-center gap-3 rounded-xl border p-4 text-left text-sm transition-all ${
                                  formData.heures_semaine === option.value
                                    ? 'border-[var(--accent)] bg-[var(--accent)]/15 text-white font-bold'
                                    : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10'
                                }`}
                              >
                                <span className={`h-4.5 w-4.5 rounded-full border flex items-center justify-center shrink-0 ${
                                  formData.heures_semaine === option.value
                                    ? 'border-[var(--accent)] bg-[var(--accent)]'
                                    : 'border-gray-500'
                                }`}>
                                  {formData.heures_semaine === option.value && <span className="h-2 w-2 rounded-full bg-black" />}
                                </span>
                                {option.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">
                            Quel est votre objectif dans les 12 prochains mois ? *
                          </label>
                          <textarea
                            required
                            rows={3}
                            value={formData.objectif_12m}
                            onChange={(e) => handleChange('objectif_12m', e.target.value)}
                            className="w-full rounded-xl border border-white/15 bg-white/5 p-4 text-sm text-white placeholder-gray-500 focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
                            placeholder="Objectif financier, quitter votre emploi actuel, nombre de clients..."
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-3">
                            Si nous pensons pouvoir vous aider, êtes-vous prêt à investir dans un accompagnement ? *
                          </label>
                          <div className="grid gap-3 sm:grid-cols-3">
                            {PRET_INVESTIR_OPTIONS.map((option) => (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => handleChange('pret_investir', option.value)}
                                className={`rounded-xl border p-4 text-center text-sm transition-all ${
                                  formData.pret_investir === option.value
                                    ? 'border-[var(--accent)] bg-[var(--accent)]/15 text-white font-bold'
                                    : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10'
                                }`}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-3">
                            Quel budget êtes-vous prêt à investir pour construire votre business ? *
                          </label>
                          <div className="grid gap-3 sm:grid-cols-2">
                            {BUDGET_OPTIONS.map((option) => (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => handleChange('budget', option.value)}
                                className={`flex items-center gap-3 rounded-xl border p-4 text-left text-sm transition-all ${
                                  formData.budget === option.value
                                    ? 'border-[var(--accent)] bg-[var(--accent)]/15 text-white font-bold'
                                    : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10'
                                }`}
                              >
                                <span className={`h-4.5 w-4.5 rounded-full border flex items-center justify-center shrink-0 ${
                                  formData.budget === option.value
                                    ? 'border-[var(--accent)] bg-[var(--accent)]'
                                    : 'border-gray-500'
                                }`}>
                                  {formData.budget === option.value && <span className="h-2 w-2 rounded-full bg-black" />}
                                </span>
                                {option.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">
                            Pourquoi pensez-vous être un bon candidat pour cet accompagnement ? *
                          </label>
                          <textarea
                            required
                            rows={3}
                            value={formData.candidat_raison}
                            onChange={(e) => handleChange('candidat_raison', e.target.value)}
                            className="w-full rounded-xl border border-white/15 bg-white/5 p-4 text-sm text-white placeholder-gray-500 focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
                            placeholder="Décrivez votre rigueur, votre détermination et pourquoi nous devrions vous sélectionner..."
                          />
                        </div>
                      </motion.div>
                    )}

                    {/* Navigation du formulaire */}
                    <div className="flex justify-between border-t border-white/10 pt-6">
                      {step > 1 ? (
                        <button
                          type="button"
                          onClick={() => setStep((s) => s - 1)}
                          className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-white transition-colors"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Retour
                        </button>
                      ) : (
                        <div />
                      )}

                      {step < 3 ? (
                        <button
                          type="button"
                          disabled={!isStepValid(step)}
                          onClick={() => setStep((s) => s + 1)}
                          className="flex items-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-bold text-black transition-all hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-white"
                        >
                          Continuer
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          type="submit"
                          disabled={!isStepValid(3) || isSubmitting}
                          className="flex items-center gap-2 rounded-full bg-gradient-to-r from-[var(--accent)] via-blue-500 to-indigo-500 px-9 py-3.5 text-sm font-bold text-black transition-all hover:scale-105 disabled:opacity-40"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Envoi en cours...
                            </>
                          ) : (
                            <>
                              Soumettre ma candidature
                              <CheckCircle className="h-4 w-4" />
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </form>
                ) : (
                  // SUCCESS SCREEN
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-12 space-y-6"
                  >
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                      <Check className="h-10 w-10" />
                    </div>
                    
                    <h3 className="font-display text-3xl font-extrabold text-white">Candidature Reçue !</h3>
                    
                    <p className="mx-auto max-w-lg text-gray-300 leading-relaxed">
                      Félicitations, <span className="font-bold text-white">{formData.prenom}</span>. Votre dossier a été transmis à notre équipe pour analyse.
                    </p>

                    <div className="mx-auto max-w-md rounded-2xl bg-white/[0.03] p-6 text-left border border-white/10 space-y-4 backdrop-blur-md">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">Prochaines étapes :</h4>
                      <div className="space-y-3.5 text-xs text-gray-300">
                        <div className="flex gap-3">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/20 text-[var(--accent)] font-bold">1</span>
                          <span><strong>Analyse de votre dossier</strong> : Notre équipe étudie vos réponses sous 24h à 48h.</span>
                        </div>
                        <div className="flex gap-3">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/20 text-[var(--accent)] font-bold">2</span>
                          <span><strong>Invitation à l'appel stratégique</strong> : Si votre profil est retenu, vous recevrez un lien personnalisé par email.</span>
                        </div>
                        <div className="flex gap-3">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/20 text-[var(--accent)] font-bold">3</span>
                          <span><strong>Diagnostic & Feuille de Route</strong> : Échange de 30 min pour valider la faisabilité de votre projet.</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-6">
                      <Link
                        to="/"
                        className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-white/20"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Retour à l'accueil
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </section>
      </main>

      {/* Footer minimaliste */}
      <footer className="border-t border-white/10 bg-[#020510] py-12 text-center text-xs text-gray-500">
        <div className="mx-auto max-w-6xl px-6 space-y-4">
          <div className="flex justify-center gap-6 font-medium">
            <Link to="/cgu" className="hover:text-white transition-colors">CGU</Link>
            <Link to="/confidentialite" className="hover:text-white transition-colors">Confidentialité</Link>
            <Link to="/mentions-legales" className="hover:text-white transition-colors">Mentions Légales</Link>
          </div>
          <p>© {new Date().getFullYear()} Leclub.ia — Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  )
}
