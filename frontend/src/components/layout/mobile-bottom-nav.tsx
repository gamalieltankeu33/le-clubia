import { Link, useLocation } from '@tanstack/react-router'
import {
  Bell,
  GraduationCap,
  LayoutDashboard,
  MessagesSquare,
  User,
  type LucideIcon,
} from 'lucide-react'
import { useNotificationsStore } from '@/stores/notifications-store'
import { useAuthStore } from '@/stores/auth-store'
import { AvatarDisplay } from '@/components/avatar-display'
import { haptic } from '@/lib/haptic'
import { cn } from '@/lib/utils'

interface NavTab {
  to: string
  label: string
  icon: LucideIcon
  /** Match les sous-routes (ex: /app/communaute/$postId reste actif sur "communaute"). */
  matchPrefix?: string
}

const TABS: NavTab[] = [
  {
    to: '/app/dashboard',
    label: 'Accueil',
    icon: LayoutDashboard,
    matchPrefix: '/app/dashboard',
  },
  {
    to: '/app/formations',
    label: 'Formations',
    icon: GraduationCap,
    matchPrefix: '/app/formations',
  },
  {
    to: '/app/communaute',
    label: 'Communauté',
    icon: MessagesSquare,
    matchPrefix: '/app/communaute',
  },
]

/**
 * Bottom navigation visible uniquement sur < lg. Sur l'iPhone X+, la
 * safe-area-inset-bottom est ajoutée pour ne pas que la home indicator
 * masque les onglets.
 *
 * L'item "Notifications" n'a pas de route propre — il ouvre le panneau
 * latéral des notifications via le store. L'item "Profil" est un Link
 * vers /app/profil, avec l'avatar du user (touche perso à la "Apple ID").
 */
export function MobileBottomNav() {
  const { pathname } = useLocation()
  const togglePanel = useNotificationsStore((s) => s.togglePanel)
  const isPanelOpen = useNotificationsStore((s) => s.isPanelOpen)
  const unreadCount = useNotificationsStore((s) => s.unreadCount)
  const profile = useAuthStore((s) => s.profile)
  const user = useAuthStore((s) => s.user)

  const isProfileActive = pathname.startsWith('/app/profil')

  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border)] bg-[var(--card)]/90 backdrop-blur-xl lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <ul className="flex h-[64px] items-stretch justify-around">
        {TABS.map((tab) => {
          const active = tab.matchPrefix
            ? pathname.startsWith(tab.matchPrefix)
            : pathname === tab.to
          return (
            <li key={tab.to} className="flex-1">
              <Link
                to={tab.to}
                onClick={() => haptic('light')}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'group relative flex h-full w-full flex-col items-center justify-center gap-1 touch-manipulation transition-transform',
                  'active:scale-95',
                )}
              >
                <ActiveIndicator visible={active} />
                <tab.icon
                  className={cn(
                    'h-[22px] w-[22px] transition-colors',
                    active
                      ? 'text-[var(--foreground)]'
                      : 'text-[var(--muted-foreground)]',
                  )}
                  // Filled effect via stroke-width sur l'icône active
                  // (lucide n'a pas de "fill" natif sur ces icônes, on
                  // mime "filled" en augmentant le stroke).
                  strokeWidth={active ? 2.4 : 1.8}
                />
                <span
                  className={cn(
                    'text-[10px] tracking-tight',
                    active
                      ? 'font-semibold text-[var(--foreground)]'
                      : 'font-medium text-[var(--muted-foreground)]',
                  )}
                >
                  {tab.label}
                </span>
              </Link>
            </li>
          )
        })}

        {/* Notifications — ouvre le panneau (pas de route dédiée) */}
        <li className="flex-1">
          <button
            type="button"
            onClick={() => {
              haptic('light')
              togglePanel()
            }}
            aria-label={
              unreadCount > 0
                ? `Notifications, ${unreadCount} non lue${unreadCount > 1 ? 's' : ''}`
                : 'Notifications'
            }
            aria-pressed={isPanelOpen}
            className={cn(
              'relative flex h-full w-full flex-col items-center justify-center gap-1 touch-manipulation transition-transform',
              'active:scale-95',
            )}
          >
            <ActiveIndicator visible={isPanelOpen} />
            <span className="relative">
              <Bell
                className={cn(
                  'h-[22px] w-[22px] transition-colors',
                  isPanelOpen
                    ? 'text-[var(--foreground)]'
                    : 'text-[var(--muted-foreground)]',
                )}
                strokeWidth={isPanelOpen ? 2.4 : 1.8}
              />
              {unreadCount > 0 && <UnreadBadge count={unreadCount} />}
            </span>
            <span
              className={cn(
                'text-[10px] tracking-tight',
                isPanelOpen
                  ? 'font-semibold text-[var(--foreground)]'
                  : 'font-medium text-[var(--muted-foreground)]',
              )}
            >
              Notifs
            </span>
          </button>
        </li>

        {/* Profil — avatar à la place d'une icône */}
        <li className="flex-1">
          <Link
            to="/app/profil"
            onClick={() => haptic('light')}
            aria-current={isProfileActive ? 'page' : undefined}
            aria-label="Profil"
            className={cn(
              'relative flex h-full w-full flex-col items-center justify-center gap-1 touch-manipulation transition-transform',
              'active:scale-95',
            )}
          >
            <ActiveIndicator visible={isProfileActive} />
            <span
              className={cn(
                'inline-flex items-center justify-center rounded-full transition-shadow',
                isProfileActive && 'ring-2 ring-[var(--foreground)]',
              )}
            >
              {profile || user ? (
                <AvatarDisplay
                  avatarUrl={profile?.avatar_url}
                  firstName={profile?.first_name}
                  lastName={profile?.last_name}
                  email={user?.email ?? null}
                  isVerified={false}
                  size="sm"
                />
              ) : (
                <User
                  className={cn(
                    'h-[22px] w-[22px]',
                    isProfileActive
                      ? 'text-[var(--foreground)]'
                      : 'text-[var(--muted-foreground)]',
                  )}
                  strokeWidth={isProfileActive ? 2.4 : 1.8}
                />
              )}
            </span>
            <span
              className={cn(
                'text-[10px] tracking-tight',
                isProfileActive
                  ? 'font-semibold text-[var(--foreground)]'
                  : 'font-medium text-[var(--muted-foreground)]',
              )}
            >
              Profil
            </span>
          </Link>
        </li>
      </ul>
    </nav>
  )
}

/** Trait orange en haut de l'item actif — signature visuelle de la nav. */
function ActiveIndicator({ visible }: { visible: boolean }) {
  if (!visible) return null
  return (
    <span
      aria-hidden
      className="absolute left-1/2 top-0 h-0.5 w-10 -translate-x-1/2 rounded-full bg-[var(--accent)]"
    />
  )
}

function UnreadBadge({ count }: { count: number }) {
  if (count > 9) {
    return (
      <span
        aria-hidden
        className="absolute -right-2 -top-1 flex h-4 min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white tabular-nums"
      >
        9+
      </span>
    )
  }
  return (
    <span
      aria-hidden
      className="absolute -right-1 -top-0.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-[var(--card)]"
    />
  )
}
