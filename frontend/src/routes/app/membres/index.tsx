import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Search, Shield, Filter } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { AvatarDisplay } from '@/components/avatar-display'
import { VerifiedBadge } from '@/components/verified-badge'
import { fetchDirectoryMembers } from '@/lib/directory'
import { useDebounce } from '@/hooks/use-debounce'

export const Route = createFileRoute('/app/membres/')({
  component: MembersDirectoryPage,
})

function MembersDirectoryPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string | null>(null)
  
  const debouncedSearch = useDebounce(searchQuery, 300)

  const { data: members, isLoading, isError } = useQuery({
    queryKey: ['directory-members', debouncedSearch, roleFilter],
    queryFn: () => fetchDirectoryMembers(debouncedSearch, roleFilter, 50, 0),
    staleTime: 60_000,
  })

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header Annuaire */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-[var(--foreground)]">
            Annuaire des membres
          </h1>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Explore la communauté, découvre de nouveaux profils et échange avec les autres membres.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
            <input
              type="text"
              placeholder="Rechercher un membre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-full sm:w-64 rounded-full border border-[var(--border)] bg-[var(--card)] pl-10 pr-4 text-sm focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] transition-all"
            />
          </div>
          <Button 
            variant={roleFilter === 'admin' ? 'default' : 'outline'} 
            size="sm" 
            className="rounded-full shrink-0"
            onClick={() => setRoleFilter(roleFilter === 'admin' ? null : 'admin')}
          >
            <Shield className="mr-2 h-4 w-4" />
            Admins
          </Button>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-64 rounded-2xl bg-[var(--card)] animate-pulse border border-[var(--border)]" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-12 text-center">
          <p className="text-sm text-[var(--muted-foreground)]">Impossible de charger l'annuaire.</p>
        </div>
      ) : members?.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-12 text-center">
          <p className="text-sm text-[var(--muted-foreground)]">Aucun membre ne correspond à cette recherche.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {members?.map((member, index) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                to="/app/membres/$userId"
                params={{ userId: member.id }}
                className="group flex flex-col items-center rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 text-center shadow-sm transition-all hover:border-[var(--primary)] hover:shadow-md"
              >
                <div className="relative mb-4">
                  <AvatarDisplay
                    avatarUrl={member.avatar_url}
                    firstName={member.first_name}
                    lastName={member.last_name}
                    isVerified={member.is_verified}
                    size="xl"
                  />
                  {member.role === 'admin' && (
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full border-2 border-[var(--card)] bg-[var(--primary)] px-2 py-0.5 text-[10px] font-bold uppercase text-white shadow-sm">
                      Admin
                    </div>
                  )}
                </div>
                
                <h3 className="flex items-center gap-1 font-display text-lg font-semibold tracking-tight text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">
                  {member.full_name || 'Sans nom'}
                  {member.is_verified && <VerifiedBadge className="h-4 w-4" />}
                </h3>
                
                <p className="mt-2 line-clamp-2 text-sm text-[var(--muted-foreground)] min-h-[40px]">
                  {member.bio || 'Aucune biographie.'}
                </p>
                
                <div className="mt-4 w-full border-t border-[var(--border)] pt-4">
                  <span className="text-xs font-medium text-[var(--primary)]">Voir le profil &rarr;</span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
