import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale/fr'
import {
  ArrowLeft,
  History,
  MessageCircle,
  Plus,
  Send,
  Sparkles,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { BrandLogo } from '@/components/brand-logo'
import { useCoachStore } from '@/stores/coach-store'
import { useAuthStore } from '@/stores/auth-store'
import { cn } from '@/lib/utils'
import { MessageBubble } from './message-bubble'

const SUGGESTIONS = [
  'Quels outils IA pour débuter ?',
  'Comment créer un workflow Make ?',
  'Explique-moi le RAG',
]

export function ChatPanel() {
  const isOpen = useCoachStore((s) => s.isOpen)
  const closePanel = useCoachStore((s) => s.closePanel)

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/30 lg:hidden"
            onClick={closePanel}
            aria-hidden="true"
          />
          <motion.aside
            key="panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-[var(--border)] bg-[var(--background)] shadow-2xl lg:w-[420px]"
            role="dialog"
            aria-modal="true"
            aria-label="Coach IA"
          >
            <PanelContent />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

function PanelContent() {
  const view = useCoachStore((s) => s.view)
  return (
    <>
      <ChatHeader />
      {view === 'history' ? <HistoryView /> : <ChatView />}
    </>
  )
}

function ChatHeader() {
  const view = useCoachStore((s) => s.view)
  const showHistory = useCoachStore((s) => s.showHistory)
  const showChat = useCoachStore((s) => s.showChat)
  const startNew = useCoachStore((s) => s.startNewConversation)
  const closePanel = useCoachStore((s) => s.closePanel)

  return (
    <header className="flex items-center justify-between gap-2 border-b border-[var(--border)] bg-[var(--card)] px-4 py-3">
      <div className="flex min-w-0 items-center gap-2.5">
        {view === 'history' ? (
          <>
            <button
              type="button"
              onClick={showChat}
              aria-label="Retour"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <h2 className="font-display text-base font-semibold tracking-tight">
              Historique
            </h2>
          </>
        ) : (
          <>
            <BrandLogo size="sm" variant="primary" asLink={false} />
            <span className="font-display text-base font-semibold tracking-tight text-[var(--foreground)]">
              Coach IA
            </span>
          </>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {view === 'chat' && (
          <>
            <button
              type="button"
              onClick={startNew}
              aria-label="Nouvelle conversation"
              title="Nouvelle conversation"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={showHistory}
              aria-label="Historique"
              title="Historique"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
            >
              <History className="h-4 w-4" />
            </button>
          </>
        )}
        <button
          type="button"
          onClick={closePanel}
          aria-label="Fermer le coach"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </header>
  )
}

function ChatView() {
  const messages = useCoachStore((s) => s.messages)
  const isSending = useCoachStore((s) => s.isSending)
  const isLoadingConversation = useCoachStore((s) => s.isLoadingConversation)

  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isSending])

  return (
    <>
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5">
        {messages.length === 0 && !isLoadingConversation ? (
          <EmptyState />
        ) : (
          <div className="space-y-4">
            {messages.map((m, i) => (
              <MessageBubble
                key={i}
                role={m.role}
                content={m.content}
                isStreaming={m.isStreaming}
              />
            ))}
          </div>
        )}
      </div>
      <ComposerBar />
    </>
  )
}

function EmptyState() {
  const profile = useAuthStore((s) => s.profile)
  const sendMessage = useCoachStore((s) => s.sendMessage)
  const firstName = profile?.first_name?.trim() || 'à toi'

  async function pick(suggestion: string) {
    const { error } = await sendMessage(suggestion)
    if (error) toast.error(error)
  }

  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent)]/15 text-[var(--accent)]">
        <Sparkles className="h-6 w-6" />
      </span>
      <h3 className="mt-5 font-display text-xl font-semibold tracking-tight">
        Salut {firstName}&nbsp;!
      </h3>
      <p className="mx-auto mt-2 max-w-xs text-sm text-[var(--muted-foreground)]">
        Je suis ton Coach IA. Pose-moi tes questions sur l'IA, l'automatisation,
        les outils, le prompt engineering…
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => pick(s)}
            className="rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-xs text-[var(--foreground)] transition-colors hover:border-[var(--primary)]/40 hover:bg-[var(--secondary)]"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}

