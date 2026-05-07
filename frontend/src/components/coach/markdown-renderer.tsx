import ReactMarkdown from 'react-markdown'
import { cn } from '@/lib/utils'

export function MarkdownRenderer({
  content,
  className,
}: {
  content: string
  className?: string
}) {
  return (
    <div className={cn('text-sm leading-relaxed', className)}>
      <ReactMarkdown
        skipHtml
        components={{
          p: ({ children }) => (
            <p className="mb-2 last:mb-0">{children}</p>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold">{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          ul: ({ children }) => (
            <ul className="my-2 list-disc space-y-1 pl-5">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="my-2 list-decimal space-y-1 pl-5">{children}</ol>
          ),
          li: ({ children }) => <li>{children}</li>,
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--primary)] underline underline-offset-2"
            >
              {children}
            </a>
          ),
          h1: ({ children }) => (
            <h3 className="mb-1 mt-3 text-base font-semibold">{children}</h3>
          ),
          h2: ({ children }) => (
            <h3 className="mb-1 mt-3 text-base font-semibold">{children}</h3>
          ),
          h3: ({ children }) => (
            <h4 className="mb-1 mt-2 text-sm font-semibold">{children}</h4>
          ),
          code: ({ children, className: codeClass }) => {
            const isBlock = Boolean(codeClass)
            if (isBlock) {
              return (
                <code className="block whitespace-pre-wrap break-words font-mono text-xs">
                  {children}
                </code>
              )
            }
            return (
              <code className="rounded bg-[var(--secondary)] px-1.5 py-0.5 font-mono text-[0.8em]">
                {children}
              </code>
            )
          },
          pre: ({ children }) => (
            <pre className="my-2 overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--secondary)] p-3">
              {children}
            </pre>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-2 border-l-2 border-[var(--border)] pl-3 italic text-[var(--muted-foreground)]">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-3 border-[var(--border)]" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
