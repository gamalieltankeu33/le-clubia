import { cn } from '@/lib/utils'

/** "Browser chrome" minimaliste partagé par les 4 previews piliers. */
export function BrowserCard({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-[#E5E5E5] bg-white shadow-lg shadow-black/5',
        className,
      )}
    >
      <div className="flex items-center gap-1.5 border-b border-[#E5E5E5] bg-[#FAFAF9] px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F56]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#FFBD2E]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#27C93F]" />
        <span className="ml-3 h-3.5 flex-1 rounded-full bg-[#E5E5E5]" />
      </div>
      <div className="bg-[#FAFAF9]">{children}</div>
    </div>
  )
}
