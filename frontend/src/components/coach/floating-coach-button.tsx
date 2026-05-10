import { AnimatePresence, motion } from 'framer-motion'
import { MessageCircle } from 'lucide-react'
import { useCoachStore } from '@/stores/coach-store'

export function FloatingCoachButton() {
  const isOpen = useCoachStore((s) => s.isOpen)
  const openPanel = useCoachStore((s) => s.openPanel)

  return (
    <AnimatePresence>
      {!isOpen && (
        <motion.button
          type="button"
          onClick={openPanel}
          aria-label="Ouvrir le Coach IA"
          initial={{ opacity: 0, scale: 0.8, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="fixed right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] shadow-lg transition-shadow hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 sm:right-6 bottom-[calc(env(safe-area-inset-bottom,0px)+152px)] lg:bottom-6"
        >
          {/* Pulse ring */}
          <span
            aria-hidden="true"
            className="absolute inset-0 animate-ping rounded-full bg-[var(--primary)] opacity-20"
          />
          <MessageCircle className="relative h-6 w-6" />
        </motion.button>
      )}
    </AnimatePresence>
  )
}
