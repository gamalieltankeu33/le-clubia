import { PlayCircle } from 'lucide-react'
import {
  driveEmbedUrl,
  extractDriveId,
  extractVimeoId,
  extractYouTubeId,
  getVideoProvider,
} from '@/lib/formation-helpers'
import { cn } from '@/lib/utils'

/**
 * Lecteur vidéo embarqué simple (sans tracking de progression).
 *
 * Réutilise les helpers de formation-helpers pour supporter
 * Vimeo / YouTube / Google Drive. Pour Vimeo, on construit nous-mêmes
 * l'iframe avec les bons query params (dnt=1, playsinline=1) — c'est le
 * pattern qui évite le bug "écran noir iOS" (on ne laisse pas le SDK
 * Vimeo fetcher la config d'embed). Pas de SDK ici car on n'a pas
 * besoin de lire la position de lecture (lecture simple = V1 replay).
 */
export function VideoEmbed({
  url,
  title = 'Vidéo',
  className,
  autoplay = false,
  loop = false,
}: {
  url: string
  title?: string
  className?: string
  /** Démarrage automatique. Forcé en muet : les navigateurs bloquent
   *  l'autoplay avec son. Le visiteur active le son via les contrôles. */
  autoplay?: boolean
  loop?: boolean
}) {
  const provider = getVideoProvider(url)

  if (!provider) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)]">
        <div className="text-center">
          <PlayCircle className="mx-auto h-8 w-8" />
          <p className="mt-3 text-sm">Vidéo non disponible.</p>
        </div>
      </div>
    )
  }

  let src = ''
  if (provider === 'vimeo') {
    const ids = extractVimeoId(url)!
    const hashParam = ids.hash ? `&h=${ids.hash}` : ''
    const autoParam = autoplay ? '&autoplay=1&muted=1' : ''
    const loopParam = loop ? '&loop=1' : ''
    // title/byline/portrait=0 : masque le titre, le nom de l'auteur et
    // l'avatar superposés → lecteur épuré (même réglage que le replay).
    src = `https://player.vimeo.com/video/${ids.id}?dnt=1&playsinline=1&title=0&byline=0&portrait=0${autoParam}${loopParam}${hashParam}`
  } else if (provider === 'youtube') {
    const id = extractYouTubeId(url)!
    const autoParam = autoplay ? '&autoplay=1&mute=1' : ''
    const loopParam = loop ? `&loop=1&playlist=${id}` : ''
    src = `https://www.youtube-nocookie.com/embed/${id}?rel=0&playsinline=1${autoParam}${loopParam}`
  } else {
    const id = extractDriveId(url)!
    src = driveEmbedUrl(id)
  }

  return (
    <div
      className={cn(
        'relative aspect-video w-full overflow-hidden rounded-2xl bg-black',
        className,
      )}
    >
      <iframe
        src={src}
        title={title}
        className="absolute inset-0 h-full w-full border-0"
        allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
        allowFullScreen
        loading="lazy"
      />
    </div>
  )
}
