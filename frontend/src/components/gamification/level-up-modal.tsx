import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, X, ArrowRight, Sparkles } from 'lucide-react'
import confetti from 'canvas-confetti'
import { Button } from '@/components/ui/button'

interface LevelUpModalProps {
  level: number
  isOpen: boolean
  onClose: () => void
}

export function LevelUpModal({ level, isOpen, onClose }: LevelUpModalProps) {
  useEffect(() => {
    if (isOpen) {
      const duration = 3 * 1000
      const animationEnd = Date.now() + duration
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 10000 }

      const randomInRange = (min: number, max: number) =>
        Math.random() * (max - min) + min

      const interval: any = setInterval(function () {
        const timeLeft = animationEnd - Date.now()

        if (timeLeft <= 0) {
          return clearInterval(interval)
        }

        const particleCount = 50 * (timeLeft / duration)
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        })
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        })
      }, 250)

      return () => clearInterval(interval)
    }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md overflow-hidden rounded-[2rem] bg-white p-8 text-center shadow-2xl shadow-black/50"
          >
            {/* Background elements */}
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[var(--primary)]/10 blur-[80px]" />
            <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-[var(--accent)]/10 blur-[80px]" />

            <button
              onClick={onClose}
              className="absolute right-6 top-6 rounded-full p-2 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="relative">
              <motion.div
                initial={{ rotate: -15, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: 'spring', damping: 12, delay: 0.2 }}
                className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-[var(--primary)] to-[#1c3a9e] text-white shadow-xl shadow-[var(--primary)]/30"
              >
                <Trophy className="h-12 w-12" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-8"
              >
                <div className="inline-flex items-center gap-1.5 rounded-full bg-[var(--emerald)]/15 px-3 py-1 text-xs font-bold uppercase tracking-widest text-[var(--emerald-deep)] ring-1 ring-[var(--emerald)]/25">
                  <Sparkles className="h-3 w-3" />
                  Nouveau Palier Atteint
                </div>
                <h2 className="mt-4 font-display text-4xl font-black tracking-tight text-[var(--foreground)]">
                  NIVEAU {level}
                </h2>
                <p className="mt-4 text-lg font-medium text-[var(--muted-foreground)]">
                  Ta Force augmente ! Continue d'apprendre et de partager pour grimper dans le classement.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mt-10"
              >
                <Button
                  size="lg"
                  className="w-full rounded-2xl h-14 text-lg font-bold shadow-xl shadow-[var(--primary)]/20"
                  onClick={onClose}
                >
                  C'est parti !
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
