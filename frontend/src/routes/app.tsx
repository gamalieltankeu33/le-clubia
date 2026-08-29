import { useEffect } from 'react'
import { createFileRoute, Outlet, useLocation } from '@tanstack/react-router'
import { AppShell } from '@/components/layout/app-shell'
import { useRequireAuth } from '@/lib/use-require-auth'
import { LevelUpListener } from '@/components/gamification/level-up-listener'

export const Route = createFileRoute('/app')({
  component: AppLayout,
})

function AppLayout() {
  const { pathname } = useLocation()

  // Déblocage automatique des clics en cas de résidu de Dropdown/Modal Radix UI lors de la navigation
  useEffect(() => {
    document.body.style.pointerEvents = ''
  }, [pathname])

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
