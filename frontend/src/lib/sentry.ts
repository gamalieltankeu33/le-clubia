import * as Sentry from '@sentry/react'

/**
 * Initialisation Sentry — capture les exceptions JS du frontend.
 *
 * Le DSN vient de `VITE_SENTRY_DSN` (variable d'env). Si elle n'est pas
 * définie (ex. dev local sans config Sentry), on no-op : aucun appel
 * réseau, aucun overhead.
 *
 * Filtres :
 *  - Pas d'envoi en dev (NODE_ENV !== production) — bruit inutile.
 *  - On ignore les erreurs de chunk loading (déjà gérées par
 *    `vite:preloadError` dans main.tsx → reload auto).
 *  - On ignore les erreurs typiques d'extensions navigateur.
 *
 * À appeler le plus tôt possible (avant ReactDOM.render).
 */
export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined
  if (!dsn) return // pas configuré → no-op (dev local par défaut)
  if (!import.meta.env.PROD) return // pas d'envoi en dev → on garde Sentry "propre"

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    // Release : exposé par Vercel via VITE_VERCEL_GIT_COMMIT_SHA si tu
    // configures la variable côté Vercel. Sinon Sentry assigne un id
    // par défaut. Utile pour rattacher une erreur à un commit précis.
    release: import.meta.env.VITE_VERCEL_GIT_COMMIT_SHA as string | undefined,

    // Échantillonnage faible : on s'intéresse aux erreurs, pas au tracing
    // détaillé qui mangerait le quota gratuit.
    tracesSampleRate: 0.05,
    replaysSessionSampleRate: 0, // pas de session replay (bandwidth)
    replaysOnErrorSampleRate: 0,

    // Filtre des erreurs non-actionables côté client.
    ignoreErrors: [
      // Chunk loading après nouveau déploiement (déjà géré par auto-reload).
      'ChunkLoadError',
      'Loading chunk',
      'Loading CSS chunk',
      'Failed to fetch dynamically imported module',
      // Extensions navigateur (Safari/Chrome) qui injectent du JS.
      "Can't find variable: ZiteReader",
      'top.GLOBALS',
      // Network instables (le user va re-essayer naturellement).
      'NetworkError when attempting to fetch',
      'Failed to fetch',
      'Load failed',
      // Erreurs ResizeObserver inoffensives (souvent émises par Safari).
      'ResizeObserver loop completed',
      'ResizeObserver loop limit exceeded',
    ],

    beforeSend(event) {
      // Filtre les erreurs venant d'un origine externe (extensions, scripts
      // injectés) — leur stack ne contient pas notre code, donc on ne peut
      // rien en faire.
      const frames = event.exception?.values?.[0]?.stacktrace?.frames
      if (frames && frames.length > 0) {
        const lastFrame = frames[frames.length - 1]
        const filename = lastFrame?.filename ?? ''
        if (
          filename.startsWith('chrome-extension://') ||
          filename.startsWith('moz-extension://') ||
          filename.startsWith('safari-extension://')
        ) {
          return null
        }
      }
      return event
    },
  })
}

/**
 * Attache l'identité de l'utilisateur connecté à Sentry — quand un user
 * plante, on sait QUI est planté (essentiel pour debug).
 *
 * Appelé depuis le store auth après login / au chargement de la session.
 */
export function setSentryUser(
  user: { id: string; email?: string | null } | null,
): void {
  if (!user) {
    Sentry.setUser(null)
    return
  }
  Sentry.setUser({
    id: user.id,
    email: user.email ?? undefined,
  })
}
