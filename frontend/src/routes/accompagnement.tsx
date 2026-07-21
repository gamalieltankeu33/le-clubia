import React, { useState, useRef, useEffect } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Loader2,
  X,
  Calendar,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import confetti from 'canvas-confetti'
import { BrandLogo } from '@/components/brand-logo'
import { supabase } from '@/lib/supabase'

export const Route = createFileRoute('/accompagnement')({
  component: AccompagnementPage,
})

/* ─── Data ─────────────────────────────────────────────────────────── */

const PROJET_TYPES = [
  { id: 'premier_business', label: 'Lancer mon premier business' },
  { id: 'developper_existant', label: 'Développer un business existant' },
  { id: 'freelance_scale', label: 'Passer de freelance à scalable' },
  { id: 'reconversion', label: 'Reconversion entrepreneuriale' },
]

const STATUTS = [
  { id: 'zero', label: 'Je pars de zéro' },
  { id: 'idee_test', label: "J'ai une idée & je teste" },
  { id: 'lancement', label: 'Projet en cours de lancement' },
  { id: 'clients', label: "J'ai déjà mes premiers clients" },
]

const HEURES = ['5–10h / semaine', '10–20h / semaine', '+20h / semaine']

const PRET_OPTIONS = [
  'Prêt à passer à l\'action maintenant',
  'Oui, si validé lors de l\'appel',
  'Je veux d\'abord des informations',
]

/* ─── Animations ───────────────────────────────────────────────────── */

const EASE = [0.16, 1, 0.3, 1] as const

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay, ease: EASE },
})

const stagger = {
  animate: { transition: { staggerChildren: 0.08 } },
}

const slideIn = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
  transition: { duration: 0.4, ease: EASE },
}

/* ─── Main Page ────────────────────────────────────────────────────── */

