import { createFileRoute } from '@tanstack/react-router'
import { LandingHeader } from '@/components/landing/landing-header'
import { Hero } from '@/components/landing/hero'
import { NextEventBanner } from '@/components/landing/next-event-banner'
import { ToolsMarquee } from '@/components/landing/tools-marquee'
import { FourPillars } from '@/components/landing/four-pillars'
import { CoachSection } from '@/components/landing/coach-section'
import { BeyondClub } from '@/components/landing/beyond-club'
import { NewsAgentSection } from '@/components/landing/news-agent-section'
import { Personas } from '@/components/landing/personas'
import { FeaturedMembers } from '@/components/landing/featured-members'
import { PricingCard } from '@/components/landing/pricing-card'
import { Testimonials } from '@/components/landing/testimonials'
import { FAQ } from '@/components/landing/faq'
import { FinalCTA } from '@/components/landing/final-cta'
import { LandingFooter } from '@/components/landing/landing-footer'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

function LandingPage() {
  return (
    <div className="relative min-h-screen scroll-smooth bg-white text-[#0A0A0A]">
      <LandingHeader />
      <main>
        <Hero />
        <NextEventBanner />
        <ToolsMarquee />
        <FourPillars />
        <CoachSection />
        <BeyondClub />
        <NewsAgentSection />
        <Personas />
        <FeaturedMembers />
        <PricingCard />
        <Testimonials />
        <FAQ />
        <FinalCTA />
      </main>
      <LandingFooter />
    </div>
  )
}
