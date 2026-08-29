import { Link, useLocation } from '@tanstack/react-router'
import { Home, Sparkles, Flame, MessageCircle, HelpCircle, Trophy, Briefcase, Bot, Video, Settings2, PlayCircle, BookOpen, CheckCircle, Bookmark, CalendarDays, Mic2 } from 'lucide-react'

export function ContextSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { pathname } = useLocation()
  
  // Déterminer le contexte actif (Communaute, Formations, Challenges, Événements, etc.)
  const isCommunity = pathname.startsWith('/app/communaute') || pathname === '/app'
  const isLearning = pathname.startsWith('/app/formations') || pathname.startsWith('/app/ressources')
  const isChallenge = pathname.startsWith('/app/challenges')
  const isEvents = pathname.startsWith('/app/events')
  
  if (!isCommunity && !isLearning && !isChallenge && !isEvents) return null

  return (
    <div className="flex h-full flex-col overflow-y-auto py-6 px-4">
      {isCommunity && <CommunityMenu onClick={onNavigate} />}
      {isLearning && <LearningMenu onClick={onNavigate} />}
      {isChallenge && <ChallengeMenu onClick={onNavigate} />}
      {isEvents && <EventsMenu onClick={onNavigate} />}
    </div>
  )
}

function NavItem({ to, icon: Icon, label, onClick }: { to: string, icon: any, label: string, onClick?: () => void }) {
  const { pathname } = useLocation()
  // Active if exact match or if there's a search param matching (simplified for now)
  const isActive = pathname === to
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        isActive 
          ? 'bg-[var(--primary)]/10 text-[var(--primary)]' 
          : 'text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]'
      }`}
    >
      <Icon className={`h-4 w-4 ${isActive ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)] group-hover:text-[var(--foreground)]'}`} />
      {label}
    </Link>
  )
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-2 mt-6 px-3 text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
      {children}
    </h3>
  )
}

function CommunityMenu({ onClick }: { onClick?: () => void }) {
  return (
    <nav className="flex flex-col gap-1">
      <SectionHeading>Communauté</SectionHeading>
      <NavItem to="/app/communaute" icon={MessageCircle} label="Discussions" onClick={onClick} />
      <NavItem to="/app/communaute?category=questions" icon={HelpCircle} label="Questions & entraide" onClick={onClick} />
      <NavItem to="/app/communaute?category=victoires" icon={Trophy} label="Victoires" onClick={onClick} />

      <SectionHeading>Mes contenus</SectionHeading>
      <NavItem to="/app/communaute?filter=saved" icon={Bookmark} label="Enregistrés" onClick={onClick} />
      <NavItem to="/app/communaute?filter=mine" icon={MessageCircle} label="Mes publications" onClick={onClick} />
    </nav>
  )
}

function LearningMenu({ onClick }: { onClick?: () => void }) {
  return (
    <nav className="flex flex-col gap-1">
      <SectionHeading>Formations</SectionHeading>
      <NavItem to="/app/formations" icon={BookOpen} label="Catalogue" onClick={onClick} />
      <NavItem to="/app/formations?category=Replays & Masterclasses" icon={Video} label="Replays & Masterclasses" onClick={onClick} />
      <NavItem to="/app/formations?filter=progress" icon={PlayCircle} label="En cours" onClick={onClick} />
      <NavItem to="/app/formations?filter=done" icon={CheckCircle} label="Terminées" onClick={onClick} />
    </nav>
  )
}

function ChallengeMenu({ onClick }: { onClick?: () => void }) {
  return (
    <nav className="flex flex-col gap-1">
      <NavItem to="/app/challenges" icon={Flame} label="En cours" onClick={onClick} />
      <NavItem to="/app/challenges?filter=done" icon={CheckCircle} label="Terminés" onClick={onClick} />
    </nav>
  )
}

function EventsMenu({ onClick }: { onClick?: () => void }) {
  return (
    <nav className="flex flex-col gap-1">
      <SectionHeading>Événements & Replays</SectionHeading>
      <NavItem to="/app/events" icon={CalendarDays} label="À venir" onClick={onClick} />
      <NavItem to="/app/events?tab=replays" icon={Video} label="Replays & Masterclasses" onClick={onClick} />
      <NavItem to="/app/events?tab=coaching" icon={Mic2} label="Coaching Live" onClick={onClick} />
    </nav>
  )
}
