import { Link } from '@tanstack/react-router'
import { ArrowRight, Trophy } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
export function MyPointsCard() {
  const profile = useAuthStore((s) => s.profile)
  const points = profile?.points ?? 0
  const level = Math.floor(points / 100) + 1

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[var(--emerald)]/5 via-[var(--card)] to-[var(--card)] p-5">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--emerald)]/12 text-[var(--emerald-deep)] shadow-inner ring-1 ring-[var(--emerald)]/20">
          <Trophy className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted-foreground)] opacity-70">
              Ma Force Actuelle
            </p>
            <span className="rounded-full bg-[var(--emerald)]/10 px-2 py-0.5 text-[10px] font-bold text-[var(--emerald-deep)] border border-[var(--emerald)]/25">
              Niveau {level}
            </span>
          </div>

          <div className="mt-2 flex items-baseline gap-2">
            <p className="font-serif-number text-4xl text-[var(--emerald-deep)] sm:text-5xl">
              {points.toLocaleString('fr-FR')}
            </p>
            <p className="text-sm font-medium text-[var(--muted-foreground)]">
              point{points > 1 ? 's' : ''}
            </p>
          </div>

          <p className="mt-2 text-xs leading-relaxed text-[var(--muted-foreground)]">
            Gagne des points en terminant des cours (+10), en publiant (+10), en commentant (+5) ou en likant (+1).
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end">
        <Link
          to="/app/communaute"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--primary)] transition-colors hover:text-[#1c3a9e]"
        >
          Aller à la communauté
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  )
}
