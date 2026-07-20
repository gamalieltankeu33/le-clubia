import React, { useState, useEffect } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Sparkles,
  User,
  Mail,
  Phone,
  Globe,
  AlertCircle,
  ShieldCheck,
  Target,
  Zap,
  Bot,
  Compass,
  Rocket,
  Sliders,
  Workflow,
  XCircle,
  HelpCircle,
  TrendingUp,
  Layers,
  Search,
  MessageSquare,
  Award,
  Clock,
  Briefcase,
  FileCheck,
  ArrowUpRight
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import confetti from 'canvas-confetti'
import { BrandLogo } from '@/components/brand-logo'
import { supabase } from '@/lib/supabase'
import { AccompagnementHeroDashboard } from '@/components/landing/mockups/accompagnement-hero-dashboard'
import {
  OffreVisual,
  PositionnementVisual,
  ContenuVisual,
  AcquisitionVisual,
  SystemeVisual,
  AutomatisationsVisual,
  BusinessVisual
} from '@/components/landing/mockups/accompagnement-grid-visuals'

export const Route = createFileRoute('/accompagnement')({
  component: AccompagnementPage,
})

// Types et Options du Formulaire de Candidature
interface CandidatureFormData {
  nom: string
  prenom: string
  email: string
  telephone: string
  pays: string
  projet_type: string
  projet_ia: string
  projet_raison: string
  projet_blocage: string
  deja_essaie: boolean
  deja_essaie_details: string
  statut_actuel: string
  heures_semaine: string
  objectif_12m: string
  pret_investir: string
  budget: string
  candidat_raison: string
}

const INITIAL_FORM_DATA: CandidatureFormData = {
  nom: '',
  prenom: '',
  email: '',
  telephone: '',
  pays: 'France',
  projet_type: 'Je veux lancer mon premier business',
  projet_ia: '',
  projet_raison: '',
  projet_blocage: '',
  deja_essaie: false,
  deja_essaie_details: '',
  statut_actuel: 'Je pars de zéro',
  heures_semaine: '5 à 10 h',
  objectif_12m: '',
  pret_investir: 'Oui',
  budget: '1 500 à 3 000 €',
  candidat_raison: ''
}

const PROJET_TYPES = [
  'Je veux lancer mon premier business',
  "J'ai déjà un business en cours",
  'Je suis indépendant / freelance',
  'Je suis salarié et souhaite me reconvertir',
  'Autre projet d\'entreprise'
]

const STATUTS_ACTUELS = [
  'Je pars de zéro',
  "J'ai une idée mais aucun système",
  "J'ai déjà commencé à tester des outils",
  "J'ai déjà des premiers clients / du chiffre d'affaires"
]

const HEURES_SEMAINE_OPTIONS = [
  'moins de 5 h / semaine',
  '5 à 10 h / semaine',
  '10 à 20 h / semaine',
  'plus de 20 h / semaine (plein temps)'
]

const PRET_INVESTIR_OPTIONS = [
  'Oui, tout à fait prêt à passer à l\'action',
  'Peut-être, selon l\'échange et la faisabilité',
  'Non, pas d\'investissement prévu pour le moment'
]

const BUDGET_OPTIONS = [
  'Moins de 500 €',
  '500 à 1 500 €',
  '1 500 à 3 000 €',
  'Plus de 3 000 €'
]

const FAQ_ITEMS = [
  {
    question: "Quelle est la différence entre le Club IA et cet accompagnement ?",
    answer: "Le Club IA est une communauté privée autonome avec des cours et des ressources en libre accès. L'Accompagnement Premium est un programme intensif sur-mesure dans lequel nous construisons votre business AVEC vous, étape par étape, avec un suivi individuel et des automatisations IA configurées sur-mesure."
  },
  {
    question: "Faut-il avoir des compétences techniques ou savoir coder ?",
    answer: "Absolument pas. Nous privilégions les architectures no-code et les agents IA configurés sans programmation complexe. Vous apprenez à piloter et maintenir vos systèmes en toute autonomie."
  },
  {
    question: "Combien de temps faut-il y consacrer par semaine ?",
    answer: "Entre 5 et 10 heures par semaine suffisent amplement pour avancer. L'objectif de l'IA est justement d'automatiser le superflu pour vous concentrer uniquement sur la haute valeur ajoutée."
  },
  {
    question: "Comment se déroule l'appel stratégique après la candidature ?",
    answer: "L'appel dure environ 30 minutes. C'est une séance de diagnostic 100% objective de votre projet. Nous analysons la viabilité de votre idée et si nous pouvons réellement vous aider. Il n'y a aucune pression commerciale."
  },
  {
    question: "Que se passe-t-il si mon profil n'est pas retenu ?",
    answer: "Si nous estimons que ce n'est pas le bon moment ou que le programme n'est pas adapté à votre niveau actuel, nous vous orienterons en toute transparence vers des ressources ou des étapes préalables adaptées."
  }
]

