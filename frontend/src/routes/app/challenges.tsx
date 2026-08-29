import { createFileRoute } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { Target } from 'lucide-react'
import { WeeklyChallenges } from '@/components/community/weekly-challenges'
import { FormationChallenges } from '@/components/community/formation-challenges'
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
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col gap-4"
      >
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)]">
            <Target className="h-6 w-6" />
          </span>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
              Challenge de la semaine
            </h1>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Relève les défis hebdomadaires pour lancer ton projet IA étape par étape.
            </p>
          </div>
        </div>
      </motion.div>

      <FormationChallenges />
      
      <div className="mt-8 border-t border-[var(--border)] pt-8">
        <WeeklyChallenges />
      </div>
    </div>
  )
}
