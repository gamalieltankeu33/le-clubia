/**
 * Capture, au tout premier chargement du module (avant que supabase-js
 * ne consomme et nettoie le hash via detectSessionInUrl), si l'URL
 * d'arrivée correspond à un lien de récupération de mot de passe.
 *
 * Pourquoi un module dédié importé en PREMIER dans main.tsx : supabase-js
 * retire `#access_token=...&type=recovery` de l'URL dès qu'il le traite.
 * Si on lit le hash plus tard (dans un useEffect), il a déjà disparu et
 * le catcher ne sait plus qu'on était en flow de récupération. En lisant
 * ici, synchrone et avant tout, on fige l'information de façon fiable.
 *
 * Le catcher global (__root.tsx) lit `RECOVERY_IN_URL` pour rediriger
 * vers /reset-password même si Supabase a déposé le lien sur une autre
 * page (ex : la landing, quand le redirectTo n'est pas allowlisté).
 */
function detectRecovery(): boolean {
  if (typeof window === 'undefined') return false
  const hash = window.location.hash || ''
  const search = window.location.search || ''
  // Flow implicite : token dans le hash avec type=recovery.
  if (hash.includes('type=recovery')) return true
  // Sécurité : certains liens portent recovery dans la query.
  if (/[?&]type=recovery(&|$)/.test(search)) return true
  return false
}

export const RECOVERY_IN_URL: boolean = detectRecovery()
