import { Eyebrow } from './eyebrow'
import { Reveal } from './reveal'

interface Tool {
  name: string
  slug: string
}

const TOOLS: Tool[] = [
  { name: 'ChatGPT', slug: 'openai' },
  { name: 'Claude', slug: 'claude' },
  { name: 'Gemini', slug: 'gemini' },
  { name: 'Mistral', slug: 'mistralai' },
  { name: 'Midjourney', slug: 'midjourney' },
  { name: 'Runway', slug: 'runway' },
  { name: 'Make', slug: 'make' },
  { name: 'Zapier', slug: 'zapier' },
  { name: 'n8n', slug: 'n8n' },
  { name: 'Notion', slug: 'notion' },
  { name: 'Canva', slug: 'canva' },
  { name: 'ElevenLabs', slug: 'elevenlabs' },
  { name: 'Hugging Face', slug: 'huggingface' },
  { name: 'Perplexity', slug: 'perplexity' },
]

export function ToolsMarquee() {
  return (
    <section
      aria-label="Outils IA couverts par Le Club IA"
      className="bg-white py-14 sm:py-16 lg:py-24 overflow-hidden"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
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
          className="relative mt-12 overflow-hidden sm:mt-16"
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
  return (
    <div
      {...rest}
      className="group flex shrink-0 flex-col items-center gap-4 px-10 sm:px-14"
      title={tool.name}
    >
      <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--background)] transition-all duration-500 group-hover:scale-110 group-hover:border-[var(--primary)]/20 group-hover:bg-white group-hover:shadow-[0_12px_24px_-8px_rgba(0,0,0,0.08)] sm:h-20 sm:w-20">
        <img
          src={`https://svgl.app/library/${tool.slug}.svg`}
          alt={tool.name}
          className="h-8 w-8 transition-all duration-500 grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100 sm:h-10 sm:w-10"
          loading="lazy"
          onError={(e) => {
            // Fallback vers SimpleIcons si SVGL échoue pour un logo spécifique
            e.currentTarget.src = `https://cdn.simpleicons.org/${tool.slug}`
          }}
        />
      </div>
    </div>
  )
}
