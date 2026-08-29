import { useLoadingTimeout } from '@/hooks/use-loading-timeout'

export function FeedSkeleton({ count = 3 }: { count?: number }) {
  const timedOut = useLoadingTimeout(12_000)

  if (timedOut) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-10 text-center">
        <p className="text-sm text-[var(--muted-foreground)]">
          Le chargement prend plus de temps que prévu…
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="text-sm font-semibold text-[var(--primary)] underline-offset-4 hover:underline"
        >
          Recharger la page
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5"
        >
          {/* Header du post: Avatar + Noms */}
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-[var(--secondary)]" />
            <div className="flex flex-col gap-2 pt-1">
              <div className="h-3 w-32 animate-pulse rounded bg-[var(--secondary)]" />
              <div className="h-2 w-20 animate-pulse rounded bg-[var(--secondary)]/70" />
            </div>
          </div>

          {/* Corps du post */}
          <div className="mt-5 space-y-3">
            <div className="h-3 w-full animate-pulse rounded bg-[var(--secondary)]" />
            <div className="h-3 w-[90%] animate-pulse rounded bg-[var(--secondary)]" />
            <div className="h-3 w-[60%] animate-pulse rounded bg-[var(--secondary)]" />
          </div>

          {/* Footer du post (Actions) */}
          <div className="mt-6 flex items-center gap-3 border-t border-[var(--border)] pt-3">
            <div className="h-8 flex-1 animate-pulse rounded-xl bg-[var(--secondary)]/50" />
            <div className="h-8 flex-1 animate-pulse rounded-xl bg-[var(--secondary)]/50" />
          </div>
        </div>
      ))}
    </div>
  )
}
