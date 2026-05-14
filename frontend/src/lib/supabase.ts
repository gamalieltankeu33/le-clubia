import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  throw new Error(
    'Variables manquantes : VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY doivent être définies dans frontend/.env',
  )
}

export const supabase = createClient<Database>(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

/**
 * Force un check + refresh éventuel du JWT. À appeler avant toute
 * mutation critique (save formation, publish news, etc.).
 *
 * Pourquoi : l'auto-refresh Supabase tourne via setInterval, throttle
 * agressivement par Chrome/Safari sur les onglets idle ou en arrière-
 * plan. Quand le user revient et clique tout de suite, le token cache
 * peut être périmé → la mutation part avec un access_token expiré et
 * échoue silencieusement (401), d'où le fameux "il faut F5 pour
 * pouvoir enregistrer".
 *
 * getSession() acquiert un lock + check expires_at + refresh si <90s
 * avant expiration (cf. EXPIRY_MARGIN_MS dans @supabase/auth-js). C'est
 * idempotent et rapide quand le token est encore frais.
 */
export async function ensureFreshSession(): Promise<void> {
  await supabase.auth.getSession()
}

// Refresh proactif quand l'onglet redevient visible / regagne le focus.
// Supabase a son propre handler visibilitychange, mais il passe par un
// lock asynchrone : si l'utilisateur clique "Save" dans les ms qui
// suivent le retour de focus, la mutation peut partir avant la fin du
// refresh. On force ici un getSession() dès la visibilité retrouvée
// pour minimiser cette fenêtre de race.
if (typeof window !== 'undefined') {
  const refreshOnReturn = () => {
    if (document.visibilityState === 'visible') {
      void supabase.auth.getSession().catch(() => {})
    }
  }
  window.addEventListener('visibilitychange', refreshOnReturn)
  window.addEventListener('focus', refreshOnReturn)
}
