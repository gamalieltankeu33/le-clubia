// Génère un PNG d'affiche branded "Le Club IA" pour un événement quand
// l'admin n'a pas uploadé de cover. Format 1200×630 (standard OG image,
// ratio compatible mail clients + landing).
//
// L'image est générée via Canvas API côté admin au moment où le formulaire
// événement est sauvegardé. Le résultat est uploadé dans le bucket
// public `event-covers` et l'URL est stockée dans `cover_image_url`.
// Cela garantit que 100% des events ont une image dans les emails et
// sur la landing, sans friction pour l'admin.

import { supabase } from './supabase'

export interface FallbackCoverParams {
  title: string
  startsAtIso: string
  speakerName?: string | null
}

const WIDTH = 1200
const HEIGHT = 630
const PADDING = 80

// Couleurs alignées avec le design system Le Club IA
const COLOR_BG_TOP = '#1E40AF' // primary
const COLOR_BG_BOTTOM = '#1E3A8A' // primary darker
const COLOR_TEXT = '#FFFFFF'
const COLOR_ACCENT = '#F97316' // orange accent (le point dans "leclub.ia")
const COLOR_LOGO_BG = '#FFFFFF'
const COLOR_LOGO_TEXT = '#1E40AF'

function formatDate(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}

// Découpe un texte en lignes qui tiennent dans `maxWidth` au font courant.
function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const candidate = current ? current + ' ' + word : word
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate
    } else {
      if (current) lines.push(current)
      current = word
      if (lines.length >= maxLines) break
    }
  }
  if (current && lines.length < maxLines) lines.push(current)
  if (lines.length === maxLines && words.length > 0) {
    // Ajoute "…" si on a tronqué
    const last = lines[lines.length - 1]
    if (ctx.measureText(last + '…').width <= maxWidth) {
      lines[lines.length - 1] = last + '…'
    }
  }
  return lines
}

export async function generateFallbackCoverBlob(
  params: FallbackCoverParams,
): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = WIDTH
  canvas.height = HEIGHT
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D non disponible.')

  // 1. Fond — gradient diagonal subtil
  const gradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT)
  gradient.addColorStop(0, COLOR_BG_TOP)
  gradient.addColorStop(1, COLOR_BG_BOTTOM)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, WIDTH, HEIGHT)

  // 2. Halo orange diffus (rappel du point accent du logo)
  const halo = ctx.createRadialGradient(
    WIDTH * 0.85,
    HEIGHT * 0.15,
    20,
    WIDTH * 0.85,
    HEIGHT * 0.15,
    400,
  )
  halo.addColorStop(0, 'rgba(249, 115, 22, 0.35)')
  halo.addColorStop(1, 'rgba(249, 115, 22, 0)')
  ctx.fillStyle = halo
  ctx.fillRect(0, 0, WIDTH, HEIGHT)

  // 3. Eyebrow "COACHING LIVE" en haut
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)'
  ctx.font = '600 18px Inter, system-ui, sans-serif'
  ctx.textBaseline = 'top'
  ctx.fillText('COACHING LIVE — LE CLUB IA', PADDING, PADDING)

  // 4. Titre — gros, multi-lignes (jusqu'à 3 lignes)
  ctx.fillStyle = COLOR_TEXT
  ctx.font = '700 64px Georgia, "Bricolage Grotesque", serif'
  const titleMaxWidth = WIDTH - PADDING * 2
  const titleLines = wrapLines(ctx, params.title, titleMaxWidth, 3)
  let y = PADDING + 60
  for (const line of titleLines) {
    ctx.fillText(line, PADDING, y)
    y += 78
  }

  // 5. Date + heure
  const dateLabel = formatDate(params.startsAtIso)
  const timeLabel = formatTime(params.startsAtIso)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.92)'
  ctx.font = '500 26px Inter, system-ui, sans-serif'
  const dateText = timeLabel
    ? `📅 ${dateLabel} · ${timeLabel}`
    : `📅 ${dateLabel}`
  ctx.fillText(dateText, PADDING, y + 24)

  // 6. Speaker (optionnel)
  if (params.speakerName) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)'
    ctx.font = '400 22px Inter, system-ui, sans-serif'
    ctx.fillText(`Animé par ${params.speakerName}`, PADDING, y + 64)
  }

  // 7. Logo "leclub.ia" capsule en bas à gauche
  const logoY = HEIGHT - PADDING - 56
  const logoText1 = 'leclub'
  const logoText2 = '.'
  const logoText3 = 'ia'
  ctx.font = '700 30px Georgia, serif'
  const w1 = ctx.measureText(logoText1).width
  const w2 = ctx.measureText(logoText2).width
  const w3 = ctx.measureText(logoText3).width
  const innerWidth = w1 + w2 + w3
  const capsulePaddingX = 24
  const capsulePaddingY = 14
  const capsuleW = innerWidth + capsulePaddingX * 2
  const capsuleH = 30 + capsulePaddingY * 2
  const capsuleX = PADDING
  const capsuleY = logoY

  // Capsule blanche arrondie
  ctx.fillStyle = COLOR_LOGO_BG
  drawRoundedRect(ctx, capsuleX, capsuleY, capsuleW, capsuleH, capsuleH / 2)
  ctx.fill()

  // Texte capsule
  ctx.textBaseline = 'middle'
  let cursor = capsuleX + capsulePaddingX
  ctx.fillStyle = COLOR_LOGO_TEXT
  ctx.fillText(logoText1, cursor, capsuleY + capsuleH / 2)
  cursor += w1
  ctx.fillStyle = COLOR_ACCENT
  ctx.fillText(logoText2, cursor, capsuleY + capsuleH / 2)
  cursor += w2
  ctx.fillStyle = COLOR_LOGO_TEXT
  ctx.fillText(logoText3, cursor, capsuleY + capsuleH / 2)

  // 8. Conversion en blob PNG
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Impossible de générer le PNG.'))
      },
      'image/png',
      0.92,
    )
  })
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

/** Génère + upload un PNG fallback dans le bucket event-covers, et retourne
 *  l'URL publique. L'admin doit avoir les droits insert sur le bucket
 *  (RLS définie en migration 0017). */
export async function generateAndUploadFallbackCover(
  params: FallbackCoverParams,
): Promise<string> {
  const blob = await generateFallbackCoverBlob(params)
  const path = `auto-${crypto.randomUUID()}.png`
  const { error: upErr } = await supabase.storage
    .from('event-covers')
    .upload(path, blob, {
      contentType: 'image/png',
      upsert: false,
    })
  if (upErr) throw upErr
  const { data } = supabase.storage.from('event-covers').getPublicUrl(path)
  return data.publicUrl
}
