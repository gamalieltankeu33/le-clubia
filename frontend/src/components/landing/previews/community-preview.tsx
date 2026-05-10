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
]

export function CommunityPreview({ className }: { className?: string }) {
  return (
    <BrowserCard className={className}>
      <div className="space-y-3 p-4 sm:p-5">
        {POSTS.map((p) => (
          <article
            key={p.name}
            className="rounded-xl border border-[#E5E5E5] bg-white p-3"
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
                <p className="truncate text-xs font-semibold text-[#0A0A0A]">
                  {p.name}
                </p>
                <p className="truncate text-[10px] text-[#737373]">{p.role}</p>
              </div>
            </header>
            <p className="mt-2 line-clamp-2 text-[11px] leading-snug text-[#0A0A0A]/85">
              {p.body}
            </p>
            <footer className="mt-2.5 flex items-center gap-3 text-[10px] text-[#737373]">
              <span className="inline-flex items-center gap-0.5">
                <Heart className="h-2.5 w-2.5" />
                {p.likes}
              </span>
              <span className="inline-flex items-center gap-0.5">
                <MessageCircle className="h-2.5 w-2.5" />
                {p.comments}
              </span>
            </footer>
          </article>
        ))}
      </div>
    </BrowserCard>
  )
}
