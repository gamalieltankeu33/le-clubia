import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { BrandLogo } from '@/components/brand-logo'
import { cn } from '@/lib/utils'

export function LandingHeader() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-300',
        scrolled
          ? 'border-b border-[#E5E5E5] bg-white/85 backdrop-blur-xl'
          : 'border-b border-transparent bg-white/0',
      )}
    >
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-6">
        <BrandLogo size="md" variant="primary" />

        <nav className="flex items-center gap-3 sm:gap-4">
          <Link
            to="/auth"
            className="hidden text-sm text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)] sm:inline-block"
          >
            Se connecter
          </Link>
          <Link
            to="/auth"
            className="cta-black"
            style={{ padding: '0.625rem 1.25rem', fontSize: '0.875rem' }}
          >
            Rejoindre
          </Link>
        </nav>
      </div>
    </header>
  )
}
