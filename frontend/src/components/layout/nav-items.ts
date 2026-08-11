import {
  Calendar,
  GraduationCap,
  LayoutDashboard,
  Library,
  MessageSquare,
  MessagesSquare,
  Newspaper,
  Target,
  Trophy,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/app/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { to: '/app/formations', label: 'Formations', icon: GraduationCap },
  { to: '/app/challenges', label: 'Challenge', icon: Target },
  { to: '/app/communaute', label: 'Communauté', icon: MessagesSquare },
  { to: '/app/messages', label: 'Messagerie', icon: MessageSquare },
  { to: '/app/actualites', label: 'Actualités', icon: Newspaper },
  { to: '/app/ressources', label: 'Ressources', icon: Library },
  { to: '/app/classement', label: 'Classement', icon: Trophy },
  { to: '/app/events', label: 'Événements', icon: Calendar },
]

