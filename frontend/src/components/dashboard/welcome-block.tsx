import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Bell, MessagesSquare, type LucideIcon } from 'lucide-react'
import { useNotificationsStore } from '@/stores/notifications-store'
import { useAuthStore } from '@/stores/auth-store'
import { cn } from '@/lib/utils'
import { CardElite } from '@/components/shared/card-elite'
import { formatMemberNumber } from '@/lib/format-member-number'

interface WelcomeBlockProps {
  /** id du membre courant — sert de clé localStorage. */
  userId: string
}

/**
 * Bloc d'accueil élite — visible une fois par jour calendaire (clé
 * localStorage `last_visit_<userId>`). Surface bleu Bloomberg signature avec :
 *  - greeting typewriter en serif italique bleu ciel
 *  - "Membre #047" en gros chiffres serif or (rare et précieux)
 *  - citation en blanc cassé italique opacity 70 %
 *
 * Le bloc n'est pas censé être visible plus d'une fois par jour : c'est
 * un moment "premium" pour démarrer la journée, pas un pavé permanent.
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
  const memberLabel = formatMemberNumber(profile?.member_number)

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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      aria-label="Accueil personnalisé du jour"
    >
      <CardElite variant="gradient" className="px-6 py-8 sm:px-10 sm:py-12">
        <div className="relative z-10">
          <p className="font-serif-signature text-lg italic text-[var(--bleu-ciel)] sm:text-xl">
            {greeting.serifLead}
          </p>

          <h2
            className="mt-3 font-display text-3xl font-bold leading-[1.1] tracking-tight text-[#FAFAF9] sm:text-4xl md:text-5xl"
            aria-live="polite"
          >
            {greetingText.slice(0, typedLength)}
            {typedLength < greetingText.length && (
              <span className="ml-0.5 inline-block h-7 w-0.5 animate-pulse bg-[var(--bleu-ciel)] align-text-bottom sm:h-9" />
            )}
          </h2>

          {memberLabel && (
            <p className="mt-4 text-sm text-white/60">
              Membre{' '}
              <span className="font-serif-number text-2xl text-[var(--or)] sm:text-3xl">
                {memberLabel}
              </span>{' '}
              du Club
            </p>
          )}

          {stats.length > 0 && (
            <ul className="mt-6 flex flex-wrap gap-2">
              {stats.map((s, i) => (
                <StatPill key={s.label} stat={s} delay={0.4 + i * 0.1} />
              ))}
            </ul>
          )}

          <p className="mt-6 font-serif-signature text-sm italic text-white/55 sm:text-base">
            « Le savoir n'est puissance que partagé. »
          </p>
        </div>
      </CardElite>
    </motion.section>
  )
}

function StatPill({ stat, delay }: { stat: Stat; delay: number }) {
  return (
    <motion.li
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: 'easeOut' }}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm ring-1 ring-white/15 sm:text-sm',
      )}
    >
      <stat.icon className="h-3.5 w-3.5 text-[var(--bleu-ciel)]" />
      {stat.label}
    </motion.li>
  )
}

function buildGreeting(firstName: string): {
  text: string
  emoji: string
  serifLead: string
} {
  const hour = new Date().getHours()
  if (hour >= 4 && hour < 12)
    return { text: `Bonjour ${firstName}`, emoji: '☀️', serifLead: 'Bonne matinée,' }
  if (hour >= 12 && hour < 18)
    return {
      text: `Bon après-midi ${firstName}`,
      emoji: '☀️',
      serifLead: 'Bon après-midi,',
    }
  if (hour >= 18 && hour < 23)
    return { text: `Bonsoir ${firstName}`, emoji: '🌙', serifLead: 'Bonne soirée,' }
  return { text: `Bonne nuit ${firstName}`, emoji: '✨', serifLead: 'Au cœur de la nuit,' }
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
  if (stats.length === 0) {
    stats.push({
      label: 'Belle journée au Club',
      icon: MessagesSquare,
    })
  }
  return stats
}
