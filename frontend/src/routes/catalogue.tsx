import { createFileRoute, Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, Clock, ChevronRight, 
  GraduationCap, Zap, Brain
} from 'lucide-react'
import { FORMATIONS } from '@/data/formations'
import { LandingHeader } from '@/components/landing/landing-header'
import { LandingFooter } from '@/components/landing/landing-footer'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/catalogue')({
  component: CataloguePage,
})

function CataloguePage() {
  return (
    <div className="min-h-screen bg-white text-[#0A0A0A]">
      <LandingHeader />
      
      <main className="relative z-10 mx-auto max-w-7xl px-6 py-24 md:py-32">
        <header className="mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="mb-4 inline-block rounded-full bg-[var(--primary)]/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.3em] text-[var(--primary)]">
              Catalogue Officiel
            </span>
            <h1 className="font-display text-4xl font-black tracking-tighter text-[#0A0A0A] md:text-6xl">
              Le Club IA — <span className="italic text-[var(--primary)]">Formations</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg font-medium leading-relaxed text-[#4A4A4A] opacity-80">
              Découvre notre catalogue de formations spécialisées pour maîtriser l'IA, automatiser ton business et créer du contenu qui cartonne.
            </p>
          </motion.div>
        </header>

        {/* Bloc 1: Foundations */}
        <section className="mb-24">
          <div className="mb-10 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10">
              <GraduationCap className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-black text-[#0A0A0A]">Bloc 1 — Fondations</h2>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#4A4A4A] opacity-40">Pour bien débuter</p>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {FORMATIONS.filter(f => f.category === "Outils IA" || f.category === "Automatisation").map((formation, i) => (
              <FormationCard key={formation.id} formation={formation} index={i} />
            ))}
          </div>
        </section>

        {/* Bloc 2: Créer ton business */}
        <section className="mb-24">
          <div className="mb-10 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--primary)]/10">
              <Zap className="h-6 w-6 text-[var(--primary)]" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-black text-[#0A0A0A]">Bloc 2 — Créer ton business</h2>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#4A4A4A] opacity-40">Le cœur de cible</p>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {FORMATIONS.filter(f => f.category === "Création de contenu IA" || f.category === "Business IA").map((formation, i) => (
              <FormationCard key={formation.id} formation={formation} index={i} />
            ))}
          </div>
        </section>

        {/* Bloc 3: Tech & Avancé */}
        <section className="mb-24">
          <div className="mb-10 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10">
              <Brain className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-black text-[#0A0A0A]">Bloc 3 — Tech & Avancé</h2>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#4A4A4A] opacity-40">Pour aller plus loin</p>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {FORMATIONS.filter(f => f.category === "Développement IA").map((formation, i) => (
              <FormationCard key={formation.id} formation={formation} index={i} />
            ))}
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  )
}

function FormationCard({ formation, index }: { formation: typeof FORMATIONS[0]; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="group relative"
    >
      <Link to="/catalogue/$id" params={{ id: formation.id }}>
        <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-[#0A0A0A]/5 bg-[#F8F9FA] p-8 transition-all duration-500 hover:border-[var(--primary)]/30 hover:bg-white hover:shadow-xl hover:shadow-[var(--primary)]/5">
          <div className={cn("absolute -right-10 -top-10 h-32 w-32 blur-3xl opacity-5 transition-opacity group-hover:opacity-10 bg-gradient-to-br", formation.color)} />
          
          <div className="relative z-10 flex-1">
            <div className="mb-6 flex items-center justify-between">
              <span className={cn(
                "rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-widest",
                formation.level === "debutant" ? "bg-emerald-500/10 text-emerald-600" :
                formation.level === "intermediaire" ? "bg-amber-500/10 text-amber-600" :
                "bg-red-500/10 text-red-600"
              )}>
                {formation.level === "debutant" ? "Débutant" : formation.level === "intermediaire" ? "Intermédiaire" : "Avancé"}
              </span>
              <div className="flex items-center gap-1.5 text-[#4A4A4A]">
                <Clock className="h-3 w-3" />
                <span className="text-[10px] font-bold">{formation.duration}</span>
              </div>
            </div>

            <h3 className="font-display text-xl font-black text-[#0A0A0A] transition-colors group-hover:text-[var(--primary)]">{formation.title}</h3>
            <p className="mt-3 text-sm font-medium leading-relaxed text-[#4A4A4A] opacity-60 transition-opacity group-hover:opacity-80">
              {formation.shortDescription}
            </p>
          </div>

          <div className="relative z-10 mt-8 flex items-center justify-between border-t border-[#0A0A0A]/5 pt-6 transition-colors group-hover:border-[var(--primary)]/20">
            <span className="text-[9px] font-black uppercase tracking-widest text-[#4A4A4A] opacity-40">{formation.category}</span>
            <div className="flex items-center gap-1 text-xs font-black uppercase tracking-widest text-[var(--primary)]">
              Explorer <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
