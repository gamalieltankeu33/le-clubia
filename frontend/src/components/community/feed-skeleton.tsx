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
          className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5"
        >
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 animate-pulse rounded-full bg-[var(--secondary)]" />
            <div className="space-y-1.5">
              <div className="h-3 w-32 animate-pulse rounded bg-[var(--secondary)]" />
              <div className="h-3 w-20 animate-pulse rounded bg-[var(--secondary)]" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="h-3 w-full animate-pulse rounded bg-[var(--secondary)]" />
            <div className="h-3 w-3/4 animate-pulse rounded bg-[var(--secondary)]" />
          </div>
          <div className="mt-4 flex gap-3">
            <div className="h-7 w-16 animate-pulse rounded bg-[var(--secondary)]" />
            <div className="h-7 w-16 animate-pulse rounded bg-[var(--secondary)]" />
          </div>
        </div>
      ))}
    </div>
  )
}
