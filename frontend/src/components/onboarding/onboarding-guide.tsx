import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth-store'

export interface GuideStep {
  targetId: string
  title: string
  content: string
  position?: 'top' | 'bottom' | 'left' | 'right'
}

interface OnboardingGuideProps {
  guideKey: string
  steps: GuideStep[]
  onComplete?: () => void
}

export function OnboardingGuide({ guideKey, steps, onComplete }: OnboardingGuideProps) {
  const profile = useAuthStore((s) => s.profile)
  const refreshUserData = useAuthStore((s) => s.refreshUserData)
  
  const [currentStep, setCurrentStep] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, height: 0 })

  // Vérifie si le guide doit être affiché
  useEffect(() => {
    if (!profile) return
    const hasSeen = profile.guides_seen?.includes(guideKey)
    if (!hasSeen) {
      // Petit délai pour laisser la page charger
      const timer = setTimeout(() => setIsVisible(true), 1500)
      return () => clearTimeout(timer)
    }
  }, [profile, guideKey])

  // Met à jour la position de la bulle selon l'élément cible
  useEffect(() => {
    if (!isVisible || steps.length === 0) return

    const updatePosition = () => {
      const target = document.getElementById(steps[currentStep].targetId)
      if (target) {
        const rect = target.getBoundingClientRect()
        // On utilise getBoundingClientRect().top + scrollY pour la position absolue
        const top = rect.top + window.scrollY
        const left = rect.left + window.scrollX
        
        setCoords({
          top,
          left,
          width: rect.width,
          height: rect.height
        })

        // On fait défiler l'écran pour bien voir l'élément et la bulle
        window.scrollTo({
          top: Math.max(0, top - 100),
          behavior: 'smooth'
        })
      } else {
        // Sécurité : si l'élément n'existe pas, on ne rend rien pour ne pas bloquer l'écran
        setCoords({ top: 0, left: 0, width: 0, height: 0 })
      }
    }

    // Petit délai pour laisser les composants enfants (Reveal, etc.) se positionner
    const timer = setTimeout(updatePosition, 100)
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition)
    
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition)
    }
  }, [isVisible, currentStep, steps])

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      await completeGuide()
    }
  }

  const completeGuide = async () => {
    setIsVisible(false)
    if (!profile) return

    const newGuidesSeen = Array.from(new Set([...(profile.guides_seen || []), guideKey]))
    const { error } = await supabase
      .from('profiles')
      .update({ guides_seen: newGuidesSeen })
      .eq('id', profile.id)

    if (!error) {
      await refreshUserData()
      if (onComplete) onComplete()
    }
  }

  // Si on n'a pas de coordonnées valides, on n'affiche rien (évite l'overlay vide)
  if (!isVisible || coords.width === 0) return null

  const step = steps[currentStep]
  const bubbleTop = coords.top + coords.height + 20
  const bubbleLeft = Math.max(20, Math.min(window.innerWidth - 340, coords.left + (coords.width / 2) - 160))

      {/* Overlay de focus (troué avec bords arrondis) */}
      <div 
        className="absolute inset-0 bg-black/70 transition-opacity duration-500 backdrop-blur-[2px]" 
        style={{ 
          maskImage: `radial-gradient(circle at ${coords.left + coords.width / 2}px ${coords.top + coords.height / 2}px, transparent ${Math.max(coords.width, coords.height) / 1.5}px, black ${Math.max(coords.width, coords.height) / 1.5 + 5}px)`,
          WebkitMaskImage: `radial-gradient(circle at ${coords.left + coords.width / 2}px ${coords.top + coords.height / 2}px, transparent ${Math.max(coords.width, coords.height) / 1.5}px, black ${Math.max(coords.width, coords.height) / 1.5 + 5}px)`
        }}
      />

      {/* Halo lumineux autour de la cible */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: [0, 0.5, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute z-[9998] rounded-full bg-[var(--primary)]/30 blur-xl pointer-events-none"
        style={{
          top: coords.top - 20,
          left: coords.left - 20,
          width: coords.width + 40,
          height: coords.height + 40,
        }}
      />

      {/* Bulle d'aide avec flèche */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="pointer-events-auto absolute w-[340px] rounded-3xl bg-white p-7 shadow-[0_25px_70px_rgba(0,0,0,0.5)] border border-[var(--primary)]/10"
        style={{
          top: bubbleTop,
          left: bubbleLeft
        }}
      >
        {/* Petite flèche qui pointe vers l'élément */}
        <div 
          className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45 border-l border-t border-[var(--primary)]/10"
        />

        <div className="flex items-center justify-between mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="flex gap-1.5">
            {steps.map((_, i) => (
              <div 
                key={i} 
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  i === currentStep ? "w-6 bg-[var(--primary)]" : "w-1.5 bg-[var(--primary)]/10"
                )} 
              />
            ))}
          </div>
        </div>

        <h4 className="font-display text-xl font-bold leading-tight text-[var(--foreground)]">
          {step.title}
        </h4>
        <p className="mt-3 text-sm text-[var(--muted-foreground)] font-medium leading-relaxed">
          {step.content}
        </p>

        <div className="mt-8 flex items-center justify-between gap-4">
          <button 
            onClick={completeGuide}
            className="text-xs font-bold uppercase tracking-widest text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            Passer
          </button>
          <Button onClick={handleNext} className="rounded-xl px-6 h-11 font-bold shadow-lg shadow-[var(--primary)]/20">
            {currentStep === steps.length - 1 ? "C'est parti !" : "Suivant"}
            {currentStep < steps.length - 1 && <ChevronRight className="ml-2 h-4 w-4" />}
          </Button>
        </div>
      </motion.div>
    </div>
  )
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ')
}
