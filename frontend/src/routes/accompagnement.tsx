import React, { useState } from 'react'
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
  ShieldCheck,
  Zap,
  Bot,
  Rocket,
  TrendingUp,
  Calendar,
  CalendarClock,
  Briefcase,
  Target,
  Clock,
  X
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import confetti from 'canvas-confetti'
import { BrandLogo } from '@/components/brand-logo'
import { supabase } from '@/lib/supabase'

export const Route = createFileRoute('/accompagnement')({
  component: AccompagnementPage,
})

// Options de qualification simples et ludiques
const PROJET_TYPES = [
  { id: 'premier_business', label: 'Lancer mon premier business', desc: 'Je veux démarrer sur de bonnes bases' },
  { id: 'developper_existant', label: 'Développer un business existant', desc: 'Je veux structurer et accélérer ma croissance' },
  { id: 'freelance_scale', label: 'Activité Freelance / Indépendant', desc: 'Je veux passer d\'une prestation de temps à une offre scalable' },
  { id: 'reconversion', label: 'Salarié en reconversion', desc: 'Je prépare ma transition vers l\'entrepreneuriat' }
]

const STATUTS_ACTUELS = [
  { id: 'zero', label: 'Je pars de zéro', desc: 'Idée au stade de réflexion' },
  { id: 'idee_test', label: 'J\'ai une idée & je teste des outils', desc: 'Premières expérimentations IA' },
  { id: 'lancement', label: 'Projet en cours de lancement', desc: 'Offre ou produit en cours de création' },
  { id: 'clients', label: 'J\'ai déjà mes premiers clients', desc: 'Revenus en cours, besoin de système' }
]

const HEURES_SEMAINE_OPTIONS = [
  '5 à 10 h / semaine',
  '10 à 20 h / semaine',
  'Plus de 20 h / semaine'
]

const PRET_INVESTIR_OPTIONS = [
  'Oui, prêt à passer à l\'action dès maintenant',
  'Oui, si le projet est validé lors de l\'appel',
  'Je souhaite juste des informations pour le moment'
]

