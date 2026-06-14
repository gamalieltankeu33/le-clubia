import DOMPurify from 'dompurify'

/**
 * Liste blanche stricte pour le rendu de posts (sortie Tiptap StarterKit + Link).
 */
const ALLOWED_TAGS = [
  'p',
  'br',
  'strong',
  'em',
  'u',
  's',
  'a',
  'ul',
  'ol',
  'li',
  'blockquote',
  'code',
  'pre',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hr',
]

// On autorise data-id (utilisé par les mentions @Membre) et data-type
// (marqueur "mention" produit par l'extension Tiptap). Les autres
// data-* restent bloqués côté DOMPurify.
const ALLOWED_ATTR = ['href', 'target', 'rel', 'class', 'data-id', 'data-type']

/**
 * Sanitise un HTML produit par Tiptap pour rendu sécurisé via
 * `dangerouslySetInnerHTML`. Comportement par cas :
 *   - <a class="mention" data-id="..."> → reste interne, pas de target=_blank
 *     (c'est un lien vers /app/membres/{id}, géré par le router).
 *   - <a> normal → target=_blank + rel=noopener noreferrer (liens externes).
 */
export function sanitizePostHtml(html: string): string {
  if (!html) return ''
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'A') {
      const isMention = node.classList?.contains('mention')
      if (isMention) {
        // Lien interne — on retire toute cible et on garantit le href.
        node.removeAttribute('target')
        node.setAttribute('rel', 'noopener')
        const userId = node.getAttribute('data-id')
        if (userId) node.setAttribute('href', `/app/membres/${userId}`)
      } else {
        node.setAttribute('target', '_blank')
        node.setAttribute('rel', 'noopener noreferrer')
      }
    }
  })
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    // ALLOW_DATA_ATTR=false : on garde les data-* non listés dans
    // ALLOWED_ATTR bloqués. data-id et data-type sont explicitement
    // listés ci-dessus → ils passent.
    ALLOW_DATA_ATTR: false,
  })
  DOMPurify.removeHook('afterSanitizeAttributes')
  return clean
}

/** Extrait le texte brut (pour preview / count) à partir d'un HTML. */
export function htmlToPlainText(html: string): string {
  if (!html) return ''
  if (typeof document === 'undefined') return html
  const div = document.createElement('div')
  div.innerHTML = sanitizePostHtml(html)
  return (div.textContent || '').trim()
}
