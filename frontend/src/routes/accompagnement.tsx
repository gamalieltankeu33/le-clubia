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
  Target
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
  { value: 'moins de 5 h', label: 'Moins de 5 heures' },
  { value: '5 à 10 h', label: '5 à 10 heures' },
  { value: '10 à 20 h', label: '10 à 20 heures' },
  { value: 'plus de 20 h', label: 'Plus de 20 heures' },
]

const PRET_INVESTIR_OPTIONS = [
  { value: 'Oui', label: 'Oui, absolument' },
  { value: 'Peut-être', label: 'Peut-être, selon l\'échange' },
  { value: 'Non', label: 'Non, pas pour le moment' },
]

const BUDGET_OPTIONS = [
  { value: 'Moins de 500 €', label: 'Moins de 500 €' },
  { value: '500 à 1 500 €', label: '500 à 1 500 €' },
  { value: '1 500 à 3 000 €', label: '1 500 à 3 000 €' },
  { value: 'Plus de 3 000 €', label: 'Plus de 3 000 €' },
]

function AccompagnementPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

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
      );
    }
    if (currentStep === 2) {
      const basicValid =
        formData.projet_type !== '' &&
        formData.projet_ia.trim() !== '' &&
        formData.projet_raison.trim() !== '' &&
        formData.projet_blocage.trim() !== '' &&
        formData.deja_essaie !== null &&
        formData.statut_actuel !== '';

      if (formData.deja_essaie === true) {
        return basicValid && formData.deja_essaie_details.trim() !== '';
      }
      return basicValid;
    }
    if (currentStep === 3) {
      return (
        formData.heures_semaine !== '' &&
        formData.objectif_12m.trim() !== '' &&
        formData.pret_investir !== '' &&
        formData.budget !== '' &&
        formData.candidat_raison.trim() !== ''
      );
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
        spread: 80,
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

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#050B1E] text-white selection:bg-[var(--accent)] selection:text-black">
      {/* Halos cinématiques et gradients de fond */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 h-[1000px] w-[1000px] -translate-x-1/2 rounded-full bg-gradient-to-b from-[var(--primary)]/30 to-transparent blur-[160px]" />
        <div className="absolute right-[-10%] top-[25%] h-[600px] w-[600px] rounded-full bg-[var(--accent)]/10 blur-[130px]" />
        <div className="absolute left-[-10%] top-[55%] h-[700px] w-[700px] rounded-full bg-[var(--primary)]/20 blur-[140px]" />
      </div>

      {/* Header premium */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-[#050B1E]/80 backdrop-blur-xl transition-all duration-300">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2">
            <BrandLogo size="md" variant="inverse" />
            <span className="ml-2 font-display text-lg font-bold tracking-tight text-white">Le Club IA</span>
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
              className="rounded-full bg-white/5 border border-white/10 px-5 py-2 text-xs font-semibold text-white transition-all hover:bg-white/10"
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
            {/* Tagline d'élite */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[var(--accent)]"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Accompagnement Business Premium
            </motion.div>

            {/* Titre Principal */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mt-8 font-display text-5xl font-black leading-[1.05] tracking-tight sm:text-6xl md:text-7xl"
            >
              Construisez un business <br />
              <span className="bg-gradient-to-r from-[var(--accent)] via-blue-400 to-indigo-500 bg-clip-text text-transparent">
                rentable grâce à l'IA.
              </span>
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
              className="mx-auto mt-10 max-w-2xl rounded-2xl border border-white/5 bg-white/[0.02] p-5 text-sm text-gray-400"
            >
              💡 <span className="font-semibold text-white">Vous ne repartez pas avec une simple formation.</span> Vous repartez avec un plan clair, un système et un business que vous construisez avec nous.
            </motion.div>

            {/* Action principale */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row"
            >
              <button
                onClick={() => scrollToSection('qualifier')}
                className="group relative flex items-center gap-3 rounded-full bg-white px-8 py-4 text-base font-bold text-black transition-all hover:scale-[1.03] hover:shadow-lg hover:shadow-blue-500/20"
              >
                Candidatez à l'accompagnement
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>
            </motion.div>
          </div>
        </section>

        {/* ================= CE PROGRAMME EST FAIT POUR VOUS SI ================= */}
        <section className="border-y border-white/5 bg-white/[0.01] px-6 py-20">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-center font-display text-3xl font-bold sm:text-4xl">
              Ce programme est peut-être fait pour vous si...
            </h2>
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
                  className="flex items-start gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-5 transition-all hover:bg-white/[0.04]"
                >
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/10 text-[var(--accent)]">
                    <Check className="h-4 w-4" />
                  </div>
                  <p className="text-sm font-medium text-gray-300">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================= LE PROBLÈME ================= */}
        <section className="px-6 py-20 lg:py-28">
          <div className="mx-auto max-w-5xl">
            <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
              <div className="lg:col-span-5">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-3.5 py-1 text-xs font-semibold text-red-400">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Le constat actuel
                </div>
                <h2 className="mt-4 font-display text-4xl font-extrabold sm:text-5xl">
                  Le problème
                </h2>
                <p className="mt-6 text-lg leading-relaxed text-gray-300">
                  Aujourd'hui, il est facile d'apprendre l'IA. <br />
                  <span className="font-semibold text-white">Mais apprendre l'IA ne construit pas un business.</span>
                </p>
                <div className="mt-8 space-y-4">
                  {[
                    "Vous regardez des vidéos.",
                    "Vous testez des outils.",
                    "Vous essayez des prompts.",
                    "Vous accumulez des connaissances.",
                    "Mais votre projet n'avance pas."
                  ].map((text, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="h-1.5 w-1.5 rounded-full bg-red-400" />
                      <span className="text-sm text-gray-400">{text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-7">
                <div className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-[#0F1E4D]/60 to-[#050B1E]/40 p-8 shadow-2xl backdrop-blur-md">
                  <div className="absolute right-6 top-6 h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                    <Info className="h-6 w-6" />
                  </div>
                  <h3 className="font-display text-2xl font-bold">Ce qui vous manque vraiment</h3>
                  <p className="mt-4 text-gray-300 leading-relaxed">
                    Ce qui manque n'est pas un nouvel outil. C'est :
                  </p>
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    {[
                      { title: "Une méthode", desc: "Un chemin éprouvé de A à Z." },
                      { title: "Un plan", desc: "Des actions claires jour après jour." },
                      { title: "Un accompagnement", desc: "Des retours honnêtes sur votre travail." },
                      { title: "Quelqu'un pour exécuter", desc: "Une responsabilisation forte pour avancer." },
                    ].map((item, idx) => (
                      <div key={idx} className="rounded-xl bg-white/5 p-4 border border-white/5">
                        <h4 className="font-display font-semibold text-[var(--accent)]">{item.title}</h4>
                        <p className="mt-1 text-xs text-gray-400">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= CE QUE NOUS CONSTRUISONS ENSEMBLE ================= */}
        <section className="border-t border-white/5 bg-white/[0.005] px-6 py-20">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">
              Ce que nous construisons ensemble
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-gray-300">
              Pendant cet accompagnement, nous travaillons ensemble pour construire votre activité. Concrètement, nous allons :
            </p>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { title: "1. Positionnement", desc: "Définir votre positionnement unique sur le marché." },
                { title: "2. Idée de Business", desc: "Trouver une idée de business parfaitement adaptée à votre profil." },
                { title: "3. Offre Irrésistible", desc: "Créer une offre qui répond à un besoin urgent et solvable." },
                { title: "4. Stratégie de Contenu", desc: "Construire votre stratégie de contenu pour attirer naturellement." },
                { title: "5. Acquisition", desc: "Mettre en place votre système d'acquisition automatisé." },
                { title: "6. Automatisation IA", desc: "Utiliser l'IA pour automatiser vos tâches répétitives au quotidien." },
                { title: "7. Produits Digitaux", desc: "Créer vos premiers produits digitaux ou services packagés." },
                { title: "8. Lancement", desc: "Lancer officiellement et concrètement votre activité sur le marché." }
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-white/5 bg-[#0A122C] p-6 text-left transition-all hover:translate-y-[-4px] hover:border-white/10 hover:bg-[#0E1B3F]"
                >
                  <h4 className="font-display text-lg font-bold text-white">{item.title}</h4>
                  <p className="mt-3 text-sm text-gray-400 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-12 inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/20 bg-[var(--accent)]/[0.03] px-5 py-3 text-sm text-[var(--accent)] font-semibold">
              🎯 Notre objectif n'est pas que vous connaissiez mieux l'IA. Notre objectif est que vous construisiez un business.
            </div>
          </div>
        </section>

        {/* ================= NOTRE MÉTHODE ================= */}
        <section className="px-6 py-20 lg:py-28">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">
              Notre méthode
            </h2>
            <p className="mt-4 text-gray-300">
              Nous avançons ensemble selon un parcours simple en 4 phases.
            </p>

            <div className="mt-16 grid gap-8 md:grid-cols-4 md:text-left">
              {[
                { step: "01", name: "Clarifier", points: ["Votre marché", "Votre client", "Votre offre", "Votre promesse"] },
                { step: "02", name: "Construire", points: ["Votre contenu", "Vos outils", "Vos automatisations", "Votre système"] },
                { step: "03", name: "Lancer", points: ["Votre acquisition", "Vos ventes", "Votre offre", "Votre tunnel"] },
                { step: "04", name: "Optimiser", points: ["Système plus simple", "Plus rentable", "Plus efficace", "Scaling"] },
              ].map((phase, idx) => (
                <div key={idx} className="relative flex flex-col items-center md:items-start">
                  <div className="font-display text-5xl font-black text-white/10">{phase.step}</div>
                  <h4 className="mt-2 font-display text-xl font-bold text-[var(--accent)]">{phase.name}</h4>
                  <ul className="mt-4 space-y-2 text-center md:text-left">
                    {phase.points.map((pt, pIdx) => (
                      <li key={pIdx} className="text-sm text-gray-400">{pt}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================= DELIVERABLES & NOT FOR ================= */}
        <section className="border-t border-white/5 bg-white/[0.005] px-6 py-20">
          <div className="mx-auto max-w-5xl">
            <div className="grid gap-12 lg:grid-cols-2">
              {/* Vous repartez avec */}
              <div className="rounded-3xl border border-white/5 bg-[#081028] p-8 shadow-xl">
                <h3 className="font-display text-2xl font-bold text-white">Vous repartez avec :</h3>
                <div className="mt-8 space-y-4">
                  {[
                    "Une offre claire.",
                    "Un positionnement.",
                    "La stratégie de contenu.",
                    "Votre système d'acquisition.",
                    "Vos automatisations IA.",
                    "Votre feuille de route.",
                    "Les outils adaptés à votre business.",
                    "Un accompagnement personnalisé."
                  ].map((text, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent)]/20 text-[var(--accent)]">
                        <Check className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-sm text-gray-300 font-medium">{text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pas fait pour vous si */}
              <div className="rounded-3xl border border-red-500/10 bg-[#1A0A0F] p-8 shadow-xl">
                <h3 className="font-display text-2xl font-bold text-red-400">Ce programme n'est PAS fait pour vous si...</h3>
                <div className="mt-8 space-y-4">
                  {[
                    "Vous cherchez une méthode miracle.",
                    "Vous voulez gagner de l'argent sans travailler.",
                    "Vous souhaitez simplement apprendre ChatGPT.",
                    "Vous n'êtes pas prêt à passer à l'action."
                  ].map((text, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500/20 text-red-400 font-bold text-xs">
                        ✕
                      </div>
                      <span className="text-sm text-gray-300 font-medium">{text}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-8 rounded-xl bg-white/5 p-4 text-xs text-gray-400 text-center border border-white/5">
                  ⚠️ Nous travaillons uniquement avec des personnes qui veulent réellement construire.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= COMMENT REJOINDRE ================= */}
        <section className="px-6 py-20 lg:py-28">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">
              Comment rejoindre l'accompagnement ?
            </h2>
            <p className="mt-4 text-gray-300">
              Un processus d'admission rigoureux pour garantir le succès de la cohorte.
            </p>

            <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 text-left">
              {[
                { num: "01", title: "Candidature", desc: "Remplissez le formulaire de qualification en bas de page." },
                { num: "02", title: "Analyse", desc: "Nous étudions votre profil, vos acquis et votre projet." },
                { num: "03", title: "Appel", desc: "Si votre profil correspond, nous vous invitons à un appel stratégique gratuit." },
                { num: "04", title: "Orientation", desc: "Nous vous orientons vers la solution adaptée (Accompagnement, Club IA ou autre)." }
              ].map((step, idx) => (
                <div key={idx} className="rounded-xl border border-white/5 bg-[#091129] p-5">
                  <div className="font-display text-sm font-bold text-[var(--accent)] uppercase tracking-wider">Étape {step.num}</div>
                  <h4 className="mt-2 font-display text-lg font-bold text-white">{step.title}</h4>
                  <p className="mt-3 text-xs text-gray-400 leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>

            <p className="mx-auto mt-10 max-w-2xl text-sm text-gray-400">
              💡 Notre objectif est de vous proposer la solution qui vous donnera le plus de chances de réussir.
            </p>

            <div className="mt-10">
              <button
                onClick={() => scrollToSection('qualifier')}
                className="cta-white inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-bold text-black bg-white"
              >
                Réserver mon appel stratégique
              </button>
            </div>
          </div>
        </section>

        {/* ================= FORMULAIRE DE QUALIFICATION ================= */}
        <section id="qualifier" className="border-t border-white/5 bg-[#020716] px-6 py-20 lg:py-28">
          <div className="mx-auto max-w-3xl" id="qualification-form-section">
            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent)]/10 px-3 py-1 text-xs font-semibold text-[var(--accent)]">
                <Target className="h-3.5 w-3.5" />
                Admission Sélective
              </span>
              <h2 className="mt-4 font-display text-4xl font-extrabold sm:text-5xl">
                Candidatez à l'accompagnement
              </h2>
              <p className="mt-4 text-gray-400">
                Prenez 5 minutes pour répondre sincèrement à ces questions. Ce formulaire est le premier pas vers votre futur business.
              </p>
            </div>

            <div className="mt-12 rounded-3xl border border-white/10 bg-white/[0.02] p-6 sm:p-10 shadow-2xl backdrop-blur-md">
              <AnimatePresence mode="wait">
                {!submitted ? (
                  <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Indicateur de Progression */}
                    <div>
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>Étape {step} sur 3</span>
                        <span className="font-semibold text-white">
                          {step === 1 && "Coordonnées de contact"}
                          {step === 2 && "Votre projet & expérience"}
                          {step === 3 && "Objectifs & capacité d'investissement"}
                        </span>
                      </div>
                      <div className="mt-3 h-1.5 w-full rounded-full bg-white/10">
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
                        <h3 className="font-display text-xl font-bold border-b border-white/5 pb-2">Informations personnelles</h3>
                        
                        <div className="grid gap-6 sm:grid-cols-2">
                          <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Prénom *</label>
                            <div className="relative">
                              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                                <User className="h-4 w-4" />
                              </span>
                              <input
                                type="text"
                                required
                                value={formData.prenom}
                                onChange={(e) => handleChange('prenom', e.target.value)}
                                className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                                placeholder="Votre prénom"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Nom *</label>
                            <div className="relative">
                              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                                <User className="h-4 w-4" />
                              </span>
                              <input
                                type="text"
                                required
                                value={formData.nom}
                                onChange={(e) => handleChange('nom', e.target.value)}
                                className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                                placeholder="Votre nom"
                              />
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Adresse Email *</label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                              <Mail className="h-4 w-4" />
                            </span>
                            <input
                              type="email"
                              required
                              value={formData.email}
                              onChange={(e) => handleChange('email', e.target.value)}
                              className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                              placeholder="votre.email@exemple.com"
                            />
                          </div>
                        </div>

                        <div className="grid gap-6 sm:grid-cols-2">
                          <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Téléphone (avec indicatif) *</label>
                            <div className="relative">
                              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                                <Phone className="h-4 w-4" />
                              </span>
                              <input
                                type="tel"
                                required
                                value={formData.telephone}
                                onChange={(e) => handleChange('telephone', e.target.value)}
                                className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                                placeholder="+33 6 12 34 56 78"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Pays de résidence *</label>
                            <div className="relative">
                              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                                <Globe className="h-4 w-4" />
                              </span>
                              <input
                                type="text"
                                required
                                value={formData.pays}
                                onChange={(e) => handleChange('pays', e.target.value)}
                                className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
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
                        <h3 className="font-display text-xl font-bold border-b border-white/5 pb-2">Votre projet & situation actuelle</h3>

                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Quel est votre projet aujourd'hui ? *</label>
                          <div className="grid gap-3 sm:grid-cols-2">
                            {PROJET_TYPES.map((option) => (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => handleChange('projet_type', option.value)}
                                className={`flex items-center gap-3 rounded-xl border p-4 text-left text-sm transition-all ${
                                  formData.projet_type === option.value
                                    ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-white font-semibold'
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
                          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                            Que souhaitez-vous construire grâce à l'IA ? *
                          </label>
                          <textarea
                            required
                            rows={3}
                            value={formData.projet_ia}
                            onChange={(e) => handleChange('projet_ia', e.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white placeholder-gray-500 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                            placeholder="Décrivez en quelques phrases le produit, le service ou l'activité automatisée que vous imaginez..."
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                            Pourquoi souhaitez-vous lancer ce projet maintenant ? *
                          </label>
                          <textarea
                            required
                            rows={3}
                            value={formData.projet_raison}
                            onChange={(e) => handleChange('projet_raison', e.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white placeholder-gray-500 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                            placeholder="Motivation personnelle, transition de carrière, opportunité de marché..."
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                            Quel est aujourd'hui votre plus grand blocage ? *
                          </label>
                          <textarea
                            required
                            rows={3}
                            value={formData.projet_blocage}
                            onChange={(e) => handleChange('projet_blocage', e.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white placeholder-gray-500 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                            placeholder="Le manque de temps, la technique, trouver des clients, la clarté sur la méthode..."
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
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
                                className={`flex-1 rounded-xl border p-4 text-center text-sm transition-all font-semibold ${
                                  formData.deja_essaie === opt.value
                                    ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-white'
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
                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                              Expliquez-nous rapidement ce que vous avez essayé *
                            </label>
                            <textarea
                              required
                              rows={2}
                              value={formData.deja_essaie_details}
                              onChange={(e) => handleChange('deja_essaie_details', e.target.value)}
                              className="w-full rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white placeholder-gray-500 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                              placeholder="Quel business, quels résultats, pourquoi cela n'a pas marché comme voulu ?"
                            />
                          </motion.div>
                        )}

                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Où en êtes-vous actuellement ? *</label>
                          <div className="grid gap-3 sm:grid-cols-2">
                            {STATUTS_ACTUELS.map((option) => (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => handleChange('statut_actuel', option.value)}
                                className={`flex items-center gap-3 rounded-xl border p-4 text-left text-sm transition-all ${
                                  formData.statut_actuel === option.value
                                    ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-white font-semibold'
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
                        <h3 className="font-display text-xl font-bold border-b border-white/5 pb-2">Engagement & Budget</h3>

                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
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
                                    ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-white font-semibold'
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
                          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                            Quel est votre objectif dans les 12 prochains mois ? *
                          </label>
                          <textarea
                            required
                            rows={3}
                            value={formData.objectif_12m}
                            onChange={(e) => handleChange('objectif_12m', e.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white placeholder-gray-500 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                            placeholder="Objectif financier, quitter votre emploi actuel, autonomie géographique, nombre de clients..."
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
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
                                    ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-white font-semibold'
                                    : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10'
                                }`}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
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
                                    ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-white font-semibold'
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
                          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                            Pourquoi pensez-vous être un bon candidat pour cet accompagnement ? *
                          </label>
                          <textarea
                            required
                            rows={3}
                            value={formData.candidat_raison}
                            onChange={(e) => handleChange('candidat_raison', e.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white placeholder-gray-500 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                            placeholder="Décrivez votre rigueur, votre détermination et pourquoi nous devrions travailler avec vous en priorité..."
                          />
                        </div>
                      </motion.div>
                    )}

                    {/* Navigation du formulaire */}
                    <div className="flex justify-between border-t border-white/5 pt-6">
                      {step > 1 ? (
                        <button
                          type="button"
                          onClick={() => setStep((s) => s - 1)}
                          className="flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-white transition-colors"
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
                          className="flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition-all hover:bg-gray-200 disabled:opacity-50 disabled:hover:bg-white"
                        >
                          Continuer
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          type="submit"
                          disabled={!isStepValid(3) || isSubmitting}
                          className="flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-[var(--accent)] px-8 py-3 text-sm font-bold text-white transition-all hover:scale-105 disabled:opacity-50"
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
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                      <Check className="h-10 w-10" />
                    </div>
                    
                    <h3 className="font-display text-3xl font-bold">Candidature Reçue !</h3>
                    
                    <p className="mx-auto max-w-lg text-gray-300 leading-relaxed">
                      Félicitations, <span className="font-bold text-white">{formData.prenom}</span>. Votre dossier a été transmis à notre équipe pour analyse.
                    </p>

                    <div className="mx-auto max-w-md rounded-2xl bg-white/[0.03] p-6 text-left border border-white/5 space-y-4">
                      <h4 className="text-sm font-bold text-white uppercase tracking-wider">Prochaines étapes :</h4>
                      <div className="space-y-3 text-xs text-gray-400">
                        <div className="flex gap-3">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/5 text-white font-bold">1</span>
                          <span><strong>Analyse de votre profil</strong> : Notre équipe étudie vos réponses sous 24h à 48h.</span>
                        </div>
                        <div className="flex gap-3">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/5 text-white font-bold">2</span>
                          <span><strong>Invitation à l'appel stratégique</strong> : Si votre profil correspond au programme, vous recevrez un lien personnalisé par email/WhatsApp pour réserver un créneau.</span>
                        </div>
                        <div className="flex gap-3">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/5 text-white font-bold">3</span>
                          <span><strong>Diagnostic</strong> : Durant cet échange de 30 minutes, nous validerons la faisabilité de votre projet et vous orienterons vers la meilleure solution.</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-6">
                      <Link
                        to="/"
                        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-white/10"
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
      <footer className="border-t border-white/5 bg-[#030716] py-12 text-center text-xs text-gray-500">
        <div className="mx-auto max-w-6xl px-6 space-y-4">
          <div className="flex justify-center gap-6">
            <Link to="/cgu" className="hover:text-white transition-colors">CGU</Link>
            <Link to="/confidentialite" className="hover:text-white transition-colors">Confidentialite</Link>
            <Link to="/mentions-legales" className="hover:text-white transition-colors">Mentions Légales</Link>
          </div>
          <p>© {new Date().getFullYear()} Leclub.ia — Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  )
}
