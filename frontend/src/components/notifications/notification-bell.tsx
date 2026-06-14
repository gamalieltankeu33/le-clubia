import { useEffect, useRef } from 'react'
import { motion, useAnimationControls } from 'framer-motion'
import { Bell } from 'lucide-react'
import { useNotificationsStore } from '@/stores/notifications-store'
import { cn } from '@/lib/utils'

export function NotificationBell({ className }: { className?: string }) {
  const togglePanel = useNotificationsStore((s) => s.togglePanel)
  const unreadCount = useNotificationsStore((s) => s.unreadCount)
  const arrivalTick = useNotificationsStore((s) => s.arrivalTick)

  const controls = useAnimationControls()
  const lastTickRef = useRef(arrivalTick)

  useEffect(() => {
    if (arrivalTick === lastTickRef.current) return
    lastTickRef.current = arrivalTick
    void controls.start({
      rotate: [0, -12, 12, -8, 8, 0],
      transition: { duration: 0.55, ease: 'easeInOut' },
    })
  }, [arrivalTick, controls])

  return (
    <button
      type="button"
      onClick={togglePanel}
      aria-label={
        unreadCount > 0
          ? `Notifications, ${unreadCount} non lue${unreadCount > 1 ? 's' : ''}`
          : 'Notifications'
      }
      className={cn(
        'relative flex h-9 w-9 items-center justify-center rounded-lg text-[var(--foreground)] transition-colors hover:bg-[var(--secondary)]',
        className,
      )}
    >
      <motion.span animate={controls} className="inline-flex">
        <Bell className="h-5 w-5" />
      </motion.span>
      {unreadCount > 0 && (
        <span
          aria-hidden="true"
          className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white"
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  )
}
