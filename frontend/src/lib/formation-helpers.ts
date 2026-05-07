import type { FormationLevel } from './database.types'

// =================== Catégories ===================
// On réutilise la même liste que les centres d'intérêt utilisateur,
// pour que les filtres du catalogue matchent les préférences saisies à l'onboarding.
export { INTERESTS as FORMATION_CATEGORIES } from './interests'

// =================== Niveaux ===================
export const LEVELS: FormationLevel[] = ['debutant', 'intermediaire', 'avance']

export const LEVEL_LABELS: Record<FormationLevel, string> = {
  debutant: 'Débutant',
  intermediaire: 'Intermédiaire',
  avance: 'Avancé',
}

// =================== Format durée ===================
export function formatDuration(minutes: number): string {
  if (!minutes || minutes <= 0) return '0 min'
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h}h` : `${h}h ${m}min`
}

// =================== Slug ===================
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

// =================== YouTube ===================
const YT_PATTERNS = [
  /(?:[?&]v=)([\w-]{11})/,
  /youtu\.be\/([\w-]{11})/,
  /youtube\.com\/embed\/([\w-]{11})/,
  /youtube\.com\/shorts\/([\w-]{11})/,
]

export function extractYouTubeId(url: string): string | null {
  if (!url) return null
  for (const pattern of YT_PATTERNS) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

export function isValidYouTubeUrl(url: string): boolean {
  return extractYouTubeId(url) !== null
}

// =================== Vimeo ===================
// Formats supportés :
//   https://vimeo.com/123456789
//   https://vimeo.com/123456789/abcdef0123        (vidéo privée — hash dans le path)
//   https://player.vimeo.com/video/123456789
//   https://player.vimeo.com/video/123456789?h=abcdef0123
const VIMEO_PATTERNS = [
  /(?:player\.)?vimeo\.com\/(?:video\/)?(\d+)(?:\/([a-zA-Z0-9]+))?/,
]

export interface VimeoIds {
  id: string
  /** Hash de privacy pour les vidéos privées Vimeo. */
  hash?: string
}

export function extractVimeoId(url: string): VimeoIds | null {
  if (!url) return null
  for (const pattern of VIMEO_PATTERNS) {
    const match = url.match(pattern)
    if (match) {
      const id = match[1]
      let hash: string | undefined = match[2]
      if (!hash) {
        const hParam = url.match(/[?&]h=([a-zA-Z0-9]+)/)
        if (hParam) hash = hParam[1]
      }
      return hash ? { id, hash } : { id }
    }
  }
  return null
}

export function isValidVimeoUrl(url: string): boolean {
  return extractVimeoId(url) !== null
}

// =================== Provider générique ===================
export type VideoProvider = 'youtube' | 'vimeo'

export function getVideoProvider(url: string): VideoProvider | null {
  if (!url) return null
  if (extractYouTubeId(url)) return 'youtube'
  if (extractVimeoId(url)) return 'vimeo'
  return null
}

/** Accepte les URLs YouTube ET Vimeo. À utiliser pour la validation des chapitres. */
export function isValidVideoUrl(url: string): boolean {
  return getVideoProvider(url) !== null
}

// =================== Date longue FR ===================
export function formatLongDate(date: Date): string {
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
