import { FileText, Sparkles, Wrench, Workflow, type LucideIcon } from 'lucide-react'
import type { ResourceType } from './database.types'
import { supabase } from './supabase'
import { slugify } from './formation-helpers'

/** Bucket de stockage des PDFs (privé, lecture membres actifs + admins). */
export const RESOURCE_BUCKET = 'resource-files'

/** Limites d'upload PDF côté admin. */
export const PDF_MAX_BYTES = 10 * 1024 * 1024 // 10 MB
export const PDF_MIME = 'application/pdf'

export interface UploadedPdfMeta {
  /** Path relatif dans le bucket (à stocker en DB via file_url). */
  path: string
  /** Taille en kilobytes, pour affichage UI. */
  sizeKb: number
  /** Nom de fichier d'origine. */
  name: string
}

export const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  prompt: 'Prompt',
  template: 'Template',
  guide_pdf: 'Guide PDF',
  tool_link: 'Lien outil',
}

export const RESOURCE_TYPES: ResourceType[] = [
  'prompt',
  'template',
  'guide_pdf',
  'tool_link',
]

export const RESOURCE_CATEGORIES = [
  'Prompts',
  'Templates',
  'Guides',
  'Outils',
  'Workflows automatisation',
] as const

/** Couleurs et icônes par type de ressource — pour les chips et empty states */
export const RESOURCE_TYPE_VISUAL: Record<
  ResourceType,
  { icon: LucideIcon; chipBg: string; chipFg: string }
> = {
  prompt: {
    icon: Sparkles,
    chipBg: 'bg-[var(--primary)]/10',
    chipFg: 'text-[var(--primary)]',
  },
  template: {
    icon: Workflow,
    chipBg: 'bg-[var(--accent)]/15',
    chipFg: 'text-[var(--accent)]',
  },
  guide_pdf: {
    icon: FileText,
    chipBg: 'bg-emerald-100',
    chipFg: 'text-emerald-700',
  },
  tool_link: {
    icon: Wrench,
    chipBg: 'bg-violet-100',
    chipFg: 'text-violet-700',
  },
}

/** Renvoie l'extension du nom de fichier en lowercase, ou '' si rien. */
export function fileExt(name: string): string {
  const i = name.lastIndexOf('.')
  return i === -1 ? '' : name.slice(i + 1).toLowerCase()
}

/** Format human pour la taille. KB sous 1024, MB au-delà avec 1 décimale. */
export function formatFileSize(sizeKb: number | null | undefined): string {
  if (!sizeKb) return ''
  if (sizeKb < 1024) return `${sizeKb} KB`
  return `${(sizeKb / 1024).toFixed(1)} MB`
}

/**
 * Upload un PDF vers le bucket privé. Valide le type + la taille avant
 * l'envoi pour éviter un round-trip réseau inutile.
 *
 * @param file Le PDF sélectionné par l'admin.
 * @param category Catégorie de la ressource (sert à organiser les paths).
 * @param titleHint Titre de la ressource (sert à générer un slug lisible).
 */
export async function uploadResourcePdf(
  file: File,
  category: string,
  titleHint: string,
): Promise<UploadedPdfMeta> {
  if (file.type !== PDF_MIME) {
    throw new Error('Seuls les PDFs sont acceptés.')
  }
  if (file.size > PDF_MAX_BYTES) {
    throw new Error('Fichier trop lourd (max 10 MB).')
  }

  const slug = slugify(titleHint || 'ressource').slice(0, 60) || 'ressource'
  const folder = slugify(category) || 'misc'
  const path = `${folder}/${slug}-${Date.now()}.pdf`

  const { error } = await supabase.storage
    .from(RESOURCE_BUCKET)
    .upload(path, file, { contentType: PDF_MIME, upsert: false })
  if (error) throw error

  return {
    path,
    sizeKb: Math.max(1, Math.round(file.size / 1024)),
    name: file.name,
  }
}

interface CachedSignature {
  url: string
  /** Epoch ms d'expiration de notre cache local (pas du token Supabase). */
  expiresAt: number
}

const SIGNED_URL_TTL_SECONDS = 24 * 60 * 60 // 24h, durée de la signature côté Supabase
const SIGNED_URL_CACHE_MS = 60 * 60 * 1000 // 1h, durée de vie du cache local

function cacheKeyForPath(path: string): string {
  return `resource-signed-url:${path}`
}

/**
 * Génère (ou récupère depuis le cache local) une URL signée valide 24h
 * pour lire un PDF du bucket privé. Cache local 1h pour éviter de
 * re-générer à chaque navigation entre routes.
 */
export async function getResourceSignedUrl(path: string): Promise<string> {
  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem(cacheKeyForPath(path))
      if (raw) {
        const parsed = JSON.parse(raw) as CachedSignature
        if (parsed.expiresAt > Date.now() && parsed.url) {
          return parsed.url
        }
      }
    } catch {
      // localStorage indisponible (Safari privé) — on régénère.
    }
  }

  const { data, error } = await supabase.storage
    .from(RESOURCE_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS)
  if (error || !data?.signedUrl) {
    throw error ?? new Error('Impossible de générer le lien signé.')
  }

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(
        cacheKeyForPath(path),
        JSON.stringify({
          url: data.signedUrl,
          expiresAt: Date.now() + SIGNED_URL_CACHE_MS,
        } satisfies CachedSignature),
      )
    } catch {
      // Ignore quota / mode privé.
    }
  }

  return data.signedUrl
}

/** Supprime un fichier du bucket. À appeler quand on remplace ou supprime une ressource. */
export async function deleteResourceFile(path: string): Promise<void> {
  if (!path) return
  await supabase.storage.from(RESOURCE_BUCKET).remove([path])
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem(cacheKeyForPath(path))
    } catch {
      // Ignore.
    }
  }
}
