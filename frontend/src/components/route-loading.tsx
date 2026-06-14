import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

/**
 * Fallback de Suspense affiché pendant le chargement d'une route ou d'un
 * composant lazy. Volontairement minimal et sans dépendance lourde —
 * doit pouvoir s'afficher AVANT que le chunk concerné n'arrive.
 */
export function RouteLoading({ label }: { label?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15, delay: 0.1 }}
      className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-6 text-center"
      role="status"
      aria-live="polite"
    >
      <Loader2
        className="h-6 w-6 animate-spin text-[var(--muted-foreground)]"
        aria-hidden="true"
      />
      <p className="text-sm text-[var(--muted-foreground)]">
        {label ?? 'Chargement…'}
      </p>
    </motion.div>
  )
}