function ComposerBar() {
  const sendMessage = useCoachStore((s) => s.sendMessage)
  const isSending = useCoachStore((s) => s.isSending)
  const quotaUsed = useCoachStore((s) => s.quotaUsed)
  const quotaLimit = useCoachStore((s) => s.quotaLimit)

  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-grow textarea (1-5 lignes)
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = '0px'
    const max = 24 * 5 + 16
    ta.style.height = `${Math.min(ta.scrollHeight, max)}px`
  }, [value])

  const quotaReached = quotaUsed >= quotaLimit
  const canSend = value.trim().length > 0 && !isSending && !quotaReached

  async function submit() {
    if (!canSend) return
    const content = value
    setValue('')
    const { error } = await sendMessage(content)
    if (error) {
      toast.error(error)
      setValue(content) // restaure ce qui a été tapé
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div className="border-t border-[var(--border)] bg-[var(--card)] px-4 py-3">
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={isSending || quotaReached}
          placeholder={
            quotaReached
              ? 'Quota quotidien atteint. Reviens demain.'
              : 'Pose ta question…'
          }
          className="flex-1 resize-none rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:cursor-not-allowed disabled:opacity-60"
        />
        <button
          type="button"
          onClick={submit}
          disabled={!canSend}
          aria-label="Envoyer"
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors',
            canSend
              ? 'bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[#1c3a9e]'
              : 'bg-[var(--secondary)] text-[var(--muted-foreground)] cursor-not-allowed',
          )}
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
      <p
        className={cn(
          'mt-2 text-center text-xs',
          quotaReached
            ? 'text-[var(--accent)]'
            : 'text-[var(--muted-foreground)]',
        )}
      >
        {quotaUsed}/{quotaLimit} messages aujourd'hui
      </p>
    </div>
  )
}

function HistoryView() {
  const conversations = useCoachStore((s) => s.conversations)
  const loadConversation = useCoachStore((s) => s.loadConversation)
  const startNew = useCoachStore((s) => s.startNewConversation)
  const isLoading = useCoachStore((s) => s.isLoadingHistory)
  const currentId = useCoachStore((s) => s.currentConversationId)

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4">
      <Button
        variant="outline"
        size="sm"
        className="mb-4 w-full justify-start"
        onClick={startNew}
      >
        <Plus className="h-4 w-4" />
        Nouvelle conversation
      </Button>

      {isLoading && conversations.length === 0 ? (
        <p className="py-8 text-center text-sm text-[var(--muted-foreground)]">
          Chargement…
        </p>
      ) : conversations.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--card)] p-6 text-center">
          <MessageCircle className="mx-auto h-6 w-6 text-[var(--muted-foreground)]" />
          <p className="mt-3 text-sm font-medium">Pas encore de conversation</p>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            Tes échanges avec le coach apparaîtront ici.
          </p>
        </div>
      ) : (
        <ul className="space-y-1">
          {conversations.map((c) => {
            const active = c.id === currentId
            return (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => loadConversation(c.id)}
                  className={cn(
                    'group flex w-full flex-col gap-0.5 rounded-lg px-3 py-2.5 text-left transition-colors',
                    active
                      ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                      : 'hover:bg-[var(--secondary)]',
                  )}
                >
                  <span className="line-clamp-1 text-sm font-medium">
                    {c.title}
                  </span>
                  <span
                    className={cn(
                      'text-xs',
                      active
                        ? 'text-[var(--primary)]/70'
                        : 'text-[var(--muted-foreground)]',
                    )}
                  >
                    {formatDistanceToNow(new Date(c.updated_at), {
                      addSuffix: true,
                      locale: fr,
                    })}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
