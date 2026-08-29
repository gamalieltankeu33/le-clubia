import { Link, useLocation } from '@tanstack/react-router'
import {
  LayoutDashboard,
  GraduationCap,
  FolderKanban,
  Newspaper,
  Calendar,
  Users,
  Trophy,
  FileText,
  BarChart3,
  ShieldAlert,
  Bot,
  PlusCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface AdminNavItem {
  title: string
  href: string
  icon: any
  exact?: boolean
}

const adminNavItems: AdminNavItem[] = [
  {
    title: 'Tableau de bord',
    href: '/app/admin',
    icon: LayoutDashboard,
    exact: true,
  },
  {
    title: 'Formations',
    href: '/app/admin/formations',
    icon: GraduationCap,
  },
  {
    title: 'Ressources',
    href: '/app/admin/ressources',
    icon: FolderKanban,
  },
  {
    title: 'Actualités & IA',
    href: '/app/admin/actualites',
    icon: Newspaper,
  },
  {
    title: 'Événements',
    href: '/app/admin/events',
    icon: Calendar,
  },
  {
    title: 'Membres',
    href: '/app/admin/members',
    icon: Users,
  },
  {
    title: 'Challenges',
    href: '/app/admin/challenges',
    icon: Trophy,
  },
  {
    title: 'Candidatures',
    href: '/app/admin/candidatures',
    icon: FileText,
  },
  {
    title: 'Statistiques',
    href: '/app/admin/insights',
    icon: BarChart3,
  },
  {
    title: 'Audit Logs',
    href: '/app/admin/audit-log',
    icon: ShieldAlert,
  },
]

export function AdminSidebar() {
  const { pathname } = useLocation()

  return (
    <aside className="w-64 shrink-0 border-r border-[var(--border)] bg-[var(--card)] hidden md:block min-h-[calc(100vh-3.5rem)]">
      <div className="flex flex-col h-full p-4 space-y-6">
        <div className="px-3 py-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
            Administration
          </h2>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
            Espace de gestion global
          </p>
        </div>

        <nav className="space-y-1 flex-1">
          {adminNavItems.map((item) => {
            const Icon = item.icon
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href)

            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-[var(--primary)] text-white font-semibold shadow-sm'
                    : 'text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]'
                )}
              >
                <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-white' : 'text-[var(--muted-foreground)]')} />
                <span className="truncate">{item.title}</span>
              </Link>
            )
          })}
        </nav>

        {/* Quick action block at bottom */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-3 space-y-2">
          <p className="text-xs font-medium text-[var(--foreground)]">Actions rapides</p>
          <div className="space-y-1">
            <Link
              to="/app/admin/actualites"
              className="flex items-center gap-2 text-xs text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors py-1"
            >
              <Bot className="h-3.5 w-3.5" />
              Lancer l'Agent IA (Actus)
            </Link>
            <Link
              to="/app/admin/formations/new"
              className="flex items-center gap-2 text-xs text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors py-1"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              Ajouter une formation
            </Link>
          </div>
        </div>
      </div>
    </aside>
  )
}
