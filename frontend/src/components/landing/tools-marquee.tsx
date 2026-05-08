import {
  Bot,
  Brush,
  FileText,
  Film,
  Image as ImageIcon,
  Mic,
  Network,
  Palette,
  Search,
  Smile,
  Sparkles,
  Star,
  Wind,
  Workflow,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { Eyebrow } from './eyebrow'
import { Reveal } from './reveal'

interface Tool {
  name: string
  icon: LucideIcon
}

const TOOLS: Tool[] = [
  { name: 'ChatGPT', icon: Bot },
  { name: 'Claude', icon: Sparkles },
  { name: 'Gemini', icon: Star },
  { name: 'Mistral', icon: Wind },
  { name: 'Midjourney', icon: Brush },
  { name: 'DALL·E', icon: Palette },
  { name: 'Runway', icon: Film },
  { name: 'Make', icon: Workflow },
  { name: 'Zapier', icon: Zap },
  { name: 'n8n', icon: Network },
  { name: 'Notion AI', icon: FileText },
  { name: 'Canva', icon: ImageIcon },
  { name: 'ElevenLabs', icon: Mic },
  { name: 'Hugging Face', icon: Smile },
  { name: 'Perplexity', icon: Search },
]

export function ToolsMarquee() {
  return (
    <section
      aria-label="Outils IA couverts par Le Club IA"
      className="bg-white py-20 sm:py-24 lg:py-32 overflow-hidden"
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <Eyebrow className="mb-4">Outils couverts dans le club</Eyebrow>
            <h2 className="font-display text-4xl font-bold tracking-tight text-[var(--foreground)] sm:text-5xl lg:text-6xl">
              Maîtrise les outils IA{' '}
              <span className="serif-accent">qui comptent.</span>
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-[var(--muted-foreground)]">
              Du modèle de langage à l'automatisation, on couvre tout
              l'écosystème IA francophone avec une expertise technique pointue.
            </p>
          </Reveal>
        </div>

        <div
          className="relative mt-16 overflow-hidden sm:mt-24"
          style={{
            maskImage:
              'linear-gradient(to right, transparent, black 15%, black 85%, transparent)',
            WebkitMaskImage:
              'linear-gradient(to right, transparent, black 15%, black 85%, transparent)',
          }}
        >
          <div className="tools-marquee-track flex items-center py-4">
            {[...TOOLS, ...TOOLS].map((tool, idx) => (
              <ToolTile
                key={`${tool.name}-${idx}`}
                tool={tool}
                aria-hidden={idx >= TOOLS.length ? 'true' : undefined}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function ToolTile({
  tool,
  ...rest
}: {
  tool: Tool
  'aria-hidden'?: 'true' | undefined
}) {
  const Icon = tool.icon
  return (
    <div
      {...rest}
      className="group flex shrink-0 flex-col items-center gap-4 px-10 text-[var(--muted-foreground)] transition-all duration-500 hover:text-[var(--primary)] sm:px-14"
      title={tool.name}
    >
      <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--background)] transition-all duration-500 group-hover:scale-110 group-hover:border-[var(--primary)]/30 group-hover:bg-white group-hover:shadow-[0_12px_24px_-8px_rgba(30,64,175,0.15)] sm:h-20 sm:w-20">
        <Icon className="h-7 w-7 transition-transform duration-500 group-hover:scale-110 sm:h-9 sm:w-9" aria-hidden="true" />
      </div>
      <span className="select-none whitespace-nowrap text-xs font-semibold tracking-wider uppercase opacity-60 transition-opacity duration-500 group-hover:opacity-100 sm:text-sm">
        {tool.name}
      </span>
    </div>
  )
}
