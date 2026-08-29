import { createFileRoute } from '@tanstack/react-router'
import { Search } from 'lucide-react'

export const Route = createFileRoute('/app/search')({
  component: SearchPage,
})

function SearchPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center justify-center space-y-4 py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--secondary)] text-[var(--muted-foreground)]">
          <Search className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
          Recherche globale
        </h1>
        <p className="max-w-md text-[var(--muted-foreground)]">
          La fonctionnalité de recherche globale sera bientôt disponible. Vous pourrez y rechercher des membres, des formations, des discussions et plus encore.
        </p>
      </div>
    </div>
  )
}
