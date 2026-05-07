import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { CoachConversation } from '@/lib/database.types'

export interface CoachMessage {
  role: 'user' | 'assistant'
  content: string
  /** True tant que le stream du coach n'est pas terminé. UI affiche un curseur. */
  isStreaming?: boolean
}

const DAILY_LIMIT = 30
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const COACH_CHAT_URL = `${SUPABASE_URL}/functions/v1/coach-chat`

type View = 'chat' | 'history'

interface CoachState {
  isOpen: boolean
  view: View
  conversations: CoachConversation[]
  currentConversationId: string | null
  messages: CoachMessage[]
  isSending: boolean
  isLoadingHistory: boolean
  isLoadingConversation: boolean
  quotaUsed: number
  quotaLimit: number

  openPanel: () => void
  closePanel: () => void
  showHistory: () => void
  showChat: () => void
  startNewConversation: () => void
  loadConversation: (id: string) => Promise<void>
  sendMessage: (content: string) => Promise<{ error: string | null }>
  refreshHistory: () => Promise<void>
  refreshQuota: () => Promise<void>
  /** Reset complet (à appeler au logout) — empêche que les conversations
   *  Coach IA d'un user A restent visibles à un user B qui se reconnecte
   *  sur le même navigateur. Symétrique avec notifications-store.reset(). */
  reset: () => void
}

