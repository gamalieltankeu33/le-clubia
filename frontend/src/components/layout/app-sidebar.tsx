import { Link, useLocation, useNavigate } from '@tanstack/react-router'
import {
  CalendarDays,
  GraduationCap,
  LayoutDashboard,
  Library,
  LogOut,
  MessageSquare,
  Newspaper,
  Trophy,
  User,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'
import { AvatarDisplay } from '@/components/avatar-display'
import { BrandLogo } from '@/components/brand-logo'
import { NAV_ITEMS } from './nav-items'

interface AdminNavItem {
  to: string
  label: string
  icon: LucideIcon
  /** matchPrefix permet de garder le lien actif sur les sous-routes (ex: /new, /$id) */
  matchPrefix?: string
}

const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { to: '/app/admin', label: 'Tableau de bord', icon: LayoutDashboard },
  {
    to: '/app/admin/formations',
    label: 'Formations',
    icon: GraduationCap,
    matchPrefix: '/app/admin/formations',
  },
  {
    to: '/app/admin/ressources',
    label: 'Ressources',
    icon: Library,
    matchPrefix: '/app/admin/ressources',
  },
  {
    to: '/app/admin/actualites',
    label: 'Actualités',
    icon: Newspaper,
    matchPrefix: '/app/admin/actualites',
  },
  { to: '/app/admin/members', label: 'Membres', icon: Users },
  {
    to: '/app/admin/community',
    label: 'Communauté',
    icon: MessageSquare,
    matchPrefix: '/app/admin/community',
  },
  { to: '/app/admin/classement', label: 'Classement', icon: Trophy },
  { to: '/app/admin/events', label: 'Événements', icon: CalendarDays },
]

export function AppSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const profile = useAuthStore((s) => s.profile)
  const user = useAuthStore((s) => s.user)
  const isAdmin = useAuthStore((s) => s.isAdmin)()
  const signOut = useAuthStore((s) => s.signOut)

  const fullName =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') ||
    user?.email ||
    'Membre'

  async function handleSignOut() {
    await signOut()
    navigate({ to: '/auth' })
  }

  return (
    <div className="flex h-full w-full flex-col bg-[var(--card)]">
      {/* Logo + badge admin */}
      <div className="flex items-center gap-2 px-5 py-5">
        <Link to="/app/dashboard" onClick={onNavigate} className="inline-flex">
          <BrandLogo size="sm" variant="primary" asLink={false} />
        </Link>
        {isAdmin && (
          <span className="ml-auto rounded-full bg-[var(--accent)]/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--accent)]">
            Admin
          </span>
        )}
      </div>

      {/* Navigation principale */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        <p className="px-3 pb-2 pt-3 text-[11px] font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
          Navigation
        </p>
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.to
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  onClick={onNavigate}
                  className={cn(
                    'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                    active
                      ? 'bg-[var(--primary)]/10 font-medium text-[var(--primary)]'
                      : 'text-[var(--foreground)] hover:bg-[var(--secondary)]',
                  )}
                >
                  {active && (
                    <span className="absolute inset-y-1 left-0 w-1 rounded-r-full bg-[var(--primary)]" />
                  )}
                  <item.icon
                    className={cn(
                      'h-4 w-4 shrink-0',
                      active
                        ? 'text-[var(--primary)]'
                        : 'text-[var(--muted-foreground)] group-hover:text-[var(--foreground)]',
                    )}
                  />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>

        {/* Section Admin (visible uniquement si admin) */}
        {isAdmin && (
          <>
            <p className="mt-6 px-3 pb-2 text-[11px] font-medium uppercase tracking-wider text-[var(--accent)]">
              Admin
            </p>
            <ul className="space-y-1">
              {ADMIN_NAV_ITEMS.map((item) => {
                const active = item.matchPrefix
                  ? pathname.startsWith(item.matchPrefix)
                  : pathname === item.to
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      onClick={onNavigate}
                      className={cn(
                        'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                        active
                          ? 'bg-[var(--accent)]/10 font-medium text-[var(--accent)]'
                          : 'text-[var(--foreground)] hover:bg-[var(--secondary)]',
                      )}
                    >
                      {active && (
                        <span className="absolute inset-y-1 left-0 w-1 rounded-r-full bg-[var(--accent)]" />
                      )}
                      <item.icon
                        className={cn(
                          'h-4 w-4 shrink-0',
                          active
                            ? 'text-[var(--accent)]'
                            : 'text-[var(--muted-foreground)] group-hover:text-[var(--foreground)]',
                        )}
                      />
                      {item.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </nav>

      {/* Bas : profil + déconnexion */}
      <div className="border-t border-[var(--border)] p-3">
        <Link
          to="/app/profil"
          onClick={onNavigate}
          className={cn(
            'flex items-center gap-3 rounded-lg p-2 transition-colors',
            pathname === '/app/profil'
              ? 'bg-[var(--primary)]/10'
              : 'hover:bg-[var(--secondary)]',
          )}
        >
          <AvatarDisplay
            avatarUrl={profile?.avatar_url}
            firstName={profile?.first_name}
            lastName={profile?.last_name}
            email={user?.email}
            isVerified={profile?.is_verified ?? false}
            size="md"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{fullName}</p>
            <p className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
              <User className="h-3 w-3" />
              Mon profil
            </p>
          </div>
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-[var(--muted-foreground)] transition-colors hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
        >
          <LogOut className="h-4 w-4" />
          Se déconnecter
        </button>
      </div>
    </div>
  )
}