export function AccompagnementPage() {
  const scrollToForm = () => {
    const el = document.getElementById('formulaire-qualification')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // Onboarding Quiz State (3 steps)
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    prenom: '',
    nom: '',
    email: '',
    telephone: '',
    pays: 'France',
    projet_type: 'Lancer mon premier business',
    statut_actuel: 'Je pars de zéro',
    projet_ia: '',
    projet_blocage: '',
    heures_semaine: '5 à 10 h / semaine',
    pret_investir: 'Oui, prêt à passer à l\'action dès maintenant'
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const nextStep = () => {
    if (currentStep === 1) {
      if (!formData.prenom.trim() || !formData.nom.trim() || !formData.email.trim() || !formData.telephone.trim()) {
        toast.error('Veuillez remplir vos coordonnées (Prénom, Nom, Email, Téléphone)')
        return
      }
      if (!formData.email.includes('@')) {
        toast.error('Veuillez saisir une adresse email valide.')
        return
      }
    }
    if (currentStep === 2) {
      if (!formData.projet_ia.trim()) {
        toast.error('Veuillez décrire brièvement ce que vous souhaitez construire.')
        return
      }
    }
    setCurrentStep(prev => Math.min(prev + 1, 3))
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
            projet_raison: 'Souhait de lancement / développement grâce à l\'IA',
            projet_blocage: formData.projet_blocage.trim() || 'Besoin de méthode et de système',
            deja_essaie: false,
            statut_actuel: formData.statut_actuel,
            heures_semaine: formData.heures_semaine,
            objectif_12m: 'Construire un business pérenne',
            pret_investir: formData.pret_investir,
            budget: 'Accompagnement sur-mesure',
            candidat_raison: 'Candidat motivé à passer à l\'action',
            status: 'Nouveau'
          }
        ])

      if (error) throw error

      setIsSubmitted(true)
      confetti({ particleCount: 90, spread: 60, origin: { y: 0.6 } })
      toast.success('Qualification enregistrée !')
    } catch (err: any) {
      console.error('Erreur soumission:', err)
      toast.error('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#111111] font-sans selection:bg-blue-600 selection:text-white antialiased">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 bg-[#FAFAFA]/90 backdrop-blur-md border-b border-zinc-200/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <BrandLogo className="h-6 w-auto" />
            <span className="text-xs font-mono tracking-wider uppercase bg-zinc-900 text-white px-2 py-0.5 rounded">
              Accompagnement
            </span>
          </Link>

          <button
            onClick={scrollToForm}
            className="px-4 py-2 bg-[#111111] hover:bg-zinc-800 text-white rounded-lg text-xs font-semibold transition-all shadow-xs cursor-pointer"
          >
            Réserver un appel
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-16 pb-20 lg:pt-24 lg:pb-28">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            <span>Accompagnement Sur-Mesure • Places Limitées</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#111111] leading-[1.1]">
            Construisez un business moderne grâce à l'IA.
          </h1>

          <p className="text-base sm:text-lg text-zinc-600 font-normal leading-relaxed max-w-2xl mx-auto">
            Nous vous accompagnons pas à pas pour transformer vos compétences, vos idées ou votre expertise en un véritable business structuré et automatisé.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={scrollToForm}
              className="w-full sm:w-auto px-8 py-4 bg-[#111111] hover:bg-zinc-800 text-white rounded-xl text-sm font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer group"
            >
              <span>Vérifier mon éligibilité & Réserver un appel</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="pt-2 flex items-center justify-center gap-6 text-xs text-zinc-500">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Diagnostic gratuit de 30 min</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              <span>Aucune obligation d'achat</span>
            </span>
          </div>
        </div>
      </section>

      {/* Section: Les 4 Étapes du Programme */}
      <section className="py-20 bg-white border-y border-zinc-200/80">
        <div className="max-w-5xl mx-auto px-4 space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-mono uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
              La Méthode
            </span>
            <h2 className="text-3xl font-bold text-[#111111]">Comment nous construisons votre business.</h2>
            <p className="text-xs sm:text-sm text-zinc-600 max-w-xl mx-auto">
              Un processus clair en 4 étapes pour passer de la réflexion à l'action.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="p-6 rounded-2xl bg-[#FAFAFA] border border-zinc-200 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                01
              </div>
              <h3 className="font-bold text-zinc-900 text-sm">Clarifier</h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Définition de votre offre haute valeur et de votre positionnement unique sur le marché.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#FAFAFA] border border-zinc-200 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold text-xs">
                02
              </div>
              <h3 className="font-bold text-zinc-900 text-sm">Construire</h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Création de vos outils, de votre présence et de votre système de captation de prospects.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#FAFAFA] border border-zinc-200 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-xs">
                03
              </div>
              <h3 className="font-bold text-zinc-900 text-sm">Lancer</h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Mise en place de la stratégie d'acquisition pour générer vos premiers échanges qualifiés.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-900 text-white border border-zinc-800 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-bold text-xs">
                04
              </div>
              <h3 className="font-bold text-white text-sm">Automatiser</h3>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Configuration d'agents IA autonomes pour gérer les tâches répétitives au quotidien.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Section: Qualification & Booking Form */}
      <section id="formulaire-qualification" className="py-20 bg-[#FAFAFA]">
        <div className="max-w-2xl mx-auto px-4 space-y-8">
          
          <div className="text-center space-y-3">
            <span className="text-xs font-mono uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
              Formulaire de Qualification
            </span>
            <h2 className="text-3xl font-bold text-[#111111]">
              Réservez votre appel stratégique.
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600">
              Répondez à ces quelques questions simples (1 min) pour accéder à l'agenda de réservation.
            </p>
          </div>

          {/* Quiz Container */}
          <div className="p-6 sm:p-8 rounded-2xl bg-white border border-zinc-200 shadow-sm relative">
            
            {isSubmitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-6 text-center space-y-6"
              >
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-zinc-900">
                    Merci {formData.prenom} ! Vos réponses sont enregistrées.
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-600 max-w-md mx-auto leading-relaxed">
                    Choisissez dès maintenant un créneau dans l'agenda ci-dessous pour fixer votre <strong>Appel Stratégique Gratuit (30 min)</strong>.
                  </p>
                </div>

                {/* Primary CTA & Calendly Embedding */}
                <div className="space-y-4 pt-2">
                  <a
                    href="https://calendly.com/ghislaintankeu6/nouvelle-reunion"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm group cursor-pointer"
                  >
                    <CalendarClock className="w-4 h-4" />
                    <span>Ouvrir l'agenda Calendly en grand</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </a>

                  <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden h-[540px]">
                    <iframe
                      src="https://calendly.com/ghislaintankeu6/nouvelle-reunion?embed_domain=leclubia.com&embed_type=Inline"
                      className="w-full h-full border-none"
                      title="Réservation d'appel Calendly"
                    />
                  </div>
                </div>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-zinc-500">
                    <span>Étape {currentStep} sur 3</span>
                    <span>{Math.round((currentStep / 3) * 100)}% complété</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-zinc-100 overflow-hidden">
                    <motion.div
                      className="h-full bg-blue-600"
                      animate={{ width: `${(currentStep / 3) * 100}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>

                {/* STEP 1: Vos Coordonnées */}
                {currentStep === 1 && (
                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-4"
                  >
                    <h3 className="text-sm font-bold text-zinc-900 border-b border-zinc-100 pb-2">
                      1. Vos Coordonnées
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-zinc-700">Prénom *</label>
                        <input
                          type="text"
                          value={formData.prenom}
                          onChange={e => handleInputChange('prenom', e.target.value)}
                          placeholder="Jean"
                          className="w-full px-3 py-2 rounded-lg bg-zinc-50 border border-zinc-200 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-zinc-700">Nom *</label>
                        <input
                          type="text"
                          value={formData.nom}
                          onChange={e => handleInputChange('nom', e.target.value)}
                          placeholder="Dupont"
                          className="w-full px-3 py-2 rounded-lg bg-zinc-50 border border-zinc-200 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-zinc-700">Email *</label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={e => handleInputChange('email', e.target.value)}
                          placeholder="jean@exemple.com"
                          className="w-full px-3 py-2 rounded-lg bg-zinc-50 border border-zinc-200 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-zinc-700">Téléphone (WhatsApp) *</label>
                        <input
                          type="tel"
                          value={formData.telephone}
                          onChange={e => handleInputChange('telephone', e.target.value)}
                          placeholder="+33 6 12 34 56 78"
                          className="w-full px-3 py-2 rounded-lg bg-zinc-50 border border-zinc-200 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                          required
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STEP 2: Votre Projet */}
                {currentStep === 2 && (
                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-4"
                  >
                    <h3 className="text-sm font-bold text-zinc-900 border-b border-zinc-100 pb-2">
                      2. Votre Projet
                    </h3>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-zinc-700">Quel est votre objectif principal ?</label>
                      <div className="grid grid-cols-1 gap-2">
                        {PROJET_TYPES.map(pt => {
                          const isSelected = formData.projet_type === pt.label
                          return (
                            <button
                              key={pt.id}
                              type="button"
                              onClick={() => handleInputChange('projet_type', pt.label)}
                              className={`p-3 rounded-xl border text-left text-xs transition-all flex items-center justify-between cursor-pointer ${
                                isSelected
                                  ? 'border-blue-600 bg-blue-50/80 font-semibold text-blue-900'
                                  : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300'
                              }`}
                            >
                              <div>
                                <div className="font-semibold">{pt.label}</div>
                                <div className="text-[10px] text-zinc-500 font-normal">{pt.desc}</div>
                              </div>
                              {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 ml-2" />}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-zinc-700">Que souhaitez-vous construire précisément ? *</label>
                      <textarea
                        rows={2}
                        value={formData.projet_ia}
                        onChange={e => handleInputChange('projet_ia', e.target.value)}
                        placeholder="Ex: Un service d'automatisation IA, une offre de conseil, une agence, etc..."
                        className="w-full px-3 py-2 rounded-lg bg-zinc-50 border border-zinc-200 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                        required
                      />
                    </div>
                  </motion.div>
                )}

                {/* STEP 3: Engagement */}
                {currentStep === 3 && (
                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-4"
                  >
                    <h3 className="text-sm font-bold text-zinc-900 border-b border-zinc-100 pb-2">
                      3. Votre Engagement
                    </h3>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-zinc-700">Temps disponible chaque semaine ?</label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {HEURES_SEMAINE_OPTIONS.map(h => {
                          const isSelected = formData.heures_semaine === h
                          return (
                            <button
                              key={h}
                              type="button"
                              onClick={() => handleInputChange('heures_semaine', h)}
                              className={`p-2.5 rounded-lg border text-center text-xs font-medium transition-all cursor-pointer ${
                                isSelected
                                  ? 'border-blue-600 bg-blue-50/80 text-blue-900 font-bold'
                                  : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300'
                              }`}
                            >
                              <span>{h}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-zinc-700">Êtes-vous prêt à passer à l'action si votre profil est retenu ?</label>
                      <div className="grid grid-cols-1 gap-2">
                        {PRET_INVESTIR_OPTIONS.map(pi => {
                          const isSelected = formData.pret_investir === pi
                          return (
                            <button
                              key={pi}
                              type="button"
                              onClick={() => handleInputChange('pret_investir', pi)}
                              className={`p-3 rounded-xl border text-left text-xs transition-all flex items-center justify-between cursor-pointer ${
                                isSelected
                                  ? 'border-blue-600 bg-blue-50/80 font-semibold text-blue-900'
                                  : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300'
                              }`}
                            >
                              <span>{pi}</span>
                              {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 ml-2" />}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Form Navigation Buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
                  {currentStep > 1 ? (
                    <button
                      type="button"
                      onClick={prevStep}
                      className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Précédent</span>
                    </button>
                  ) : (
                    <div />
                  )}

                  {currentStep < 3 ? (
                    <button
                      type="button"
                      onClick={nextStep}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-all shadow-xs flex items-center gap-1 cursor-pointer ml-auto"
                    >
                      <span>Suivant</span>
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
                          <span>Validation...</span>
                        </>
                      ) : (
                        <>
                          <span>Accéder à la prise de rendez-vous</span>
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

      {/* Simple Footer */}
      <footer className="py-8 bg-white border-t border-zinc-200 text-center text-xs text-zinc-400">
        <p>© {new Date().getFullYear()} Le Club IA — Accompagnement Business Premium. Tous droits réservés.</p>
      </footer>
    </div>
  )
}
