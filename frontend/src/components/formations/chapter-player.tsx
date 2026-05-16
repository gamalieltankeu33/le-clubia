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
// Détection mobile : sur desktop la lecture Vimeo fonctionne nativement,
// le fallback et le diagnostic ne doivent s'afficher que sur smartphone.
const IS_MOBILE =
  typeof navigator !== 'undefined' &&
  /Mobi|iP(hone|ad|od)|Android/.test(navigator.userAgent)

function VimeoChapterPlayer({
  chapter,
  initialPositionSeconds,
  onProgressTick,
}: PlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<VimeoPlayer | null>(null)
  const [showFallback, setShowFallback] = useState(false)
  const [diag, setDiag] = useState('')

  const tickRef = useRef(onProgressTick)
  tickRef.current = onProgressTick

  useEffect(() => {
    setShowFallback(false)
    setDiag(IS_MOBILE ? 'init…' : '')
    if (!containerRef.current || !chapter.video_url) return
    const ids = extractVimeoId(chapter.video_url)
    if (!ids) {
      if (IS_MOBILE) {
        setDiag('URL non reconnue')
        setShowFallback(true)
      }
      return
    }

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
      if (IS_MOBILE) {
        const msg = err instanceof Error ? err.message : String(err)
        setDiag(`SDK crash: ${msg}`)
        setShowFallback(true)
      }
      return
    }
    playerRef.current = player

    if (IS_MOBILE) {
      player.on('error', (err: { name?: string; message?: string }) => {
        setDiag(`erreur Vimeo: ${err?.name ?? '?'} — ${err?.message ?? '?'}`)
        setShowFallback(true)
      })
    }

    // Sur mobile uniquement : 4 s après le mount, si l'iframe est
    // absente ou < 10 px, on propose un fallback "ouvrir sur Vimeo".
    const fallbackTimer = IS_MOBILE
      ? window.setTimeout(() => {
          const iframe = containerRef.current?.querySelector('iframe')
          if (!iframe) {
            setDiag('aucune iframe créée')
            setShowFallback(true)
            return
          }
          const rect = iframe.getBoundingClientRect()
          setDiag(`iframe ${Math.round(rect.width)}×${Math.round(rect.height)}`)
          if (rect.width < 10 || rect.height < 10) setShowFallback(true)
        }, 4000)
      : null

    player
      .ready()
      .then(() => {
        if (IS_MOBILE) setDiag('player prêt')
        if (initialPositionSeconds > 0) {
          return player.setCurrentTime(initialPositionSeconds)
        }
      })
      .catch((err) => {
        if (IS_MOBILE) {
          const msg = err instanceof Error ? err.message : String(err)
          setDiag(`init échouée: ${msg}`)
          setShowFallback(true)
        }
      })

    return () => {
      if (fallbackTimer !== null) window.clearTimeout(fallbackTimer)
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
    <div className="space-y-1">
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-black">
        <div
          key={chapter.id}
          ref={containerRef}
          className="absolute inset-0 h-full w-full [&_iframe]:absolute [&_iframe]:inset-0 [&_iframe]:block [&_iframe]:h-full [&_iframe]:w-full [&_iframe]:border-0"
        />
        {showFallback && chapter.video_url && (
          <a
            href={chapter.video_url}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-black/80 px-4 text-center text-white"
          >
            <PlayCircle className="h-12 w-12" />
            <span className="text-sm font-semibold">
              Ouvrir la vidéo sur Vimeo
            </span>
            <span className="text-xs opacity-70">
              Le player intégré ne se charge pas sur cet appareil
            </span>
          </a>
        )}
      </div>
      {diag && (
        <p className="text-right font-mono text-[10px] text-[var(--muted-foreground)] opacity-50">
          {diag}
        </p>
      )}
    </div>
  )
}
