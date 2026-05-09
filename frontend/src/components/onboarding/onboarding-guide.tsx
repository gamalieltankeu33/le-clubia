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

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999]">
      {/* Overlay de focus (troué sur l'élément cible) */}
      <div 
        className="absolute inset-0 bg-black/60 transition-opacity duration-500" 
        style={{ 
          clipPath: `polygon(0% 0%, 0% 100%, ${coords.left - 8}px 100%, ${coords.left - 8}px ${coords.top - 8}px, ${coords.left + coords.width + 8}px ${coords.top - 8}px, ${coords.left + coords.width + 8}px ${coords.top + coords.height + 8}px, ${coords.left - 8}px ${coords.top + coords.height + 8}px, ${coords.left - 8}px 100%, 100% 100%, 100% 0%)` 
        }}
      />

      {/* Bulle d'aide */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="pointer-events-auto absolute w-[320px] rounded-2xl bg-white p-6 shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-[var(--primary)]/10"
        style={{
          top: bubbleTop,
          left: bubbleLeft
        }}
      >
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--primary)]">
            <Sparkles className="h-3.5 w-3.5" />
            Guide Découverte
          </span>
          <button 
            onClick={completeGuide}
            className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <h4 className="mt-3 font-display text-lg font-semibold leading-tight">
          {step.title}
        </h4>
        <p className="mt-2 text-sm text-[var(--muted-foreground)] leading-relaxed">
          {step.content}
        </p>

        <div className="mt-6 flex items-center justify-between">
          <div className="flex gap-1">
            {steps.map((_, i) => (
              <div 
                key={i} 
                className={cn(
                  "h-1 rounded-full transition-all",
                  i === currentStep ? "w-4 bg-[var(--primary)]" : "w-1.5 bg-[var(--primary)]/20"
                )} 
              />
            ))}
          </div>
          <Button size="sm" onClick={handleNext} className="gap-1.5">
            {currentStep === steps.length - 1 ? "J'ai compris" : "Suivant"}
            {currentStep < steps.length - 1 && <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>
      </motion.div>
    </div>
  )
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ')
}
