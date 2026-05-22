import VimeoPlayer from '@vimeo/player'
import { Volume2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { extractVimeoId } from '@/lib/formation-helpers'
import { cn } from '@/lib/utils'

/**
 * Lecteur VSL de la landing.
 *
 * Contrainte navigateur : l'autoplay AVEC son est interdit tant que
 * l'utilisateur n'a pas interagi. On démarre donc la vidéo en MUET
 * (autoplay autorisé), avec un overlay "Activer le son". Au premier
 * clic (geste utilisateur), on dé-mute via le SDK Vimeo SANS recharger
 * l'iframe — la vidéo continue, le son s'active.
 *
 * Pattern iframe : on crée l'iframe nous-mêmes (params dnt/playsinline)
 * puis on attache le SDK en "attach mode" → évite le bug "écran noir
 * iOS" (le SDK ne fait pas son fetch GET /config). cf. chapter-player.
 */

function buildVslSrc(id: string, hash?: string): string {
  const params = new URLSearchParams({
    dnt: '1',
    playsinline: '1',
    autoplay: '1',
    muted: '1',
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
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const playerRef = useRef<VimeoPlayer | null>(null)
  const [muted, setMuted] = useState(true)

  const ids = extractVimeoId(url)
  const src = ids ? buildVslSrc(ids.id, ids.hash) : null

  // SDK Vimeo en best-effort : sert uniquement à dé-muter au clic. Si
  // l'attach plante, l'iframe affiche quand même la vidéo (muette) et
  // le visiteur peut utiliser le bouton son natif de Vimeo.
  useEffect(() => {
    if (!iframeRef.current || !src) return
    let player: VimeoPlayer | null = null
    try {
      player = new VimeoPlayer(iframeRef.current)
      playerRef.current = player
    } catch (err) {
      console.warn('[VslPlayer] SDK attach failed', err)
    }
    return () => {
      const p = playerRef.current
      playerRef.current = null
      if (p) {
        try {
          void p.destroy().catch(() => {})
        } catch {
          // destroy peut throw si l'iframe est déjà retirée du DOM — OK.
        }
      }
    }
  }, [src])

  const enableSound = async () => {
    setMuted(false) // masque l'overlay immédiatement
    const player = playerRef.current
    if (!player) return
    try {
      await player.setMuted(false)
      await player.setVolume(1)
      await player.play().catch(() => {})
    } catch (err) {
      console.warn('[VslPlayer] unmute failed', err)
    }
  }

  if (!src) return null

  return (
    <div
      className={cn(
        'relative aspect-video w-full overflow-hidden bg-black',
        className,
      )}
    >
      <iframe
        ref={iframeRef}
        src={src}
        title={title}
        className="absolute inset-0 h-full w-full border-0"
        allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
        allowFullScreen
      />
      {muted && (
        <button
          type="button"
          onClick={enableSound}
          aria-label="Activer le son"
          className="group absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black/25 transition-colors hover:bg-black/35"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-2xl shadow-black/30 transition-transform group-hover:scale-105 sm:h-20 sm:w-20">
            <Volume2 className="h-7 w-7 text-[#0A0A0A] sm:h-8 sm:w-8" />
          </span>
          <span className="rounded-full bg-white/95 px-4 py-1.5 text-sm font-semibold text-[#0A0A0A] shadow-lg">
            Cliquez pour activer le son
          </span>
        </button>
      )}
    </div>
  )
}
