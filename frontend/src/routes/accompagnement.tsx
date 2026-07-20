import { useEffect, useState } from 'react'
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
  CheckCircle,
  TrendingUp,
  Layers,
  Search,
  MessageSquare
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import confetti from 'canvas-confetti'
import { BrandLogo } from '@/components/brand-logo'
import { supabase } from '@/lib/supabase'
import { DashboardIllustration } from '@/components/landing/dashboard-illustration'
import { FaqAccordion, type FaqItem } from '@/components/landing/faq-accordion'

export const Route = createFileRoute('/accompagnement')({
  component: AccompagnementPage,
})

// Options des questions du formulaire
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

// Questions FAQ
const FAQ_ITEMS: FaqItem[] = [
  {
    question: "Quelle est la différence entre le Club IA et ce programme d'accompagnement ?",
    answer: "Le Club IA est une communauté privée autonome avec des formations en libre accès. L'accompagnement premium est un programme intensif sur-mesure dans lequel nous construisons votre business AVEC vous, étape par étape, avec un suivi direct et des automatisations IA configurées pour vous."
  },
  {
    question: "Faut-il avoir des compétences techniques en programmation ?",
    answer: "Non, absolument pas. Nous utilisons des outils d'IA no-code et des architectures pré-construites. Vous n'avez pas besoin de savoir coder pour construire et automatiser votre activité."
  },
  {
    question: "Combien de temps faut-il y consacrer chaque semaine ?",
    answer: "Entre 5 et 10 heures par semaine suffisent pour avancer efficacement. L'objectif est d'optimiser votre temps grâce à l'IA, pas de vous surcharger."
  },
  {
    question: "Comment se déroule l'appel stratégique après la candidature ?",
    answer: "L'appel dure environ 30 minutes. Il s'agit d'un diagnostic 100% objectif de votre projet. Nous analysons si notre accompagnement est la solution optimale pour vous. Il n'y a aucune pression commerciale."
  },
  {
    question: "Que se passe-t-il si mon profil n'est pas retenu pour l'accompagnement ?",
    answer: "Si nous estimons que ce n'est pas le bon moment ou que votre projet correspond mieux à une autre étape, nous vous orienterons en toute transparence vers le Club IA ou vers des ressources adaptées."
  }
]

// Phases de transformation
const TRANSFORMATION_STEPS = [
  {
    num: '01',
    title: 'Clarifier',
    subtitle: 'Positionnement • Client • Offre',
    desc: 'Définir un positionnement unique et une offre irrésistible qui répond à un vrai besoin de marché.',
    deliverables: ['Audit de profil & compétences', 'Avatar client idéal', 'Promesse de vente à haute valeur']
  },
  {
    num: '02',
    title: 'Construire',
    subtitle: 'Contenu • Audience • Automatisation',
    desc: 'Créer votre système de contenu et déployer vos agents & automatisations IA sur-mesure.',
    deliverables: ['Matrice de contenu IA', 'Automatisations (Make, OpenAI, Prompts)', 'Produits digitaux ou services packagés']
  },
  {
    num: '03',
    title: 'Lancer',
    subtitle: 'Acquisition • Ventes • Tunnel',
    desc: 'Mettre en ligne votre tunnel d\'acquisition et convertir vos premiers prospects qualifiés.',
    deliverables: ['Tunnel de conversion prêt-à-vendre', 'Script de diagnostic & vente', 'Premiers prospects engagés']
  },
  {
    num: '04',
    title: 'Optimiser',
    subtitle: 'Système • Croissance • Automatisation',
    desc: 'Simplifier vos opérations pour maximiser la rentabilité et déléguer 80% des tâches répétitives à l\'IA.',
    deliverables: ['Analyse de performance', 'Délégation totale aux assistants IA', 'Business prêt à scaler']
  }
]

