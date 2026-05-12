import { Clock, GraduationCap } from 'lucide-react'
import { BrowserCard } from './browser-card'
import {
  GradientPlaceholder,
  ImageWithFallback,
} from './image-with-fallback'
import { cn } from '@/lib/utils'
import { FORMATIONS } from '@/data/formations'

const LEVEL_COLORS: Record<string, string> = {
  debutant: 'bg-[var(--bleu-ciel)]/15 text-[var(--bleu-ciel-deep)]',
  intermediaire: 'bg-[var(--primary)]/10 text-[var(--primary)]',
  avance: 'bg-[var(--or)]/15 text-[var(--or-deep)]',
}

const LEVEL_LABELS: Record<string, string> = {
  debutant: 'Débutant',
  intermediaire: 'Intermédiaire',
  avance: 'Avancé',
}

export function FormationsPreview({ className }: { className?: string }) {
  const previewFormations = FORMATIONS.slice(0, 3)
  
  return (
    <div className={cn("grid gap-4 p-2", className)}>
      {previewFormations.map((f, i) => (
        <div
          key={f.id}
          className="group/item relative flex flex-col gap-3 rounded-2xl border border-[#0A0A0A]/5 bg-white p-3 shadow-sm transition-all hover:border-[var(--primary)]/20 hover:shadow-md"
        >
          {/* Thumbnail - YouTube style - Reduced size */}
          <div className="aspect-video w-full overflow-hidden rounded-xl bg-gray-100 md:aspect-[21/9]">
            <ImageWithFallback
              src={f.image ?? ''}
              alt={f.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover/item:scale-105"
              fallback={<GradientPlaceholder variant={i === 0 ? 'blue' : i === 1 ? 'orange' : 'green'} />}
            />
          </div>
          
          <div className="flex flex-col gap-2 px-1 py-1">
            <div className="flex items-center justify-between">
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-widest',
                  LEVEL_COLORS[f.level],
                )}
              >
                {LEVEL_LABELS[f.level]}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#737373]">
                <Clock className="h-3 w-3" />
                {f.duration}
              </span>
            </div>
            
            <h4 className="line-clamp-1 font-display text-xl font-black tracking-tight text-[#0A0A0A] group-hover/item:text-[var(--primary)] transition-colors">
              {f.title}
            </h4>
            <p className="line-clamp-2 text-sm font-medium leading-relaxed text-[#4A4A4A] opacity-80">
              {f.shortDescription}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
