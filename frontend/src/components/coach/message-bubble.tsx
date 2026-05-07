import { Sparkles } from 'lucide-react'
import { MarkdownRenderer } from './markdown-renderer'
import { cn } from '@/lib/utils'

export function MessageBubble({
  role,
  content,
  isStreaming,
}: {
  role: 'user' | 'assistant'
  content: string
  /** True quand le coach est en train de streamer cette réponse. */
  isStreaming?: boolean
}) {
  if (role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-[var(--primary)] px-4 py-2.5 text-sm leading-relaxed text-[var(--primary-foreground)]">
          {content.split('\n').map((line, i) => (
            <p key={i} className={cn(i === 0 ? '' : 'mt-1')}>
              {line || ' '}
            </p>
          ))}
        </div>
      </div>
    )
  }

  // Bulle assistant — gère 3 états :
  // 1. streaming + content vide  → dots "Le coach réfléchit"
  // 2. streaming + content rempli → markdown + curseur clignotant
  // 3. terminé                   → markdown seul
  const showDots = isStreaming && content.length === 0

  return (
    <div className="flex gap-2.5">
      <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/15 text-[var(--accent)]">
        <Sparkles className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0 flex-1 rounded-2xl rounded-tl-md bg-[var(--secondary)] px-4 py-3 text-[var(--foreground)]">
        {showDots ? (
          <ThinkingDots />
        ) : (
          <div className="relative">
            <MarkdownRenderer content={content} />
            {isStreaming && <StreamingCursor />}
          </div>
        )}
      </div>
    </div>
  )
}

/** Conservé pour rétro-compat — n'est plus utilisé activement (la bulle
 *  assistant streamée gère son propre état "thinking"). */
export function ThinkingBubble() {
  return (
    <div className="flex gap-2.5">
      <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/15 text-[var(--accent)]">
        <Sparkles className="h-3.5 w-3.5" />
      </span>
      <div className="rounded-2xl rounded-tl-md bg-[var(--secondary)] px-4 py-3">
        <ThinkingDots />
      </div>
    </div>
  )
}

function ThinkingDots() {
  return (
    <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
      <span>Le coach réfléchit</span>
      <span className="flex gap-1">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--muted-foreground)] [animation-delay:-0.3s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--muted-foreground)] [animation-delay:-0.15s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--muted-foreground)]" />
      </span>
    </div>
  )
}

function StreamingCursor() {
  // Curseur "▋" clignotant inline, en cohérence avec le style ChatGPT.
  return (
    <span
      aria-hidden="true"
      className="ml-0.5 inline-block h-4 w-[3px] translate-y-0.5 animate-pulse rounded-sm bg-[var(--foreground)]/70 align-middle"
    />
  )
}
