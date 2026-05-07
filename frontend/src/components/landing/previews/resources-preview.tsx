import {
  Download,
  FileText,
  Sparkles,
  Workflow,
  type LucideIcon,
} from 'lucide-react'
import { BrowserCard } from './browser-card'
import { cn } from '@/lib/utils'

interface ResourceItem {
  title: string
  type: 'Prompt' | 'Template' | 'Guide'
  icon: LucideIcon
  bg: string
  fg: string
}

const RESOURCES: ResourceItem[] = [
  {
    title: 'Prompts ChatGPT Business',
    type: 'Prompt',
    icon: Sparkles,
    bg: 'bg-[#1E40AF]/10',
    fg: 'text-[#1E40AF]',
  },
  {
    title: 'Template Notion : Plan de contenu IA',
    type: 'Template',
    icon: Workflow,
    bg: 'bg-[#F97316]/15',
    fg: 'text-[#F97316]',
  },
  {
    title: 'Guide PDF : Automatisation 101',
    type: 'Guide',
    icon: FileText,
    bg: 'bg-emerald-100',
    fg: 'text-emerald-700',
  },
]

export function ResourcesPreview({ className }: { className?: string }) {
  return (
    <BrowserCard className={className}>
      <div className="space-y-3 p-4 sm:p-5">
        {RESOURCES.map((r) => {
          const Icon = r.icon
          return (
            <div
              key={r.title}
              className="flex items-center gap-3 rounded-xl border border-[#E5E5E5] bg-white p-3"
            >
              <span
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                  r.bg,
                  r.fg,
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-[#0A0A0A]">
                  {r.title}
                </p>
                <span
                  className={cn(
                    'mt-0.5 inline-flex rounded-full px-1.5 py-0.5 text-[9px] font-medium',
                    r.bg,
                    r.fg,
                  )}
                >
                  {r.type}
                </span>
              </div>
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[#737373]">
                <Download className="h-3.5 w-3.5" />
              </span>
            </div>
          )
        })}
      </div>
    </BrowserCard>
  )
}
