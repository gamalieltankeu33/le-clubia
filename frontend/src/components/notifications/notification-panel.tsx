import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BellOff, CheckCheck, Loader2, X } from 'lucide-react'
import { useNotificationsStore } from '@/stores/notifications-store'
import { Button } from '@/components/ui/button'
import { NotificationItem } from './notification-item'

export function NotificationPanel() {
  const isPanelOpen = useNotificationsStore((s) => s.isPanelOpen)
  const closePanel = useNotificationsStore((s) => s.closePanel)
  const notifications = useNotificationsStore((s) => s.notifications)
  const actorsById = useNotificationsStore((s) => s.actorsById)
  const unreadCount = useNotificationsStore((s) => s.unreadCount)
  const isLoading = useNotificationsStore((s) => s.isLoading)
  const markAllAsRead = useNotificationsStore((s) => s.markAllAsRead)

  // Bloque le scroll du body quand le panel est ouvert (mobile fullscreen)
  useEffect(() => {
    if (!isPanelOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [isPanelOpen])

  // Fermeture clavier (Échap)
  useEffect(() => {
    if (!isPanelOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePanel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isPanelOpen, closePanel])

  return (
    <AnimatePresence>
      {isPanelOpen && (
        <>
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 bg-black/30"
            onClick={closePanel}
            aria-hidden="true"
          />
          <motion.aside
            key="panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-[var(--border)] bg-[var(--card)] shadow-2xl sm:w-[400px]"
            role="dialog"
            aria-modal="true"
            aria-label="Notifications"
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-5 py-4">
              <div>
                <h2 className="font-display text-lg font-semibold tracking-tight">
                  Notifications
                </h2>
                {unreadCount > 0 && (
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => void markAllAsRead()}
                  >
                    <CheckCheck className="h-4 w-4" />
                    <span className="hidden sm:inline">Tout lu</span>
                  </Button>
                )}
                <button
                  type="button"
                  onClick={closePanel}
                  aria-label="Fermer"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Liste */}
            <div className="flex-1 overflow-y-auto">
              {isLoading && notifications.length === 0 ? (
                <div className="flex h-40 items-center justify-center text-[var(--muted-foreground)]">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : notifications.length === 0 ? (
                <EmptyState />
              ) : (
                <ul className="divide-y divide-[var(--border)]">
                  {notifications.map((n) => (
                    <li key={n.id}>
                      <NotificationItem
                        notification={n}
                        actor={n.actor_id ? actorsById[n.actor_id] : undefined}
                        onClose={closePanel}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-8 py-16 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--secondary)] text-[var(--muted-foreground)]">
        <BellOff className="h-7 w-7" />
      </span>
      <h3 className="mt-5 font-display text-lg font-semibold tracking-tight text-[var(--foreground)]">
        Tout est calme par ici
      </h3>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-[var(--muted-foreground)] sm:text-base">
        Aucune notification pour le moment. Profite-en pour publier dans la
        communauté.
      </p>
    </div>
  )
}
