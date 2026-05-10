import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Bell, MessagesSquare, type LucideIcon } from 'lucide-react'
import { useNotificationsStore } from '@/stores/notifications-store'
import { useAuthStore } from '@/stores/auth-store'
import { cn } from '@/lib/utils'

interface WelcomeBlockProps {
  /** id du membre courant — sert de clé localStorage. */
  userId: string
}

/**
 * Bloc d'accueil personnalisé — visible une fois par jour calendaire
 * (clé localStorage `last_visit_<userId>`). Greeting selon l'heure,
 * effet typewriter sur le greeting, stats du jour en stagger.
 */
export function WelcomeBlock({ userId }: WelcomeBlockProps) {
  const profile = useAuthStore((s) => s.profile)
  const user = useAuthStore((s) => s.user)
  const unreadCount = useNotificationsStore((s) => s.unreadCount)

  const [shouldShow, setShouldShow] = useState(false)

  useEffect(() => {
    if (!userId) return
    const key = `last_visit_${userId}`
    const today = new Date().toISOString().slice(0, 10)
    let last: string | null = null
    try {
      last = localStorage.getItem(key)
    } catch {
      // localStorage indispo (mode privé ou bloqué) → on affiche le bloc
      // mais on ne le persiste pas.
    }
    if (last !== today) {
      setShouldShow(true)
      try {
        localStorage.setItem(key, today)
      } catch {
        /* noop */
      }
    }
  }, [userId])

  const firstName =
    profile?.first_name?.trim() ||
    user?.email?.split('@')[0] ||
    'membre'

  const greeting = useMemo(() => buildGreeting(firstName), [firstName])
  const greetingText = greeting.text

  // Typewriter sur le greeting (1× au mount).
  const [typedLength, setTypedLength] = useState(0)
  useEffect(() => {
    if (!shouldShow) return
    setTypedLength(0)
    let i = 0
    const id = setInterval(() => {
      i += 1
      setTypedLength(i)
      if (i >= greetingText.length) clearInterval(id)
    }, 30)
    return () => clearInterval(id)
  }, [shouldShow, greetingText])

  if (!shouldShow) return null

  const stats = buildStats({ unreadCount })

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      aria-label="Accueil personnalisé du jour"
      className="rounded-2xl bg-[var(--card)] p-5 ring-1 ring-[var(--border)] sm:p-6"
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl sm:text-3xl" aria-hidden>
          {greeting.emoji}
        </span>
        <div className="flex-1 min-w-0">
          <h2
            className="font-display text-lg font-semibold tracking-tight text-[var(--foreground)] sm:text-xl"
            aria-live="polite"
          >
            {greetingText.slice(0, typedLength)}
            {typedLength < greetingText.length && (
              <span className="ml-0.5 inline-block h-5 w-0.5 animate-pulse bg-[var(--foreground)] align-text-bottom" />
            )}
          </h2>
          {stats.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2">
              {stats.map((s, i) => (
                <StatPill key={s.label} stat={s} delay={0.2 + i * 0.1} />
              ))}
            </ul>
          )}
        </div>
      </div>
    </motion.section>
  )
}

function StatPill({
  stat,
  delay,
}: {
  stat: Stat
  delay: number
}) {
  return (
    <motion.li
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: 'easeOut' }}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-[var(--secondary)] px-3 py-1.5 text-xs font-medium text-[var(--foreground)] sm:text-sm',
      )}
    >
      <stat.icon className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
      {stat.label}
    </motion.li>
  )
}

function buildGreeting(firstName: string): { text: string; emoji: string } {
  const hour = new Date().getHours()
  if (hour >= 4 && hour < 12) return { text: `Bonjour ${firstName}`, emoji: '👋' }
  if (hour >= 12 && hour < 18) return { text: `Bon après-midi ${firstName}`, emoji: '☀️' }
  if (hour >= 18 && hour < 23) return { text: `Bonsoir ${firstName}`, emoji: '🌙' }
  return { text: `Bonne nuit ${firstName}`, emoji: '✨' }
}

interface Stat {
  label: string
  icon: LucideIcon
}

function buildStats({ unreadCount }: { unreadCount: number }): Stat[] {
  const stats: Stat[] = []
  if (unreadCount > 0) {
    stats.push({
      label: `${unreadCount} notification${unreadCount > 1 ? 's' : ''} t'attend${unreadCount > 1 ? 'ent' : ''}`,
      icon: Bell,
    })
  }
  // Stats supplémentaires (membres / posts) : laissées pour évolution
  // future quand une RPC dashboard_stats sera disponible. Pour l'instant
  // on s'appuie uniquement sur l'unreadCount qui est déjà en cache.
  if (stats.length === 0) {
    stats.push({
      label: 'Bonne journée dans Le Club IA',
      icon: MessagesSquare,
    })
  }
  return stats
}
