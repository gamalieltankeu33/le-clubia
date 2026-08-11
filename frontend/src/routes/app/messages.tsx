import { useState, useEffect, useRef } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { format, isToday, isYesterday } from 'date-fns'
import { fr } from 'date-fns/locale/fr'
import { 
  Send, 
  User, 
  Search, 
  ArrowLeft, 
  Sparkles, 
  CheckCheck,
  MessagesSquare,
  MoreVertical,
  Trash2,
  Edit2,
  Copy,
  Check,
  X,
  Filter,
  ShieldCheck,
  Smile
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'
import { AvatarDisplay } from '@/components/avatar-display'
import { VerifiedBadge } from '@/components/verified-badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useConfirm } from '@/hooks/use-confirm'
import { 
  fetchUserConversations, 
  fetchConversationMessages, 
  sendDirectMessage, 
  updateDirectMessage,
  deleteDirectMessage,
  deleteConversation,
  markConversationAsRead,
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
  const { confirm, ConfirmDialog } = useConfirm()

  const [activeConvId, setActiveConvId] = useState<string | undefined>(selectedConvIdFromUrl)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'unread'>('all')
  const [inputMessage, setInputMessage] = useState('')
  
  // Message edit state
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState('')

  // Header dropdown menu state
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (selectedConvIdFromUrl) {
      setActiveConvId(selectedConvIdFromUrl)
    }
  }, [selectedConvIdFromUrl])

  // Fetch Conversations list (poll every 3s)
  const conversationsQuery = useQuery({
    queryKey: ['direct-conversations', currentUser?.id],
    queryFn: () => fetchUserConversations(currentUser?.id || ''),
    enabled: !!currentUser?.id,
    refetchInterval: 3000,
  })

  const conversations = conversationsQuery.data ?? []

  // Auto-select first conversation if none selected
  useEffect(() => {
    if (!activeConvId && conversations.length > 0) {
      setActiveConvId(conversations[0].id)
    }
  }, [conversations, activeConvId])

  const activeConv = conversations.find((c) => c.id === activeConvId)

  // Fetch Messages for active conversation (poll every 2s)
  const messagesQuery = useQuery({
    queryKey: ['direct-messages', activeConvId],
    queryFn: async () => {
      if (!activeConvId || !currentUser) return []
      const msgs = await fetchConversationMessages(activeConvId)
      // Mark as read
      void markConversationAsRead(activeConvId, currentUser.id)
      return msgs
    },
    enabled: !!activeConvId && !!currentUser,
    refetchInterval: 2000,
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

  // Edit message mutation
  const editMutation = useMutation({
    mutationFn: async ({ messageId, text }: { messageId: string; text: string }) => {
      await updateDirectMessage(messageId, text)
    },
    onSuccess: () => {
      setEditingMessageId(null)
      setEditingText('')
      toast.success('Message modifié.')
      queryClient.invalidateQueries({ queryKey: ['direct-messages', activeConvId] })
      queryClient.invalidateQueries({ queryKey: ['direct-conversations', currentUser?.id] })
    },
  })

  // Delete message mutation
  const deleteMsgMutation = useMutation({
    mutationFn: async (messageId: string) => {
      await deleteDirectMessage(messageId)
    },
    onSuccess: () => {
      toast.success('Message supprimé.')
      queryClient.invalidateQueries({ queryKey: ['direct-messages', activeConvId] })
      queryClient.invalidateQueries({ queryKey: ['direct-conversations', currentUser?.id] })
    },
  })

  // Delete conversation mutation
  const deleteConvMutation = useMutation({
    mutationFn: async (convId: string) => {
      await deleteConversation(convId)
    },
    onSuccess: () => {
      setIsHeaderMenuOpen(false)
      setActiveConvId(undefined)
      toast.success('Discussion supprimée.')
      queryClient.invalidateQueries({ queryKey: ['direct-conversations', currentUser?.id] })
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

  const handleStartEdit = (msg: DirectMessage) => {
    setEditingMessageId(msg.id)
    setEditingText(msg.content)
  }

  const handleSaveEdit = (msgId: string) => {
    if (!editingText.trim()) return
    editMutation.mutate({ messageId: msgId, text: editingText })
  }

  const handleDeleteMsg = async (msgId: string) => {
    const ok = await confirm({
      title: 'Supprimer ce message ?',
      description: 'Le message sera retiré de la conversation.',
      confirmLabel: 'Supprimer',
      variant: 'destructive',
    })
    if (!ok) return
    deleteMsgMutation.mutate(msgId)
  }

  const handleDeleteConv = async () => {
    if (!activeConv) return
    const ok = await confirm({
      title: 'Supprimer toute la discussion ?',
      description: 'Tout l’historique des messages avec ce membre sera effacé.',
      confirmLabel: 'Supprimer la discussion',
      variant: 'destructive',
    })
    if (!ok) return
    deleteConvMutation.mutate(activeConv.id)
  }

  const handleCopyText = (text: string) => {
    void navigator.clipboard.writeText(text)
    toast.success('Message copié !')
  }

  // Filter conversations
  const filteredConvs = conversations.filter((c) => {
    const name = `${c.other_user.first_name || ''} ${c.other_user.last_name || ''}`.toLowerCase()
    const matchesSearch = name.includes(searchQuery.toLowerCase()) || c.last_message_text.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesUnread = filterType === 'unread' ? (c.unread_count || 0) > 0 : true
    return matchesSearch && matchesUnread
  })

  const totalUnreadCount = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0)

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
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold md:text-3xl flex items-center gap-3 text-[var(--foreground)]">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--primary)] text-white shadow-md">
              <MessagesSquare className="h-5 w-5" />
            </span>
            Messagerie Privée
            {totalUnreadCount > 0 && (
              <span className="inline-flex items-center justify-center h-6 min-w-6 px-2 text-xs font-extrabold rounded-full bg-[var(--or)] text-[var(--noir)] shadow-sm">
                {totalUnreadCount}
              </span>
            )}
          </h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Échanges sécurisés et instantanés entre membres du Club IA et le fondateur.
          </p>
        </div>
      </div>

      {/* Main Messenger Container */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-0 border border-[var(--border)] rounded-3xl bg-[var(--card)] shadow-xl overflow-hidden min-h-[600px] h-[calc(100vh-210px)] max-h-[750px]">
        {/* Left Sidebar: Conversations List */}
        <div
          className={cn(
            'md:col-span-4 border-r border-[var(--border)] flex flex-col bg-[var(--background-pure)]',
            activeConvId && 'hidden md:flex',
          )}
        >
          {/* Search & Filter Toolbar */}
          <div className="p-4 border-b border-[var(--border)] space-y-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
              <input
                type="text"
                placeholder="Rechercher une discussion..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm rounded-2xl border border-[var(--border)] bg-[var(--secondary)]/70 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 transition"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 text-xs">
              <button
                onClick={() => setFilterType('all')}
                className={cn(
                  'px-3 py-1 rounded-full font-semibold transition',
                  filterType === 'all'
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
                )}
              >
                Toutes ({conversations.length})
              </button>
              <button
                onClick={() => setFilterType('unread')}
                className={cn(
                  'px-3 py-1 rounded-full font-semibold transition flex items-center gap-1',
                  filterType === 'unread'
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
                )}
              >
                <Filter className="h-3 w-3" />
                Non lues
              </button>
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
                <p className="font-semibold text-[var(--foreground)]">Aucune discussion</p>
                <p className="text-xs mt-1">
                  Visite le profil d'un membre pour lui envoyer un message !
                </p>
              </div>
            ) : (
              filteredConvs.map((conv) => {
                const isActive = conv.id === activeConvId
                const fullName = `${conv.other_user.first_name || 'Membre'} ${conv.other_user.last_name || ''}`.trim()
                const hasUnread = (conv.unread_count || 0) > 0

                return (
                  <button
                    key={conv.id}
                    onClick={() => setActiveConvId(conv.id)}
                    className={cn(
                      'w-full flex items-center gap-3 p-3.5 rounded-2xl text-left transition-all relative group',
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
                        <span className="font-bold text-sm truncate flex items-center gap-1">
                          {fullName}
                          {conv.other_user.is_verified && (
                            <VerifiedBadge className="h-3.5 w-3.5" />
                          )}
                        </span>
                        <span
                          className={cn(
                            'text-[10px] font-medium shrink-0',
                            isActive ? 'text-white/80' : 'text-[var(--muted-foreground)]',
                          )}
                        >
                          {formatTimestamp(conv.last_message_at)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <p
                          className={cn(
                            'text-xs truncate max-w-[180px]',
                            isActive ? 'text-white/80' : 'text-[var(--muted-foreground)]',
                            hasUnread && !isActive && 'font-bold text-[var(--foreground)]',
                          )}
                        >
                          {conv.last_message_text}
                        </p>
                        {hasUnread && !isActive && (
                          <span className="h-4 min-w-4 px-1 inline-flex items-center justify-center rounded-full bg-[var(--or)] text-[var(--noir)] text-[10px] font-bold">
                            {conv.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Right Main Chat Window */}
        <div
          className={cn(
            'md:col-span-8 flex flex-col bg-[var(--card)] relative',
            !activeConvId && 'hidden md:flex',
          )}
        >
          {activeConv ? (
            <>
              {/* Chat Window Header */}
              <div className="px-6 py-3.5 border-b border-[var(--border)] flex items-center justify-between bg-[var(--background-pure)] z-10 shadow-sm">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveConvId(undefined)}
                    className="md:hidden p-1.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] rounded-xl hover:bg-[var(--secondary)]"
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
                    <h2 className="font-bold text-sm sm:text-base flex items-center gap-1.5 text-[var(--foreground)]">
                      {activeConv.other_user.first_name} {activeConv.other_user.last_name}
                      {activeConv.other_user.is_verified && (
                        <VerifiedBadge className="h-4 w-4" />
                      )}
                    </h2>
                    <span className="text-xs text-[var(--muted-foreground)] flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3 text-emerald-600" /> Discussion chiffrée
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 relative">
                  <Button asChild variant="outline" size="sm" className="rounded-xl text-xs font-semibold">
                    <Link to="/app/membres/$userId" params={{ userId: activeConv.other_user.id }}>
                      <User className="h-3.5 w-3.5 mr-1" />
                      Profil
                    </Link>
                  </Button>

                  {/* Header Dropdown Menu Button */}
                  <button
                    onClick={() => setIsHeaderMenuOpen(!isHeaderMenuOpen)}
                    className="p-2 rounded-xl text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] transition"
                    title="Menu conversation"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>

                  {/* Header Dropdown Menu */}
                  {isHeaderMenuOpen && (
                    <div className="absolute right-0 top-11 w-52 rounded-2xl border border-[var(--border)] bg-white shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95">
                      <button
                        onClick={handleDeleteConv}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Supprimer la discussion
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Chat Message History List */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/60">
                {messagesQuery.isLoading ? (
                  <div className="space-y-3">
                    <div className="h-12 w-2/3 animate-pulse rounded-2xl bg-gray-200" />
                    <div className="h-12 w-1/2 animate-pulse rounded-2xl bg-blue-100 ml-auto" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="py-16 text-center max-w-sm mx-auto">
                    <Sparkles className="mx-auto h-10 w-10 text-[var(--or)] mb-3 animate-bounce" />
                    <h3 className="font-bold text-base text-[var(--foreground)]">
                      Début de la discussion avec {activeConv.other_user.first_name}
                    </h3>
                    <p className="text-xs text-[var(--muted-foreground)] mt-1.5">
                      Tous vos messages sont sauvegardés et accessibles en toute sécurité.
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.sender_id === currentUser.id
                    const isEditing = editingMessageId === msg.id

                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn('flex flex-col group relative', isMe ? 'items-end' : 'items-start')}
                      >
                        {/* Bubble content */}
                        <div className="relative max-w-[85%] sm:max-w-[72%]">
                          {isEditing ? (
                            <div className="flex flex-col gap-2 p-3 bg-white rounded-2xl border-2 border-[var(--primary)] shadow-md">
                              <textarea
                                value={editingText}
                                onChange={(e) => setEditingText(e.target.value)}
                                className="w-full text-sm p-2 rounded-xl border border-[var(--border)] focus:outline-none"
                                rows={2}
                              />
                              <div className="flex justify-end gap-1.5">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setEditingMessageId(null)}
                                  className="h-7 text-xs px-2"
                                >
                                  <X className="h-3 w-3 mr-1" /> Annuler
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleSaveEdit(msg.id)}
                                  disabled={editMutation.isPending}
                                  className="h-7 text-xs px-3 bg-[var(--primary)] text-white"
                                >
                                  <Check className="h-3 w-3 mr-1" /> Enregistrer
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div
                              className={cn(
                                'relative rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap shadow-sm transition-all',
                                isMe
                                  ? 'bg-[var(--primary)] text-white rounded-br-none'
                                  : 'bg-white border border-[var(--border)] text-[var(--foreground)] rounded-bl-none',
                              )}
                            >
                              {msg.content}
                              {msg.is_edited && (
                                <span className="text-[10px] italic opacity-75 ml-1.5">(modifié)</span>
                              )}
                            </div>
                          )}

                          {/* Quick Hover Action Toolbar */}
                          {!isEditing && (
                            <div
                              className={cn(
                                'absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white border border-[var(--border)] rounded-full px-2 py-1 shadow-md z-10',
                                isMe ? '-left-24' : '-right-24',
                              )}
                            >
                              <button
                                onClick={() => handleCopyText(msg.content)}
                                className="p-1 hover:bg-slate-100 rounded-full text-slate-600 transition"
                                title="Copier"
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </button>
                              {isMe && (
                                <button
                                  onClick={() => handleStartEdit(msg)}
                                  className="p-1 hover:bg-blue-50 text-blue-600 rounded-full transition"
                                  title="Modifier"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteMsg(msg.id)}
                                className="p-1 hover:bg-red-50 text-red-600 rounded-full transition"
                                title="Supprimer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Timestamp */}
                        <span className="text-[10px] text-[var(--muted-foreground)] mt-1 px-1 flex items-center gap-1 font-medium">
                          {format(new Date(msg.created_at), 'HH:mm', { locale: fr })}
                          {isMe && <CheckCheck className="h-3.5 w-3.5 text-blue-500" />}
                        </span>
                      </motion.div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Box */}
              <form
                onSubmit={handleSend}
                className="p-3 sm:p-4 border-t border-[var(--border)] bg-[var(--background-pure)] flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="Écris ton message en privé..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  className="flex-1 px-4 py-3 text-sm rounded-2xl border border-[var(--border)] bg-[var(--secondary)]/70 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 transition"
                />

                <Button
                  type="submit"
                  size="icon"
                  disabled={!inputMessage.trim() || sendMutation.isPending}
                  className="h-11 w-11 shrink-0 rounded-2xl bg-[var(--primary)] text-white hover:bg-[var(--primary-light)] shadow-md transition"
                >
                  <Send className="h-4.5 w-4.5" />
                </Button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <MessagesSquare className="h-16 w-16 text-[var(--muted-foreground)]/30 mb-4" />
              <h2 className="font-display font-bold text-xl text-[var(--foreground)]">Sélectionnez une discussion</h2>
              <p className="text-sm text-[var(--muted-foreground)] max-w-sm mt-1.5">
                Choisissez une conversation dans la liste de gauche ou écrivez à un membre directement depuis son profil.
              </p>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog />
    </div>
  )
}

function formatTimestamp(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    if (isToday(d)) return format(d, 'HH:mm', { locale: fr })
    if (isYesterday(d)) return 'Hier'
    return format(d, 'dd MMM', { locale: fr })
  } catch {
    return ''
  }
}
