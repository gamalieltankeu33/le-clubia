import { create } from 'zustand'
import { toast } from 'sonner'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Notification } from '@/lib/database.types'

const PAGE_SIZE = 50

export interface NotificationActor {
  id: string
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
}

interface NotificationsState {
  notifications: Notification[]
  /** Map actor_id → infos profil. Permet d'afficher avatar/nom dans la liste. */
  actorsById: Record<string, NotificationActor>
  unreadCount: number
  isLoading: boolean
  isPanelOpen: boolean
  /** Bumped à chaque arrivée realtime — utilisé par le bell pour animer. */
  arrivalTick: number

  togglePanel: () => void
  closePanel: () => void
  openPanel: () => void

  fetchNotifications: () => Promise<void>
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (id: string) => Promise<void>

  subscribeToRealtime: (userId: string) => void
  unsubscribeFromRealtime: () => void
  /** Reset complet (à appeler au logout). */
  reset: () => void
}

let channel: RealtimeChannel | null = null
let subscribedUserId: string | null = null

async function loadActors(
  ids: string[],
): Promise<Record<string, NotificationActor>> {
  const unique = [...new Set(ids.filter((x): x is string => Boolean(x)))]
  if (unique.length === 0) return {}
  // Passe par la RPC publique (sans email) plutôt que la table profiles
  // directement, pour ne pas dépendre d'une RLS permissive.
  // @ts-expect-error - RPC custom non typée dans Database['public']['Functions']
  const { data, error } = await supabase.rpc('public_profiles_in', {
    p_ids: unique,
  })
  if (error || !data) return {}
  const map: Record<string, NotificationActor> = {}
  for (const row of data as NotificationActor[]) map[row.id] = row
  return map
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications: [],
  actorsById: {},
  unreadCount: 0,
  isLoading: false,
  isPanelOpen: false,
  arrivalTick: 0,

  togglePanel: () => {
    const next = !get().isPanelOpen
    set({ isPanelOpen: next })
    if (next && get().notifications.length === 0) {
      void get().fetchNotifications()
    }
  },
  closePanel: () => set({ isPanelOpen: false }),
  openPanel: () => {
    set({ isPanelOpen: true })
    if (get().notifications.length === 0) {
      void get().fetchNotifications()
    }
  },

  fetchNotifications: async () => {
    set({ isLoading: true })
    const { data, error } = await supabase
      .from('notifications')
      .select(
        'id, user_id, type, title, message, link_url, related_id, actor_id, is_read, created_at',
      )
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE)
      .returns<Notification[]>()

    if (error) {
      console.error('fetchNotifications failed:', error)
      set({ isLoading: false })
      return
    }
    const list = data ?? []
    const actorIds = list
      .map((n) => n.actor_id)
      .filter((x): x is string => Boolean(x))
    const actorsById = await loadActors(actorIds)
    set({
      notifications: list,
      actorsById,
      unreadCount: list.filter((n) => !n.is_read).length,
      isLoading: false,
    })
  },

  markAsRead: async (id) => {
    const list = get().notifications
    const target = list.find((n) => n.id === id)
    if (!target || target.is_read) return
    set({
      notifications: list.map((n) =>
        n.id === id ? { ...n, is_read: true } : n,
      ),
      unreadCount: Math.max(0, get().unreadCount - 1),
    })
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
    if (error) {
      console.error('markAsRead failed:', error)
      void get().fetchNotifications()
    }
  },

  markAllAsRead: async () => {
    const list = get().notifications
    if (!list.some((n) => !n.is_read)) return
    set({
      notifications: list.map((n) => ({ ...n, is_read: true })),
      unreadCount: 0,
    })
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('is_read', false)
    if (error) {
      console.error('markAllAsRead failed:', error)
      void get().fetchNotifications()
    }
  },

  deleteNotification: async (id) => {
    const list = get().notifications
    const target = list.find((n) => n.id === id)
    if (!target) return
    set({
      notifications: list.filter((n) => n.id !== id),
      unreadCount: target.is_read
        ? get().unreadCount
        : Math.max(0, get().unreadCount - 1),
    })
    const { error } = await supabase.from('notifications').delete().eq('id', id)
    if (error) {
      console.error('deleteNotification failed:', error)
      void get().fetchNotifications()
    }
  },

  subscribeToRealtime: (userId) => {
    if (channel && subscribedUserId === userId) return
    if (channel) {
      void supabase.removeChannel(channel)
      channel = null
      subscribedUserId = null
    }

    channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const notif = payload.new as Notification
          set((state) => ({
            notifications: [notif, ...state.notifications].slice(0, PAGE_SIZE),
            unreadCount: state.unreadCount + (notif.is_read ? 0 : 1),
            arrivalTick: state.arrivalTick + 1,
          }))

          // Enrichit l'actor en arrière-plan si on ne l'a pas déjà
          if (notif.actor_id && !get().actorsById[notif.actor_id]) {
            void loadActors([notif.actor_id]).then((map) => {
              if (Object.keys(map).length === 0) return
              set((state) => ({
                actorsById: { ...state.actorsById, ...map },
              }))
            })
          }

          // Toast — clic ouvre la notif
          toast(notif.title, {
            description: notif.message,
            action: notif.link_url
              ? {
                  label: 'Voir',
                  onClick: () => {
                    void get().markAsRead(notif.id)
                    if (notif.link_url) {
                      window.location.assign(notif.link_url)
                    }
                  },
                }
              : undefined,
          })
        },
      )
      .subscribe()

    subscribedUserId = userId
  },

  unsubscribeFromRealtime: () => {
    if (!channel) return
    void supabase.removeChannel(channel)
    channel = null
    subscribedUserId = null
  },

  reset: () => {
    if (channel) {
      void supabase.removeChannel(channel)
      channel = null
      subscribedUserId = null
    }
    set({
      notifications: [],
      actorsById: {},
      unreadCount: 0,
      isLoading: false,
      isPanelOpen: false,
      arrivalTick: 0,
    })
  },
}))
