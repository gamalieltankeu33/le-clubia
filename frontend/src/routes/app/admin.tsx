import { createFileRoute, Outlet } from '@tanstack/react-router'
import { useRequireAuth } from '@/lib/use-require-auth'

export const Route = createFileRoute('/app/admin')({
  component: AdminLayout,
})

function AdminLayout() {
  const allowed = useRequireAuth({ requireOnboarded: true, requireAdmin: true })
  if (!allowed) return null
  return <Outlet />
}
