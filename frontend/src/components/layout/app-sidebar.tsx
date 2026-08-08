import { Link, useLocation, useNavigate } from '@tanstack/react-router'
import {
  Briefcase,
  CalendarDays,
  GraduationCap,
  LayoutDashboard,
  Library,
  LogOut,
  MessageSquare,
  Newspaper,
  Trophy,
  Users,
  Zap,
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
    to: '/app/admin/candidatures',
    label: 'Sprint Business IA',
    icon: Zap,
    matchPrefix: '/app/admin/candidatures',
  },
  {
    to: '/app/admin/formations',
    label: 'Formations',
    icon: GraduationCap,
    matchPrefix: '/app/admin/formations',
  },
  {
    to: '/app/admin/challenges',
    label: 'Challenges',
    icon: Trophy,
    matchPrefix: '/app/admin/challenges',
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
  {
    to: '/app/admin/membres',
    label: 'Membres',
    icon: Users,
    matchPrefix: '/app/admin/membres',
  },
]

export function AppSidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, profile, isAdmin, isSuperAdmin, logout } = useAuthStore()

  const handleLogout = async () => {
    await logout()
    navigate({ to: '/auth' })
  }

  const isAdminRoute = location.pathname.startsWith('/app/admin')
  const showAdminToggle = isAdmin || isSuperAdmin

  const userInitials =
    user?.user_metadata?.full_name
      ?.split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2) ||
    user?.email?.substring(0, 2).toUpperCase() ||
    'U'

  const userName =
    user?.user_metadata?.full_name ||
    profile?.full_name ||
    user?.email?.split('@')[0] ||
    'Utilisateur'

  return (
    <aside className="w-64 bg-[#FAFAF9] border-r border-zinc-200/80 flex flex-col h-screen fixed left-0 top-0 z-30 font-sans">
      {/* Brand Header */}
      <div className="p-6 border-b border-zinc-200/60 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <BrandLogo size="sm" />
        </Link>
        {isAdminRoute && (
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-900 bg-zinc-200/80 px-2 py-0.5 rounded">
            Admin
          </span>
        )}
      </div>

      {/* Admin Toggle Banner */}
      {showAdminToggle && (
        <div className="px-4 py-3 border-b border-zinc-200/60 bg-zinc-100/50">
          {isAdminRoute ? (
            <Link
              to="/app/communaute"
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-700 transition-colors shadow-2xs"
            >
              <span>← Retour à l'espace Membre</span>
            </Link>
          ) : (
            <Link
              to="/app/admin"
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-semibold transition-colors shadow-2xs"
            >
              <Zap className="w-3.5 h-3.5 text-blue-400" />
              <span>Espace Admin</span>
            </Link>
          )}
        </div>
      )}

      {/* Main Navigation Links */}
      <div className="flex-1 py-4 px-3 overflow-y-auto space-y-6">
        {isAdminRoute ? (
          <div>
            <div className="px-3 mb-2 text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">
              Administration
            </div>
            <nav className="space-y-1">
              {ADMIN_NAV_ITEMS.map((item) => {
                const Icon = item.icon
                const isActive = item.matchPrefix
                  ? location.pathname === item.to || location.pathname.startsWith(item.matchPrefix)
                  : location.pathname === item.to

                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors',
                      isActive
                        ? 'bg-zinc-900 text-white font-semibold shadow-2xs'
                        : 'text-zinc-600 hover:bg-zinc-200/60 hover:text-zinc-900'
                    )}
                  >
                    <Icon className={cn('w-4 h-4', isActive ? 'text-blue-400' : 'text-zinc-500')} />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>
          </div>
        ) : (
          <div>
            <div className="px-3 mb-2 text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">
              Plateforme
            </div>
            <nav className="space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.to || (item.to !== '/app' && location.pathname.startsWith(item.to))

                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors',
                      isActive
                        ? 'bg-zinc-900 text-white font-semibold shadow-2xs'
                        : 'text-zinc-600 hover:bg-zinc-200/60 hover:text-zinc-900'
                    )}
                  >
                    <Icon className={cn('w-4 h-4', isActive ? 'text-blue-400' : 'text-zinc-500')} />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>
          </div>
        )}
      </div>

      {/* User Footer Profile & Logout */}
      <div className="p-4 border-t border-zinc-200/80 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <AvatarDisplay
              src={profile?.avatar_url || user?.user_metadata?.avatar_url}
              initials={userInitials}
              size="sm"
            />
            <div className="truncate">
              <div className="text-xs font-bold text-zinc-900 truncate">{userName}</div>
              <div className="text-[10px] text-zinc-500 font-mono truncate">{user?.email}</div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Se déconnecter"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
