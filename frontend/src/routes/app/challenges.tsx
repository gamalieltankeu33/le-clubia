import { createFileRoute } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { Target } from 'lucide-react'
import { WeeklyChallenges } from '@/components/community/weekly-challenges'
import {
  ChallengeLockedScreen,
  useIsChallengeUser,
} from '@/components/shared/premium-lock'

export const Route = createFileRoute('/app/challenges')({
  component: ChallengesPage,
})

function ChallengesPage() {
  const isChallenge = useIsChallengeUser()

  if (isChallenge) {
    return <ChallengeLockedScreen backTo="/app/communaute" itemKind="formation" />
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:py-14">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
            <Target className="h-5 w-5" />
          </span>
          <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl">
            Challenge de la semaine
          </h1>
        </div>
        <p className="mt-3 text-lg text-[var(--muted-foreground)]">
          Relève les défis hebdomadaires pour lancer ton projet IA étape par étape et accumuler des points.
        </p>
      </motion.div>

      <WeeklyChallenges />
    </div>
  )
}
