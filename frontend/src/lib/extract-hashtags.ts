// Extrait les hashtags #motclé d'un texte. Accents FR supportés.
// Renvoie tableau dédupliqué en lowercase, sans le #.
const HASHTAG_RE = /(?:^|\s)#([\p{L}\p{N}_]{2,40})/gu

export function extractHashtags(text: string): string[] {
  if (!text) return []
  const out = new Set<string>()
  for (const match of text.matchAll(HASHTAG_RE)) {
    out.add(match[1].toLowerCase())
  }
  return Array.from(out).slice(0, 10)
}