export function AccompagnementPage() {
  const [showForm, setShowForm] = useState(false)

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] antialiased selection:bg-[var(--primary)] selection:text-white">
      {/* ── Header ── */}
      <header className="fixed inset-x-0 top-0 z-50 bg-[var(--background)]/80 backdrop-blur-xl border-b border-[var(--border)]/50">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link to="/" className="flex items-center gap-3">
            <BrandLogo size="sm" className="transition-transform hover:scale-[1.02]" />
          </Link>

          <button
            onClick={() => setShowForm(true)}
            className="cta-black group relative overflow-hidden px-5 py-2.5 text-sm cursor-pointer"
          >
            <span className="relative z-10 flex items-center gap-2">
              Prendre rendez-vous
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </span>
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
          </button>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative pt-32 pb-24 sm:pt-40 sm:pb-32 lg:pt-48 lg:pb-40 overflow-hidden">
        {/* Background glow */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-40 left-1/2 h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-gradient-to-b from-[var(--primary)]/[0.06] to-transparent blur-[120px]" />
          <div className="absolute right-[10%] top-1/3 h-[400px] w-[400px] rounded-full bg-[var(--bleu-ciel)]/[0.04] blur-[100px]" />
        </div>

        <div className="mx-auto max-w-4xl px-5 sm:px-6">
          <motion.p
            {...fadeUp(0.05)}
            className="eyebrow mb-8"
          >
            Accompagnement sur-mesure
          </motion.p>

          <motion.h1
            {...fadeUp(0.15)}
            className="font-display text-[2.5rem] sm:text-5xl lg:text-6xl xl:text-[4.25rem] font-bold leading-[0.95] tracking-tight"
          >
            Votre business.{' '}
            <span className="serif-accent">Propulsé par l'IA.</span>
          </motion.h1>

          <motion.p
            {...fadeUp(0.3)}
            className="mt-8 max-w-2xl text-lg sm:text-xl leading-relaxed text-[var(--muted-foreground)]"
          >
            On ne vous apprend pas à utiliser ChatGPT. On construit avec vous un vrai business — de l'offre au système d'acquisition, en passant par l'automatisation complète.
          </motion.p>

          <motion.div {...fadeUp(0.45)} className="mt-12 flex flex-col sm:flex-row items-start gap-4">
            <button
              onClick={() => setShowForm(true)}
              className="cta-black cta-black-xl group relative overflow-hidden px-10 py-5 cursor-pointer"
            >
              <span className="relative z-10 flex items-center gap-3">
                <span>Réserver un appel stratégique</span>
                <span className="mx-1 h-4 w-px bg-white/20" />
                <span className="text-sm font-normal opacity-80">Gratuit · 30 min</span>
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </span>
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
            </button>
          </motion.div>

          <motion.p {...fadeUp(0.55)} className="mt-5 text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
            Aucun engagement · Aucun paiement demandé
          </motion.p>
        </div>
      </section>

      {/* ── The Method ── */}
      <section className="py-24 sm:py-32 border-t border-[var(--border)]">
        <div className="mx-auto max-w-6xl px-5 sm:px-6">
          <InViewReveal>
            <p className="eyebrow mb-4">La méthode</p>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight max-w-3xl leading-tight">
              4 phases. Un système.{' '}
              <span className="text-[var(--muted-foreground)]">Des résultats.</span>
            </h2>
          </InViewReveal>

          <div className="mt-16 sm:mt-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-[var(--border)] rounded-2xl overflow-hidden border border-[var(--border)]">
            {[
              { num: '01', title: 'Clarifier', body: 'Définition de votre offre haute valeur et de votre positionnement unique.' },
              { num: '02', title: 'Construire', body: 'Création de vos outils, de votre présence et de votre système de captation.' },
              { num: '03', title: 'Lancer', body: 'Mise en place de la stratégie d\'acquisition pour vos premiers clients.' },
              { num: '04', title: 'Automatiser', body: 'Configuration d\'agents IA autonomes pour gérer vos tâches quotidiennes.' },
            ].map((step, i) => (
              <InViewReveal key={step.num} delay={i * 0.1}>
                <div className={`p-8 sm:p-10 bg-[var(--card)] h-full flex flex-col justify-between gap-8 group ${i === 3 ? 'bg-[var(--noir)] text-white' : ''}`}>
                  <span className={`text-xs font-mono tracking-widest ${i === 3 ? 'text-[var(--bleu-ciel)]' : 'text-[var(--muted-foreground)]'}`}>
                    {step.num}
                  </span>
                  <div>
                    <h3 className={`text-xl font-bold mb-3 ${i === 3 ? 'text-white' : 'text-[var(--foreground)]'}`}>
                      {step.title}
                    </h3>
                    <p className={`text-sm leading-relaxed ${i === 3 ? 'text-white/60' : 'text-[var(--muted-foreground)]'}`}>
                      {step.body}
                    </p>
                  </div>
                </div>
              </InViewReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── What makes this different ── */}
      <section className="py-24 sm:py-32 bg-[var(--noir)] text-white">
        <div className="mx-auto max-w-5xl px-5 sm:px-6">
          <InViewReveal>
            <p className="eyebrow text-[var(--bleu-ciel)] mb-4">Ce qui nous différencie</p>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight max-w-3xl leading-tight">
              Pas une formation de plus.{' '}
              <span className="text-white/40">Un vrai co-pilotage.</span>
            </h2>
          </InViewReveal>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-14">
            {[
              {
                title: 'Sur-mesure',
                body: 'Chaque accompagnement est adapté à votre situation, votre marché et vos objectifs. Pas de template.',
              },
              {
                title: 'Action, pas théorie',
                body: 'Chaque semaine, vous avancez concrètement. On construit ensemble, pas juste on écoute des cours.',
              },
              {
                title: 'Résultats mesurables',
                body: 'Offre créée, site lancé, premiers prospects contactés. Tout est concret et datable.',
              },
            ].map((item, i) => (
              <InViewReveal key={item.title} delay={i * 0.12}>
                <div className="space-y-4">
                  <div className="w-10 h-px bg-[var(--bleu-ciel)]" />
                  <h3 className="text-lg font-bold">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-white/50">{item.body}</p>
                </div>
              </InViewReveal>
            ))}
          </div>

          <InViewReveal delay={0.4}>
            <div className="mt-20 text-center">
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-3 px-10 py-5 bg-white text-[var(--noir)] rounded-2xl text-sm font-bold transition-all hover:bg-white/90 shadow-[0_0_40px_rgba(255,255,255,0.1)] cursor-pointer group"
              >
                <Calendar className="w-5 h-5" />
                <span>Réserver mon appel gratuit</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </InViewReveal>
        </div>
      </section>

      {/* ── Who is this for ── */}
      <section className="py-24 sm:py-32 border-t border-[var(--border)]">
        <div className="mx-auto max-w-5xl px-5 sm:px-6">
          <InViewReveal>
            <p className="eyebrow mb-4">Pour qui ?</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight max-w-2xl leading-tight">
              Cet accompagnement est fait pour vous si…
            </h2>
          </InViewReveal>

          <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              'Vous avez une expertise ou une idée, mais pas encore de système pour la monétiser.',
              'Vous voulez lancer un business ou développer celui que vous avez, avec les bons outils IA.',
              'Vous êtes prêt à investir du temps chaque semaine pour avancer concrètement.',
              'Vous cherchez un cadre, une méthode et un mentor — pas juste des tutos YouTube.',
            ].map((text, i) => (
              <InViewReveal key={i} delay={i * 0.08}>
                <div className="flex items-start gap-4 p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] transition-all hover:border-[var(--primary)]/20 hover:shadow-sm">
                  <div className="mt-0.5 w-6 h-6 rounded-full bg-[var(--primary)] text-white flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-sm leading-relaxed text-[var(--foreground-soft)]">{text}</p>
                </div>
              </InViewReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-24 sm:py-32 bg-[var(--secondary)]">
        <div className="mx-auto max-w-3xl px-5 sm:px-6 text-center">
          <InViewReveal>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
              Prêt à passer à l'action ?
            </h2>
            <p className="mt-6 text-base sm:text-lg text-[var(--muted-foreground)] max-w-xl mx-auto leading-relaxed">
              Réservez un appel stratégique gratuit de 30 minutes. On analyse votre situation, on identifie vos leviers, et on voit si on peut travailler ensemble.
            </p>
          </InViewReveal>

          <InViewReveal delay={0.2}>
            <div className="mt-10">
              <button
                onClick={() => setShowForm(true)}
                className="cta-black cta-black-xl group relative overflow-hidden px-10 py-5 cursor-pointer"
              >
                <span className="relative z-10 flex items-center gap-3">
                  <span>Prendre rendez-vous maintenant</span>
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </span>
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
              </button>
              <p className="mt-4 text-xs text-[var(--muted-foreground)] uppercase tracking-wide font-medium">
                Diagnostic gratuit · Sans engagement · Places limitées
              </p>
            </div>
          </InViewReveal>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-10 border-t border-[var(--border)] text-center">
        <p className="text-xs text-[var(--muted-foreground)]">
          © {new Date().getFullYear()} Le Club IA — Accompagnement Business Premium
        </p>
      </footer>

      {/* ── Form Modal Overlay ── */}
      <AnimatePresence>
        {showForm && (
          <QualificationModal onClose={() => setShowForm(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─── InView Reveal ────────────────────────────────────────────────── */

function InViewReveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const [isMobile] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches
  )

  if (isMobile) return <div className={className}>{children}</div>

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.65, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  )
}

/* ─── Qualification Modal ──────────────────────────────────────────── */

function QualificationModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)

  const [form, setForm] = useState({
    prenom: '',
    nom: '',
    email: '',
    telephone: '',
    pays: 'France',
    projet_type: 'Lancer mon premier business',
    statut_actuel: 'Je pars de zéro',
    projet_ia: '',
    projet_blocage: '',
    heures_semaine: '5–10h / semaine',
    pret_investir: 'Prêt à passer à l\'action maintenant',
  })

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape' && !isSubmitted) onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, isSubmitted])

  const next = () => {
    if (step === 1) {
      if (!form.prenom.trim() || !form.nom.trim() || !form.email.trim() || !form.telephone.trim()) {
        toast.error('Veuillez remplir tous les champs.')
        return
      }
      if (!form.email.includes('@')) {
        toast.error('Adresse email invalide.')
        return
      }
    }
    if (step === 2 && !form.projet_ia.trim()) {
      toast.error('Décrivez brièvement ce que vous souhaitez construire.')
      return
    }
    setStep(s => Math.min(s + 1, 3))
  }

  const prev = () => setStep(s => Math.max(s - 1, 1))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const { error } = await supabase.from('accompagnement_candidatures').insert([{
        nom: form.nom.trim(),
        prenom: form.prenom.trim(),
        email: form.email.trim().toLowerCase(),
        telephone: form.telephone.trim(),
        pays: form.pays.trim(),
        projet_type: form.projet_type,
        projet_ia: form.projet_ia.trim(),
        projet_raison: 'Souhait de lancement / développement grâce à l\'IA',
        projet_blocage: form.projet_blocage.trim() || 'Besoin de méthode et de système',
        deja_essaie: false,
        statut_actuel: form.statut_actuel,
        heures_semaine: form.heures_semaine,
        objectif_12m: 'Construire un business pérenne',
        pret_investir: form.pret_investir,
        budget: 'Accompagnement sur-mesure',
        candidat_raison: 'Candidat motivé à passer à l\'action',
        status: 'Nouveau',
      }])
      if (error) throw error
      setIsSubmitted(true)
      confetti({ particleCount: 80, spread: 55, origin: { y: 0.55 } })
      toast.success('Parfait ! Choisissez maintenant votre créneau.')
    } catch {
      toast.error('Erreur. Veuillez réessayer.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const TOTAL_STEPS = 3

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[100] flex items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget && !isSubmitted) onClose() }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <motion.div
        ref={modalRef}
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 20 }}
        transition={{ duration: 0.4, ease: EASE }}
        className="relative z-10 w-full max-w-xl mx-4 bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-8 pt-7 pb-4">
          <div>
            <h2 className="text-lg font-bold text-[var(--foreground)]">
              {isSubmitted ? 'Choisissez votre créneau' : 'Quelques questions rapides'}
            </h2>
            {!isSubmitted && (
              <p className="text-xs text-[var(--muted-foreground)] mt-1">
                Étape {step} sur {TOTAL_STEPS} — moins d'une minute
              </p>
            )}
          </div>
          {!isSubmitted && (
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-[var(--secondary)] hover:bg-[var(--border)] flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4 text-[var(--muted-foreground)]" />
            </button>
          )}
        </div>

        {/* Progress */}
        {!isSubmitted && (
          <div className="px-8 pb-2">
            <div className="h-1 w-full rounded-full bg-[var(--secondary)] overflow-hidden">
              <motion.div
                className="h-full bg-[var(--primary)]"
                animate={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
                transition={{ duration: 0.35, ease: EASE }}
              />
            </div>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-8 pb-8">
          <AnimatePresence mode="wait">
            {isSubmitted ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="pt-4 space-y-6"
              >
                <div className="text-center space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-[var(--primary)] text-white flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    Merci <strong className="text-[var(--foreground)]">{form.prenom}</strong> ! Vos réponses sont enregistrées.
                    <br />Choisissez un créneau pour votre appel stratégique gratuit.
                  </p>
                </div>

                {/* Calendly Embed */}
                <div className="rounded-2xl border border-[var(--border)] overflow-hidden bg-white" style={{ height: 520 }}>
                  <iframe
                    src="https://calendly.com/ghislaintankeu6/nouvelle-reunion?embed_domain=leclubia.com&embed_type=Inline"
                    className="w-full h-full border-none"
                    title="Réservation d'appel Calendly"
                  />
                </div>

                <a
                  href="https://calendly.com/ghislaintankeu6/nouvelle-reunion"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 text-sm font-medium text-[var(--primary)] hover:underline"
                >
                  <span>Ouvrir dans un nouvel onglet</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </motion.div>
            ) : (
              <form onSubmit={submit}>
                {/* Step 1: Contact */}
                {step === 1 && (
                  <motion.div key="s1" {...slideIn} className="pt-4 space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField label="Prénom" value={form.prenom} onChange={v => set('prenom', v)} placeholder="Votre prénom" required />
                      <FormField label="Nom" value={form.nom} onChange={v => set('nom', v)} placeholder="Votre nom" required />
                    </div>
                    <FormField label="Email" type="email" value={form.email} onChange={v => set('email', v)} placeholder="vous@email.com" required />
                    <FormField label="Téléphone (WhatsApp)" type="tel" value={form.telephone} onChange={v => set('telephone', v)} placeholder="+33 6 12 34 56 78" required />
                  </motion.div>
                )}

                {/* Step 2: Project */}
                {step === 2 && (
                  <motion.div key="s2" {...slideIn} className="pt-4 space-y-5">
                    <div className="space-y-2.5">
                      <label className="text-sm font-semibold text-[var(--foreground)]">Votre objectif principal</label>
                      <div className="grid grid-cols-1 gap-2">
                        {PROJET_TYPES.map(pt => (
                          <OptionButton
                            key={pt.id}
                            selected={form.projet_type === pt.label}
                            onClick={() => set('projet_type', pt.label)}
                            label={pt.label}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-[var(--foreground)]">Que souhaitez-vous construire ?</label>
                      <textarea
                        rows={2}
                        value={form.projet_ia}
                        onChange={e => set('projet_ia', e.target.value)}
                        placeholder="Ex: Un service d'automatisation, une agence, un SaaS…"
                        className="w-full px-4 py-3 rounded-xl bg-[var(--secondary)] border border-[var(--border)] text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent focus:outline-none transition-all resize-none placeholder:text-[var(--muted-foreground)]"
                        required
                      />
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Engagement */}
                {step === 3 && (
                  <motion.div key="s3" {...slideIn} className="pt-4 space-y-5">
                    <div className="space-y-2.5">
                      <label className="text-sm font-semibold text-[var(--foreground)]">Où en êtes-vous ?</label>
                      <div className="grid grid-cols-2 gap-2">
                        {STATUTS.map(s => (
                          <OptionButton
                            key={s.id}
                            selected={form.statut_actuel === s.label}
                            onClick={() => set('statut_actuel', s.label)}
                            label={s.label}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <label className="text-sm font-semibold text-[var(--foreground)]">Temps disponible par semaine</label>
                      <div className="grid grid-cols-3 gap-2">
                        {HEURES.map(h => (
                          <OptionButton
                            key={h}
                            selected={form.heures_semaine === h}
                            onClick={() => set('heures_semaine', h)}
                            label={h}
                            compact
                          />
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <label className="text-sm font-semibold text-[var(--foreground)]">Prêt à vous engager ?</label>
                      <div className="grid grid-cols-1 gap-2">
                        {PRET_OPTIONS.map(p => (
                          <OptionButton
                            key={p}
                            selected={form.pret_investir === p}
                            onClick={() => set('pret_investir', p)}
                            label={p}
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between pt-6 mt-6 border-t border-[var(--border)]">
                  {step > 1 ? (
                    <button
                      type="button"
                      onClick={prev}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[var(--secondary)] hover:bg-[var(--border)] rounded-xl text-sm font-medium transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Retour
                    </button>
                  ) : (
                    <div />
                  )}

                  {step < TOTAL_STEPS ? (
                    <button
                      type="button"
                      onClick={next}
                      className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-light)] text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                    >
                      Suivant
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex items-center gap-2 px-7 py-3 bg-[var(--primary)] hover:bg-[var(--primary-light)] text-white rounded-xl text-sm font-bold transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Validation…
                        </>
                      ) : (
                        <>
                          Accéder à l'agenda
                          <ArrowRight className="w-4 h-4" />
                        </>
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

/* ─── Shared Components ────────────────────────────────────────────── */

function FormField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  required = false,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  required?: boolean
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-semibold text-[var(--foreground)]">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full px-4 py-3 rounded-xl bg-[var(--secondary)] border border-[var(--border)] text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent focus:outline-none transition-all placeholder:text-[var(--muted-foreground)]"
      />
    </div>
  )
}

function OptionButton({
  selected,
  onClick,
  label,
  compact = false,
}: {
  selected: boolean
  onClick: () => void
  label: string
  compact?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${compact ? 'px-3 py-2.5 text-xs' : 'px-4 py-3 text-sm'} rounded-xl border text-left font-medium transition-all cursor-pointer flex items-center justify-between gap-2 ${
        selected
          ? 'border-[var(--primary)] bg-[var(--primary)]/[0.05] text-[var(--foreground)] ring-1 ring-[var(--primary)]/20'
          : 'border-[var(--border)] bg-[var(--card)] text-[var(--foreground-soft)] hover:border-[var(--primary)]/30 hover:bg-[var(--secondary)]'
      }`}
    >
      <span>{label}</span>
      {selected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-5 h-5 rounded-full bg-[var(--primary)] text-white flex items-center justify-center shrink-0"
        >
          <Check className="w-3 h-3" />
        </motion.div>
      )}
    </button>
  )
}
