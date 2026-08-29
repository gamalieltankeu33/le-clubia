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

export interface NavGroup {
  title: string
  items: NavItem[]
}

export const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Vue d\'ensemble',
    items: [
      { to: '/app/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    ]
  },
  {
    title: 'Apprendre',
    items: [
      { to: '/app/formations', label: 'Formations', icon: GraduationCap },
      { to: '/app/ressources', label: 'Ressources', icon: Library },
      { to: '/app/actualites', label: 'Actualités', icon: Newspaper },
    ]
  },
  {
    title: 'Agir',
    items: [
      { to: '/app/challenges', label: 'Challenge', icon: Target },
      { to: '/app/events', label: 'Événements', icon: Calendar },
    ]
  },
  {
    title: 'Interagir',
    items: [
      { to: '/app/communaute', label: 'Communauté', icon: MessagesSquare },
      { to: '/app/messages', label: 'Messagerie', icon: MessageSquare },
      { to: '/app/classement', label: 'Classement', icon: Trophy },
    ]
  }
]
