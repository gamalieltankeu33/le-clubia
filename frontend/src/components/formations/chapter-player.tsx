import { useEffect, useMemo, useRef } from 'react'
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

  // CRITICAL : on FIGE la position de départ au montage du chapitre.
  // Sinon `start` dans opts.playerVars change à chaque sauvegarde de
  // progression (toutes les ~5 s), et react-youtube interprète ce
  // changement comme un ordre de cueVideoById() → la vidéo s'ARRÊTE
  // et se recharge, ce qui se traduisait côté membre par "ça coupe
  // toutes les 2 secondes". Capturer la valeur 1x via useMemo([chapter.id])
  // évite ce remount silencieux. Voir react-youtube/dist/YouTube.js
  // shouldUpdateVideo() qui compare prevVars.start !== vars.start.
  const stableStartSeconds = useMemo(
    () => Math.max(0, Math.floor(initialPositionSeconds)),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- volontaire : capture une seule fois par chapitre
    [chapter.id],
  )

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

  // Ceinture + bretelles : on fige aussi l'OBJET opts entier via useMemo.
  // Même si `start` est stable, react-youtube re-render à chaque tick
  // (parent re-render) — fastDeepEqual sur un objet identique reste true,
  // mais autant lui passer la même référence pour éliminer toute classe
  // de régression future où quelqu'un ajouterait un champ réactif.
  const ytOpts = useMemo(
    () => ({
      width: '100%' as const,
      height: '100%' as const,
      host: 'https://www.youtube-nocookie.com',
      playerVars: {
        modestbranding: 1,
        rel: 0,
        showinfo: 0,
        autoplay: 0,
        playsinline: 1,
        start: stableStartSeconds,
      },
    }),
    [stableStartSeconds],
  )

  if (!videoId) return <UnsupportedPlayer />

  return (
    <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-black">
      <YouTube
        key={chapter.id}
        videoId={videoId}
        className="absolute inset-0 h-full w-full"
        iframeClassName="absolute inset-0 block h-full w-full border-0"
        opts={ytOpts}
        onReady={(event) => {
          playerRef.current = event.target
          try {
            if (stableStartSeconds > 0) {
              event.target.seekTo?.(stableStartSeconds, true)
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

  const tickRef = useRef(onProgressTick)
  tickRef.current = onProgressTick

  const ids = chapter.video_url ? extractVimeoId(chapter.video_url) : null
  const iframeSrc = ids ? buildVimeoIframeSrc(ids.id, ids.hash) : null

  // SDK Vimeo en best-effort : sert uniquement à tracker la position
  // de lecture pour la progression automatique. Si l'init plante (race
  // condition, version SDK, etc.), l'iframe continue à afficher la
  // vidéo normalement — c'est tout ce qui compte pour le user. Tout
  // le code est entouré de try/catch pour ne JAMAIS throw vers React.
  useEffect(() => {
    if (!iframeRef.current || !iframeSrc) return

    let player: VimeoPlayer | null = null
    try {
      player = new VimeoPlayer(iframeRef.current)
      playerRef.current = player

      if (initialPositionSeconds > 0) {
        player
          .ready()
          .then(() => player!.setCurrentTime(initialPositionSeconds))
          .catch(() => {})
      }
    } catch (err) {
      console.warn(
        '[VimeoPlayer] SDK attach failed — tracking de progression désactivé',
        err,
      )
    }

    return () => {
      const p = playerRef.current
      playerRef.current = null
      if (p) {
        try {
          void p.destroy().catch(() => {})
        } catch {
          // SDK destroy peut throw si l'iframe a déjà été retirée du
          // DOM par React. C'est OK, on ignore.
        }
      }
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
        // noop : player peut être en cours de chargement
      }
    }, SAVE_INTERVAL_MS)
    return () => window.clearInterval(interval)
  }, [chapter.id])

  if (!iframeSrc) return <UnsupportedPlayer />

  return (
    <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-black">
      <iframe
        key={chapter.id}
        ref={iframeRef}
        src={iframeSrc}
        title={chapter.title}
        allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
        allowFullScreen
        className="absolute inset-0 block h-full w-full border-0"
      />
    </div>
  )
}
