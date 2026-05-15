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
function VimeoChapterPlayer({
  chapter,
  initialPositionSeconds,
  onProgressTick,
}: PlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<VimeoPlayer | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const tickRef = useRef(onProgressTick)
  tickRef.current = onProgressTick

  useEffect(() => {
    if (!containerRef.current || !chapter.video_url) return
    const ids = extractVimeoId(chapter.video_url)
    if (!ids) {
      setErrorMessage('URL Vimeo non reconnue')
      return
    }
    setErrorMessage(null)
    console.log('[Vimeo] init', { videoId: ids.id, url: chapter.video_url })

    const containerWidth =
      containerRef.current.getBoundingClientRect().width || 640

    let player: VimeoPlayer
    try {
      player = new VimeoPlayer(containerRef.current, {
        id: Number(ids.id),
        ...(ids.hash ? { h: ids.hash } : {}),
        responsive: false,
        width: Math.round(containerWidth),
        autoplay: false,
        playsinline: true,
        dnt: true,
        title: false,
        byline: false,
        portrait: false,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error('[Vimeo] constructor threw', err)
      setErrorMessage(`Crash SDK — ${message}`)
      return
    }
    playerRef.current = player

    player.on('error', (err: { name?: string; message?: string }) => {
      console.error('[Vimeo] error event', err)
      const name = err?.name ?? 'Erreur'
      const message = err?.message ?? 'lecture impossible'
      setErrorMessage(`${name} — ${message}`)
    })
    player.on('loaded', () => console.log('[Vimeo] loaded'))
    player.on('play', () => console.log('[Vimeo] play'))
    player.on('bufferstart', () => console.log('[Vimeo] bufferstart'))

    player
      .ready()
      .then(() => {
        console.log('[Vimeo] ready')
        if (initialPositionSeconds > 0) {
          return player.setCurrentTime(initialPositionSeconds)
        }
      })
      .catch((err) => {
        console.error('[Vimeo] ready/seek failed', err)
        const message = err instanceof Error ? err.message : String(err)
        setErrorMessage(`Init échouée — ${message}`)
      })

    return () => {
      player.destroy().catch(() => {})
      playerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapter.id])

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
        // noop : le player peut être en cours de chargement
      }
    }, SAVE_INTERVAL_MS)
    return () => window.clearInterval(interval)
  }, [chapter.id])

  return (
    <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-black">
      <div
        key={chapter.id}
        ref={containerRef}
        className="absolute inset-0 h-full w-full [&_iframe]:absolute [&_iframe]:inset-0 [&_iframe]:block [&_iframe]:h-full [&_iframe]:w-full [&_iframe]:border-0"
      />
      {errorMessage && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-red-600/90 px-4 py-2 text-center text-xs text-white">
          Vimeo : {errorMessage}
        </div>
      )}
    </div>
  )
}
