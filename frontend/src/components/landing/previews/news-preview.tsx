import { useState } from 'react'
import { TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

// Logos via cdn.simpleicons.org (autorisé dans la CSP img-src).
// SimpleIcons a parfois retiré OpenAI de son catalogue → on prévoit
// systématiquement un fallback texte si l'image échoue à charger.

interface BrandLogo {
  src: string
  text: string
}

type ArticleVisual =
  | { kind: 'duo'; left: BrandLogo; right: BrandLogo; leftBg: string; rightBg: string }
  | { kind: 'mono'; brand: BrandLogo; bg: string }
  | { kind: 'metric'; bg: string; value: string; label: string }

interface Article {
  title: string
  source: string
  tag: string
  visual: ArticleVisual
}

const articles: Article[] = [
  {
    title: 'GPT-X dépasse Claude sur les benchmarks de code',
    source: 'openai.com',
    tag: 'Modèles',
    visual: {
      kind: 'duo',
      left: { src: 'https://cdn.simpleicons.org/openai/FFFFFF', text: 'GPT' },
      right: { src: 'https://cdn.simpleicons.org/anthropic/FFFFFF', text: 'Claude' },
      leftBg: 'bg-[#10A37F]',
      rightBg: 'bg-[#D97757]',
    },
  },
  {
    title: 'Mistral publie son nouveau modèle open source',
    source: 'huggingface.co',
    tag: 'Lancements',
    visual: {
      kind: 'mono',
      brand: { src: 'https://cdn.simpleicons.org/mistralai/FFFFFF', text: 'Mistral' },
      bg: 'bg-gradient-to-br from-[#FA520F] to-[#FFCC00]',
    },
  },
  {
    title: 'Claude lance les agents autonomes en production',
    source: 'anthropic.com',
    tag: 'Outils',
    visual: {
      kind: 'mono',
      brand: { src: 'https://cdn.simpleicons.org/anthropic/FFFFFF', text: 'Claude' },
      bg: 'bg-gradient-to-br from-[#1F1F1F] to-[#3A2415]',
    },
  },
  {
    title: 'Les levées de fonds IA atteignent un nouveau record',
    source: 'techcrunch.com',
    tag: 'Business',
    visual: {
      kind: 'metric',
      bg: 'bg-gradient-to-br from-emerald-600 to-emerald-700',
      value: '+185%',
      label: 'YoY funding',
    },
  },
]

/** Logo brand avec fallback texte si l'image ne charge pas (CDN down,
 *  marque retirée de SimpleIcons, etc.). Le texte est sizé pour rester
 *  lisible dans la même bbox que le logo. */
function BrandMark({
  brand,
  imgClassName,
  textClassName,
}: {
  brand: BrandLogo
  imgClassName: string
  textClassName: string
}) {
  const [errored, setErrored] = useState(false)
  if (errored) {
    return (
      <span className={cn('font-display font-black tracking-tight text-white', textClassName)}>
        {brand.text}
      </span>
    )
  }
  return (
    <img
      src={brand.src}
      alt={brand.text}
      loading="lazy"
      onError={() => setErrored(true)}
      className={imgClassName}
    />
  )
}

function ArticleVisualBlock({ visual }: { visual: ArticleVisual }) {
  if (visual.kind === 'duo') {
    return (
      <div className="absolute inset-0 grid grid-cols-2">
        <div className={cn('flex items-center justify-center', visual.leftBg)}>
          <BrandMark
            brand={visual.left}
            imgClassName="h-8 w-8 opacity-95 sm:h-10 sm:w-10"
            textClassName="text-base sm:text-lg"
          />
        </div>
        <div className={cn('flex items-center justify-center', visual.rightBg)}>
          <BrandMark
            brand={visual.right}
            imgClassName="h-8 w-8 opacity-95 sm:h-10 sm:w-10"
            textClassName="text-base sm:text-lg"
          />
        </div>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-[#0A0A0A] shadow-md sm:text-[9px]"
        >
          vs
        </span>
      </div>
    )
  }

  if (visual.kind === 'mono') {
    return (
      <div className={cn('absolute inset-0 flex items-center justify-center', visual.bg)}>
        <BrandMark
          brand={visual.brand}
          imgClassName="h-10 w-10 opacity-95 sm:h-12 sm:w-12"
          textClassName="text-lg sm:text-xl"
        />
      </div>
    )
  }

  return (
    <div className={cn('absolute inset-0 flex flex-col items-center justify-center text-white', visual.bg)}>
      <TrendingUp className="mb-1 h-5 w-5 opacity-80" />
      <span className="font-display text-xl font-black leading-none tracking-tight sm:text-2xl">
        {visual.value}
      </span>
      <span className="mt-0.5 text-[7px] font-bold uppercase tracking-widest opacity-80 sm:text-[8px]">
        {visual.label}
      </span>
    </div>
  )
}

export function NewsPreview({ className }: { className?: string }) {
  return (
    <div className={cn('relative rounded-3xl border border-[#0A0A0A]/5 bg-white p-4 shadow-2xl shadow-black/5', className)}>
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {articles.map((article, i) => (
          <div
            key={i}
            className="group/article overflow-hidden rounded-xl border border-[#0A0A0A]/5 bg-white transition-all hover:border-[var(--primary)]/20 hover:shadow-lg"
          >
            <div className="relative aspect-[16/10] w-full overflow-hidden bg-gray-100">
              <ArticleVisualBlock visual={article.visual} />
              <div className="absolute top-2 left-2">
                <span className="rounded-full bg-white/90 backdrop-blur-sm px-2 py-0.5 text-[8px] font-black uppercase tracking-wider text-[#0A0A0A] shadow-sm">
                  {article.tag}
                </span>
              </div>
            </div>
            <div className="p-3">
              <h4 className="line-clamp-2 text-[10px] font-black leading-tight text-[#0A0A0A] sm:text-[11px]">
                {article.title}
              </h4>
              <p className="mt-1.5 text-[8px] font-bold text-[#737373] uppercase tracking-widest">
                {article.source}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
