import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/**
 * ErrorBoundary périmètre page : capture les exceptions de rendu pour
 * éviter l'écran blanc. Pas de telemetry — on log juste en console et
 * on offre à l'utilisateur de recharger.
 *
 * Volontairement class component (l'app n'a pas react-error-boundary
 * en dépendance).
 */
export class PageErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[PageErrorBoundary] uncaught render error:', error, info)
  }

  handleReload = () => {
    window.location.reload()
  }

  handleReset = () => {
    this.setState({ error: null })
  }

  render() {
    if (!this.state.error) return this.props.children

    const err = this.state.error
    const message = err.message || String(err)
    const stack = err.stack ?? ''

    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 py-12 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-500">
          <AlertTriangle className="h-6 w-6" />
        </span>
        <div>
          <p className="font-display text-lg font-semibold text-[var(--foreground)]">
            Une erreur est survenue
          </p>
          <p className="mt-1 max-w-md text-sm text-[var(--muted-foreground)]">
            Quelque chose s'est mal passé pendant le chargement de cette page.
            Recharge pour réessayer.
          </p>
        </div>

        {/* Détails de l'erreur — affichés directement à l'écran pour
            faciliter le diagnostic sans avoir à ouvrir DevTools. À
            laisser tant qu'on n'a pas une vraie télémétrie (Sentry). */}
        <details className="mt-2 w-full max-w-2xl rounded-lg border border-[var(--border)] bg-[var(--card)] p-3 text-left text-xs">
          <summary className="cursor-pointer font-mono font-semibold text-red-600">
            {message}
          </summary>
          {stack && (
            <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words font-mono text-[10px] leading-relaxed text-[var(--muted-foreground)]">
              {stack}
            </pre>
          )}
        </details>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={this.handleReset}
            className="rounded-full border border-[var(--border)] bg-white px-5 py-2.5 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--secondary)]"
          >
            Réessayer
          </button>
          <button
            type="button"
            onClick={this.handleReload}
            className="rounded-full bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:opacity-90"
          >
            Recharger la page
          </button>
        </div>
      </div>
    )
  }
}
