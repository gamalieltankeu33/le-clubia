import { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { LevelUpModal } from './level-up-modal'

/**
 * Composant invisible qui surveille les points du profil.
 * S'il détecte que le niveau a augmenté depuis le dernier chargement,
 * il affiche la modale de célébration.
 */
export function LevelUpListener() {
  const profile = useAuthStore((s) => s.profile)
  const [modalOpen, setModalOpen] = useState(false)
  const [currentLevel, setCurrentLevel] = useState<number | null>(null)
  
  // On utilise un ref pour stocker le niveau "connu" pour éviter de trigger 
  // au tout premier chargement de la page si l'utilisateur est déjà lvl 10 par ex.
  const lastKnownLevel = useRef<number | null>(null)

  useEffect(() => {
    if (!profile) return

    const points = profile.points ?? 0
    const level = Math.floor(points / 100) + 1

    // Premier chargement : on initialise le ref sans trigger la modale
    if (lastKnownLevel.current === null) {
      lastKnownLevel.current = level
      return
    }

    // Si le niveau a augmenté
    if (level > lastKnownLevel.current) {
      console.log(`[Gamification] Level Up detected: ${lastKnownLevel.current} -> ${level}`)
      setCurrentLevel(level)
      setModalOpen(true)
      lastKnownLevel.current = level
    }
  }, [profile])

  if (!currentLevel) return null

  return (
    <LevelUpModal
      level={currentLevel}
      isOpen={modalOpen}
      onClose={() => setModalOpen(false)}
    />
  )
}
