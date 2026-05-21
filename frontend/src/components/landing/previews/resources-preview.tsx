import { useQuery } from '@tanstack/react-query'
import {
  Download,
  ExternalLink,
  FileText,
  Sparkles,
  Workflow,
  type LucideIcon,
} from 'lucide-react'
import { BrowserCard } from './browser-card'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

const TYPE_STYLE: Record<
  string,
  { label: string; icon: LucideIcon; bg: string; fg: string }
> = {
  prompt: {
    label: 'Prompt',
    icon: Sparkles,
    bg: 'bg-emerald-500/10',
    fg: 'text-emerald-600',
  },
  template: {
    label: 'Template',
    icon: Workflow,
    bg: 'bg-[var(--bleu-ciel)]/15',
    fg: 'text-[var(--bleu-ciel-deep)]',
  },
  guide_pdf: {
    label: 'Guide',
    icon: FileText,
    bg: 'bg-[var(--or)]/15',
    fg: 'text-[var(--or-deep)]',
  },
  tool_link: {
    label: 'Outil',
    icon: ExternalLink,
    bg: 'bg-violet-500/10',
    fg: 'text-violet-600',
  },
}

const DEFAULT_STYLE = {
  label: 'Ressource',
  icon: FileText,
  bg: 'bg-gray-500/10',
  fg: 'text-gray-600',
}

interface DbResource {
  id: string
  title: string
  resource_type: string | null
}

export function ResourcesPreview({ className }: { className?: string }) {
  // La landing est publique. La table `resources` a une RLS qui n'autorise
  // que les membres actifs / admins → l'anon role ne peut rien lire.
  // On passe donc par la fonction `get_public_resources` (SECURITY DEFINER)
  // qui ne renvoie QUE les colonnes sûres (titre + type + catégorie),
  // jamais les URLs de fichier ni le contenu.
  const { data: resources = [] } = useQuery({
    queryKey: ['landing', 'resources-preview'],
    queryFn: async (): Promise<DbResource[]> => {
      // @ts-expect-error - get_public_resources est une RPC custom non typée
      const { data } = await supabase.rpc('get_public_resources', { p_limit: 6 })
      return ((data ?? []) as Array<Record<string, unknown>>)
        .filter((r) => r.id != null && r.title != null)
        .map((r) => ({
          id: r.id as string,
          title: r.title as string,
          resource_type: (r.resource_type as string | null) ?? null,
        }))
    },
    staleTime: 10 * 60 * 1000,
  })

  return (
    <BrowserCard className={className}>
      <div className="space-y-3 p-4 sm:p-5">
        {resources.length === 0
          ? Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-xl border border-[#E5E5E5] bg-white p-3"
              >
                <span className="h-9 w-9 shrink-0 animate-pulse rounded-lg bg-gray-200" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <span className="block h-3 w-3/4 animate-pulse rounded bg-gray-200" />
                  <span className="block h-2 w-12 animate-pulse rounded bg-gray-100" />
                </div>
              </div>
            ))
          : resources.map((r) => {
              const style =
                (r.resource_type && TYPE_STYLE[r.resource_type]) || DEFAULT_STYLE
              const Icon = style.icon
              return (
                <div
                  key={r.id}
                  className="flex items-center gap-3 rounded-xl border border-[#E5E5E5] bg-white p-3"
                >
                  <span
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                      style.bg,
                      style.fg,
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
                        style.bg,
                        style.fg,
                      )}
                    >
                      {style.label}
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
