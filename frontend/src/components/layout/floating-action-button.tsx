import { lazy, Suspense, useState } from 'react'
import { useLocation } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { useCoachStore } from '@/stores/coach-store'
import { haptic } from '@/lib/haptic'

// PostComposerModal embarque Tiptap (~120 kB) — on le lazy-load pour
// ne payer le coût que si l'utilisateur ouvre le composer.
const PostComposerModal = lazy(() =>
  import('@/components/community/post-composer-modal').then((m) => ({
    default: m.PostComposerModal,
  })),
)

interface FabAction {
  label: string
  ariaLabel: string
  onClick: () => void
}

/**
 * FAB orange contextuel (mobile only). L'action change selon la route :
 *  - communauté + dashboard → ouvre le composer de post
 *  - coach → démarre une nouvelle conversation et ouvre le panneau
 *  - autres pages → caché (pas d'action prioritaire)
 *
 * Position : bottom-[80px] pour rester au-dessus de la bottom nav qui
 * mesure 64px + safe-area.
 */
export function FloatingActionButton() {
  const { pathname } = useLocation()
  const queryClient = useQueryClient()
  const openCoachPanel = useCoachStore((s) => s.openPanel)
  const startNewConversation = useCoachStore((s) => s.startNewConversation)
  const [composerOpen, setComposerOpen] = useState(false)

  const action = resolveAction(pathname, {
    openComposer: () => setComposerOpen(true),
    newCoach: () => {
      startNewConversation()
      openCoachPanel()
    },
  })

  return (
    <>
      <AnimatePresence>
        {action && (
          <motion.button
            key="fab"
            type="button"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            whileTap={{ scale: 0.92 }}
            onClick={() => {
              haptic('medium')
              action.onClick()
            }}
            aria-label={action.ariaLabel}
            className="fixed right-5 z-[41] flex h-14 w-14 items-center justify-center rounded-full bg-[var(--or)] text-[var(--noir)] shadow-xl shadow-[var(--or-deep)]/40 ring-0 transition-shadow active:ring-4 active:ring-[var(--or)]/30 lg:hidden touch-manipulation"
            style={{
              bottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)',
            }}
          >
            <Plus className="h-6 w-6" strokeWidth={2.5} />
          </motion.button>
        )}
      </AnimatePresence>

      <Suspense fallback={null}>
        <PostComposerModal
          open={composerOpen}
          onClose={() => setComposerOpen(false)}
          onPosted={() => {
            queryClient.invalidateQueries({ queryKey: ['community-feed'] })
            queryClient.invalidateQueries({ queryKey: ['recent-posts'] })
          }}
        />
      </Suspense>
    </>
  )
}

function resolveAction(
  pathname: string,
  handlers: { openComposer: () => void; newCoach: () => void },
): FabAction | null {
  if (
    pathname.startsWith('/app/communaute') ||
    pathname.startsWith('/app/dashboard')
  ) {
    return {
      label: 'Publier',
      ariaLabel: 'Publier un post',
      onClick: handlers.openComposer,
    }
  }
  if (pathname.startsWith('/app/coach')) {
    return {
      label: 'Nouvelle conversation',
      ariaLabel: 'Démarrer une nouvelle conversation',
      onClick: handlers.newCoach,
    }
  }
  return null
}
