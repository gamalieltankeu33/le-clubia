import { createFileRoute, Outlet } from '@tanstack/react-router'
import { AppShell } from '@/components/layout/app-shell'
import { useRequireAuth } from '@/lib/use-require-auth'
import { LevelUpListener } from '@/components/gamification/level-up-listener'

export const Route = createFileRoute('/app')({
  component: AppLayout,
})

function AppLayout() {
  // requireMember:true verrouille toute la zone /app/* derrière un
  // abonnement actif (Chariow). Les admins et le retour de paiement
  // (?payment=success) sont gérés en bypass dans useRequireAuth.
  // PaymentSuccessHandler est désormais monté à la racine
  // (__root.tsx) pour survivre aux redirections.
  const allowed = useRequireAuth({ requireOnboarded: true, requireMember: true })
  if (!allowed) return null

  return (
    <AppShell>
      <Outlet />
      <LevelUpListener />
    </AppShell>
  )
}
