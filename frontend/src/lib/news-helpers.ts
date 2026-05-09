// Catégories techniques synchronisées avec la CHECK constraint DB
// (migration 0022_breaking_news.sql). Toute valeur non listée ici est
// rejetée par Postgres avec une erreur 400 lors d'un INSERT/UPDATE.
export const NEWS_CATEGORIES = [
  'weekly-recap',
  'breaking-news',
  'news',
  'tutorial',
  'opinion',
  'analysis',
] as const

export type NewsCategory = (typeof NEWS_CATEGORIES)[number]

/** Label affiché à l'utilisateur pour chaque catégorie technique. */
export const NEWS_CATEGORY_LABEL: Record<string, string> = {
  'weekly-recap': '📰 Récap de la semaine',
  'breaking-news': '🔥 Actualité chaude',
  news: 'Actualité',
  tutorial: 'Tutoriel',
  opinion: 'Opinion',
  analysis: 'Analyse',
}

export function getCategoryLabel(category: string): string {
  return NEWS_CATEGORY_LABEL[category] ?? category
}

/** Couleurs (chip bg / fg) par catégorie. */
export const NEWS_CATEGORY_VISUAL: Record<
  string,
  { bg: string; fg: string }
> = {
  'weekly-recap': {
    bg: 'bg-amber-100',
    fg: 'text-amber-800',
  },
  'breaking-news': {
    bg: 'bg-orange-100',
    fg: 'text-orange-700',
  },
  news: {
    bg: 'bg-[var(--primary)]/10',
    fg: 'text-[var(--primary)]',
  },
  tutorial: {
    bg: 'bg-emerald-100',
    fg: 'text-emerald-700',
  },
  opinion: {
    bg: 'bg-violet-100',
    fg: 'text-violet-700',
  },
  analysis: {
    bg: 'bg-[var(--accent)]/15',
    fg: 'text-[var(--accent)]',
  },
}

export function getCategoryVisual(category: string) {
  return (
    NEWS_CATEGORY_VISUAL[category] ?? {
      bg: 'bg-[var(--secondary)]',
      fg: 'text-[var(--muted-foreground)]',
    }
  )
}

/** Estime le temps de lecture en minutes (200 mots/min). */
export function estimateReadMinutes(content: string): number {
  if (!content) return 1
  const text = content
    .replace(/[#*_`>~\[\]()!]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  const words = text.split(' ').filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}

/** Convertit un markdown sommaire en plain text pour les previews / extraits. */
export function markdownExcerpt(md: string, max = 150): string {
  if (!md) return ''
  const stripped = md
    .replace(/```[\s\S]*?```/g, '') // code blocks
    .replace(/`[^`]+`/g, '') // inline code
    .replace(/!?\[([^\]]+)\]\([^)]+\)/g, '$1') // links / images
    .replace(/[*_~>#]+/g, '') // markdown markers
    .replace(/\s+/g, ' ')
    .trim()
  return stripped.length > max ? stripped.slice(0, max).trimEnd() + '…' : stripped
}

/** "lundi 12 mai 2025" */
export function formatLongFrenchDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/** Extrait le hostname lisible d'une URL (ex: "openai.com"). */
export function sourceHostname(url: string | null | undefined): string {
  if (!url) return ''
  try {
    const u = new URL(url)
    return u.hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}
