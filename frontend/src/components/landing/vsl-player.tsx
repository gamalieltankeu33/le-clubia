import { Play } from 'lucide-react'
import { useState } from 'react'
import { extractVimeoId } from '@/lib/formation-helpers'
import { cn } from '@/lib/utils'

/**
 * Lecteur VSL de la landing — "lecture au clic, avec le son".
 *
 * Contrainte navigateur : impossible de démarrer une vidéo AVEC le son
 * sans geste utilisateur. On affiche donc un poster avec un gros bouton
 * ▶️ ; au clic (geste utilisateur), on monte l'iframe en autoplay=1 SANS
 * mute → la vidéo démarre avec le son depuis la 1re seconde.
 *
 * Pattern iOS-safe : iframe simple vers player.vimeo.com (pas de SDK,
 * donc pas de fetch GET /config qui échoue sur Safari iOS → pas d'écran
 * noir). cf. video-embed.tsx.
 */

function buildVslSrc(id: string, hash?: string): string {
  const params = new URLSearchParams({
    dnt: '1',
    playsinline: '1',
    autoplay: '1', // déclenché par le clic → le son est autorisé
    title: '0',
    byline: '0',
    portrait: '0',
  })
  if (hash) params.set('h', hash)
  return `https://player.vimeo.com/video/${id}?${params.toString()}`
}

export function VslPlayer({
  url,
  title = 'Vidéo',
  className,
}: {
  url: string
  title?: string
  className?: string
}) {
  const [playing, setPlaying] = useState(false)

  const ids = extractVimeoId(url)
  const src = ids ? buildVslSrc(ids.id, ids.hash) : null
  if (!src) return null

  return (
    <div
      className={cn(
        'relative aspect-video w-full overflow-hidden bg-[#0A0A0A]',
        className,
      )}
    >
      {playing ? (
        <iframe
          src={src}
          title={title}
          className="absolute inset-0 h-full w-full border-0"
          allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          aria-label="Lire la vidéo"
          className="group absolute inset-0 flex flex-col items-center justify-center gap-5"
        >
          {/* Texture de fond */}
          <span aria-hidden="true" className="absolute inset-0 opacity-40">
            <span className="absolute left-1/4 top-1/3 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--primary)]/40 blur-[100px]" />
            <span className="absolute right-1/4 top-2/3 h-80 w-80 -translate-y-1/2 rounded-full bg-[var(--accent)]/20 blur-[100px]" />
          </span>
          <span
            aria-hidden="true"
            className="absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage:
                'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
              backgroundSize: '64px 64px',
            }}
          />

          <span className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-2xl shadow-white/20 transition-transform group-hover:scale-105 sm:h-24 sm:w-24">
            <Play className="ml-1 h-8 w-8 fill-[#0A0A0A] text-[#0A0A0A] sm:h-10 sm:w-10" />
          </span>
          <span className="relative text-base font-semibold tracking-tight text-white sm:text-lg">
            Regarder la vidéo
          </span>
        </button>
      )}
    </div>
  )
}
