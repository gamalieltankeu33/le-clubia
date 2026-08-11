import { useState, useEffect, useRef } from 'react'
import { createFileRoute, Link, useSearch } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale/fr'
import { 
  Send, 
  MessageSquare, 
  User, 
  Search, 
  ArrowLeft, 
  Sparkles, 
  CheckCheck,
  MessagesSquare
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'
import { AvatarDisplay } from '@/components/avatar-display'
import { VerifiedBadge } from '@/components/verified-badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { 
  fetchUserConversations, 
  fetchConversationMessages, 
  sendDirectMessage, 
  type DirectConversation, 
  type DirectMessage 
} from '@/lib/direct-messages'

export const Route = createFileRoute('/app/messages')({
  component: MessagesPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      conv: typeof search.conv === 'string' ? search.conv : undefined,
    }
  },
})

function MessagesPage() {
  const { conv: selectedConvIdFromUrl } = Route.useSearch()
  const currentUser = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()

  const [activeConvId, setActiveConvId] = useState<string | undefined>(selectedConvIdFromUrl)
  const [searchQuery, setSearchQuery] = useState('')
  const [inputMessage, setInputMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Update activeConvId if URL param changes
  useEffect(() => {
    if (selectedConvIdFromUrl) {
      setActiveConvId(selectedConvIdFromUrl)
    }
  }, [selectedConvIdFromUrl])

  // Fetch Conversations list (poll every 4s for fresh messages)
  const conversationsQuery = useQuery({
    queryKey: ['direct-conversations', currentUser?.id],
    queryFn: () => fetchUserConversations(currentUser?.id || ''),
    enabled: !!currentUser?.id,
    refetchInterval: 4000,
  })

  const conversations = conversationsQuery.data ?? []

  // Auto-select first conversation if none selected
  useEffect(() => {
    if (!activeConvId && conversations.length > 0) {
      setActiveConvId(conversations[0].id)
    }
  }, [conversations, activeConvId])

  const activeConv = conversations.find((c) => c.id === activeConvId)

  // Fetch Messages for active conversation (poll every 2.5s)
  const messagesQuery = useQuery({
    queryKey: ['direct-messages', activeConvId],
    queryFn: () => fetchConversationMessages(activeConvId || ''),
    enabled: !!activeConvId,
    refetchInterval: 2500,
  })

  const messages = messagesQuery.data ?? []

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, activeConvId])

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: async ({
      convId,
      senderId,
      receiverId,
      text,
    }: {
      convId: string
      senderId: string
      receiverId: string
      text: string
    }) => {
      return sendDirectMessage(convId, senderId, receiverId, text)
    },
    onSuccess: () => {
      setInputMessage('')
      queryClient.invalidateQueries({ queryKey: ['direct-messages', activeConvId] })
      queryClient.invalidateQueries({ queryKey: ['direct-conversations', currentUser?.id] })
    },
    onError: () => {
      toast.error('Erreur lors de l’envoi du message')
    },
  })

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!inputMessage.trim() || !activeConv || !currentUser) return

    sendMutation.mutate({
      convId: activeConv.id,
      senderId: currentUser.id,
      receiverId: activeConv.other_user.id,
      text: inputMessage,
    })
  }

  // Filter conversations
  const filteredConvs = conversations.filter((c) => {
    const name = `${c.other_user.first_name || ''} ${c.other_user.last_name || ''}`.toLowerCase()
    return name.includes(searchQuery.toLowerCase()) || c.last_message_text.toLowerCase().includes(searchQuery.toLowerCase())
  })

  if (!currentUser) {
    return (
      <div className="mx-auto max-w-xl px-6 py-20 text-center">
        <MessagesSquare className="mx-auto h-12 w-12 text-[var(--muted-foreground)] mb-4" />
        <h1 className="font-display text-2xl font-semibold">Messagerie Privée</h1>
        <p className="mt-2 text-[var(--muted-foreground)]">
          Veuillez vous connecter pour accéder à vos discussions privées.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-2 sm:px-6 py-6 lg:py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold md:text-3xl flex items-center gap-2.5">
            <MessagesSquare className="h-7 w-7 text-[var(--primary)]" />
            Messagerie Privée
          </h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Échange directement en privé avec les autres membres et le fondateur.
          </p>
        </div>
      </div>

      {/* Main Messenger Box */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-0 border border-[var(--border)] rounded-3xl bg-[var(--card)] shadow-lg overflow-hidden min-h-[580px] h-[calc(100vh-220px)] max-h-[720px]">
        {/* Left Column: Conversations List */}
        <div
          className={cn(
            'md:col-span-4 border-r border-[var(--border)] flex flex-col bg-[var(--background-pure)]',
            activeConvId && 'hidden md:flex', // Hide on mobile when conv is open
          )}
        >
          {/* Search Header */}
          <div className="p-4 border-b border-[var(--border)]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
              <input
                type="text"
                placeholder="Rechercher une discussion..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-[var(--border)] bg-[var(--secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
              />
            </div>
          </div>

          {/* Conversations Scrollable List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {conversationsQuery.isLoading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-16 animate-pulse rounded-2xl bg-[var(--secondary)]" />
                ))}
              </div>
            ) : filteredConvs.length === 0 ? (
              <div className="p-8 text-center text-sm text-[var(--muted-foreground)]">
                <p>Aucune discussion trouvée.</p>
                <p className="text-xs mt-1">
                  Visite le profil d'un membre pour lui envoyer un message !
                </p>
              </div>
            ) : (
              filteredConvs.map((conv) => {
                const isActive = conv.id === activeConvId
                const fullName = `${conv.other_user.first_name || 'Membre'} ${conv.other_user.last_name || ''}`.trim()

                return (
                  <button
                    key={conv.id}
                    onClick={() => setActiveConvId(conv.id)}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all',
                      isActive
                        ? 'bg-[var(--primary)] text-white shadow-md'
                        : 'hover:bg-[var(--secondary)] text-[var(--foreground)]',
                    )}
                  >
                    <AvatarDisplay
                      avatarUrl={conv.other_user.avatar_url}
                      firstName={conv.other_user.first_name}
                      lastName={conv.other_user.last_name}
                      isVerified={conv.other_user.is_verified}
                      size="md"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm truncate flex items-center gap-1">
                          {fullName}
                          {conv.other_user.is_verified && (
                            <VerifiedBadge className="h-3.5 w-3.5" />
                          )}
                        </span>
                        <span
                          className={cn(
                            'text-[10px]',
                            isActive ? 'text-white/70' : 'text-[var(--muted-foreground)]',
                          )}
                        >
                          {formatRelativeTime(conv.last_message_at)}
                        </span>
                      </div>
                      <p
                        className={cn(
                          'text-xs truncate mt-0.5',
                          isActive ? 'text-white/80' : 'text-[var(--muted-foreground)]',
                        )}
                      >
                        {conv.last_message_text}
                      </p>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Right Column: Chat Main Area */}
        <div
          className={cn(
            'md:col-span-8 flex flex-col bg-[var(--card)]',
            !activeConvId && 'hidden md:flex',
          )}
        >
          {activeConv ? (
            <>
              {/* Chat Header */}
              <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--background-pure)]">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveConvId(undefined)}
                    className="md:hidden p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>

                  <AvatarDisplay
                    avatarUrl={activeConv.other_user.avatar_url}
                    firstName={activeConv.other_user.first_name}
                    lastName={activeConv.other_user.last_name}
                    isVerified={activeConv.other_user.is_verified}
                    size="md"
                  />

                  <div>
                    <h2 className="font-bold text-sm sm:text-base flex items-center gap-1.5">
                      {activeConv.other_user.first_name} {activeConv.other_user.last_name}
                      {activeConv.other_user.is_verified && (
                        <VerifiedBadge className="h-4 w-4" />
                      )}
                    </h2>
                    <span className="text-xs text-[var(--muted-foreground)]">Discussion privée</span>
                  </div>
                </div>

                <Button asChild variant="outline" size="sm" className="rounded-xl text-xs">
                  <Link to="/app/membres/$userId" params={{ userId: activeConv.other_user.id }}>
                    <User className="h-3.5 w-3.5 mr-1" />
                    Voir profil
                  </Link>
                </Button>
              </div>

              {/* Chat Messages List */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/50">
                {messagesQuery.isLoading ? (
                  <div className="space-y-3">
                    <div className="h-10 w-2/3 animate-pulse rounded-2xl bg-gray-200" />
                    <div className="h-10 w-1/2 animate-pulse rounded-2xl bg-blue-100 ml-auto" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="py-12 text-center">
                    <Sparkles className="mx-auto h-8 w-8 text-[var(--or)] mb-2 animate-bounce" />
                    <p className="font-semibold text-sm text-[var(--foreground)]">
                      Début de la discussion avec {activeConv.other_user.first_name}
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)] mt-1">
                      Envoyez votre premier message ci-dessous !
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.sender_id === currentUser.id

                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn('flex flex-col', isMe ? 'items-end' : 'items-start')}
                      >
                        <div
                          className={cn(
                            'max-w-[80%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap shadow-sm',
                            isMe
                              ? 'bg-[var(--primary)] text-white rounded-br-none'
                              : 'bg-white border border-[var(--border)] text-[var(--foreground)] rounded-bl-none',
                          )}
                        >
                          {msg.content}
                        </div>
                        <span className="text-[10px] text-[var(--muted-foreground)] mt-1 px-1 flex items-center gap-1">
                          {format(new Date(msg.created_at), 'HH:mm', { locale: fr })}
                          {isMe && <CheckCheck className="h-3 w-3 text-blue-400" />}
                        </span>
                      </motion.div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Form */}
              <form
                onSubmit={handleSend}
                className="p-3 sm:p-4 border-t border-[var(--border)] bg-[var(--background-pure)] flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="Écris ton message en privé..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  className="flex-1 px-4 py-2.5 text-sm rounded-2xl border border-[var(--border)] bg-[var(--secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                />

                <Button
                  type="submit"
                  size="icon"
                  disabled={!inputMessage.trim() || sendMutation.isPending}
                  className="h-10 w-10 shrink-0 rounded-2xl bg-[var(--primary)] text-white hover:bg-[var(--primary-light)]"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <MessagesSquare className="h-14 w-14 text-[var(--muted-foreground)]/40 mb-3" />
              <h2 className="font-display font-semibold text-lg">Sélectionnez une discussion</h2>
              <p className="text-xs text-[var(--muted-foreground)] max-w-sm mt-1">
                Choisissez une conversation dans la liste de gauche ou écrivez à un membre depuis son profil.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function formatRelativeTime(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / (60 * 1000))
    const diffHours = Math.floor(diffMs / (3600 * 1000))

    if (diffMins < 1) return 'À l’instant'
    if (diffMins < 60) return `${diffMins}m`
    if (diffHours < 24) return `${diffHours}h`
    return format(d, 'dd MMM', { locale: fr })
  } catch {
    return ''
  }
}
