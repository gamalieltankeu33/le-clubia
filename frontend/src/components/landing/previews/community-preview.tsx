import { Heart, MessageCircle } from 'lucide-react'
import { BrowserCard } from './browser-card'
import { ImageWithFallback } from './image-with-fallback'
import { cn } from '@/lib/utils'

interface PostItem {
  name: string
  initials: string
  role: string
  body: string
  avatar: string
  bg: string
  likes: number
  comments: number
  isVerified?: boolean
  postImage?: string
}

const POSTS: PostItem[] = [
  {
    name: 'Abdoulaye K.',
    initials: 'AK',
    role: 'Growth Hacker IA',
    body: "Incroyable ! J'ai automatisé toute ma prospection LinkedIn avec Claude et Phantombuster. +30% de taux de réponse cette semaine.",
    avatar: '/landing/avatars/ak.png',
    bg: '#1E40AF',
    likes: 56,
    comments: 14,
    isVerified: true,
  },
  {
    name: 'Moussa D.',
    initials: 'MD',
    role: 'Automation Architect',
    body: "J'ai branché GPT-4o sur mon CRM pour qualifier les leads en temps réel. Ça change tout pour la réactivité commerciale.",
    avatar: '/landing/avatars/md.png',
    bg: '#1e293b',
    likes: 67,
    comments: 19,
    isVerified: true,
  },
  {
    name: 'Zainab S.',
    initials: 'ZS',
    role: 'Freelance IA Expert',
    body: "Résultat de mon dernier test sur Midjourney v6 pour un client e-commerce. La cohérence des personnages est maintenant folle. Regardez ce rendu !",
    avatar: '/landing/avatars/zs.png',
    bg: '#db2777',
    likes: 124,
    comments: 32,
    postImage: '/landing/previews/ai-generation.png',
  },
  {
    name: 'Koffi M.',
    initials: 'KM',
    role: 'Entrepreneur No-Code',
    body: "Le Club est vraiment une mine d'or. La formation sur les Micro-SaaS m'a permis de lancer ma V1 en 4 jours. Merci pour les retours !",
    avatar: '/landing/avatars/km.png',
    bg: '#059669',
    likes: 42,
    comments: 8,
    isVerified: true,
  },
]

export function CommunityPreview({ className }: { className?: string }) {
  return (
    <BrowserCard className={cn("flex flex-col", className)}>
      <div className="space-y-4 p-4 sm:p-6">
        {POSTS.map((p) => (
          <article
            key={p.name}
            className="group/post rounded-2xl border border-[#0A0A0A]/5 bg-white p-4 shadow-sm transition-all hover:border-[var(--primary)]/20"
          >
            <header className="flex items-center gap-3">
              <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full ring-2 ring-white shadow-sm">
                <ImageWithFallback
                  src={p.avatar}
                  alt={p.name}
                  fallback={
                    <span
                      className={cn(
                        'flex h-full w-full items-center justify-center text-xs font-black text-white',
                      )}
                      style={{ backgroundColor: p.bg }}
                    >
                      {p.initials}
                    </span>
                  }
                />
              </span>
              <div className="min-w-0 leading-tight">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-[13px] font-black text-[#0A0A0A]">
                    {p.name}
                  </p>
                  {p.isVerified && (
                    <div className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-blue-500 text-white">
                      <svg viewBox="0 0 24 24" fill="none" className="h-2 w-2" stroke="currentColor" strokeWidth="4">
                        <path d="M20 6L9 17L4 12" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )}
                </div>
                <p className="truncate text-[10px] font-bold text-[#737373] uppercase tracking-widest">{p.role}</p>
              </div>
            </header>
            
            <p className="mt-3 text-[12px] leading-relaxed text-[#4A4A4A]">
              {p.body}
            </p>

            {p.postImage && (
              <div className="mt-4 overflow-hidden rounded-xl border border-[#0A0A0A]/5 bg-gray-50 aspect-video relative">
                <ImageWithFallback
                  src={p.postImage}
                  alt="Post content"
                  className="h-full w-full object-cover"
                  fallback={
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-blue-500/10 flex items-center justify-center">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#0A0A0A]/20">Visualisation IA</span>
                    </div>
                  }
                />
              </div>
            )}

            <footer className="mt-4 flex items-center gap-4 text-[10px] font-black text-[#737373] uppercase tracking-wider">
              <span className="inline-flex items-center gap-1.5 transition-colors hover:text-red-500 cursor-pointer">
                <Heart className="h-3 w-3" />
                {p.likes}
              </span>
              <span className="inline-flex items-center gap-1.5 transition-colors hover:text-[var(--primary)] cursor-pointer">
                <MessageCircle className="h-3 w-3" />
                {p.comments}
              </span>
            </footer>
          </article>
        ))}
      </div>
      
      {/* "Active Conversation" Footer Section */}
      <div className="border-t border-[#0A0A0A]/5 bg-white/50 p-5 backdrop-blur-sm">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-8 w-8 rounded-full border-2 border-white bg-gray-200 shadow-sm" />
              ))}
            </div>
            <span className="text-[11px] font-black text-[#4A4A4A] uppercase tracking-widest">+24 membres actifs</span>
          </div>
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-[#0A0A0A]/5 bg-white px-5 py-3 shadow-inner">
          <div className="h-2 w-2 rounded-full bg-[var(--primary)]/20" />
          <span className="text-xs font-medium text-[#A3A3A3]">Échanger avec la communauté...</span>
        </div>
      </div>
    </BrowserCard>
  )
}
