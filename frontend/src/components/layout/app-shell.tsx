import { useEffect, useState } from 'react'
import { useLocation } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { AppSidebar } from './app-sidebar'
import { AppHeader } from './app-header'
import { MobileBottomNav } from './mobile-bottom-nav'
import { FloatingActionButton } from './floating-action-button'
import { FloatingCoachButton } from '@/components/coach/floating-coach-button'
import { ChatPanel } from '@/components/coach/chat-panel'
import { NotificationPanel } from '@/components/notifications/notification-panel'
import { PageErrorBoundary } from '@/components/shared/page-error-boundary'
import { useNotifications } from '@/lib/use-notifications'

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { pathname } = useLocation()

  // Init globale des notifications (fetch + realtime).
  useNotifications()

  // Ferme le drawer après navigation
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // Bloque le scroll du body quand le drawer est ouvert
  useEffect(() => {
    if (mobileOpen) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = prev
      }
    }
  }, [mobileOpen])

  return (
    <div className="flex min-h-screen bg-[var(--background)]">
      {/* Sidebar desktop fixe */}
      <aside className="hidden w-[260px] shrink-0 border-r border-[var(--border)] lg:block">
        <div className="sticky top-0 h-screen">
          <AppSidebar />
        </div>
      </aside>

      {/* Drawer mobile */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/40 lg:hidden"
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />
            <motion.aside
              key="drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="fixed inset-y-0 left-0 z-50 w-[280px] border-r border-[var(--border)] bg-[var(--card)] lg:hidden"
              role="dialog"
              aria-modal="true"
            >
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Fermer le menu"
                className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
              >
                <X className="h-5 w-5" />
              </button>
              <AppSidebar onNavigate={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Contenu */}
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader onOpenSidebar={() => setMobileOpen(true)} />
        <main
          className="flex-1 pb-[80px] lg:pb-0"
          style={{
            scrollPaddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)',
          }}
        >
          <PageErrorBoundary>{children}</PageErrorBoundary>
        </main>
      </div>

      {/* Coach IA — bouton flottant + panneau latéral */}
      <FloatingCoachButton />
      <ChatPanel />

      {/* Notifications — panneau latéral droit */}
      <NotificationPanel />

      {/* Mobile : bottom nav + FAB contextuel (cachés sur lg) */}
      <MobileBottomNav />
      <FloatingActionButton />
    </div>
  )
}
