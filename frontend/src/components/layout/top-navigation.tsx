import { Link, useLocation, useNavigate } from '@tanstack/react-router'
import { Search, MessageSquare, Bookmark, Settings, LogOut, Shield } from 'lucide-react'
import { NotificationBell } from '@/components/notifications/notification-bell'
import { NotificationPanel } from '@/components/notifications/notification-panel'
import { cn } from '@/lib/utils'
import { BrandLogo } from '@/components/brand-logo'
import { AvatarDisplay } from '@/components/avatar-display'
import { useAuthStore } from '@/stores/auth-store'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

export function TopNavigation({ onOpenMobileMenu }: { onOpenMobileMenu: () => void }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const profile = useAuthStore((s) => s.profile)
  const isAdmin = useAuthStore((s) => s.isAdmin)()
  const signOut = useAuthStore((s) => s.signOut)

  const navLinks = [
    { name: 'Accueil', path: '/app' },
    { name: 'Formations', path: '/app/formations' },
    { name: 'Communauté', path: '/app/communaute' },
    { name: 'Événements', path: '/app/events' },
  ]

  return (
    <header className="sticky top-0 z-40 w-full max-w-full overflow-hidden border-b border-[var(--border)] bg-[var(--card)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--card)]/80">
      <div className="flex h-14 w-full items-center px-3 sm:px-4 md:px-6">
        {/* Logo & Mobile Menu Toggle */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <button
            onClick={onOpenMobileMenu}
            className="flex h-9 w-9 items-center justify-center rounded-md text-[var(--muted-foreground)] hover:bg-[var(--secondary)] lg:hidden"
          >
            <span className="sr-only">Ouvrir le menu</span>
            <svg width="20" height="20" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1.5 3C1.22386 3 1 3.22386 1 3.5C1 3.77614 1.22386 4 1.5 4H13.5C13.7761 4 14 3.77614 14 3.5C14 3.22386 13.7761 3 13.5 3H1.5ZM1 7.5C1 7.22386 1.22386 7 1.5 7H13.5C13.7761 7 14 7.22386 14 7.5C14 7.77614 13.7761 8 13.5 8H1.5C1.22386 8 1 7.77614 1 7.5ZM1 11.5C1 11.2239 1.22386 11 1.5 11H13.5C13.7761 11 14 11.2239 14 11.5C14 11.7761 13.7761 12 13.5 12H1.5C1.22386 12 1 11.7761 1 11.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
            </svg>
          </button>
          <Link to="/app" className="flex items-center gap-2">
            <BrandLogo size="sm" asLink={false} />
          </Link>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden flex-1 items-center justify-center gap-6 lg:flex shrink-0">
          {navLinks.map((link) => {
            // Active si c'est la page exacte ou si on est dans un sous-dossier (ex: /app/communaute/*)
            // Sauf pour /app (accueil) où ça doit être exact.
            const isActive =
              link.path === '/app'
                ? pathname === '/app'
                : pathname.startsWith(link.path)

            return (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-[var(--primary)] text-white shadow-sm'
                    : 'text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]'
                )}
              >
                {link.name}
              </Link>
            )
          })}
          
          <DropdownMenu>
            <DropdownMenuTrigger className="px-3 py-1.5 rounded-full text-sm font-medium text-[var(--muted-foreground)] transition-colors hover:bg-[var(--secondary)] hover:text-[var(--foreground)] focus:outline-none flex items-center gap-1">
              Plus
              <svg width="12" height="12" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.18179 6.18181C4.35753 6.00608 4.64245 6.00608 4.81819 6.18181L7.49999 8.86362L10.1818 6.18181C10.3575 6.00608 10.6424 6.00608 10.8182 6.18181C10.9939 6.35755 10.9939 6.64247 10.8182 6.81821L7.81819 9.81821C7.73379 9.9026 7.61934 9.95001 7.49999 9.95001C7.38064 9.95001 7.26618 9.9026 7.18179 9.81821L4.18179 6.81821C4.00605 6.64247 4.00605 6.35755 4.18179 6.18181Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem className="cursor-pointer" onSelect={() => navigate({ to: '/app/messages' })}>
                Messagerie
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" onSelect={() => navigate({ to: '/app/challenges' })}>
                Challenges
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" onSelect={() => navigate({ to: '/app/ressources' })}>
                Ressources
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" onSelect={() => navigate({ to: '/app/actualites' })}>
                Actualités
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" onSelect={() => navigate({ to: '/app/classement' })}>
                Classement
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        {/* Right Actions */}
        <div className="flex flex-1 items-center justify-end gap-1 sm:gap-2">
          {isAdmin && (
            <Link
              to="/app/admin"
              className="flex items-center gap-1.5 rounded-full bg-[var(--or)]/10 px-3 py-1.5 text-xs font-semibold text-[var(--or)] hover:bg-[var(--or)]/20 transition-colors mr-2 focus:outline-none"
            >
              <Shield className="h-3.5 w-3.5" />
              Admin
            </Link>
          )}
          <Link to="/app/search" className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)] transition-colors"><Search className="h-5 w-5" /></Link>
          <NotificationBell className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-[var(--secondary)] hover:text-[var(--foreground)] transition-colors" />
          
          <div className="ml-2 pl-2 border-l border-[var(--border)]">
            <DropdownMenu>
              <DropdownMenuTrigger className="focus:outline-none flex items-center">
                <AvatarDisplay
                  avatarUrl={profile?.avatar_url}
                  firstName={profile?.first_name}
                  lastName={profile?.last_name}
                  size="sm"
                  className="hover:ring-2 hover:ring-[var(--primary)] transition-all"
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 mt-2">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    {profile?.first_name && <p className="font-medium text-sm">{profile.first_name} {profile.last_name}</p>}
                    {user?.email && <p className="w-[200px] truncate text-xs text-[var(--muted-foreground)]">{user.email}</p>}
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer" onSelect={() => navigate({ to: '/app/membres/$userId', params: { userId: user?.id || '' } })}>
                  Voir mon profil
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  Mes favoris
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer" onSelect={() => navigate({ to: '/app/profil' })}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Paramètres</span>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem className="cursor-pointer text-[var(--primary)] font-medium" onSelect={() => navigate({ to: '/app/admin' })}>
                    <Shield className="mr-2 h-4 w-4" />
                    <span>Administration</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700 dark:focus:bg-red-950" onClick={signOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Se déconnecter</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      <NotificationPanel />
    </header>
  )
}
