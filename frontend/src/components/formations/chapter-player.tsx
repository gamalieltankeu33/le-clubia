import { useEffect, useRef } from 'react'
import YouTube, { type YouTubePlayer } from 'react-youtube'
import VimeoPlayer from '@vimeo/player'
import { PlayCircle } from 'lucide-react'
import type { FormationChapter } from '@/lib/database.types'
import {
  extractVimeoId,
  extractYouTubeId,
  getVideoProvider,
} from '@/lib/formation-helpers'

const SAVE_INTERVAL_MS = 10_000
const AUTO_COMPLETE_RATIO = 0.9

interface PlayerProps {
  chapter: FormationChapter
  initialPositionSeconds: number
  isCompleted: boolean
  onPositionTick: (seconds: number) => void
  onAutoComplete: () => void
}

/** Dispatch sur le provider de la vidéo (YouTube ou Vimeo). */
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
  return <VimeoChapterPlayer {...props} />
}

function UnsupportedPlayer() {
  return (
    <div className="flex aspect-video w-full items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)]">
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
  isCompleted,
  onPositionTick,
  onAutoComplete,
}: PlayerProps) {
  const playerRef = useRef<YouTubePlayer | null>(null)
  const tickRef = useRef(onPositionTick)
  tickRef.current = onPositionTick
  const autoCompleteCbRef = useRef(onAutoComplete)
  autoCompleteCbRef.current = onAutoComplete

  const autoCompletedFiredRef = useRef(false)
  useEffect(() => {
    autoCompletedFiredRef.current = false
  }, [chapter.id])

  const isCompletedRef = useRef(isCompleted)
  isCompletedRef.current = isCompleted

  const videoId = chapter.video_url ? extractYouTubeId(chapter.video_url) : null

  useEffect(() => {
    playerRef.current = null
  }, [chapter.id])

  useEffect(() => {
    const interval = window.setInterval(() => {
      const player = playerRef.current
      if (!player) return
      try {
        const seconds = Math.floor(player.getCurrentTime?.() ?? 0)
        const duration = Number(player.getDuration?.() ?? 0)
        if (seconds > 0) tickRef.current(seconds)
        if (
          !isCompletedRef.current &&
          !autoCompletedFiredRef.current &&
          duration > 0 &&
          seconds / duration >= AUTO_COMPLETE_RATIO
        ) {
          autoCompletedFiredRef.current = true
          autoCompleteCbRef.current()
        }
      } catch {
        // noop
      }
    }, SAVE_INTERVAL_MS)
    return () => window.clearInterval(interval)
  }, [chapter.id])

  if (!videoId) return <UnsupportedPlayer />

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black">
      <YouTube
        key={chapter.id}
        videoId={videoId}
        className="absolute inset-0 h-full w-full"
        iframeClassName="h-full w-full"
        opts={{
          width: '100%',
          height: '100%',
          playerVars: {
            modestbranding: 1,
            rel: 0,
            showinfo: 0,
            autoplay: 0,
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
// Vimeo
// =============================================================================
function VimeoChapterPlayer({
  chapter,
  initialPositionSeconds,
  isCompleted,
  onPositionTick,
  onAutoComplete,
}: PlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<VimeoPlayer | null>(null)

  const tickRef = useRef(onPositionTick)
  tickRef.current = onPositionTick
  const autoCompleteCbRef = useRef(onAutoComplete)
  autoCompleteCbRef.current = onAutoComplete

  const autoCompletedFiredRef = useRef(false)
  useEffect(() => {
    autoCompletedFiredRef.current = false
  }, [chapter.id])

  const isCompletedRef = useRef(isCompleted)
  isCompletedRef.current = isCompleted

  // Mount / unmount du Vimeo Player quand le chapitre change.
  useEffect(() => {
    if (!containerRef.current || !chapter.video_url) return
    const ids = extractVimeoId(chapter.video_url)
    if (!ids) return
    const player = new VimeoPlayer(containerRef.current, {
      id: Number(ids.id),
      ...(ids.hash ? { h: ids.hash } : {}),
      responsive: true,
      autoplay: false,
      title: false,
      byline: false,
      portrait: false,
    })
    playerRef.current = player

    // Reprise au timecode après chargement
    if (initialPositionSeconds > 0) {
      player
        .ready()
        .then(() => player.setCurrentTime(initialPositionSeconds))
        .catch(() => {
          // noop : la lib renvoie une erreur si timecode > durée
        })
    }

    return () => {
      player.destroy().catch(() => {})
      playerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapter.id])

  // Tick toutes les 10s : position + auto-mark 90%.
  useEffect(() => {
    const interval = window.setInterval(async () => {
      const player = playerRef.current
      if (!player) return
      try {
        const [seconds, duration] = await Promise.all([
          player.getCurrentTime(),
          player.getDuration(),
        ])
        const sec = Math.floor(seconds)
        if (sec > 0) tickRef.current(sec)
        if (
          !isCompletedRef.current &&
          !autoCompletedFiredRef.current &&
          duration > 0 &&
          sec / duration >= AUTO_COMPLETE_RATIO
        ) {
          autoCompletedFiredRef.current = true
          autoCompleteCbRef.current()
        }
      } catch {
        // noop : le player peut être en cours de chargement
      }
    }, SAVE_INTERVAL_MS)
    return () => window.clearInterval(interval)
  }, [chapter.id])

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black">
      <div
        key={chapter.id}
        ref={containerRef}
        className="absolute inset-0 h-full w-full [&_iframe]:h-full [&_iframe]:w-full"
      />
    </div>
  )
}
