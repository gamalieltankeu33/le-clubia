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
        // On utilise les coordonnées RELATIVES au viewport car l'overlay est FIXED
        setCoords({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height
        })

        // On fait défiler doucement pour centrer l'élément
        target.scrollIntoView({ behavior: 'smooth', block: 'center' })
      } else {
        setCoords({ top: 0, left: 0, width: 0, height: 0 })
      }
    }

    const timer = setTimeout(updatePosition, 300)
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

  if (!isVisible || coords.width === 0) return null

  const step = steps[currentStep]
  const bubbleTop = coords.top + coords.height + 20
  const bubbleLeft = Math.max(20, Math.min(window.innerWidth - 360, coords.left + (coords.width / 2) - 170))

  return (
    <div className="pointer-events-auto fixed inset-0 z-[9999] overflow-hidden">
      {/* Overlay de focus avec trou rectangulaire arrondi via clip-path */}
      <div 
        className="absolute inset-0 bg-black/70 transition-all duration-500 backdrop-blur-[1px]" 
        style={{ 
          clipPath: `path('M 0 0 h ${window.innerWidth} v ${window.innerHeight} h -${window.innerWidth} Z M ${coords.left - 5} ${coords.top - 5} a 12 12 0 0 0 -12 12 v ${coords.height + 10 - 24} a 12 12 0 0 0 12 12 h ${coords.width + 10 - 24} a 12 12 0 0 0 12 -12 v -${coords.height + 10 - 24} a 12 12 0 0 0 -12 -12 h -${coords.width + 10 - 24} Z')`,
          fillRule: 'evenodd'
        }}
      />

      {/* Cadre lumineux précis */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute z-[9998] rounded-xl border-2 border-[var(--primary)] shadow-[0_0_20px_rgba(var(--primary-rgb),0.5)] pointer-events-none"
        style={{
          top: coords.top - 8,
          left: coords.left - 8,
          width: coords.width + 16,
          height: coords.height + 16,
        }}
      />

      {/* Bulle d'aide */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute w-[340px] rounded-2xl bg-white p-6 shadow-[0_30px_60px_rgba(0,0,0,0.6)] border border-[var(--primary)]/10"
        style={{
          top: bubbleTop > window.innerHeight - 300 ? coords.top - 220 : bubbleTop,
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
