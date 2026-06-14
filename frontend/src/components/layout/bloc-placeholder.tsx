import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'

export function BlocPlaceholder({
  icon: Icon,
  title,
  description,
  comingSoon = 'Bientôt disponible',
}: {
  icon: LucideIcon
  title: string
  description: string
  comingSoon?: string
}) {
  return (
    <div className="mx-auto max-w-4xl px-6 py-10 lg:py-14">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
            <Icon className="h-5 w-5" />
          </span>
          <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
            {title}
          </h1>
        </div>
        <p className="mt-3 max-w-2xl text-lg text-[var(--muted-foreground)]">
          {description}
        </p>

        <div className="mt-10 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--emerald-deep)]">
            {comingSoon}
          </p>
          <p className="mt-3 text-[var(--muted-foreground)]">
            Cette section arrive très vite. On la branche dans une prochaine
            session.
          </p>
        </div>
      </motion.div>
    </div>
  )
}
