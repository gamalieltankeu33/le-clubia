import { Link } from '@tanstack/react-router'
import { Menu } from 'lucide-react'
import { BrandLogo } from '@/components/brand-logo'
import { NotificationBell } from '@/components/notifications/notification-bell'

export function AppHeader({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[var(--border)] bg-[var(--card)] px-4">
      {/* Logo : visible mobile uniquement (la sidebar le montre déjà sur desktop) */}
      <Link
        to="/app/dashboard"
        className="inline-flex lg:hidden"
        aria-label="Tableau de bord"
      >
        <BrandLogo size="sm" variant="primary" asLink={false} />
      </Link>
      {/* Spacer pour pousser la cloche à droite sur desktop */}
      <span aria-hidden="true" className="hidden lg:block" />

      <div className="flex items-center gap-1">
        <NotificationBell />
        <button
          type="button"
          onClick={onOpenSidebar}
          aria-label="Ouvrir le menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--foreground)] transition-colors hover:bg-[var(--secondary)] lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>
    </header>
  )
}
