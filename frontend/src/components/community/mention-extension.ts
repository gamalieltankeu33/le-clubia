// Configuration de l'extension Tiptap Mention.
// Gère :
//   - Le caractère déclencheur '@'
//   - Le rendu HTML : <a class="mention" data-id="USER_ID" data-type="mention" href="/app/membres/USER_ID">@Nom</a>
//   - La suggestion via la RPC search_mentionable_users(p_query)
//   - Le dropdown via Tippy.js + composant React MentionList
//
// L'extension est utilisée dans le composer post (post-composer-modal),
// le composer commentaire et le composer réponse.

import Mention from '@tiptap/extension-mention'
import { ReactRenderer } from '@tiptap/react'
import type { SuggestionOptions } from '@tiptap/suggestion'
import tippy, { type Instance as TippyInstance } from 'tippy.js'
import { supabase } from '@/lib/supabase'
import { MentionList, type MentionItem, type MentionListRef } from './mention-list'
import { checkRateLimit } from '@/lib/use-rate-limit'

async function searchMembers(query: string): Promise<MentionItem[]> {
  // Rate limit anti-bot : 20 recherches/minute. À chaque keystroke
  // dans un éditeur Tiptap on appelle cette fonction → un humain n'a
  // pas le temps d'atteindre 20 recherches en 60s, mais un script qui
  // automatise la frappe pour scraper des profils membres serait
  // bloqué. En cas de blocage on retourne [] (dropdown vide), pas
  // d'erreur visible au user — c'est silencieux côté UX.
  const rl = await checkRateLimit('mention_search')
  if (!rl.allowed) {
    console.warn('[mention] rate limited, returning empty results')
    return []
  }
  // @ts-expect-error - search_mentionable_users est une RPC custom non typée dans Database['public']['Functions']
  const { data, error } = await supabase.rpc('search_mentionable_users', {
    p_query: query,
  })
  if (error) {
    console.warn('[mention] search_mentionable_users error:', error)
    return []
  }
  return (data ?? []) as MentionItem[]
}

const suggestion: Omit<SuggestionOptions<MentionItem>, 'editor'> = {
  char: '@',
  // Permet de taper '@' au début ou après un espace.
  startOfLine: false,
  // Pause de 200 ms côté requête réseau pour ne pas spammer Postgres
  // — Tiptap n'expose pas de debounce natif, on fait confiance à la
  // simplicité de RLS + index sur profiles. Le query final est très court
  // (< 30 chars), la latence est correcte.
  items: async ({ query }) => {
    return await searchMembers(query)
  },
  render: () => {
    let component: ReactRenderer<MentionListRef> | null = null
    let popup: TippyInstance | null = null

    return {
      onStart: (props) => {
        component = new ReactRenderer(MentionList, {
          props,
          editor: props.editor,
        })
        if (!props.clientRect) return
        const instances = tippy('body', {
          getReferenceClientRect: () =>
            (props.clientRect?.() ?? new DOMRect()) as DOMRect,
          appendTo: () => document.body,
          content: component.element,
          showOnCreate: true,
          interactive: true,
          trigger: 'manual',
          placement: 'bottom-start',
          // Léger offset vertical pour ne pas recouvrir le caret.
          offset: [0, 8],
          // Pas d'arrow visuel — on a déjà notre propre design pour la
          // liste (ombre + radius).
          arrow: false,
          // Évite que le dropdown se ferme quand l'utilisateur clique
          // dans la liste.
          hideOnClick: false,
        })
        popup = Array.isArray(instances) ? instances[0] : instances
      },
      onUpdate: (props) => {
        component?.updateProps(props)
        if (!props.clientRect) return
        popup?.setProps({
          getReferenceClientRect: () =>
            (props.clientRect?.() ?? new DOMRect()) as DOMRect,
        })
      },
      onKeyDown: (props) => {
        if (props.event.key === 'Escape') {
          popup?.hide()
          return true
        }
        return component?.ref?.onKeyDown(props) ?? false
      },
      onExit: () => {
        popup?.destroy()
        component?.destroy()
        popup = null
        component = null
      },
    }
  },
}

/**
 * Extension prête à l'emploi : ajoute la suggestion @ + le rendu HTML.
 * À ajouter dans `extensions: [...]` de useEditor().
 */
export const MentionExtension = Mention.configure({
  HTMLAttributes: {
    class: 'mention',
  },
  // L'identifiant stocké dans le node Tiptap est l'objet { id, label }
  // produit par command({ id, label }) dans MentionList.
  renderHTML({ options, node }) {
    const attrs = node.attrs as { id: string; label: string }
    return [
      'a',
      {
        ...options.HTMLAttributes,
        'data-id': attrs.id,
        'data-type': 'mention',
        href: `/app/membres/${attrs.id}`,
      },
      `@${attrs.label}`,
    ]
  },
  // Le label par défaut affiché dans l'éditeur est `@${label}`.
  renderText({ node }) {
    const attrs = node.attrs as { id: string; label: string }
    return `@${attrs.label}`
  },
  suggestion,
})

/**
 * Parse un HTML Tiptap pour extraire les `data-id` des mentions.
 * Renvoie une liste d'IDs uniques (pas de doublons).
 * Utilisé au submit du commentaire pour insérer dans comment_mentions.
 */
export function extractMentionedUserIds(html: string): string[] {
  if (!html || typeof document === 'undefined') return []
  const div = document.createElement('div')
  div.innerHTML = html
  const ids = new Set<string>()
  div.querySelectorAll('a.mention[data-id], [data-type="mention"][data-id]').forEach((el) => {
    const id = el.getAttribute('data-id')
    if (id) ids.add(id)
  })
  return Array.from(ids)
}