export function AccompagnementPage() {
  // Navigation & Scroll State
  const scrollToForm = () => {
    const el = document.getElementById('formulaire-candidature')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // Form Multi-Step State
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<CandidatureFormData>(INITIAL_FORM_DATA)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0)

  const handleInputChange = (field: keyof CandidatureFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const validateStep = (step: number) => {
    if (step === 1) {
      if (!formData.nom.trim() || !formData.prenom.trim() || !formData.email.trim() || !formData.telephone.trim()) {
        toast.error('Veuillez remplir votre nom, prénom, email et téléphone.')
        return false
      }
      if (!formData.email.includes('@')) {
        toast.error('Veuillez saisir une adresse email valide.')
        return false
      }
    }
    if (step === 2) {
      if (!formData.projet_ia.trim()) {
        toast.error('Veuillez préciser ce que vous souhaitez construire.')
        return false
      }
    }
    if (step === 3) {
      if (!formData.projet_blocage.trim()) {
        toast.error('Veuillez indiquer votre principal blocage.')
        return false
      }
      if (!formData.projet_raison.trim()) {
        toast.error('Veuillez expliquer pourquoi maintenant.')
        return false
      }
    }
    if (step === 4) {
      if (!formData.candidat_raison.trim()) {
        toast.error('Veuillez expliquer pourquoi vous pensez être un bon candidat.')
        return false
      }
    }
    return true
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4))
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateStep(4)) return

    setIsSubmitting(true)

    try {
      const { error } = await supabase
        .from('accompagnement_candidatures')
        .insert([
          {
            nom: formData.nom.trim(),
            prenom: formData.prenom.trim(),
            email: formData.email.trim().toLowerCase(),
            telephone: formData.telephone.trim(),
            pays: formData.pays.trim(),
            projet_type: formData.projet_type,
            projet_ia: formData.projet_ia.trim(),
            projet_raison: formData.projet_raison.trim(),
            projet_blocage: formData.projet_blocage.trim(),
            deja_essaie: formData.deja_essaie,
            deja_essaie_details: formData.deja_essaie ? formData.deja_essaie_details.trim() : null,
            statut_actuel: formData.statut_actuel,
            heures_semaine: formData.heures_semaine,
            objectif_12m: formData.objectif_12m.trim(),
            pret_investir: formData.pret_investir,
            budget: formData.budget,
            candidat_raison: formData.candidat_raison.trim(),
          }
        ])

      if (error) {
        throw error
      }

      setIsSubmitted(true)
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      })
      toast.success('Votre candidature a été transmise avec succès !')
    } catch (err: any) {
      console.error('Erreur candidature:', err)
      toast.error('Une erreur est survenue lors de la transmission. Veuillez réessayer.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#111111] font-sans selection:bg-blue-600 selection:text-white antialiased">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-[#FAFAFA]/90 backdrop-blur-md border-b border-zinc-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <BrandLogo className="h-6 w-auto" />
            <span className="text-xs font-mono tracking-wider uppercase bg-zinc-900 text-white px-2 py-0.5 rounded">
              Accompagnement
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-zinc-600">
            <a href="#probleme" className="hover:text-zinc-900 transition-colors">Le Problème</a>
            <a href="#transformation" className="hover:text-zinc-900 transition-colors">La Transformation</a>
            <a href="#construisez" className="hover:text-zinc-900 transition-colors">Ce Que Vous Construisez</a>
            <a href="#pour-qui" className="hover:text-zinc-900 transition-colors">Pour Qui ?</a>
            <a href="#processus" className="hover:text-zinc-900 transition-colors">Processus</a>
            <a href="#faq" className="hover:text-zinc-900 transition-colors">FAQ</a>
          </nav>

          <button
            onClick={scrollToForm}
            className="px-4 py-2 bg-[#111111] hover:bg-zinc-800 text-white rounded-lg text-xs font-semibold transition-all shadow-xs hover:shadow-md cursor-pointer"
          >
            Candidater au programme
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-24 lg:pt-28 lg:pb-36 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Hero Left Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-6 space-y-6 text-left"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-800 text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                <span>Accompagnement Sur-Mesure • Places Limitées</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#111111] leading-[1.08]">
                Construisez un business rentable grâce à l'IA.
              </h1>

              <p className="text-base sm:text-lg text-zinc-600 font-normal leading-relaxed max-w-xl">
                Nous vous accompagnons pour transformer une idée, une compétence ou une expertise en un business moderne. Vous ne repartez pas avec une simple formation. Vous repartez avec un business construit avec nous.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <button
                  onClick={scrollToForm}
                  className="px-6 py-3.5 bg-[#111111] hover:bg-zinc-800 text-white rounded-xl text-sm font-semibold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer group"
                >
                  <span>Candidater au programme</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                <div className="flex items-center gap-2 text-xs text-zinc-500 justify-center sm:justify-start">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Sélection sur dossier & entretien</span>
                </div>
              </div>
            </motion.div>

            {/* Hero Right Mockup Showcase */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-6 w-full"
            >
              <AccompagnementHeroDashboard />
            </motion.div>

          </div>
        </div>
      </section>

      {/* Section: Le Problème */}
      <section id="probleme" className="py-24 lg:py-32 bg-white border-y border-zinc-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
            <span className="text-xs font-mono uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
              Le Problème
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#111111]">
              Apprendre l'IA ne suffit pas à construire un business.
            </h2>
            <p className="text-zinc-600 text-base leading-relaxed">
              Aujourd'hui, il est facile d'apprendre l'IA. Mais apprendre l'IA ne construit pas un business. Vous regardez des vidéos, vous testez des outils, vous accumulez des connaissances… mais votre projet n'avance pas. Ce qui manque n'est pas un nouvel outil. C'est une méthode, un système et un accompagnement.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Card 1: Le piège de la connaissance passive */}
            <div className="p-8 rounded-2xl bg-[#FAFAFA] border border-zinc-200 space-y-4 hover:border-zinc-300 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                <XCircle className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900">Le piège de la connaissance passive</h3>
              <ul className="space-y-3 text-xs text-zinc-600">
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">•</span>
                  <span>Accumulation infinie de vidéos YouTube et de prompts inutiles.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">•</span>
                  <span>Aucun système d'acquisition de clients ni offre claire.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">•</span>
                  <span>Sentiment d'être débordé par la vitesse des nouveaux outils.</span>
                </li>
              </ul>
            </div>

            {/* Card 2: Le système d'exécution guidée */}
            <div className="p-8 rounded-2xl bg-zinc-900 text-white border border-zinc-800 space-y-4 shadow-lg">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Le système d'exécution guidée</h3>
              <ul className="space-y-3 text-xs text-zinc-300">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Une offre positionnée sur un marché prêt à payer.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Des automatisations IA configurées spécifiquement pour votre business.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Un accompagnement pas à pas avec des experts pour franchir chaque blocage.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Section: La Transformation (Vertical Timeline) */}
      <section id="transformation" className="py-24 lg:py-36 bg-[#FAFAFA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-20">
            <span className="text-xs font-mono uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
              La Transformation
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#111111]">
              Ce que nous construisons ensemble.
            </h2>
            <p className="text-zinc-600 text-base">
              À la fin du programme, vous repartez avec un business structuré, un plan clair et un système que vous êtes capable de faire évoluer en autonomie.
            </p>
          </div>

          <div className="max-w-4xl mx-auto relative pl-6 sm:pl-10 border-l-2 border-zinc-200 space-y-16">
            
            {/* Step 1 */}
            <div className="relative group">
              <div className="absolute -left-[31px] sm:-left-[47px] top-0 w-8 h-8 rounded-full bg-white border-2 border-blue-600 flex items-center justify-center font-bold text-xs text-blue-600 shadow-xs">
                1
              </div>
              <div className="p-6 sm:p-8 rounded-2xl bg-white border border-zinc-200/80 shadow-2xs space-y-3">
                <div className="text-xs font-mono font-semibold text-blue-600 uppercase tracking-wider">Étape 01</div>
                <h3 className="text-xl font-bold text-zinc-900">Clarifier — Positionnement & Angle Unique</h3>
                <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                  Définition précise de votre angle d'attaque, étude du marché cible et validation de la proposition de valeur pour vous détacher de la concurrence.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative group">
              <div className="absolute -left-[31px] sm:-left-[47px] top-0 w-8 h-8 rounded-full bg-white border-2 border-purple-600 flex items-center justify-center font-bold text-xs text-purple-600 shadow-xs">
                2
              </div>
              <div className="p-6 sm:p-8 rounded-2xl bg-white border border-zinc-200/80 shadow-2xs space-y-3">
                <div className="text-xs font-mono font-semibold text-purple-600 uppercase tracking-wider">Étape 02</div>
                <h3 className="text-xl font-bold text-zinc-900">Construire — Offre High-Ticket & Tarification</h3>
                <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                  Packaging d'une offre irrésistible haute valeur, définition des livrables et des tarifs permettant une rentabilité dès les premiers clients.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative group">
              <div className="absolute -left-[31px] sm:-left-[47px] top-0 w-8 h-8 rounded-full bg-white border-2 border-amber-500 flex items-center justify-center font-bold text-xs text-amber-600 shadow-xs">
                3
              </div>
              <div className="p-6 sm:p-8 rounded-2xl bg-white border border-zinc-200/80 shadow-2xs space-y-3">
                <div className="text-xs font-mono font-semibold text-amber-600 uppercase tracking-wider">Étape 03</div>
                <h3 className="text-xl font-bold text-zinc-900">Lancer — Stratégie de Contenu & Acquisition</h3>
                <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                  Mise en place de votre funnel d'acquisition et de votre moteur de publication pour attirer des prospects qualifiés chaque semaine.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="relative group">
              <div className="absolute -left-[31px] sm:-left-[47px] top-0 w-8 h-8 rounded-full bg-white border-2 border-emerald-500 flex items-center justify-center font-bold text-xs text-emerald-600 shadow-xs">
                4
              </div>
              <div className="p-6 sm:p-8 rounded-2xl bg-white border border-zinc-200/80 shadow-2xs space-y-3">
                <div className="text-xs font-mono font-semibold text-emerald-600 uppercase tracking-wider">Étape 04</div>
                <h3 className="text-xl font-bold text-zinc-900">Automatiser — Systèmes IA & Agents sur-mesure</h3>
                <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                  Configuration et déploiement de vos workflows autonomes (capture de leads, qualification, génération de contenu, réponses clients).
                </p>
              </div>
            </div>

            {/* Step 5 */}
            <div className="relative group">
              <div className="absolute -left-[31px] sm:-left-[47px] top-0 w-8 h-8 rounded-full bg-white border-2 border-zinc-900 flex items-center justify-center font-bold text-xs text-zinc-900 shadow-xs">
                5
              </div>
              <div className="p-6 sm:p-8 rounded-2xl bg-zinc-900 text-white border border-zinc-800 shadow-md space-y-3">
                <div className="text-xs font-mono font-semibold text-blue-400 uppercase tracking-wider">Étape 05</div>
                <h3 className="text-xl font-bold text-white">Développer — Croissance & Autonomie</h3>
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                  Revue des performances, ajustements et passage à l'échelle pour pérenniser votre activité avec un minimum de temps opérationnel.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Section: Ce Que Vous Construisez (7 Cards Grid) */}
      <section id="construisez" className="py-24 lg:py-36 bg-white border-y border-zinc-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
            <span className="text-xs font-mono uppercase tracking-widest text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-100">
              Écosystème Produit
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#111111]">
              Les 7 piliers de votre business IA.
            </h2>
            <p className="text-zinc-600 text-base">
              Chaque module est conçu pour bâtir un actif tangible et mesurable dans votre entreprise.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Card 1 */}
            <div className="p-6 rounded-2xl bg-[#FAFAFA] border border-zinc-200/80 space-y-4 hover:shadow-sm transition-all">
              <OffreVisual />
              <h3 className="font-bold text-base text-zinc-900">1. Votre Offre</h3>
              <p className="text-xs text-zinc-600">
                Une proposition irrésistible clarifiée, packagée et prête à être vendue à des clients cibles.
              </p>
            </div>

            {/* Card 2 */}
            <div className="p-6 rounded-2xl bg-[#FAFAFA] border border-zinc-200/80 space-y-4 hover:shadow-sm transition-all">
              <PositionnementVisual />
              <h3 className="font-bold text-base text-zinc-900">2. Votre Positionnement</h3>
              <p className="text-xs text-zinc-600">
                Un message différenciant qui vous extrait instantanément de la masse des concurrents.
              </p>
            </div>

            {/* Card 3 */}
            <div className="p-6 rounded-2xl bg-[#FAFAFA] border border-zinc-200/80 space-y-4 hover:shadow-sm transition-all">
              <ContenuVisual />
              <h3 className="font-bold text-base text-zinc-900">3. Votre Contenu</h3>
              <p className="text-xs text-zinc-600">
                Une machine à produire du contenu d'autorité régulier sans y passer des heures.
              </p>
            </div>

            {/* Card 4 */}
            <div className="p-6 rounded-2xl bg-[#FAFAFA] border border-zinc-200/80 space-y-4 hover:shadow-sm transition-all">
              <AcquisitionVisual />
              <h3 className="font-bold text-base text-zinc-900">4. Votre Acquisition</h3>
              <p className="text-xs text-zinc-600">
                Un tunnel de conversion automatisé qui filtre et qualifie les prospects avant l'appel.
              </p>
            </div>

            {/* Card 5 */}
            <div className="p-6 rounded-2xl bg-[#FAFAFA] border border-zinc-200/80 space-y-4 hover:shadow-sm transition-all">
              <SystemeVisual />
              <h3 className="font-bold text-base text-zinc-900">5. Votre Système</h3>
              <p className="text-xs text-zinc-600">
                Une architecture de gestion opérationnelle centralisée et connectée en no-code.
              </p>
            </div>

            {/* Card 6 */}
            <div className="p-6 rounded-2xl bg-[#FAFAFA] border border-zinc-200/80 space-y-4 hover:shadow-sm transition-all">
              <AutomatisationsVisual />
              <h3 className="font-bold text-base text-zinc-900">6. Vos Automatisations</h3>
              <p className="text-xs text-zinc-600">
                Des agents IA personnalisés qui prennent en charge les tâches répétitives.
              </p>
            </div>

            {/* Card 7 (Full Span on LG) */}
            <div className="md:col-span-2 lg:col-span-3 p-6 rounded-2xl bg-zinc-900 text-white border border-zinc-800 space-y-4">
              <BusinessVisual />
              <h3 className="font-bold text-base text-white">7. Votre Business en Autonomie</h3>
              <p className="text-xs text-zinc-400 max-w-2xl">
                Un modèle économique structuré qui génère des revenus prédictibles et vous laisse le contrôle total de votre temps.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Section: Pour Qui ? (Matrix) */}
      <section id="pour-qui" className="py-24 lg:py-36 bg-[#FAFAFA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
            <span className="text-xs font-mono uppercase tracking-widest text-zinc-600 bg-zinc-200/60 px-3 py-1 rounded-full">
              Sélection & Exigence
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#111111]">
              Est-ce fait pour vous ?
            </h2>
            <p className="text-zinc-600 text-base">
              Nous sélectionnons rigoureusement les candidats pour garantir 100% de réussite.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            
            {/* Column A: Programme Idéal */}
            <div className="p-8 rounded-2xl bg-white border border-zinc-200 shadow-2xs space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-zinc-100">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                  ✓
                </div>
                <h3 className="text-lg font-bold text-zinc-900">Le programme est idéal si :</h3>
              </div>

              <ul className="space-y-4 text-xs sm:text-sm text-zinc-700">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Vous souhaitez construire un vrai business sérieux et pérenne avec l'IA.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Vous disposez d'au moins 5 heures par semaine à consacrer à l'exécution.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Vous êtes prêt à investir sur vous-même pour accélérer vos résultats.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Vous valorisez un accompagnement personnalisé plutôt que des cours génériques.</span>
                </li>
              </ul>
            </div>

            {/* Column B: Non Adapté */}
            <div className="p-8 rounded-2xl bg-white border border-zinc-200 shadow-2xs space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-zinc-100">
                <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-sm">
                  ✕
                </div>
                <h3 className="text-lg font-bold text-zinc-900">Ce programme n'est PAS pour vous si :</h3>
              </div>

              <ul className="space-y-4 text-xs sm:text-sm text-zinc-700">
                <li className="flex items-start gap-3">
                  <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>Vous cherchez une formule magique "enrichissement rapide sans travail".</span>
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>Vous souhaitez uniquement consommer des vidéos sans passer à l'action.</span>
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>Vous n'avez aucun temps ni budget à investir dans votre projet.</span>
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>Vous refusez d'appliquer les recommandations du coach.</span>
                </li>
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* Section: Processus de Candidature */}
      <section id="processus" className="py-24 lg:py-36 bg-white border-y border-zinc-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-20">
            <span className="text-xs font-mono uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
              Le Parcours Candidat
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#111111]">
              Processus de candidature simple & transparent.
            </h2>
            <p className="text-zinc-600 text-base">
              Une démarche claire en 4 étapes pour valider notre alignement.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto relative">
            
            {/* Step 1 */}
            <div className="p-6 rounded-2xl bg-[#FAFAFA] border border-zinc-200 space-y-3 relative">
              <div className="w-8 h-8 rounded-lg bg-[#111111] text-white flex items-center justify-center font-mono font-bold text-xs">
                01
              </div>
              <h3 className="font-bold text-zinc-900 text-base">Vous candidatez</h3>
              <p className="text-xs text-zinc-600">
                Vous remplissez le formulaire détaillé ci-dessous pour présenter votre profil et vos objectifs.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl bg-[#FAFAFA] border border-zinc-200 space-y-3 relative">
              <div className="w-8 h-8 rounded-lg bg-[#111111] text-white flex items-center justify-center font-mono font-bold text-xs">
                02
              </div>
              <h3 className="font-bold text-zinc-900 text-base">Analyse du dossier</h3>
              <p className="text-xs text-zinc-600">
                Notre équipe étudie votre projet sous 24h à 48h pour vérifier le potentiel et la faisabilité.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl bg-[#FAFAFA] border border-zinc-200 space-y-3 relative">
              <div className="w-8 h-8 rounded-lg bg-[#111111] text-white flex items-center justify-center font-mono font-bold text-xs">
                03
              </div>
              <h3 className="font-bold text-zinc-900 text-base">Appel stratégique</h3>
              <p className="text-xs text-zinc-600">
                Échange individuel de 30 minutes pour approfondir vos besoins et valider l'accompagnement.
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-6 rounded-2xl bg-zinc-900 text-white border border-zinc-800 space-y-3 relative">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-mono font-bold text-xs">
                04
              </div>
              <h3 className="font-bold text-white text-base">Admission ou Orientation</h3>
              <p className="text-xs text-zinc-300">
                Si validé, vous rejoignez le programme. Sinon, nous vous orientons vers la solution adaptée.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Section: FAQ */}
      <section id="faq" className="py-24 lg:py-32 bg-[#FAFAFA]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-mono uppercase tracking-widest text-zinc-600 bg-zinc-200/60 px-3 py-1 rounded-full">
              Questions Fréquentes
            </span>
            <h2 className="text-3xl font-bold text-[#111111]">Toutes les réponses à vos questions.</h2>
          </div>

          <div className="space-y-4">
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = openFaqIndex === idx
              return (
                <div
                  key={idx}
                  className="rounded-xl bg-white border border-zinc-200 overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full p-5 text-left font-semibold text-sm text-zinc-900 flex items-center justify-between gap-4 cursor-pointer hover:bg-zinc-50"
                  >
                    <span>{item.question}</span>
                    <ChevronRight className={`w-4 h-4 text-zinc-400 transition-transform ${isOpen ? 'rotate-90 text-zinc-900' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="px-5 pb-5 text-xs text-zinc-600 leading-relaxed border-t border-zinc-100 pt-3"
                      >
                        {item.answer}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Section: Formulaire de Candidature SaaS */}
      <section id="formulaire-candidature" className="py-24 lg:py-36 bg-white border-t border-zinc-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100 text-xs font-mono uppercase tracking-wider">
              Dossier de Candidature
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#111111]">
              Posez votre candidature au programme.
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600">
              Complétez ce formulaire avec précision. Temps estimé : 3 minutes.
            </p>
          </div>

          {/* Form Card Container */}
          <div className="p-6 sm:p-10 rounded-2xl bg-[#FAFAFA] border border-zinc-200 shadow-sm relative overflow-hidden">
            
            {isSubmitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-12 text-center space-y-4"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-zinc-900">Candidature bien reçue !</h3>
                <p className="text-xs sm:text-sm text-zinc-600 max-w-md mx-auto leading-relaxed">
                  Merci <strong>{formData.prenom}</strong>. Notre équipe étudie actuellement votre dossier. Si votre profil correspond, nous vous contacterons sous 24h à 48h pour planifier votre appel stratégique.
                </p>
                <div className="pt-4">
                  <Link
                    to="/"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-zinc-900 text-white rounded-lg text-xs font-semibold hover:bg-zinc-800 transition-all"
                  >
                    <span>Retourner à l'accueil</span>
                  </Link>
                </div>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-zinc-500">
                    <span>Étape {currentStep} sur 4</span>
                    <span>{currentStep * 25}% complété</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-zinc-200 overflow-hidden">
                    <motion.div
                      className="h-full bg-blue-600"
                      initial={{ width: '25%' }}
                      animate={{ width: `${currentStep * 25}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>

                {/* STEP 1: Identification */}
                {currentStep === 1 && (
                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-4"
                  >
                    <h3 className="text-base font-bold text-zinc-900 border-b border-zinc-200 pb-2">
                      1. Identité & Coordonnées
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-zinc-700">Nom *</label>
                        <input
                          type="text"
                          value={formData.nom}
                          onChange={e => handleInputChange('nom', e.target.value)}
                          placeholder="Dupont"
                          className="w-full px-3 py-2 rounded-lg bg-white border border-zinc-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-zinc-700">Prénom *</label>
                        <input
                          type="text"
                          value={formData.prenom}
                          onChange={e => handleInputChange('prenom', e.target.value)}
                          placeholder="Jean"
                          className="w-full px-3 py-2 rounded-lg bg-white border border-zinc-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-zinc-700">Email professionnel *</label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={e => handleInputChange('email', e.target.value)}
                          placeholder="jean.dupont@exemple.com"
                          className="w-full px-3 py-2 rounded-lg bg-white border border-zinc-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-zinc-700">Téléphone (WhatsApp) *</label>
                        <input
                          type="tel"
                          value={formData.telephone}
                          onChange={e => handleInputChange('telephone', e.target.value)}
                          placeholder="+33 6 12 34 56 78"
                          className="w-full px-3 py-2 rounded-lg bg-white border border-zinc-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-zinc-700">Pays de résidence</label>
                      <input
                        type="text"
                        value={formData.pays}
                        onChange={e => handleInputChange('pays', e.target.value)}
                        placeholder="France, Belgique, Suisse, Canada..."
                        className="w-full px-3 py-2 rounded-lg bg-white border border-zinc-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                      />
                    </div>
                  </motion.div>
                )}

                {/* STEP 2: Projet */}
                {currentStep === 2 && (
                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-4"
                  >
                    <h3 className="text-base font-bold text-zinc-900 border-b border-zinc-200 pb-2">
                      2. Votre Projet & Vision
                    </h3>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-zinc-700">Quel est votre projet principal ? *</label>
                      <select
                        value={formData.projet_type}
                        onChange={e => handleInputChange('projet_type', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-white border border-zinc-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                      >
                        {PROJET_TYPES.map(pt => (
                          <option key={pt} value={pt}>{pt}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-zinc-700">Où en êtes-vous actuellement ? *</label>
                      <select
                        value={formData.statut_actuel}
                        onChange={e => handleInputChange('statut_actuel', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-white border border-zinc-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                      >
                        {STATUTS_ACTUELS.map(st => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-zinc-700">Que souhaitez-vous construire précisément grâce à l'IA ? *</label>
                      <textarea
                        rows={3}
                        value={formData.projet_ia}
                        onChange={e => handleInputChange('projet_ia', e.target.value)}
                        placeholder="Décrivez votre idée, vos compétences ou votre service envisagé..."
                        className="w-full px-3 py-2 rounded-lg bg-white border border-zinc-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                        required
                      />
                    </div>
                  </motion.div>
                )}

                {/* STEP 3: Expérience & Blocages */}
                {currentStep === 3 && (
                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-4"
                  >
                    <h3 className="text-base font-bold text-zinc-900 border-b border-zinc-200 pb-2">
                      3. Vos Enjeux & Freins
                    </h3>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-zinc-700">Quel est votre principal blocage aujourd'hui ? *</label>
                      <textarea
                        rows={2}
                        value={formData.projet_blocage}
                        onChange={e => handleInputChange('projet_blocage', e.target.value)}
                        placeholder="Manque de méthode, d'offre, d'acquisition, difficulté technique..."
                        className="w-full px-3 py-2 rounded-lg bg-white border border-zinc-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-zinc-700">Pourquoi souhaitez-vous vous lancer maintenant ? *</label>
                      <textarea
                        rows={2}
                        value={formData.projet_raison}
                        onChange={e => handleInputChange('projet_raison', e.target.value)}
                        placeholder="Pourquoi ce projet est-il prioritaire pour vous aujourd'hui ?"
                        className="w-full px-3 py-2 rounded-lg bg-white border border-zinc-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                        required
                      />
                    </div>

                    <div className="space-y-2 pt-2">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-zinc-700">
                        <input
                          type="checkbox"
                          checked={formData.deja_essaie}
                          onChange={e => handleInputChange('deja_essaie', e.target.checked)}
                          className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                        />
                        <span>Avez-vous déjà essayé d'autres formations ou accompagnements par le passé ?</span>
                      </label>

                      {formData.deja_essaie && (
                        <input
                          type="text"
                          value={formData.deja_essaie_details}
                          onChange={e => handleInputChange('deja_essaie_details', e.target.value)}
                          placeholder="Précisez rapidement ce que vous avez testé et pourquoi cela n'a pas suffi..."
                          className="w-full px-3 py-2 rounded-lg bg-white border border-zinc-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                        />
                      )}
                    </div>
                  </motion.div>
                )}

                {/* STEP 4: Engagement */}
                {currentStep === 4 && (
                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-4"
                  >
                    <h3 className="text-base font-bold text-zinc-900 border-b border-zinc-200 pb-2">
                      4. Engagement & Candidature
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-zinc-700">Temps disponible chaque semaine ? *</label>
                        <select
                          value={formData.heures_semaine}
                          onChange={e => handleInputChange('heures_semaine', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-white border border-zinc-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                        >
                          {HEURES_SEMAINE_OPTIONS.map(h => (
                            <option key={h} value={h}>{h}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-zinc-700">Quel budget êtes-vous prêt à investir ? *</label>
                        <select
                          value={formData.budget}
                          onChange={e => handleInputChange('budget', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-white border border-zinc-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                        >
                          {BUDGET_OPTIONS.map(b => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-zinc-700">Êtes-vous prêt à investir dans un accompagnement si nous retenons votre dossier ? *</label>
                      <select
                        value={formData.pret_investir}
                        onChange={e => handleInputChange('pret_investir', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-white border border-zinc-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                      >
                        {PRET_INVESTIR_OPTIONS.map(pi => (
                          <option key={pi} value={pi}>{pi}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-zinc-700">Objectif de chiffre d'affaires dans les 12 prochains mois ?</label>
                      <input
                        type="text"
                        value={formData.objectif_12m}
                        onChange={e => handleInputChange('objectif_12m', e.target.value)}
                        placeholder="Ex: 5 000 € / mois, 100 000 € / an..."
                        className="w-full px-3 py-2 rounded-lg bg-white border border-zinc-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-zinc-700">Pourquoi pensez-vous être le bon candidat pour ce programme ? *</label>
                      <textarea
                        rows={3}
                        value={formData.candidat_raison}
                        onChange={e => handleInputChange('candidat_raison', e.target.value)}
                        placeholder="Exprimez votre motivation et votre détermination à exécuter les actions..."
                        className="w-full px-3 py-2 rounded-lg bg-white border border-zinc-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                        required
                      />
                    </div>
                  </motion.div>
                )}

                {/* Form Buttons Navigation */}
                <div className="flex items-center justify-between pt-4 border-t border-zinc-200">
                  {currentStep > 1 ? (
                    <button
                      type="button"
                      onClick={prevStep}
                      className="px-4 py-2 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Précédent</span>
                    </button>
                  ) : (
                    <div />
                  )}

                  {currentStep < 4 ? (
                    <button
                      type="button"
                      onClick={nextStep}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-all shadow-xs flex items-center gap-1 cursor-pointer ml-auto"
                    >
                      <span>Étape suivante</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-3 bg-[#111111] hover:bg-zinc-800 text-white rounded-lg text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50 ml-auto"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                          <span>Transmission en cours...</span>
                        </>
                      ) : (
                        <>
                          <span>Envoyer ma candidature</span>
                          <Check className="w-4 h-4 text-emerald-400" />
                        </>
                      )}
                    </button>
                  )}
                </div>

              </form>
            )}

          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-[#FAFAFA] border-t border-zinc-200 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 space-y-3">
          <p>© {new Date().getFullYear()} Le Club IA — Accompagnement Business Premium. Tous droits réservés.</p>
          <div className="flex items-center justify-center gap-6 text-zinc-400">
            <Link to="/mentions-legales" className="hover:text-zinc-700">Mentions Légales</Link>
            <Link to="/confidentialite" className="hover:text-zinc-700">Confidentialité</Link>
            <Link to="/cgu" className="hover:text-zinc-700">CGU</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
