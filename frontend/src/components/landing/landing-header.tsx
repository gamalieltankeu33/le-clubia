import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { BrandLogo } from '@/components/brand-logo'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

export function LandingHeader() {
  const [scrolled, setScrolled] = useState(false)
  const [visible, setVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      const currentScrollY = window.scrollY
      setScrolled(currentScrollY > 24)
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setVisible(false)
      } else {
        setVisible(true)
      }
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [lastScrollY])

  return (
    <AnimatePresence>
      <motion.header
        initial={{ y: 0 }}
        animate={{ y: visible ? 0 : -100 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          'fixed inset-x-0 top-0 z-50 transition-all duration-500',
          scrolled
            ? 'border-b border-white/10 bg-white/70 backdrop-blur-xl'
            : 'border-b border-transparent bg-white/0',
        )}
      >
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <BrandLogo size="md" variant="primary" className="transition-transform hover:scale-[1.02]" />

          <nav className="flex items-center gap-6 sm:gap-8">
            <a
              href="#formations"
              className="hidden text-sm font-medium text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)] sm:inline-block"
            >
              Formations
            </a>
            <Link
              to="/auth"
              className="hidden text-sm font-medium text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)] sm:inline-block"
            >
              Se connecter
            </Link>
            <Link
              to="/auth"
              className="cta-black group relative overflow-hidden px-6 py-2.5 text-sm"
            >
              <span className="relative z-10 flex items-center gap-2">
                Rejoindre Le Club
                <div className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
              </span>
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            </Link>
          </nav>
        </div>
      </motion.header>
    </AnimatePresence>
  )
}
