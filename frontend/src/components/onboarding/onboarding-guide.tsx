import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronRight, Sparkles, GraduationCap, MessagesSquare, Library, Newspaper, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth-store'

export function OnboardingGuide() {
  const profile = useAuthStore((s) => s.profile)
  const refreshUserData = useAuthStore((s) => s.refreshUserData)
  
  const [currentStep, setCurrentStep] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null)

  useEffect(() => {
    if (!profile) return
    const hasSeen = profile.guides_seen?.includes('spotlight-v3')
    if (!hasSeen) {
      const timer = setTimeout(() => setIsVisible(true), 1500)
      return () => clearTimeout(timer)
    }
  }, [profile])

  const steps = [
    {
      targetId: "coach-section",
      icon: <Sparkles className="h-5 w-5" />,
      title: "Ton Coach IA",
      content: "Ton expert disponible 24/7 pour tes prompts et tes questions.",
    },
    {
      targetId: "pillar-formations",
      icon: <GraduationCap className="h-5 w-5" />,
      title: "Le Catalogue",
      content: "Toutes nos formations pour maîtriser l'IA étape par étape.",
    },
    {
      targetId: "pillar-communaute",
      icon: <MessagesSquare className="h-5 w-5" />,
      title: "La Communauté",
      content: "Échange avec les membres et partage tes découvertes.",
    },
    {
      targetId: "pillar-ressources",
      icon: <Library className="h-5 w-5" />,
      title: "Les Ressources",
      content: "Bibliothèque de prompts, templates et outils.",
    },
    {
      targetId: "pillar-actualites",
      icon: <Newspaper className="h-5 w-5" />,
      title: "L'Actualité IA",
      content: "La veille stratégique pour ne rien rater d'essentiel.",
    },
    {
      targetId: null,
      icon: <CheckCircle2 className="h-5 w-5" />,
      title: "Règles d'Or du Club",
      content: "Bienveillance, partage de valeur et excellence. Prêt à commencer ?",
    },
  ]

  const updateSpotlight = useCallback(() => {
    const targetId = steps[currentStep]?.targetId
    if (!targetId) {
      setSpotlightRect(null)
      return
    }

    const el = document.getElementById(targetId)
    if (el) {
      const rect = el.getBoundingClientRect()
      // On vérifie si le rect a changé pour éviter des renders inutiles
      setSpotlightRect(rect)
    }
  }, [currentStep])

  useEffect(() => {
    if (!isVisible) return

    const targetId = steps[currentStep]?.targetId
    if (targetId) {
      const el = document.getElementById(targetId)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }

    // On utilise un intervalle court pendant le changement d'étape 
    // pour suivre les animations de scroll/reveal
    const interval = setInterval(updateSpotlight, 16)
    
    window.addEventListener('resize', updateSpotlight)
    window.addEventListener('scroll', updateSpotlight, true)
    
    return () => {
      clearInterval(interval)
      window.removeEventListener('resize', updateSpotlight)
      window.removeEventListener('scroll', updateSpotlight, true)
    }
  }, [currentStep, isVisible, updateSpotlight])

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

    const newGuidesSeen = Array.from(new Set([...(profile.guides_seen || []), 'spotlight-v3']))
    const { error } = await supabase
      .from('profiles')
      .update({ guides_seen: newGuidesSeen })
      .eq('id', profile.id)

    if (!error) {
      await refreshUserData()
    }
  }

  if (!isVisible) return null

  // On ajoute une petite marge autour de l'élément pour ne pas le coller
  const padding = 8
  const left = (spotlightRect?.left ?? 0) - padding
  const top = (spotlightRect?.top ?? 0) - padding
  const right = (spotlightRect?.right ?? 0) + padding
  const bottom = (spotlightRect?.bottom ?? 0) + padding

  return (
    <div className="fixed inset-0 z-[10000] overflow-hidden pointer-events-none">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-[2px] pointer-events-auto"
          style={{
            clipPath: spotlightRect 
              ? `polygon(0% 0%, 0% 100%, ${left}px 100%, ${left}px ${top}px, ${right}px ${top}px, ${right}px ${bottom}px, ${left}px ${bottom}px, ${left}px 100%, 100% 100%, 100% 0%)`
              : 'none'
          }}
          onClick={completeGuide}
        />
      </AnimatePresence>

      <div className="relative h-full w-full flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
              ...(spotlightRect ? {
                position: 'fixed',
                top: Math.min(window.innerHeight - 200, bottom + 24),
                left: Math.max(20, Math.min(window.innerWidth - 340, left + ((right - left) / 2) - 160)),
              } : {})
            }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            className="pointer-events-auto w-[320px] rounded-2xl bg-white p-5 shadow-2xl border border-[var(--border)]"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
                {steps[currentStep].icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-sm font-bold text-[var(--foreground)]">
                    {steps[currentStep].title}
                  </h3>
                  <button onClick={completeGuide} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] p-1">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-[var(--muted-foreground)]">
                  {steps[currentStep].content}
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between gap-4">
              <div className="flex gap-1.5">
                {steps.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      i === currentStep ? 'w-4 bg-[var(--primary)]' : 'w-1 bg-[var(--primary)]/20'
                    }`}
                  />
                ))}
              </div>
              <Button size="sm" onClick={handleNext} className="h-8 rounded-lg text-xs font-bold px-4">
                {currentStep === steps.length - 1 ? "C'est parti !" : "Suivant"}
                <ChevronRight className="ml-1 h-3 w-3" />
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
