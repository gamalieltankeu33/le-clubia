import { BrowserCard } from './browser-card'
import {
  GradientPlaceholder,
  ImageWithFallback,
} from './image-with-fallback'
import { cn } from '@/lib/utils'

interface ArticleItem {
  title: string
  category: 'Modèles & recherche' | 'Outils & produits' | 'Business'
  ago: string
  image: string
  variant: 'blue' | 'orange' | 'violet'
}

// Édite ces articles pour customiser le rendu. Drop tes images dans
// /public/landing/articles/ avec ces noms exacts pour les utiliser.
const ARTICLES: ArticleItem[] = [
  {
    title: 'OpenAI dévoile GPT-5 : ce qui change vraiment',
    category: 'Modèles & recherche',
    ago: 'il y a 2h',
    image: '/landing/articles/article-1.jpg',
    variant: 'blue',
  },
  {
    title: 'Anthropic lance Claude Code : la révolution dev',
    category: 'Outils & produits',
    ago: 'il y a 5h',
    image: '/landing/articles/article-2.jpg',
    variant: 'orange',
  },
  {
    title: 'Mistral AI lève 600 M€ pour accélérer en Europe',
    category: 'Business',
    ago: 'il y a 1j',
    image: '/landing/articles/article-3.jpg',
    variant: 'violet',
  },
]

const CATEGORY_COLORS: Record<ArticleItem['category'], string> = {
  'Modèles & recherche': 'bg-[var(--primary)]/10 text-[var(--primary)]',
  'Outils & produits': 'bg-[var(--bleu-ciel)]/15 text-[var(--bleu-ciel-deep)]',
  Business: 'bg-violet-100 text-violet-700',
}

export function NewsPreview({ className }: { className?: string }) {
  return (
    <BrowserCard className={className}>
      <div className="space-y-3 p-4 sm:p-5">
        {ARTICLES.map((a) => (
          <article
            key={a.title}
            className="flex gap-3 overflow-hidden rounded-xl border border-[#E5E5E5] bg-white p-2.5"
          >
            <div className="h-14 w-20 shrink-0 overflow-hidden rounded-lg">
              <ImageWithFallback
                src={a.image}
                alt={a.title}
                fallback={<GradientPlaceholder variant={a.variant} />}
              />
            </div>
            <div className="min-w-0 flex-1">
              <span
                className={cn(
                  'inline-flex rounded-full px-1.5 py-0.5 text-[9px] font-medium',
                  CATEGORY_COLORS[a.category],
                )}
              >
                {a.category}
              </span>
              <p className="mt-1 line-clamp-2 text-xs font-semibold leading-snug text-[#0A0A0A]">
                {a.title}
              </p>
              <p className="mt-1 text-[10px] text-[#737373]">{a.ago}</p>
            </div>
          </article>
        ))}
      </div>
    </BrowserCard>
  )
}