function AccompagnementPage() {
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [activeImmersiveStep, setActiveImmersiveStep] = useState(0)

  // Formulaire State
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

  const handleChange = (field: keyof typeof formData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

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
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.6 },
      })
      toast.success('Votre candidature a été transmise avec succès !')
    } catch (err: any) {
      console.error('Erreur lors de la soumission de la candidature:', err)
      toast.error('Erreur lors de l\'envoi. Veuillez réessayer.')
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    if (step > 1 && !submitted) {
      const formEl = document.getElementById('qualification-form-section')
      if (formEl) {
        formEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
  }, [step])

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#111111] antialiased selection:bg-indigo-500 selection:text-white">
      {/* Header Premium SaaS */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-gray-200/60 bg-[#FAFAFA]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-[1100px] items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-3 transition-opacity hover:opacity-90">
            <BrandLogo size="md" variant="primary" asLink={false} />
            <span className="font-display text-base font-bold tracking-tight text-gray-900">
              Le Club IA
            </span>
          </Link>

          <nav className="flex items-center gap-6 sm:gap-8">
            <Link
              to="/"
              className="text-xs font-semibold text-gray-500 transition-colors hover:text-gray-900"
            >
              Accueil
            </Link>
            <button
              onClick={() => scrollToSection('transformation')}
              className="hidden text-xs font-semibold text-gray-500 transition-colors hover:text-gray-900 sm:inline-block"
            >
              Programme
            </button>
            <button
              onClick={() => scrollToSection('processus')}
              className="hidden text-xs font-semibold text-gray-500 transition-colors hover:text-gray-900 sm:inline-block"
            >
              Processus
            </button>
            <button
              onClick={() => scrollToSection('faq')}
              className="hidden text-xs font-semibold text-gray-500 transition-colors hover:text-gray-900 sm:inline-block"
            >
              FAQ
            </button>
            <button
              onClick={() => scrollToSection('qualifier')}
              className="rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-indigo-500/20 transition-all hover:scale-105 hover:shadow-indigo-500/30"
            >
              Candidater au programme
            </button>
          </nav>
        </div>
      </header>

      <main className="pt-20">
        {/* ================= HERO SECTION ================= */}
        <section className="relative overflow-hidden px-6 py-24 lg:py-32">
          {/* Accent glow de fond */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-40 left-1/2 h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-gradient-to-b from-blue-500/10 via-indigo-500/10 to-transparent blur-3xl"
          />

          <div className="mx-auto max-w-[1100px]">
            <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
              {/* Gauche : Textes */}
              <div className="lg:col-span-7">
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-indigo-50/70 px-3.5 py-1 text-[11px] font-bold uppercase tracking-widest text-indigo-700 shadow-sm"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-pulse" />
                  Accompagnement Business Premium
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="mt-6 font-display text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl leading-[1.08]"
                >
                  Construisez un business{' '}
                  <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
                    rentable
                  </span>{' '}
                  grâce à l'IA.
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="mt-6 text-base leading-relaxed text-gray-600 sm:text-lg"
                >
                  Passez de l'idée à un véritable business accompagné étape par étape.
                  Nous vous aidons à transformer vos compétences, vos idées ou votre expertise en un business moderne grâce à l'IA.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="mt-6 space-y-2 border-l-2 border-indigo-600/80 pl-4 text-sm font-semibold text-gray-800"
                >
                  <p>Vous ne repartez pas avec une simple formation.</p>
                  <p className="text-indigo-600 font-bold">
                    Vous repartez avec un business construit avec nous.
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center"
                >
                  <button
                    onClick={() => scrollToSection('qualifier')}
                    className="group inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-8 py-4 text-sm font-bold text-white shadow-xl shadow-indigo-500/25 transition-all hover:scale-105 hover:shadow-indigo-500/35"
                  >
                    Candidater au programme
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </button>

                  <span className="text-xs text-gray-500 font-medium">
                    ⚡ Places limitées • Sélection sur dossier
                  </span>
                </motion.div>
              </div>

              {/* Droite : Illustration SaaS Dashboard */}
              <div className="lg:col-span-5">
                <DashboardIllustration />
              </div>
            </div>
          </div>
        </section>

        {/* ================= SECTION PROBLÈME ================= */}
        <section className="border-t border-gray-200/60 bg-white px-6 py-24 lg:py-32">
          <div className="mx-auto max-w-[1100px]">
            <div className="mx-auto max-w-3xl text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100/80 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-rose-700">
                <AlertCircle className="h-3.5 w-3.5" />
                Le Constat Brutal
              </span>
              <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
                Pourquoi la majorité des personnes n'arrivent jamais à construire un business avec l'IA ?
              </h2>
            </div>

            <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { title: "Trop d'informations", desc: "Surchargé de vidéos, d'articles et d'actualités contradictoires sans savoir par quoi commencer." },
                { title: "Trop d'outils", desc: "Tester 50 applications IA par semaine sans jamais finaliser une seule mise en production." },
                { title: "Aucun plan", desc: "Naviguer à vue jour après jour sans feuille de route claire ni objectifs intermédiaires." },
                { title: "Beaucoup de théorie", desc: "Comprendre les principes du Prompt Engineering mais ne rien appliquer concrètement." },
                { title: "Peu d'exécution", desc: "Rester bloqué au stade de l'idée par manque de soutien et de responsabilisation." }
              ].map((prob, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.08 }}
                  className="rounded-2xl border border-gray-200/80 bg-[#FAFAFA] p-6 shadow-sm transition-all hover:bg-white hover:shadow-md hover:border-gray-300"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 text-rose-600 font-bold text-sm">
                    ✕
                  </div>
                  <h3 className="mt-4 font-display text-lg font-bold text-gray-900">
                    {prob.title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-gray-600">
                    {prob.desc}
                  </p>
                </motion.div>
              ))}

              {/* Carte de conclusion remarquable */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="flex flex-col justify-center rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-600 to-violet-700 p-6 text-white shadow-xl shadow-indigo-500/20 sm:col-span-2 lg:col-span-1"
              >
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">
                  Le diagnostic réel
                </span>
                <h3 className="mt-2 font-display text-xl font-extrabold leading-snug">
                  Le problème n'est pas l'IA. <br />
                  Le problème est l'absence d'un système.
                </h3>
                <p className="mt-3 text-xs text-indigo-100 leading-relaxed">
                  C'est précisément la structure et l'exécution que nous vous apportons.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ================= SECTION TRANSFORMATION (TIMELINE PREMIUM) ================= */}
        <section id="transformation" className="px-6 py-24 lg:py-32">
          <div className="mx-auto max-w-[1100px]">
            <div className="mx-auto max-w-3xl text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100/80 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                <Workflow className="h-3.5 w-3.5" />
                La Feuille de Route
              </span>
              <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
                Ce que nous construisons ensemble.
              </h2>
              <p className="mt-4 text-base text-gray-600">
                Un parcours fluide en 4 étapes claires pour passer de l'idée à une entreprise rentable.
              </p>
            </div>

            <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {TRANSFORMATION_STEPS.map((stepItem, idx) => (
                <motion.div
                  key={stepItem.num}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className="group relative rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-200"
                >
                  <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <span className="font-display text-2xl font-black text-indigo-600">
                      Étape {stepItem.num}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Phase {idx + 1}
                    </span>
                  </div>

                  <h3 className="mt-4 font-display text-xl font-bold text-gray-900">
                    {stepItem.title}
                  </h3>
                  <div className="mt-1 text-xs font-semibold text-indigo-600">
                    {stepItem.subtitle}
                  </div>

                  <p className="mt-3 text-xs leading-relaxed text-gray-600">
                    {stepItem.desc}
                  </p>

                  <div className="mt-6 space-y-2 border-t border-gray-100 pt-4">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Livrables :
                    </div>
                    {stepItem.deliverables.map((deliv, dIdx) => (
                      <div key={dIdx} className="flex items-center gap-2 text-xs text-gray-700 font-medium">
                        <Check className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                        <span>{deliv}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ================= SECTION RÉSULTATS ================= */}
        <section className="border-t border-gray-200/60 bg-white px-6 py-24 lg:py-32">
          <div className="mx-auto max-w-[1100px]">
            <div className="mx-auto max-w-3xl text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/80 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Résultats Garantis
              </span>
              <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
                À la fin du programme, vous repartez avec :
              </h2>
            </div>

            <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { title: "Une offre claire", desc: "Packagée, prête à être vendue au juste prix.", icon: Target },
                { title: "Un positionnement", desc: "Distinction nette face à la concurrence.", icon: Sparkles },
                { title: "Une stratégie de contenu", desc: "Système de création assisté par IA.", icon: Compass },
                { title: "Un système d'acquisition", desc: "Tunnel d'attraction et de conversion.", icon: Zap },
                { title: "Vos automatisations IA", desc: "Agents configurés pour vos opérations.", icon: Bot },
                { title: "Votre feuille de route", desc: "Plan d'action clair pour les 12 prochains mois.", icon: Layers },
                { title: "Votre business construit", desc: "Une entreprise moderne fonctionnelle.", icon: Rocket },
                { title: "Un accompagnement", desc: "Suivi continu et réponses à toutes vos questions.", icon: ShieldCheck },
              ].map((res, idx) => {
                const IconComp = res.icon
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: idx * 0.05 }}
                    className="flex items-start gap-3.5 rounded-2xl border border-gray-200/80 bg-[#FAFAFA] p-5 shadow-sm transition-all hover:bg-white hover:shadow-md hover:border-gray-300"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                      <IconComp className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-display text-sm font-bold text-gray-900">
                        {res.title}
                      </h3>
                      <p className="mt-1 text-xs text-gray-600 leading-relaxed">
                        {res.desc}
                      </p>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </section>

        {/* ================= SECTION POUR QUI ================= */}
        <section className="px-6 py-24 lg:py-32">
          <div className="mx-auto max-w-[1100px]">
            <div className="grid gap-8 md:grid-cols-2">
              {/* ✅ Fait pour vous si */}
              <div className="rounded-3xl border border-emerald-200/80 bg-white p-8 shadow-xl shadow-emerald-500/5">
                <div className="flex items-center gap-3 border-b border-gray-100 pb-5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold">
                    ✓
                  </div>
                  <h3 className="font-display text-xl font-bold text-gray-900">
                    Ce programme est fait pour vous si :
                  </h3>
                </div>

                <div className="mt-6 space-y-4">
                  {[
                    "Vous voulez créer un business grâce à l'IA.",
                    "Vous êtes prêt à passer à l'action.",
                    "Vous cherchez un accompagnement.",
                    "Vous voulez accélérer."
                  ].map((text, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span className="text-sm font-semibold text-gray-800">{text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ❌ Pas fait pour vous si */}
              <div className="rounded-3xl border border-rose-200/80 bg-white p-8 shadow-xl shadow-rose-500/5">
                <div className="flex items-center gap-3 border-b border-gray-100 pb-5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-rose-600 font-bold">
                    ✕
                  </div>
                  <h3 className="font-display text-xl font-bold text-gray-900">
                    Ce programme n'est pas fait pour vous si :
                  </h3>
                </div>

                <div className="mt-6 space-y-4">
                  {[
                    "Vous cherchez une méthode miracle.",
                    "Vous ne souhaitez pas exécuter.",
                    "Vous voulez uniquement apprendre ChatGPT.",
                    "Vous cherchez une formation passive."
                  ].map((text, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <XCircle className="h-4 w-4 text-rose-500 shrink-0" />
                      <span className="text-sm font-medium text-gray-600">{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= SECTION MÉTHODE IMMERSIVE (APPLE-STYLE SCROLL / STEPPER) ================= */}
        <section className="border-t border-gray-200/60 bg-white px-6 py-24 lg:py-32">
          <div className="mx-auto max-w-[1100px]">
            <div className="mx-auto max-w-3xl text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100/80 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                <Sliders className="h-3.5 w-3.5" />
                Progression Immersive
              </span>
              <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
                Suivez votre progression étape par étape.
              </h2>
              <p className="mt-4 text-base text-gray-600">
                Visualisez votre avancée dans le programme comme si vous y étiez.
              </p>
            </div>

            {/* Selector Buttons */}
            <div className="mt-12 flex justify-center gap-2 overflow-x-auto pb-2">
              {TRANSFORMATION_STEPS.map((s, idx) => {
                const isActive = activeImmersiveStep === idx
                return (
                  <button
                    key={s.num}
                    type="button"
                    onClick={() => setActiveImmersiveStep(idx)}
                    className={`rounded-full px-5 py-2.5 text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Étape {s.num} : {s.title}
                  </button>
                )
              })}
            </div>

            {/* Dynamic Step Display */}
            <div className="mt-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeImmersiveStep}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.4 }}
                  className="rounded-3xl border border-gray-200/80 bg-[#FAFAFA] p-8 shadow-xl"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
                    <div className="space-y-4 lg:max-w-md">
                      <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                        Phase 0{activeImmersiveStep + 1}
                      </span>
                      <h3 className="font-display text-3xl font-extrabold text-gray-900">
                        {TRANSFORMATION_STEPS[activeImmersiveStep].title}
                      </h3>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {TRANSFORMATION_STEPS[activeImmersiveStep].desc}
                      </p>
                      <div className="space-y-2 pt-2">
                        {TRANSFORMATION_STEPS[activeImmersiveStep].deliverables.map((item, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs font-semibold text-gray-800">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm flex-1 max-w-lg">
                      <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                        Aperçu de la phase
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs font-semibold text-gray-800">
                          <span>Statut du programme :</span>
                          <span className="text-indigo-600 font-bold">En progression (Étape {activeImmersiveStep + 1}/4)</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-500"
                            style={{ width: `${((activeImmersiveStep + 1) / 4) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </section>

        {/* ================= SECTION PROCESSUS ================= */}
        <section id="processus" className="px-6 py-24 lg:py-32">
          <div className="mx-auto max-w-[1100px]">
            <div className="mx-auto max-w-3xl text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100/80 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-blue-700">
                <ShieldCheck className="h-3.5 w-3.5" />
                Transparence & Confiance
              </span>
              <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
                Comment rejoindre le programme ?
              </h2>
              <p className="mt-4 text-base text-gray-600">
                Un processus simple, sans aucune pression commerciale.
              </p>
            </div>

            <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { step: "01", title: "Vous candidatez", desc: "Remplissez le formulaire de qualification en bas de page." },
                { step: "02", title: "Nous analysons", desc: "Étude attentive de votre profil et de votre projet sous 24h à 48h." },
                { step: "03", title: "Appel stratégique", desc: "Échange de 30 min basé sur le diagnostic et la faisabilité." },
                { step: "04", title: "Intégration", desc: "Si retenu, vous rejoignez le programme. Sinon, orientation vers le Club IA." }
              ].map((p, idx) => (
                <div key={idx} className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm">
                  <span className="font-display text-xs font-bold uppercase tracking-wider text-indigo-600">
                    Étape {p.step}
                  </span>
                  <h3 className="mt-2 font-display text-lg font-bold text-gray-900">
                    {p.title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-gray-600">
                    {p.desc}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-12 text-center">
              <div className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-3 text-xs font-semibold text-gray-700 shadow-sm">
                💡 <span className="text-gray-900 font-bold">Aucune pression commerciale.</span> Notre objectif est uniquement de valider si nous pouvons réellement vous aider à réussir.
              </div>
            </div>
          </div>
        </section>

        {/* ================= SECTION FAQ ================= */}
        <section id="faq" className="border-t border-gray-200/60 bg-white px-6 py-24 lg:py-32">
          <div className="mx-auto max-w-[1100px]">
            <div className="mx-auto max-w-3xl text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-gray-700">
                <HelpCircle className="h-3.5 w-3.5" />
                Questions Fréquentes
              </span>
              <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
                Tout ce que vous devez savoir.
              </h2>
            </div>

            <div className="mt-16 mx-auto max-w-3xl">
              <FaqAccordion items={FAQ_ITEMS} />
            </div>
          </div>
        </section>

        {/* ================= FORMULAIRE PREMIUM (SAAS INTERFACE) ================= */}
        <section id="qualifier" className="px-6 py-24 lg:py-32">
          <div className="mx-auto max-w-[1100px]" id="qualification-form-section">
            <div className="mx-auto max-w-3xl text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100/80 px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                <Target className="h-3.5 w-3.5" />
                Candidature Sélective
              </span>
              <h2 className="mt-4 font-display text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
                Candidater au programme
              </h2>
              <p className="mt-4 text-base text-gray-600">
                Prenez 5 minutes pour compléter ce formulaire. Il nous permet de préparer votre diagnostic avant notre échange.
              </p>
            </div>

            <div className="mt-14 mx-auto max-w-2xl rounded-3xl border border-gray-200/90 bg-white p-8 sm:p-12 shadow-2xl shadow-indigo-500/5">
              <AnimatePresence mode="wait">
                {!submitted ? (
                  <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Progress indicator */}
                    <div>
                      <div className="flex items-center justify-between text-xs text-gray-500 font-semibold">
                        <span>Étape {step} sur 3</span>
                        <span className="font-bold text-gray-900">
                          {step === 1 && "Coordonnées"}
                          {step === 2 && "Projet & Expérience"}
                          {step === 3 && "Engagement & Budget"}
                        </span>
                      </div>
                      <div className="mt-3 h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 transition-all duration-500"
                          style={{ width: `${(step / 3) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* ÉTAPE 1 : COORDONNÉES */}
                    {step === 1 && (
                      <motion.div
                        key="step-1"
                        initial={{ opacity: 0, x: 15 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -15 }}
                        className="space-y-6"
                      >
                        <h3 className="font-display text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">
                          1. Vos coordonnées
                        </h3>

                        <div className="grid gap-6 sm:grid-cols-2">
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">Prénom *</label>
                            <div className="relative">
                              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                                <User className="h-4 w-4" />
                              </span>
                              <input
                                type="text"
                                required
                                value={formData.prenom}
                                onChange={(e) => handleChange('prenom', e.target.value)}
                                className="w-full rounded-xl border border-gray-200 bg-[#FAFAFA] py-3.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                placeholder="Votre prénom"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">Nom *</label>
                            <div className="relative">
                              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                                <User className="h-4 w-4" />
                              </span>
                              <input
                                type="text"
                                required
                                value={formData.nom}
                                onChange={(e) => handleChange('nom', e.target.value)}
                                className="w-full rounded-xl border border-gray-200 bg-[#FAFAFA] py-3.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                placeholder="Votre nom"
                              />
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">Adresse Email *</label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                              <Mail className="h-4 w-4" />
                            </span>
                            <input
                              type="email"
                              required
                              value={formData.email}
                              onChange={(e) => handleChange('email', e.target.value)}
                              className="w-full rounded-xl border border-gray-200 bg-[#FAFAFA] py-3.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                              placeholder="votre.email@exemple.com"
                            />
                          </div>
                        </div>

                        <div className="grid gap-6 sm:grid-cols-2">
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">Téléphone (avec indicatif) *</label>
                            <div className="relative">
                              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                                <Phone className="h-4 w-4" />
                              </span>
                              <input
                                type="tel"
                                required
                                value={formData.telephone}
                                onChange={(e) => handleChange('telephone', e.target.value)}
                                className="w-full rounded-xl border border-gray-200 bg-[#FAFAFA] py-3.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                placeholder="+33 6 12 34 56 78"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">Pays de résidence *</label>
                            <div className="relative">
                              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                                <Globe className="h-4 w-4" />
                              </span>
                              <input
                                type="text"
                                required
                                value={formData.pays}
                                onChange={(e) => handleChange('pays', e.target.value)}
                                className="w-full rounded-xl border border-gray-200 bg-[#FAFAFA] py-3.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
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
                        initial={{ opacity: 0, x: 15 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -15 }}
                        className="space-y-6"
                      >
                        <h3 className="font-display text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">
                          2. Votre projet
                        </h3>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-3">Quel est votre projet aujourd'hui ? *</label>
                          <div className="grid gap-3 sm:grid-cols-2">
                            {PROJET_TYPES.map((option) => (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => handleChange('projet_type', option.value)}
                                className={`flex items-center gap-3 rounded-xl border p-4 text-left text-sm transition-all ${
                                  formData.projet_type === option.value
                                    ? 'border-indigo-600 bg-indigo-50/60 font-bold text-indigo-900 shadow-sm'
                                    : 'border-gray-200 bg-[#FAFAFA] text-gray-700 hover:bg-gray-100'
                                }`}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                            Que souhaitez-vous construire grâce à l'IA ? *
                          </label>
                          <textarea
                            required
                            rows={3}
                            value={formData.projet_ia}
                            onChange={(e) => handleChange('projet_ia', e.target.value)}
                            className="w-full rounded-xl border border-gray-200 bg-[#FAFAFA] p-4 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            placeholder="Décrivez l'activité, le produit ou le service automatisé..."
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                            Quel est votre principal blocage ? *
                          </label>
                          <textarea
                            required
                            rows={2}
                            value={formData.projet_blocage}
                            onChange={(e) => handleChange('projet_blocage', e.target.value)}
                            className="w-full rounded-xl border border-gray-200 bg-[#FAFAFA] p-4 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            placeholder="Le manque de temps, la technique, l'acquisition client..."
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                            Pourquoi souhaitez-vous lancer ce projet maintenant ? *
                          </label>
                          <textarea
                            required
                            rows={2}
                            value={formData.projet_raison}
                            onChange={(e) => handleChange('projet_raison', e.target.value)}
                            className="w-full rounded-xl border border-gray-200 bg-[#FAFAFA] p-4 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            placeholder="Motivation personnelle, transition professionnelle..."
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-3">
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
                                className={`flex-1 rounded-xl border p-4 text-center text-sm font-bold transition-all ${
                                  formData.deja_essaie === opt.value
                                    ? 'border-indigo-600 bg-indigo-50/60 text-indigo-900'
                                    : 'border-gray-200 bg-[#FAFAFA] text-gray-700 hover:bg-gray-100'
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
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                              Expliquez-nous rapidement ce que vous avez essayé *
                            </label>
                            <textarea
                              required
                              rows={2}
                              value={formData.deja_essaie_details}
                              onChange={(e) => handleChange('deja_essaie_details', e.target.value)}
                              className="w-full rounded-xl border border-gray-200 bg-[#FAFAFA] p-4 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                              placeholder="Quel projet, quels résultats obtenus ?"
                            />
                          </motion.div>
                        )}

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-3">Où en êtes-vous aujourd'hui ? *</label>
                          <div className="grid gap-3 sm:grid-cols-2">
                            {STATUTS_ACTUELS.map((option) => (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => handleChange('statut_actuel', option.value)}
                                className={`flex items-center gap-3 rounded-xl border p-4 text-left text-sm transition-all ${
                                  formData.statut_actuel === option.value
                                    ? 'border-indigo-600 bg-indigo-50/60 font-bold text-indigo-900 shadow-sm'
                                    : 'border-gray-200 bg-[#FAFAFA] text-gray-700 hover:bg-gray-100'
                                }`}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* ÉTAPE 3 : ENGAGEMENT & BUDGET */}
                    {step === 3 && (
                      <motion.div
                        key="step-3"
                        initial={{ opacity: 0, x: 15 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -15 }}
                        className="space-y-6"
                      >
                        <h3 className="font-display text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">
                          3. Engagement & Budget
                        </h3>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-3">
                            Combien d'heures pouvez-vous consacrer chaque semaine ? *
                          </label>
                          <div className="grid gap-3 sm:grid-cols-2">
                            {HEURES_SEMAINE_OPTIONS.map((option) => (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => handleChange('heures_semaine', option.value)}
                                className={`flex items-center gap-3 rounded-xl border p-4 text-left text-sm transition-all ${
                                  formData.heures_semaine === option.value
                                    ? 'border-indigo-600 bg-indigo-50/60 font-bold text-indigo-900 shadow-sm'
                                    : 'border-gray-200 bg-[#FAFAFA] text-gray-700 hover:bg-gray-100'
                                }`}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                            Quel est votre objectif dans les 12 prochains mois ? *
                          </label>
                          <textarea
                            required
                            rows={2}
                            value={formData.objectif_12m}
                            onChange={(e) => handleChange('objectif_12m', e.target.value)}
                            className="w-full rounded-xl border border-gray-200 bg-[#FAFAFA] p-4 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            placeholder="Objectif de chiffre d'affaires, autonomie, nombre de clients..."
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-3">
                            Êtes-vous prêt à investir dans un accompagnement si nous pensons pouvoir vous aider ? *
                          </label>
                          <div className="grid gap-3 sm:grid-cols-3">
                            {PRET_INVESTIR_OPTIONS.map((option) => (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => handleChange('pret_investir', option.value)}
                                className={`rounded-xl border p-4 text-center text-sm transition-all ${
                                  formData.pret_investir === option.value
                                    ? 'border-indigo-600 bg-indigo-50/60 font-bold text-indigo-900 shadow-sm'
                                    : 'border-gray-200 bg-[#FAFAFA] text-gray-700 hover:bg-gray-100'
                                }`}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-3">
                            Quel budget êtes-vous prêt à investir ? *
                          </label>
                          <div className="grid gap-3 sm:grid-cols-2">
                            {BUDGET_OPTIONS.map((option) => (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => handleChange('budget', option.value)}
                                className={`flex items-center gap-3 rounded-xl border p-4 text-left text-sm transition-all ${
                                  formData.budget === option.value
                                    ? 'border-indigo-600 bg-indigo-50/60 font-bold text-indigo-900 shadow-sm'
                                    : 'border-gray-200 bg-[#FAFAFA] text-gray-700 hover:bg-gray-100'
                                }`}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                            Pourquoi pensez-vous être un bon candidat ? *
                          </label>
                          <textarea
                            required
                            rows={3}
                            value={formData.candidat_raison}
                            onChange={(e) => handleChange('candidat_raison', e.target.value)}
                            className="w-full rounded-xl border border-gray-200 bg-[#FAFAFA] p-4 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            placeholder="Décrivez votre niveau de détermination et votre motivation..."
                          />
                        </div>
                      </motion.div>
                    )}

                    {/* Navigation du formulaire */}
                    <div className="flex justify-between border-t border-gray-100 pt-6">
                      {step > 1 ? (
                        <button
                          type="button"
                          onClick={() => setStep((s) => s - 1)}
                          className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors"
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
                          className="flex items-center gap-2 rounded-full bg-gray-900 px-7 py-3 text-xs font-bold text-white transition-all hover:bg-black disabled:opacity-40"
                        >
                          Continuer
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          type="submit"
                          disabled={!isStepValid(3) || isSubmitting}
                          className="flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-9 py-3.5 text-xs font-bold text-white shadow-lg shadow-indigo-500/25 transition-all hover:scale-105 disabled:opacity-40"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Envoi de votre dossier...
                            </>
                          ) : (
                            <>
                              Candidater au programme
                              <CheckCircle className="h-4 w-4" />
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </form>
                ) : (
                  /* Success View */
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="py-8 text-center space-y-6"
                  >
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                      <Check className="h-8 w-8" />
                    </div>

                    <h3 className="font-display text-2xl font-bold text-gray-900">
                      Candidature Transmise !
                    </h3>

                    <p className="text-sm text-gray-600 leading-relaxed max-w-md mx-auto">
                      Merci <strong className="text-gray-900">{formData.prenom}</strong>. Votre dossier a été enregistré et notre équipe étudie vos réponses sous 24h à 48h.
                    </p>

                    <div className="rounded-2xl border border-gray-100 bg-[#FAFAFA] p-6 text-left text-xs text-gray-600 space-y-3">
                      <div className="font-bold text-gray-900 uppercase tracking-wider">Prochaines étapes :</div>
                      <div className="flex items-start gap-2">
                        <span className="font-bold text-indigo-600">1.</span>
                        <span>Analyse de faisabilité de votre projet.</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="font-bold text-indigo-600">2.</span>
                        <span>Invitation à un appel stratégique de 30 min (sans pression commerciale).</span>
                      </div>
                    </div>

                    <div className="pt-4">
                      <Link
                        to="/"
                        className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-6 py-2.5 text-xs font-bold text-gray-800 shadow-sm transition-all hover:bg-gray-50"
                      >
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

      {/* Footer Minimaliste */}
      <footer className="border-t border-gray-200/60 bg-white py-12 text-center text-xs text-gray-500">
        <div className="mx-auto max-w-[1100px] px-6 space-y-4">
          <div className="flex justify-center gap-6 font-semibold text-gray-600">
            <Link to="/cgu" className="hover:text-gray-900 transition-colors">CGU</Link>
            <Link to="/confidentialite" className="hover:text-gray-900 transition-colors">Confidentialité</Link>
            <Link to="/mentions-legales" className="hover:text-gray-900 transition-colors">Mentions Légales</Link>
          </div>
          <p>© {new Date().getFullYear()} Leclub.ia — Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  )
}
