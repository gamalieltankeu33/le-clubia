import { Link } from '@tanstack/react-router'
import { Menu } from 'lucide-react'
import { BrandLogo } from '@/components/brand-logo'
import { NotificationBell } from '@/components/notifications/notification-bell'

export function AppHeader({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[var(--border)] bg-white/70 px-6 backdrop-blur-md">
      {/* Logo : visible mobile uniquement (la sidebar le montre déjà sur desktop) */}
      <Link
        to="/app/dashboard"
        className="inline-flex lg:hidden transition-transform hover:scale-[1.02]"
        aria-label="Tableau de bord"
      >
        <BrandLogo size="sm" variant="primary" asLink={false} />
      </Link>
      {/* Spacer pour pousser la cloche à droite sur desktop */}
      <span aria-hidden="true" className="hidden lg:block" />

      <div className="flex items-center gap-3">
        <NotificationBell />
        <button
          type="button"
          onClick={onOpenSidebar}
          aria-label="Ouvrir le menu"
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--secondary)] text-[var(--foreground)] transition-all hover:bg-[var(--primary)]/10 hover:text-[var(--primary)] lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>
    </header>
  )
}
