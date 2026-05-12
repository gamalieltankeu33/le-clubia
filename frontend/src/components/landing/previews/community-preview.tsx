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
}

// Édite ces posts pour customiser le rendu. Drop tes images dans
// /public/landing/avatars/ avec ces noms exacts pour qu'elles
// remplacent les avatars colorés.
const POSTS: PostItem[] = [
  {
    name: 'Camille R.',
    initials: 'CR',
    role: 'Créatrice de contenu',
    body: 'Je viens de tester GPT-5 sur la rédaction de scripts vidéo : le ton est bien plus naturel, on sent moins le "ChatGPT". Mes premiers retours…',
    avatar: '/landing/avatars/avatar-1.jpg',
    bg: '#1E40AF',
    likes: 24,
    comments: 6,
  },
  {
    name: 'Yanis B.',
    initials: 'YB',
    role: 'Entrepreneur',
    body: 'Mon workflow Make qui me fait gagner 5h/semaine sur ma veille concurrentielle. Je le partage en exclusivité aux membres du Club.',
    avatar: '/landing/avatars/avatar-2.jpg',
    bg: '#2563EB',
    likes: 41,
    comments: 12,
  },
  {
    name: 'Sofia M.',
    initials: 'SM',
    role: 'Designeuse IA',
    body: "Astuce ChatGPT que personne ne mentionne : utilise le mode \"projet\" pour garder le contexte sur plusieurs sessions. Game changer.",
    avatar: '/landing/avatars/avatar-3.jpg',
    bg: '#7c3aed',
    likes: 18,
    comments: 4,
  },
  {
    name: 'Lucas T.',
    initials: 'LT',
    role: 'Dev Fullstack',
    body: "Qui a testé le nouveau SDK de Mistral ? Les performances sur l'extraction de données sont bluffantes.",
    avatar: '/landing/avatars/avatar-4.jpg',
    bg: '#059669',
    likes: 12,
    comments: 3,
  },
  {
    name: 'Marie E.',
    initials: 'ME',
    role: 'Product Manager',
    body: "Je cherche des retours sur l'intégration de Perplexity API dans un produit SaaS. Quelqu'un a déjà mis ça en prod ?",
    avatar: '/landing/avatars/avatar-5.jpg',
    bg: '#db2777',
    likes: 15,
    comments: 7,
  },
  {
    name: 'Thomas D.',
    initials: 'TD',
    role: 'Freelance IA',
    body: "Nouveau record : j'ai réussi à automatiser 90% de mon reporting client avec n8n. Voici le schéma du workflow...",
    avatar: '/landing/avatars/avatar-6.jpg',
    bg: '#d97706',
    likes: 38,
    comments: 9,
  },
]

export function CommunityPreview({ className }: { className?: string }) {
  return (
    <BrowserCard className={cn("flex flex-col", className)}>
      <div className="space-y-3 p-4 sm:p-5">
        {POSTS.map((p) => (
          <article
            key={p.name}
            className="rounded-xl border border-[#0A0A0A]/5 bg-white p-3 shadow-sm transition-transform hover:scale-[1.01]"
          >
            <header className="flex items-center gap-2">
              <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full">
                <ImageWithFallback
                  src={p.avatar}
                  alt={p.name}
                  fallback={
                    <span
                      className={cn(
                        'flex h-full w-full items-center justify-center text-[10px] font-semibold text-white',
                      )}
                      style={{ backgroundColor: p.bg }}
                    >
                      {p.initials}
                    </span>
                  }
                />
              </span>
              <div className="min-w-0 leading-tight">
                <p className="truncate text-xs font-bold text-[#0A0A0A]">
                  {p.name}
                </p>
                <p className="truncate text-[9px] font-medium text-[#737373] uppercase tracking-wider">{p.role}</p>
              </div>
            </header>
            <p className="mt-2 line-clamp-2 text-[11px] leading-snug text-[#4A4A4A]">
              {p.body}
            </p>
            <footer className="mt-2 flex items-center gap-3 text-[9px] font-bold text-[#737373]">
              <span className="inline-flex items-center gap-1 transition-colors hover:text-red-500 cursor-pointer">
                <Heart className="h-2.5 w-2.5" />
                {p.likes}
              </span>
              <span className="inline-flex items-center gap-1 transition-colors hover:text-[var(--primary)] cursor-pointer">
                <MessageCircle className="h-2.5 w-2.5" />
                {p.comments}
              </span>
            </footer>
          </article>
        ))}
      </div>
      
      {/* "Active Conversation" Footer Section to fill the void and look like a group chat */}
      <div className="border-t border-[#0A0A0A]/5 bg-white/50 p-4 backdrop-blur-sm">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-6 w-6 rounded-full border-2 border-white bg-gray-200" />
              ))}
            </div>
            <span className="text-[10px] font-bold text-[#4A4A4A]">+12 connectés</span>
          </div>
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>
        <div className="flex items-center gap-2 rounded-full border border-[#0A0A0A]/5 bg-white px-4 py-2">
          <div className="h-1.5 w-1.5 rounded-full bg-gray-300" />
          <span className="text-[10px] font-medium text-[#A3A3A3]">Taper un message...</span>
        </div>
      </div>
    </BrowserCard>
  )
}
