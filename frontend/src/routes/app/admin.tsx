import { createFileRoute, Outlet, Link, useLocation } from '@tanstack/react-router'
import { useRequireAuth } from '@/lib/use-require-auth'
import { AdminSidebar } from '@/components/layout/admin-sidebar'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/app/admin')({
  component: AdminLayout,
})

const mobileAdminTabs = [
  { title: 'Dashboard', href: '/app/admin', exact: true },
  { title: 'Formations', href: '/app/admin/formations' },
  { title: 'Ressources', href: '/app/admin/ressources' },
  { title: 'Actualités', href: '/app/admin/actualites' },
  { title: 'Événements', href: '/app/admin/events' },
  { title: 'Membres', href: '/app/admin/members' },
  { title: 'Challenges', href: '/app/admin/challenges' },
]

function AdminLayout() {
  const allowed = useRequireAuth({ requireOnboarded: true, requireAdmin: true })
  const { pathname } = useLocation()

  if (!allowed) return null

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col md:flex-row">
      {/* Mobile Horizontal Subnav */}
      <div className="md:hidden border-b border-[var(--border)] bg-[var(--card)] px-4 py-2 overflow-x-auto scrollbar-none flex items-center gap-2 shrink-0">
        {mobileAdminTabs.map((tab) => {
          const isActive = tab.exact
            ? pathname === tab.href
            : pathname.startsWith(tab.href)
          return (
            <Link
              key={tab.href}
              to={tab.href}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors',
                isActive
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              )}
            >
              {tab.title}
            </Link>
          )
        })}
      </div>

      {/* Desktop Sidebar */}
      <AdminSidebar />

      {/* Main Admin Content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}

