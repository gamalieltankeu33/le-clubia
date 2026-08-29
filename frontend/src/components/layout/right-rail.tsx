import { Link, useLocation } from '@tanstack/react-router'
import { Calendar, Users, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function RightRail() {
  const { pathname } = useLocation()
  
  // Dans le futur, on pourrait fetch les events ou membres en ligne ici.
  // Pour l'instant on met la structure UI demandée dans le master prompt.

  const isCommunity = pathname.startsWith('/app/communaute') || pathname === '/app'

  if (!isCommunity) {
    return null // Masquer sur les autres pages pour l'instant
  }

  return (
    <div className="flex h-full flex-col gap-8 overflow-y-auto py-6 px-4">
      {/* Block Événement */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-[var(--muted-foreground)]" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
            Prochain Événement
          </h3>
        </div>
        
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm transition-colors hover:border-[var(--primary)]">
          <h4 className="font-medium text-[var(--foreground)] line-clamp-2">
            Coaching Live — Créer & vendre ses produits digitaux
          </h4>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">30 août · 20:00</p>
          
          <div className="mt-3 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
            </span>
            <span className="text-xs font-medium text-red-500">En direct</span>
          </div>

          <Button size="sm" className="mt-4 w-full bg-[var(--primary)] text-white hover:bg-[var(--primary-light)]">
            Rejoindre maintenant
          </Button>
        </div>
      </section>

      {/* Block Membres en ligne */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-[var(--muted-foreground)]" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
              En ligne (12)
            </h3>
          </div>
          <Link to="/app/membres" className="text-xs text-[var(--primary)] hover:underline">
            Voir tous
          </Link>
        </div>
        
        <div className="flex flex-col gap-3">
          {/* Faux membres pour le design. Plus tard on les chargera depuis Supabase Presence */}
          {['Sarah N.', 'Benjamin T.', 'Yacouba M.'].map((name, i) => (
            <div key={i} className="flex items-center gap-3 cursor-pointer group">
              <div className="relative">
                <div className="h-8 w-8 rounded-full bg-[var(--secondary)] border border-[var(--border)] group-hover:border-[var(--primary)] transition-colors" />
                <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[var(--background)] bg-green-500" />
              </div>
              <span className="text-sm font-medium text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">
                {name}
              </span>
            </div>
          ))}
          <div className="mt-1 text-xs text-[var(--muted-foreground)]">
            + 9 autres membres
          </div>
        </div>
      </section>

      {/* Block Discussions */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-[var(--muted-foreground)]" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
            Discussions actives
          </h3>
        </div>
        
        <div className="flex flex-col gap-4">
          <div className="group cursor-pointer">
            <h4 className="text-sm font-medium text-[var(--foreground)] group-hover:text-[var(--primary)] line-clamp-2">
              Quel outil utilisez-vous pour faire des montages automatiques ?
            </h4>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">18 réponses</p>
          </div>
          <div className="group cursor-pointer">
            <h4 className="text-sm font-medium text-[var(--foreground)] group-hover:text-[var(--primary)] line-clamp-2">
              J'ai lancé mon premier produit SaaS ce matin !
            </h4>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">12 réponses</p>
          </div>
        </div>
      </section>
    </div>
  )
}
