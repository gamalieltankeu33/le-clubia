import { Link } from '@tanstack/react-router'
import { AlertTriangle, ArrowLeft } from 'lucide-react'
import { BrandLogo } from '@/components/brand-logo'

export function LegalLayout({
  title,
  lastUpdated,
  children,
}: {
  title: string
  lastUpdated?: string
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-white text-[#0A0A0A]">
      <header className="border-b border-[#E5E5E5] bg-white">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between gap-3 px-5 sm:px-6">
          <BrandLogo size="sm" variant="primary" />
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-[#737373] transition-colors hover:text-[#0A0A0A]"
            aria-label="Retour à l'accueil"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Retour à l'accueil</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-12 sm:px-6 sm:py-16 lg:py-20">
        {/* Bandeau d'alerte juridique — pages en cours de validation */}
        <div className="mb-8 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p>
            Cette page est en cours de validation juridique. Pour toute
            question, écrivez-nous à{' '}
            <a
              href="mailto:betterzapp@gmail.com"
              className="font-medium underline underline-offset-2 hover:text-amber-700"
            >
              betterzapp@gmail.com
            </a>
            .
          </p>
        </div>

        <h1 className="font-display text-3xl font-bold tracking-tight text-[#0A0A0A] sm:text-4xl lg:text-5xl">
          {title}
        </h1>
        {lastUpdated && (
          <p className="mt-3 text-sm text-[#737373]">
            Dernière mise à jour&nbsp;: {lastUpdated}
          </p>
        )}
        <div className="prose-legal mt-10 space-y-6 text-[#0A0A0A]/85 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-[#0A0A0A] [&_h2]:mt-12 [&_h2]:mb-3 [&_h3]:font-display [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-[#0A0A0A] [&_h3]:mt-6 [&_h3]:mb-2 [&_p]:leading-relaxed [&_p]:text-[#0A0A0A]/80 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_ul]:text-[#0A0A0A]/80 [&_a]:text-[#1E40AF] [&_a]:underline [&_a]:underline-offset-2">
          {children}
        </div>

        {/* Navigation inter-pages légales */}
        <nav className="mt-16 flex flex-wrap gap-x-6 gap-y-2 border-t border-[#E5E5E5] pt-8 text-sm">
          <Link
            to="/cgu"
            className="text-[#737373] transition-colors hover:text-[#0A0A0A]"
          >
            Conditions d'utilisation
          </Link>
          <Link
            to="/confidentialite"
            className="text-[#737373] transition-colors hover:text-[#0A0A0A]"
          >
            Politique de confidentialité
          </Link>
          <Link
            to="/mentions-legales"
            className="text-[#737373] transition-colors hover:text-[#0A0A0A]"
          >
            Mentions légales
          </Link>
        </nav>
      </main>

      <footer className="border-t border-[#E5E5E5] bg-[#FAFAF9]">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-5 text-xs text-[#737373] sm:px-6">
          <span>© {new Date().getFullYear()} Le Club IA</span>
          <Link to="/" className="hover:text-[#0A0A0A]">
            Retour à l'accueil
          </Link>
        </div>
      </footer>
    </div>
  )
}
