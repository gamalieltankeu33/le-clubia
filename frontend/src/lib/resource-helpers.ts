import { FileText, Sparkles, Wrench, Workflow, type LucideIcon } from 'lucide-react'
import type { ResourceType } from './database.types'

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
