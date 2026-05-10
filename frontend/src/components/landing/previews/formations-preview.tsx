import { Clock, GraduationCap } from 'lucide-react'
import { BrowserCard } from './browser-card'
import {
  GradientPlaceholder,
  ImageWithFallback,
} from './image-with-fallback'
import { cn } from '@/lib/utils'

interface FormationItem {
  title: string
  level: 'Débutant' | 'Intermédiaire' | 'Avancé'
  duration: string
  image: string
  variant: 'blue' | 'orange' | 'green'
}

// Édite ces items pour customiser le rendu. Drop tes images dans
// /public/landing/formations/ avec ces noms exacts pour qu'elles
// remplacent les gradients placeholders.
const FORMATIONS: FormationItem[] = [
  {
    title: 'ChatGPT pour les pros',
    level: 'Débutant',
    duration: '30 min',
    image: '/landing/formations/formation-1.jpg',
    variant: 'blue',
  },
  {
    title: 'Automatiser avec Make',
    level: 'Intermédiaire',
    duration: '1h 20',
    image: '/landing/formations/formation-2.jpg',
    variant: 'orange',
  },
  {
    title: 'Vidéo IA avec Sora',
    level: 'Avancé',
    duration: '45 min',
    image: '/landing/formations/formation-3.jpg',
    variant: 'green',
  },
]

const LEVEL_COLORS: Record<FormationItem['level'], string> = {
  Débutant: 'bg-[var(--bleu-ciel)]/15 text-[var(--bleu-ciel-deep)]',
  Intermédiaire: 'bg-[var(--primary)]/10 text-[var(--primary)]',
  Avancé: 'bg-[var(--or)]/15 text-[var(--or-deep)]',
}

export function FormationsPreview({ className }: { className?: string }) {
  return (
    <BrowserCard className={className}>
      <div className="space-y-3 p-4 sm:p-5">
        {FORMATIONS.map((f) => (
          <div
            key={f.title}
            className="flex items-center gap-3 rounded-xl border border-[#E5E5E5] bg-white p-2.5 transition-shadow hover:shadow-sm"
          >
            <div className="h-12 w-16 shrink-0 overflow-hidden rounded-lg">
              <ImageWithFallback
                src={f.image}
                alt={f.title}
                fallback={<GradientPlaceholder variant={f.variant} />}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-[#0A0A0A] sm:text-sm">
                {f.title}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 text-[9px] font-medium',
                    LEVEL_COLORS[f.level],
                  )}
                >
                  {f.level}
                </span>
                <span className="inline-flex items-center gap-0.5 text-[10px] text-[#737373]">
                  <Clock className="h-2.5 w-2.5" />
                  {f.duration}
                </span>
              </div>
            </div>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#1E40AF]/10 text-[#1E40AF]">
              <GraduationCap className="h-3.5 w-3.5" />
            </span>
          </div>
        ))}
      </div>
    </BrowserCard>
  )
}