export const useCoachStore = create<CoachState>((set, get) => ({
  isOpen: false,
  view: 'chat',
  conversations: [],
  currentConversationId: null,
  messages: [],
  isSending: false,
  isLoadingHistory: false,
  isLoadingConversation: false,
  quotaUsed: 0,
  quotaLimit: DAILY_LIMIT,

  openPanel: () => {
    set({ isOpen: true })
    void get().refreshHistory()
    void get().refreshQuota()
  },

  closePanel: () => set({ isOpen: false }),

  showHistory: () => {
    set({ view: 'history' })
    void get().refreshHistory()
  },

  showChat: () => set({ view: 'chat' }),

  startNewConversation: () =>
    set({
      currentConversationId: null,
      messages: [],
      view: 'chat',
    }),

  loadConversation: async (id) => {
    set({ isLoadingConversation: true, view: 'chat' })
    const { data, error } = await supabase
      .from('coach_messages')
      .select('role, content')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true })
    if (error) {
      set({ isLoadingConversation: false })
      return
    }
    set({
      currentConversationId: id,
      messages: (data ?? []).map((d) => ({
        role: d.role,
        content: d.content,
      })) as CoachMessage[],
      isLoadingConversation: false,
    })
  },

  sendMessage: async (content) => {
    const trimmed = content.trim()
    if (!trimmed || get().isSending) return { error: null }

    const previousMessages = get().messages
    const newUser: CoachMessage = { role: 'user', content: trimmed }
    const placeholderAssistant: CoachMessage = {
      role: 'assistant',
      content: '',
      isStreaming: true,
    }

    // Optimistic : ajoute le message user + une bulle assistant vide en streaming
    set({
      messages: [...previousMessages, newUser, placeholderAssistant],
      isSending: true,
    })

    // Récupère le JWT courant (la session est déjà persistée par supabase-js)
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const token = session?.access_token
    if (!token) {
      set({ messages: previousMessages, isSending: false })
      return { error: 'Session expirée. Reconnecte-toi.' }
    }

    let response: Response
    try {
      response = await fetch(COACH_CHAT_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversation_id: get().currentConversationId,
          messages: [...previousMessages, newUser].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      })
    } catch (err) {
      console.error('[coach-store] fetch failed:', err)
      set({ messages: previousMessages, isSending: false })
      return { error: 'Le coach ne répond pas. Vérifie ta connexion.' }
    }

    // Erreur synchrone (auth/quota/etc.) : la fonction renvoie un JSON, pas un stream
    const ct = response.headers.get('content-type') ?? ''
    if (!ct.includes('text/event-stream') || !response.body) {
      set({ messages: previousMessages, isSending: false })
      let errMsg = 'Le coach ne répond pas. Réessaie dans un instant.'
      try {
        const json = await response.json()
        if (json?.error) errMsg = json.error
      } catch {
        /* noop */
      }
      return { error: errMsg }
    }

    // Lecture du stream SSE
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let conversationId: string | null = get().currentConversationId
    let quotaInfo: { used: number; limit: number } | null = null
    let errorMsg: string | null = null

    function appendChunk(text: string) {
      const current = get().messages
      const last = current[current.length - 1]
      if (last?.role === 'assistant' && last.isStreaming) {
        const next = current.slice(0, -1)
        next.push({ ...last, content: last.content + text })
        set({ messages: next })
      }
    }

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const events = buffer.split('\n\n')
        buffer = events.pop() ?? ''
        for (const ev of events) {
          const line = ev.trim()
          if (!line.startsWith('data:')) continue
          const data = line.slice(5).trim()
          if (!data) continue
          try {
            const parsed = JSON.parse(data) as
              | { type: 'chunk'; text: string }
              | { type: 'done'; conversation_id: string; quota: { used: number; limit: number } }
              | { type: 'error'; message: string }
            if (parsed.type === 'chunk') {
              appendChunk(parsed.text)
            } else if (parsed.type === 'done') {
              conversationId = parsed.conversation_id ?? conversationId
              quotaInfo = parsed.quota ?? null
            } else if (parsed.type === 'error') {
              errorMsg = parsed.message ?? 'Erreur du coach.'
            }
          } catch {
            /* ignore parse errors on partial chunks */
          }
        }
      }
    } catch (err) {
      console.error('[coach-store] stream read error:', err)
      errorMsg = errorMsg ?? 'Stream interrompu. Réessaie.'
    }

    // Finalisation
    const current = get().messages
    const last = current[current.length - 1]

    if (errorMsg) {
      // Si on a du contenu partiel : on le garde, on lève juste le flag streaming
      if (last?.role === 'assistant' && last.isStreaming && last.content) {
        const next = current.slice(0, -1)
        next.push({ ...last, isStreaming: false })
        set({ messages: next, isSending: false })
      } else {
        // Pas de contenu partiel : on retire la bulle vide
        set({
          messages: previousMessages.concat([newUser]),
          isSending: false,
        })
      }
      return { error: errorMsg }
    }

    // Stream terminé proprement
    if (last?.role === 'assistant' && last.isStreaming) {
      const next = current.slice(0, -1)
      next.push({ ...last, isStreaming: false })
      set({ messages: next })
    }
    set({
      currentConversationId: conversationId ?? get().currentConversationId,
      isSending: false,
      quotaUsed: quotaInfo?.used ?? get().quotaUsed + 1,
      quotaLimit: quotaInfo?.limit ?? DAILY_LIMIT,
    })

    void get().refreshHistory()
    return { error: null }
  },

  refreshHistory: async () => {
    set({ isLoadingHistory: true })
    const { data, error } = await supabase
      .from('coach_conversations')
      .select('id, user_id, title, created_at, updated_at')
      .order('updated_at', { ascending: false })
      .limit(50)
    if (error) {
      set({ isLoadingHistory: false })
      return
    }
    set({
      conversations: (data ?? []) as CoachConversation[],
      isLoadingHistory: false,
    })
  },

  refreshQuota: async () => {
    const todayStart = new Date()
    todayStart.setUTCHours(0, 0, 0, 0)
    const { count } = await supabase
      .from('coach_messages')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'user')
      .gte('created_at', todayStart.toISOString())
    set({ quotaUsed: count ?? 0, quotaLimit: DAILY_LIMIT })
  },

  reset: () => {
    set({
      isOpen: false,
      view: 'chat',
      conversations: [],
      currentConversationId: null,
      messages: [],
      isSending: false,
      isLoadingHistory: false,
      isLoadingConversation: false,
      quotaUsed: 0,
      quotaLimit: DAILY_LIMIT,
    })
  },
}))
