export function FeedSkeleton({ count = 3 }: { count?: number }) {
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
