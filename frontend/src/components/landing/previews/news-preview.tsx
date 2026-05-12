import {
  ImageWithFallback,
} from './image-with-fallback'
import { cn } from '@/lib/utils'

const articles = [
  {
    title: 'GPT-X dépasse Claude sur les benchmarks de code',
    source: 'openai.com',
    tag: 'Modèles',
    image: '/landing/previews/article-benchmarks.png',
    color: 'bg-blue-600',
  },
  {
    title: 'Mistral publie son nouveau modèle open source',
    source: 'huggingface.co',
    tag: 'Lancements',
    image: '/landing/previews/article-mistral.png',
    color: 'bg-indigo-500',
  },
  {
    title: 'Claude lance les agents autonomes en production',
    source: 'anthropic.com',
    tag: 'Outils',
    image: '/landing/previews/article-agents.png',
    color: 'bg-slate-800',
  },
  {
    title: 'Les levées de fonds IA atteignent un nouveau record',
    source: 'techcrunch.com',
    tag: 'Business',
    image: '/landing/previews/article-funding.png',
    color: 'bg-emerald-600',
  },
]

export function NewsPreview({ className }: { className?: string }) {
  return (
    <div className={cn('relative rounded-3xl border border-[#0A0A0A]/5 bg-white p-4 shadow-2xl shadow-black/5', className)}>
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {articles.map((article, i) => (
          <div
            key={i}
            className="group/article overflow-hidden rounded-xl border border-[#0A0A0A]/5 bg-white transition-all hover:border-[var(--primary)]/20 hover:shadow-lg"
          >
            <div className="aspect-[16/10] w-full overflow-hidden bg-gray-100 relative">
              <ImageWithFallback
                src={article.image}
                alt={article.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover/article:scale-110"
                fallback={
                  <div className={cn("absolute inset-0", article.color)} />
                }
              />
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
