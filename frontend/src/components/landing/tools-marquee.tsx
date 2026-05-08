import { Eyebrow } from './eyebrow'
import { Reveal } from './reveal'

interface Tool {
  name: string
  slug: string
  color: string
}

const TOOLS: Tool[] = [
  { name: 'ChatGPT', slug: 'openai', color: '#412991' },
  { name: 'Claude', slug: 'anthropic', color: '#D97757' },
  { name: 'Gemini', slug: 'googlegemini', color: '#1A73E8' },
  { name: 'Mistral', slug: 'mistralai', color: '#FD722E' },
  { name: 'Midjourney', slug: 'midjourney', color: '#000000' },
  { name: 'Runway', slug: 'runway', color: '#FF5C00' },
  { name: 'Make', slug: 'make', color: '#FF0000' },
  { name: 'Zapier', slug: 'zapier', color: '#FF4A00' },
  { name: 'n8n', slug: 'n8n', color: '#FF6600' },
  { name: 'Notion', slug: 'notion', color: '#000000' },
  { name: 'Canva', slug: 'canva', color: '#00C4CC' },
  { name: 'ElevenLabs', slug: 'elevenlabs', color: '#000000' },
  { name: 'Hugging Face', slug: 'huggingface', color: '#FFD21E' },
  { name: 'Perplexity', slug: 'perplexity', color: '#000000' },
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
                key={`${tool.slug}-${idx}`}
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
  // Pattern CDN GitHub officiel de Simple Icons (extrêmement robuste)
  const iconUrl = `https://raw.githubusercontent.com/simple-icons/simple-icons/v11.13.0/icons/${tool.slug}.svg`

  return (
    <div
      {...rest}
      className="group flex shrink-0 flex-col items-center gap-4 px-10 sm:px-14"
      title={tool.name}
    >
      <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--background)] transition-all duration-500 group-hover:scale-110 group-hover:border-[var(--primary)]/20 group-hover:bg-white group-hover:shadow-[0_12px_24px_-8px_rgba(0,0,0,0.08)] sm:h-20 sm:w-20">
        <div
          className="h-8 w-8 transition-all duration-500 sm:h-10 sm:w-10"
          style={{
            backgroundColor: 'currentColor',
            color: '#94a3b8', // Slate-400 (gris neutre élégant)
            maskImage: `url(${iconUrl})`,
            WebkitMaskImage: `url(${iconUrl})`,
            maskSize: 'contain',
            WebkitMaskSize: 'contain',
            maskRepeat: 'no-repeat',
            WebkitMaskRepeat: 'no-repeat',
            maskPosition: 'center',
            WebkitMaskPosition: 'center',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = tool.color
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#94a3b8'
          }}
        />
      </div>
    </div>
  )
}
