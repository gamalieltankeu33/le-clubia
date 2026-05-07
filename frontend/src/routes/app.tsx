import { createFileRoute, Outlet } from '@tanstack/react-router'
import { AppShell } from '@/components/layout/app-shell'
import { useRequireAuth } from '@/lib/use-require-auth'

export const Route = createFileRoute('/app')({
  component: AppLayout,
})

function AppLayout() {
  const allowed = useRequireAuth({ requireOnboarded: true })
  if (!allowed) return null

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}
