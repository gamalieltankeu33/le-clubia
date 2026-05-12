import { createFileRoute, Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, Clock, CheckCircle2, ChevronRight, 
  BookOpen, Star, Layers, Zap, Users
} from 'lucide-react'
import { FORMATIONS } from '@/data/formations'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useEffect } from 'react'

export const Route = createFileRoute('/catalogue/$id')({
  component: FormationDetailPage,
})

function FormationDetailPage() {
  const { id } = Route.useParams()
  const formation = FORMATIONS.find((f) => f.id === id)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [id])

  if (!formation) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
        <h1 className="mb-4 text-2xl font-bold">Formation non trouvée</h1>
        <Link to="/catalogue">
          <Button>Retour au catalogue</Button>
        </Link>
      </div>
    )
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-24 md:py-32">
      <div className="mb-10">
        <Link to="/catalogue">
          <Button variant="ghost" className="h-10 rounded-full border border-[#0A0A0A]/5 px-4 text-[10px] font-black uppercase tracking-widest text-[#4A4A4A] transition-all hover:bg-[#0A0A0A] hover:text-white">
            <ArrowLeft className="mr-2 h-3.5 w-3.5" />
            Retour au catalogue
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-16 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Hero Thumbnail */}
            <div className="relative mb-12 aspect-video w-full overflow-hidden rounded-[2.5rem] border border-[#0A0A0A]/5 shadow-2xl shadow-[var(--primary)]/5 bg-[#F8F9FA]">
              {formation.image ? (
                <img 
                  src={formation.image} 
                  alt={formation.title}
                  className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                />
              ) : (
                <>
                  <div className={cn("absolute inset-0 opacity-20 bg-gradient-to-br", formation.color)} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/20 backdrop-blur-md">
                      <div className="h-0 w-0 border-b-[15px] border-l-[25px] border-t-[15px] border-b-transparent border-l-white border-t-transparent ml-2" />
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="mb-6 flex items-center gap-3">
              <span className={cn(
                "rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest",
                formation.level === "debutant" ? "bg-emerald-500/10 text-emerald-600" :
                formation.level === "intermediaire" ? "bg-amber-500/10 text-amber-600" :
                "bg-red-500/10 text-red-600"
              )}>
                Niveau {formation.level === "debutant" ? "Débutant" : formation.level === "intermediaire" ? "Intermédiaire" : "Avancé"}
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#4A4A4A] opacity-40">
                {formation.category}
              </span>
            </div>

            <h1 className="font-display text-4xl font-black leading-[1.1] tracking-tighter text-[#0A0A0A] md:text-6xl">
              {formation.title}
            </h1>
            <p className="mt-4 font-display text-xl font-bold italic text-[var(--primary)] md:text-2xl">
              {formation.subtitle}
            </p>

            <div className="mt-12 rounded-3xl border border-[#0A0A0A]/5 bg-[#F8F9FA] p-8 md:p-10">
              <h2 className="mb-6 flex items-center gap-3 text-lg font-black text-[#0A0A0A]">
                <Star className="h-5 w-5 text-[var(--primary)]" />
                À propos de cette formation
              </h2>
              <p className="font-medium leading-relaxed text-[#4A4A4A] opacity-80">
                {formation.longDescription}
              </p>
            </div>

            {/* Modules List */}
            <div className="mt-16 space-y-6">
              <h2 className="mb-10 flex items-center gap-4 font-display text-2xl font-black text-[#0A0A0A]">
                <Layers className="h-7 w-7 text-[var(--primary)]" />
                Programme détaillé
              </h2>
              {formation.chapters.map((chapter, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  className="group rounded-2xl border border-[#0A0A0A]/5 bg-white p-6 transition-all hover:border-[var(--primary)]/20 hover:shadow-lg hover:shadow-[var(--primary)]/5"
                >
                  <div className="flex items-start gap-5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#0A0A0A]/5 bg-[#F8F9FA] font-black text-xs text-[#4A4A4A] transition-all group-hover:border-[var(--primary)]/30 group-hover:bg-[var(--primary)]/10 group-hover:text-[var(--primary)]">
                      {String(idx + 1).padStart(2, '0')}
                    </div>
                    <div className="flex-1 pt-1">
                      <div className="mb-2 flex items-center justify-between">
                        <h3 className="text-lg font-black tracking-tight text-[#0A0A0A] transition-colors group-hover:text-[var(--primary)]">{chapter.title}</h3>
                        {chapter.duration && (
                          <span className="text-[10px] font-black uppercase tracking-widest text-[#4A4A4A] opacity-30">{chapter.duration}</span>
                        )}
                      </div>
                      {chapter.description && (
                        <p className="text-sm font-medium leading-relaxed text-[#4A4A4A] opacity-60">
                          {chapter.description}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Sidebar / CTA */}
        <aside className="lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="sticky top-32"
          >
            <div className="relative overflow-hidden rounded-3xl border border-[#0A0A0A]/5 bg-white p-8 shadow-2xl shadow-[#0A0A0A]/5 md:p-10">
              <div className={cn("absolute -right-20 -top-20 h-64 w-64 blur-3xl opacity-5 bg-gradient-to-br", formation.color)} />
              
              <div className="relative z-10">
                <div className="mb-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--primary)]">
                  <Zap className="h-4 w-4" />
                  Formation Complète
                </div>

                <div className="mb-10 space-y-6">
                  <div className="flex items-center justify-between border-b border-[#0A0A0A]/5 pb-4">
                    <div className="flex items-center gap-3 text-sm font-bold text-[#4A4A4A]">
                      <Clock className="h-4 w-4 opacity-40" /> Durée totale
                    </div>
                    <span className="font-black text-[#0A0A0A]">{formation.duration}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-[#0A0A0A]/5 pb-4">
                    <div className="flex items-center gap-3 text-sm font-bold text-[#4A4A4A]">
                      <BookOpen className="h-4 w-4 opacity-40" /> Modules
                    </div>
                    <span className="font-black text-[#0A0A0A]">{formation.chapters.length} chapitres</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-[#0A0A0A]/5 pb-4">
                    <div className="flex items-center gap-3 text-sm font-bold text-[#4A4A4A]">
                      <Users className="h-4 w-4 opacity-40" /> Accès
                    </div>
                    <span className="font-black text-[#0A0A0A]">À vie</span>
                  </div>
                </div>

                <div className="mb-10 space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    <span className="text-xs font-bold leading-snug text-[#4A4A4A]">Vidéos HD & supports PDF inclus</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    <span className="text-xs font-bold leading-snug text-[#4A4A4A]">Mises à jour gratuites</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    <span className="text-xs font-bold leading-snug text-[#4A4A4A]">Certificat de complétion</span>
                  </div>
                </div>

                <Link to="/auth">
                  <Button className="h-14 w-full rounded-2xl bg-[var(--primary)] text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-[var(--primary)]/20 transition-all hover:scale-[1.02] active:scale-95">
                    Rejoindre Le Club IA
                  </Button>
                </Link>
                
                <p className="mt-5 text-center text-[9px] font-black uppercase tracking-widest text-[#4A4A4A] opacity-30">
                  Accès immédiat • 100% sécurisé
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-[var(--primary)]/10 bg-[var(--primary)]/[0.02] p-6 backdrop-blur-xl">
              <div className="mb-2 flex items-center gap-3">
                <Users className="h-5 w-5 text-[var(--primary)]" />
                <h4 className="text-sm font-black text-[#0A0A0A]">Communauté Privée</h4>
              </div>
              <p className="text-xs font-medium leading-relaxed text-[#4A4A4A] opacity-70">
                Pose tes questions, partage tes projets et avance avec les meilleurs.
              </p>
            </div>
          </motion.div>
        </aside>
      </div>

      {/* Final CTA Section */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mt-24 overflow-hidden rounded-[2rem] border border-[#0A0A0A]/5 bg-[#F8F9FA] p-10 text-center md:p-16"
      >
        <div className="relative z-10">
          <span className="mb-4 inline-block rounded-full bg-[var(--primary)]/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--primary)]">
            Accès Illimité
          </span>
          
          <h2 className="mx-auto max-w-2xl font-display text-3xl font-black leading-tight tracking-tight text-[#0A0A0A] md:text-4xl">
            Prêt à transformer ton quotidien avec <span className="text-[var(--primary)]">l'IA ?</span>
          </h2>
          
          <p className="mx-auto mt-6 max-w-lg text-base font-medium leading-relaxed text-[#4A4A4A] opacity-70">
            Rejoins plus de 500 passionnés et accède immédiatement à toutes nos formations et notre communauté.
          </p>
          
          <div className="mt-10 flex flex-col items-center justify-center gap-6 sm:flex-row">
            <Link to="/auth">
              <Button size="lg" className="h-14 rounded-xl bg-[var(--primary)] px-8 text-xs font-black uppercase tracking-widest text-white transition-all hover:scale-[1.02] shadow-lg shadow-[var(--primary)]/20">
                Rejoindre Le Club
                <Zap className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          
          <div className="mt-8 flex justify-center gap-6 text-[9px] font-black uppercase tracking-widest text-[#4A4A4A] opacity-40">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Sans engagement
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Accès immédiat
            </div>
          </div>
        </div>
      </motion.section>
    </main>
  )
}
