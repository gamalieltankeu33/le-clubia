import { useEffect, useRef, useState } from 'react'
import YouTube, { type YouTubePlayer } from 'react-youtube'
import VimeoPlayer from '@vimeo/player'
import { PlayCircle } from 'lucide-react'
import type { FormationChapter } from '@/lib/database.types'
import {
  driveEmbedUrl,
  extractDriveId,
  extractVimeoId,
  extractYouTubeId,
  getVideoProvider,
} from '@/lib/formation-helpers'

const SAVE_INTERVAL_MS = 5_000

interface PlayerProps {
  chapter: FormationChapter
  initialPositionSeconds: number
  /**
   * Callback déclenché ~toutes les 5 s pendant la lecture.
   * `durationSeconds` peut être 0 si pas encore connu (race au chargement).
   */
  onProgressTick: (currentSeconds: number, durationSeconds: number) => void
}

export function ChapterPlayer(props: PlayerProps) {
  const provider = props.chapter.video_url
    ? getVideoProvider(props.chapter.video_url)
    : null

  if (!provider) {
    return <UnsupportedPlayer />
  }

  if (provider === 'youtube') {
    return <YouTubeChapterPlayer {...props} />
  }
  if (provider === 'drive') {
    return <DriveChapterPlayer {...props} />
  }
  return <VimeoChapterPlayer {...props} />
}

function UnsupportedPlayer() {
  return (
    <div className="flex aspect-[16/9] w-full items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)]">
      <div className="text-center">
        <PlayCircle className="mx-auto h-8 w-8" />
        <p className="mt-3 text-sm">Vidéo non disponible pour ce chapitre.</p>
      </div>
    </div>
  )
}

// =============================================================================
// YouTube
// =============================================================================
function YouTubeChapterPlayer({
  chapter,
  initialPositionSeconds,
  onProgressTick,
}: PlayerProps) {
  const playerRef = useRef<YouTubePlayer | null>(null)
  const tickRef = useRef(onProgressTick)
  tickRef.current = onProgressTick

  const videoId = chapter.video_url ? extractYouTubeId(chapter.video_url) : null

  useEffect(() => {
    playerRef.current = null
  }, [chapter.id])

  useEffect(() => {
    const interval = window.setInterval(() => {
      const player = playerRef.current
      if (!player) return
      try {
        const seconds = Number(player.getCurrentTime?.() ?? 0)
        const duration = Number(player.getDuration?.() ?? 0)
        if (seconds > 0) tickRef.current(seconds, duration)
      } catch {
        // noop
      }
    }, SAVE_INTERVAL_MS)
    return () => window.clearInterval(interval)
  }, [chapter.id])

  if (!videoId) return <UnsupportedPlayer />

  return (
    <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-black">
      <YouTube
        key={chapter.id}
        videoId={videoId}
        className="absolute inset-0 h-full w-full"
        iframeClassName="absolute inset-0 block h-full w-full border-0"
        opts={{
          width: '100%',
          height: '100%',
          host: 'https://www.youtube-nocookie.com',
          playerVars: {
            modestbranding: 1,
            rel: 0,
            showinfo: 0,
            autoplay: 0,
            playsinline: 1,
            start: Math.max(0, Math.floor(initialPositionSeconds)),
          },
        }}
        onReady={(event) => {
          playerRef.current = event.target
          try {
            const target = Math.max(0, Math.floor(initialPositionSeconds))
            if (target > 0) {
              event.target.seekTo?.(target, true)
            }
          } catch {
            // noop
          }
        }}
      />
    </div>
  )
}

// =============================================================================
// Google Drive
// =============================================================================
// Drive ne fournit pas d'API JS cross-origin pour lire la position de
// lecture. On embed via iframe `/preview` et c'est tout : pas d'envoi
// de ticks. La progression auto à 90 % ne se déclenche donc pas — les
// membres doivent cliquer "Marquer comme terminé" manuellement (bouton
// déjà présent sur la page chapitre).
//
// Pré-requis admin : la vidéo Drive doit être partagée en "Tous ceux
// qui ont le lien", sinon le navigateur du membre verra une page
// Google d'erreur d'accès dans l'iframe.
function DriveChapterPlayer({ chapter }: PlayerProps) {
  const driveId = chapter.video_url ? extractDriveId(chapter.video_url) : null
  if (!driveId) return <UnsupportedPlayer />

  return (
    <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-black">
      <iframe
        key={chapter.id}
        src={driveEmbedUrl(driveId)}
        title={chapter.title}
        allow="autoplay"
        allowFullScreen
        className="absolute inset-0 block h-full w-full border-0"
      />
    </div>
  )
}

// =============================================================================
// Vimeo
// =============================================================================
// On crée l'iframe NOUS-MÊMES (avec l'URL player.vimeo.com et les
// query params dnt/playsinline) puis on ATTACHE le SDK à l'iframe
// existante. Ça évite que le SDK fasse son propre fetch GET /config
// (qui échoue avec "There was an error fetching the embed code from
// Vimeo" sur Safari iOS sans cookies de session). L'attach mode
// communique uniquement via postMessage, donc on garde le tracking
// de progression sans le call /config strict.

function buildVimeoIframeSrc(id: string, hash?: string): string {
  const params = new URLSearchParams({
    dnt: '1',
    playsinline: '1',
    autoplay: '0',
    title: '0',
    byline: '0',
    portrait: '0',
  })
  if (hash) params.set('h', hash)
  return `https://player.vimeo.com/video/${id}?${params.toString()}`
}

