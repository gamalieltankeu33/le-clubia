import { motion } from 'framer-motion'
import { ArrowRight, BookOpen, Clock } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { FORMATIONS } from '@/data/formations'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function FormationSection() {
  return (
    <section id="formations" className="relative overflow-hidden bg-[#F8F9FA] py-24 md:py-32">
      <div className="container relative z-10 mx-auto px-6">
        <motion.div 
          className="mb-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <span className="mb-4 inline-block rounded-full bg-[var(--primary)]/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.3em] text-[var(--primary)]">
            Académie Le Club IA
          </span>
          <h2 className="font-display text-3xl font-black tracking-tight text-[#0A0A0A] md:text-5xl">
            Formations <span className="italic text-[var(--primary)]">Pratiques & Actionnables</span>
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm font-medium text-[#4A4A4A] opacity-80">
            Maîtrise les outils de demain pour bâtir ton empire aujourd'hui.
          </p>
        </motion.div>

        <div className="mb-16 grid gap-6 md:grid-cols-3">
          {FORMATIONS.slice(0, 3).map((f, i) => (
            <motion.div
              key={f.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-[#0A0A0A]/5 bg-white p-8 transition-all duration-500 hover:border-[var(--primary)]/30 hover:shadow-xl hover:shadow-[var(--primary)]/5"
            >
              <div className={cn("absolute -right-10 -top-10 h-32 w-32 blur-3xl opacity-5 transition-opacity group-hover:opacity-10 bg-gradient-to-br", f.color)} />
              
              <div className="relative z-10 flex-1">
                <div className="mb-6 flex items-center justify-between">
                  <span className="rounded-full bg-[var(--primary)]/10 px-2 py-1 text-[8px] font-black uppercase tracking-widest text-[var(--primary)]">
                    {f.category}
                  </span>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-[#4A4A4A]">
                    <Clock className="h-3 w-3" /> {f.duration}
                  </div>
                </div>
                <h3 className="font-display text-xl font-black text-[#0A0A0A] transition-colors group-hover:text-[var(--primary)] md:text-2xl">
                  {f.title}
                </h3>
                <p className="mt-4 text-sm font-medium leading-relaxed text-[#4A4A4A] opacity-70 line-clamp-3">
                  {f.shortDescription}
                </p>
              </div>

              <div className="mt-10">
                <Link to="/catalogue/$id" params={{ id: f.id }}>
                  <Button variant="ghost" className="h-11 w-full justify-between rounded-xl border border-[#0A0A0A]/5 px-4 transition-all group-hover:border-[var(--primary)] group-hover:bg-[var(--primary)] group-hover:text-white">
                    <span className="text-[10px] font-black uppercase tracking-widest">Voir le programme</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="text-center">
          <Link to="/catalogue">
            <Button size="lg" className="group h-12 rounded-full bg-[#0A0A0A] px-8 text-xs font-black uppercase tracking-widest text-white transition-all hover:scale-[1.02] active:scale-95">
              Explorer toutes les formations
              <BookOpen className="ml-2 h-4 w-4 transition-transform group-hover:rotate-6" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
