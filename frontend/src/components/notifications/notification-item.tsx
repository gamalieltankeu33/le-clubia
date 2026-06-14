import { useNavigate } from '@tanstack/react-router'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale/fr'
import {
  AtSign,
  Bell,
  CalendarClock,
  CalendarDays,
  GraduationCap,
  Heart,
  Library,
  MessageCircle,
  Newspaper,
  Sparkles,
  Trash2,
  Video,
  type LucideIcon,
} from 'lucide-react'
import { AvatarDisplay } from '@/components/avatar-display'
import {
  useNotificationsStore,
  type NotificationActor,
} from '@/stores/notifications-store'
import type { Notification, NotificationType } from '@/lib/database.types'
import { cn } from '@/lib/utils'

interface TypeMeta {
  icon: LucideIcon
  /** Couleur tailwind arbitraire — fond et texte. */
  iconBg: string
  iconText: string
}

// Fallback générique pour les types DB inconnus (ex : un type ajouté
// par une nouvelle migration côté backend mais pas encore poussé côté
// frontend, ou une ancienne notif d'un type retiré). On NE crash JAMAIS.
const DEFAULT_TYPE_META: TypeMeta = {
  icon: Bell,
  iconBg: 'bg-[var(--secondary)]',
  iconText: 'text-[var(--foreground)]',
}

// Doit couvrir TOUS les types autorisés par la CHECK constraint cumulée
// des migrations 0011 + 0017 + 0019. Si un type est absent ici mais
// présent en DB, le composant retombe sur DEFAULT_TYPE_META — visible
// mais pas crashé.
const TYPE_META: Record<NotificationType, TypeMeta> = {
  // ---- Communauté (0011) ----
  new_post: {
    icon: Sparkles,
    iconBg: 'bg-blue-500/15',
    iconText: 'text-blue-600',
  },
  new_resource: {
    icon: Library,
    iconBg: 'bg-[var(--bleu-ciel)]/15',
    iconText: 'text-[var(--bleu-ciel-deep)]',
  },
  new_formation: {
    icon: GraduationCap,
    iconBg: 'bg-purple-500/15',
    iconText: 'text-purple-600',
  },
  new_article: {
    icon: Newspaper,
    iconBg: 'bg-[var(--primary)]/10',
    iconText: 'text-[var(--primary)]',
  },
  comment_on_post: {
    icon: MessageCircle,
    iconBg: 'bg-pink-500/15',
    iconText: 'text-pink-600',
  },
  like_on_post: {
    icon: Heart,
    iconBg: 'bg-pink-500/15',
    iconText: 'text-pink-600',
  },
  reply_to_comment: {
    icon: MessageCircle,
    iconBg: 'bg-pink-500/15',
    iconText: 'text-pink-600',
  },
  mention: {
    icon: AtSign,
    iconBg: 'bg-blue-500/15',
    iconText: 'text-blue-600',
  },
  // ---- Récap hebdo + breaking-news (0017 + 0022) ----
  // Note : les breaking-news sont stockés sous le même type sémantique
  // 'weekly_recap' en table notifications (cf. migration 0022, le trigger
  // notify_on_weekly_recap insère le même type pour les 2 catégories).
  weekly_recap: {
    icon: Newspaper,
    iconBg: 'bg-amber-500/15',
    iconText: 'text-amber-700',
  },
  // ---- Events (0017) ----
  event_announcement: {
    icon: CalendarDays,
    iconBg: 'bg-[var(--primary)]/10',
    iconText: 'text-[var(--primary)]',
  },
  event_reminder_1day: {
    icon: CalendarClock,
    iconBg: 'bg-amber-500/15',
    iconText: 'text-amber-700',
  },
  event_reminder_today: {
    icon: Video,
    iconBg: 'bg-red-500/15',
    iconText: 'text-red-600',
  },
}

export function NotificationItem({
  notification,
  actor,
  onClose,
}: {
  notification: Notification
  actor?: NotificationActor
  onClose: () => void
}) {
  const navigate = useNavigate()
  const markAsRead = useNotificationsStore((s) => s.markAsRead)
  const deleteNotification = useNotificationsStore((s) => s.deleteNotification)

  // Lookup safe : si la DB renvoie un type qu'on n'a pas encore mappé
  // (ex : nouvelle migration backend pas encore propagée côté frontend),
  // on retombe sur DEFAULT_TYPE_META plutôt que de crasher.
  const meta =
    (TYPE_META as Record<string, TypeMeta>)[notification.type] ??
    DEFAULT_TYPE_META
  const Icon = meta.icon

  function handleClick() {
    void markAsRead(notification.id)
    if (notification.link_url) {
      onClose()
      // Navigation programmatique. On utilise un cast `as never` car l'URL
      // est dynamique (issue de la DB), pas dans l'union des routes.
      void navigate({ to: notification.link_url as never })
    }
  }

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    void deleteNotification(notification.id)
  }

  const timeAgo = formatDistanceToNow(new Date(notification.created_at), {
    addSuffix: true,
    locale: fr,
  })

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'group relative flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--secondary)]',
        !notification.is_read && 'bg-[var(--primary)]/5',
      )}
    >
      {/* Pastille "non lu" */}
      {!notification.is_read && (
        <span
          aria-hidden="true"
          className="absolute left-1.5 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-[var(--primary)]"
        />
      )}

      {/* Avatar de l'actor si présent, sinon icône type-spécifique */}
      {actor ? (
        <AvatarDisplay
          avatarUrl={actor.avatar_url}
          firstName={actor.first_name}
          lastName={actor.last_name}
          email={null}
          isVerified={false}
          size="md"
        />
      ) : (
        <span
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
            meta.iconBg,
            meta.iconText,
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
      )}

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-tight text-[var(--foreground)]">
          {notification.title}
        </p>
        <p className="mt-0.5 line-clamp-2 text-xs text-[var(--muted-foreground)]">
          {notification.message}
        </p>
        <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">
          {timeAgo}
        </p>
      </div>

      <button
        type="button"
        onClick={handleDelete}
        aria-label="Supprimer"
        className="hidden h-7 w-7 shrink-0 items-center justify-center rounded-md text-[var(--muted-foreground)] transition-colors hover:bg-[var(--background)] hover:text-[var(--foreground)] group-hover:flex"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </button>
  )
}