function VimeoChapterPlayer({
  chapter,
  initialPositionSeconds,
  onProgressTick,
}: PlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const playerRef = useRef<VimeoPlayer | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const tickRef = useRef(onProgressTick)
  tickRef.current = onProgressTick

  const ids = chapter.video_url ? extractVimeoId(chapter.video_url) : null

  // src figé au 1er render valide. On NE change PAS la src de
  // l'iframe au changement de chapitre, sinon React démonte/remonte
  // l'iframe et le SDK Vimeo (qui manipule les nœuds DOM en parallèle)
  // entre en conflit → "The object can not be found here" sur
  // removeChild. À la place, on utilise player.loadVideo() pour
  // switcher de vidéo dans la même iframe sans toucher au DOM.
  const initialSrcRef = useRef<string | null>(null)
  if (!initialSrcRef.current && ids) {
    initialSrcRef.current = buildVimeoIframeSrc(ids.id, ids.hash)
  }
  const iframeSrc = initialSrcRef.current

  // Effet : créer le SDK la 1re fois, ou charger une autre vidéo si
  // le SDK existe déjà. Dépend uniquement de l'id du chapitre.
  useEffect(() => {
    if (!iframeRef.current || !ids) return
    setErrorMessage(null)

    // Player déjà créé → loadVideo, pas de remount.
    if (playerRef.current) {
      const player = playerRef.current
      player
        .loadVideo(Number(ids.id))
        .then(() => {
          if (initialPositionSeconds > 0) {
            return player.setCurrentTime(initialPositionSeconds)
          }
        })
        .catch((err: { name?: string; message?: string } | unknown) => {
          console.error('[VimeoPlayer] loadVideo failed', err)
          const e = err as { name?: string; message?: string }
          setErrorMessage(
            e?.message ?? e?.name ?? 'Cette vidéo n\'est pas accessible.',
          )
        })
      return
    }

    // Première fois : init du SDK en attach mode.
    let player: VimeoPlayer
    try {
      player = new VimeoPlayer(iframeRef.current)
    } catch (err) {
      console.error('[VimeoPlayer] Init failed', err)
      setErrorMessage('Impossible d\'initialiser le lecteur Vimeo.')
      return
    }
    playerRef.current = player

    // Listener d'erreur : Vimeo refuse l'embed (privacy stricte, vidéo
    // privée, domaine non whitelisté, vidéo supprimée). Plutôt qu'un
    // rectangle noir muet, on affiche le message exact dans l'UI.
    player.on('error', (err: { name?: string; message?: string }) => {
      console.error('[VimeoPlayer] runtime error event', err)
      const name = err?.name ?? 'Erreur'
      const msg = err?.message ?? 'Cette vidéo n\'est pas accessible.'
      setErrorMessage(`${name} — ${msg}`)
    })

    // Confirmation que la vidéo a bien chargé : clear l'éventuel
    // message d'erreur précédent (cas où on retry).
    player.on('loaded', () => setErrorMessage(null))

    player
      .ready()
      .then(() => {
        if (initialPositionSeconds > 0) {
          return player.setCurrentTime(initialPositionSeconds)
        }
      })
      .catch((err: { name?: string; message?: string } | unknown) => {
        // ready() rejette si Vimeo refuse l'embed dès l'init.
        console.error('[VimeoPlayer] ready() rejected', err)
        const e = err as { name?: string; message?: string }
        const msg =
          e?.message ?? "Cette vidéo n'a pas pu être chargée depuis Vimeo."
        setErrorMessage(msg)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapter.id])

  // Cleanup au démontage du composant (changement de formation, pas
  // de chapitre). On laisse le SDK détruire ses propres listeners
  // une fois que React a fini son démontage.
  useEffect(() => {
    return () => {
      const player = playerRef.current
      playerRef.current = null
      if (player) {
        // On lance destroy() de façon "fire-and-forget" et on swallow
        // les erreurs de cleanup pour ne pas re-déclencher l'erreur.
        player.destroy().catch(() => {})
      }
    }
  }, [])

  useEffect(() => {
    const interval = window.setInterval(async () => {
      const player = playerRef.current
      if (!player) return
      try {
        const [seconds, duration] = await Promise.all([
          player.getCurrentTime(),
          player.getDuration(),
        ])
        if (seconds > 0) tickRef.current(Number(seconds), Number(duration))
      } catch {
        // noop : player peut être en cours de chargement
      }
    }, SAVE_INTERVAL_MS)
    return () => window.clearInterval(interval)
  }, [chapter.id])

  if (!iframeSrc) return <UnsupportedPlayer />

  return (
    <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-black">
      <iframe
        ref={iframeRef}
        src={iframeSrc}
        title={chapter.title}
        allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
        allowFullScreen
        className="absolute inset-0 block h-full w-full border-0"
      />
      {errorMessage && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/85 px-6 text-center text-white">
          <PlayCircle className="h-10 w-10 opacity-60" />
          <p className="max-w-md text-sm font-semibold">
            Cette vidéo n'a pas pu être chargée
          </p>
          <p className="max-w-md text-xs opacity-70">{errorMessage}</p>
          {chapter.video_url && (
            <a
              href={chapter.video_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold underline-offset-2 hover:bg-white/25 hover:underline"
            >
              Ouvrir directement sur Vimeo →
            </a>
          )}
        </div>
      )}
    </div>
  )
}
