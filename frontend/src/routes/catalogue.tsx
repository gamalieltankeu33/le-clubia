import { createFileRoute, Outlet } from '@tanstack/react-router'
import { LandingHeader } from '@/components/landing/landing-header'
import { LandingFooter } from '@/components/landing/landing-footer'

export const Route = createFileRoute('/catalogue')({
  component: CatalogueLayout,
})

function CatalogueLayout() {
  return (
    <div className="min-h-screen bg-white text-[#0A0A0A]">
      <LandingHeader />
      <Outlet />
      <LandingFooter />
    </div>
  )
}
