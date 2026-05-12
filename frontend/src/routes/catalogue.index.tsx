import { createFileRoute, Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, Clock, ChevronRight, 
  GraduationCap, Zap, Brain
} from 'lucide-react'
import { FORMATIONS } from '@/data/formations'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/catalogue/')({
  component: CataloguePage,
})

function CataloguePage() {
  return (
    <main className="relative z-10 mx-auto max-w-5xl px-6 py-24 md:py-32">
      <header className="mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-10">
            <Link to="/">
              <Button variant="ghost" className="h-10 rounded-full border border-[#0A0A0A]/5 px-4 text-[10px] font-black uppercase tracking-widest text-[#4A4A4A] transition-all hover:bg-[#0A0A0A] hover:text-white">
                <ArrowLeft className="mr-2 h-3.5 w-3.5" />
                Retour à l'accueil
              </Button>
            </Link>
          </div>

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

      {/* Categories Section */}
      <div className="space-y-24">
        <CategorySection 
          title="Bloc 1 — Fondations" 
          subtitle="Pour bien débuter" 
          icon={<GraduationCap className="h-6 w-6 text-blue-500" />}
          bgColor="bg-blue-500/10"
          formations={FORMATIONS.filter(f => f.category === "Outils IA" || f.category === "Automatisation")}
        />

        <CategorySection 
          title="Bloc 2 — Créer ton business" 
          subtitle="Le cœur de cible" 
          icon={<Zap className="h-6 w-6 text-[var(--primary)]" />}
          bgColor="bg-[var(--primary)]/10"
          formations={FORMATIONS.filter(f => f.category === "Création de contenu IA" || f.category === "Business IA")}
        />

        <CategorySection 
          title="Bloc 3 — Tech & Avancé" 
          subtitle="Pour aller plus loin" 
          icon={<Brain className="h-6 w-6 text-purple-500" />}
          bgColor="bg-purple-500/10"
          formations={FORMATIONS.filter(f => f.category === "Développement IA")}
        />
      </div>
    </main>
  )
}

function CategorySection({ title, subtitle, icon, bgColor, formations }: any) {
  return (
    <section>
      <div className="mb-10 flex items-center gap-4">
        <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl", bgColor)}>
          {icon}
        </div>
        <div>
          <h2 className="font-display text-2xl font-black text-[#0A0A0A]">{title}</h2>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#4A4A4A] opacity-40">{subtitle}</p>
        </div>
      </div>
      <div className="grid gap-8">
        {formations.map((formation: any, i: number) => (
          <FormationCard key={formation.id} formation={formation} index={i} />
        ))}
      </div>
    </section>
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
        <div className="flex flex-col overflow-hidden rounded-[2.5rem] border border-[#0A0A0A]/5 bg-[#F8F9FA] transition-all duration-500 hover:border-[var(--primary)]/30 hover:bg-white hover:shadow-2xl hover:shadow-[var(--primary)]/5 md:flex-row">
          {/* Left: Thumbnail (YouTube Style) */}
          <div className="relative aspect-video w-full shrink-0 overflow-hidden bg-[#F8F9FA] md:w-80 lg:w-96">
            {formation.image ? (
              <img 
                src={formation.image} 
                alt={formation.title}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
            ) : (
              <>
                <div className={cn("absolute inset-0 opacity-20 transition-opacity group-hover:opacity-30 bg-gradient-to-br", formation.color)} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-md transition-transform duration-500 group-hover:scale-110">
                    <div className="h-0 w-0 border-b-[10px] border-l-[18px] border-t-[10px] border-b-transparent border-l-white border-t-transparent ml-1" />
                  </div>
                </div>
              </>
            )}
            <div className="absolute bottom-4 right-4 rounded-md bg-[#0A0A0A]/80 px-2 py-1 text-[10px] font-black text-white backdrop-blur-sm">
              {formation.duration}
            </div>
          </div>

          {/* Right: Content */}
          <div className="flex flex-1 flex-col justify-center p-8 md:p-10">
            <div className="mb-4 flex items-center gap-3">
              <span className={cn(
                "rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-widest",
                formation.level === "debutant" ? "bg-emerald-500/10 text-emerald-600" :
                formation.level === "intermediaire" ? "bg-amber-500/10 text-amber-600" :
                "bg-red-500/10 text-red-600"
              )}>
                {formation.level === "debutant" ? "Débutant" : formation.level === "intermediaire" ? "Intermédiaire" : "Avancé"}
              </span>
              <span className="text-[9px] font-black uppercase tracking-widest text-[#4A4A4A] opacity-40">{formation.category}</span>
            </div>

            <h3 className="font-display text-2xl font-black leading-tight text-[#0A0A0A] transition-colors group-hover:text-[var(--primary)] md:text-3xl">
              {formation.title}
            </h3>
            <p className="mt-4 max-w-xl text-sm font-medium leading-relaxed text-[#4A4A4A] opacity-70 transition-opacity group-hover:opacity-90">
              {formation.shortDescription}
            </p>

            <div className="mt-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--primary)]">
              Découvrir le programme <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
