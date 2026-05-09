// =====================================================================
// Helper CORS partagé pour les edge functions Le Club IA.
//
// Origines autorisées :
//   - production future (leclubia.com + www)
//   - URLs Vercel principales et alias
//   - dev local (Vite + Antigravity)
//   - URLs de preview Vercel (matchées par regex pour ne pas avoir à
//     redéployer chaque fois qu'on push une nouvelle branche)
//
// Sécurité : on n'utilise JAMAIS '*'. Si l'origine n'est pas
// reconnue, on renvoie le domaine principal en fallback (le navigateur
// rejettera le call CORS, ce qui est le comportement attendu).
// =====================================================================

const ALLOWED_ORIGINS = [
  'https://leclubia.com',
  'https://www.leclubia.com',
  'https://le-clubia-one.vercel.app',
  'https://le-clubia-j9i5.vercel.app',
  'https://le-clubia.vercel.app',
  'http://localhost:5173',
  'http://localhost:5177',
]

// Preview URLs Vercel pour ce projet : `le-clubia-<hash>.vercel.app`
// ou `le-clubia-<branche>-<équipe>.vercel.app`.
const VERCEL_PREVIEW_PATTERN = /^https:\/\/le-clubia.*-.*\.vercel\.app$/

export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') || ''

  // Fallback : domaine principal (le navigateur rejettera la réponse
  // CORS si l'origine du caller ne matche pas — c'est intentionnel).
  let allowOrigin: string = ALLOWED_ORIGINS[0]

  if (ALLOWED_ORIGINS.includes(origin)) {
    allowOrigin = origin
  } else if (VERCEL_PREVIEW_PATTERN.test(origin)) {
    allowOrigin = origin
  }

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, DELETE, PUT, PATCH',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  }
}

/**
 * Réponse 200 vide pour les requêtes preflight `OPTIONS`. Renvoie
 * `null` si la requête n'est pas un preflight, à appeler en début de
 * `Deno.serve()`.
 */
export function handleCorsPreflight(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(req) })
  }
  return null
}
