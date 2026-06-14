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
    <div className="flex h-full w-full flex-col bg-white/70 backdrop-blur-md">
      {/* Logo + badge admin */}
      <div className="flex items-center gap-2 px-6 py-8">
        <Link to="/app/dashboard" onClick={onNavigate} className="inline-flex transition-transform hover:scale-[1.02]">
          <BrandLogo size="sm" variant="primary" asLink={false} />
        </Link>
        {isAdmin && (
          <span className="ml-auto rounded-full bg-[var(--noir)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--or)] ring-1 ring-[var(--or)]/40">
            Admin
          </span>
        )}
      </div>

      {/* Navigation principale */}
      <nav className="flex-1 overflow-y-auto px-4 py-2">
        <p className="px-3 pb-3 pt-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted-foreground)] opacity-60">
          Navigation
        </p>
        <ul className="space-y-1.5">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.to
            return (
              <li key={item.to}>
                <Link
                  id={`nav-${item.to.split('/').pop()}`}
                  to={item.to}
                  onClick={onNavigate}
                  className={cn(
                    'group relative flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-300',
                    active
                      ? 'bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/20'
                      : 'text-[var(--foreground)] hover:bg-[var(--primary)]/5 hover:text-[var(--primary)]',
                  )}
                >
                  <item.icon
                    className={cn(
                      'h-[18px] w-[18px] shrink-0 transition-colors',
                      active
                        ? 'text-white'
                        : 'text-[var(--muted-foreground)] group-hover:text-[var(--primary)]',
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
            <p className="mt-8 px-3 pb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--or-deep)] opacity-80">
              Administration
            </p>
            <ul className="space-y-1.5">
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
                        'group relative flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-300',
                        active
                          ? 'bg-[var(--or)] text-[var(--noir)] shadow-lg shadow-[var(--or-deep)]/30'
                          : 'text-[var(--foreground)] hover:bg-[var(--or)]/10 hover:text-[var(--or-deep)]',
                      )}
                    >
                      <item.icon
                        className={cn(
                          'h-[18px] w-[18px] shrink-0 transition-colors',
                          active
                            ? 'text-[var(--noir)]'
                            : 'text-[var(--muted-foreground)] group-hover:text-[var(--or-deep)]',
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
      <div className="mt-auto border-t border-[var(--border)] p-4">
        <Link
          to="/app/profil"
          onClick={onNavigate}
          className={cn(
            'flex items-center gap-3 rounded-2xl p-3 transition-all duration-300',
            pathname === '/app/profil'
              ? 'bg-[var(--primary)]/5 border border-[var(--primary)]/10'
              : 'hover:bg-[var(--secondary)] border border-transparent',
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
            <p className="truncate text-sm font-bold tracking-tight">{fullName}</p>
            <p className="flex items-center gap-1 text-[11px] font-medium text-[var(--muted-foreground)]">
              Mon profil
            </p>
          </div>
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          className="mt-2 flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-[var(--muted-foreground)] transition-all hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="h-4 w-4" />
          Se déconnecter
        </button>
      </div>
    </div>
  )
}
