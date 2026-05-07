import { useState } from 'react'
import { Eyebrow } from './eyebrow'
import { Reveal } from './reveal'

/**
 * Section "Outils maîtrisés" — défilement infini de logos IA en grayscale.
 *
 * Comble visuellement l'espace entre Hero et FourPillars.
 * Les logos viennent de Simple Icons CDN (https://simpleicons.org) ; ceux
 * qui n'y figurent pas (Midjourney, DALL·E, Runway) sont rendus en texte
 * stylé avec une typographie cohérente.
 *
 * Au hover : la couleur d'origine du logo réapparaît + opacité 100%.
 * Sur desktop, le défilement se met en pause au survol.
 * Respect de `prefers-reduced-motion` (animation désactivée si l'utilisateur
 * a désactivé les animations système).
 */

interface Tool {
  name: string
  /** Slug Simple Icons (https://simpleicons.org). Si absent → rendu texte. */
  slug?: string
}

const TOOLS: Tool[] = [
  { name: 'ChatGPT', slug: 'openai' },
  { name: 'Claude', slug: 'anthropic' },
  { name: 'Gemini', slug: 'googlegemini' },
  { name: 'Mistral', slug: 'mistralai' },
  { name: 'Midjourney' },
  { name: 'DALL·E' },
  { name: 'Runway' },
  { name: 'Make', slug: 'make' },
  { name: 'Zapier', slug: 'zapier' },
  { name: 'n8n', slug: 'n8n' },
  { name: 'Notion AI', slug: 'notion' },
  { name: 'Canva', slug: 'canva' },
  { name: 'ElevenLabs', slug: 'elevenlabs' },
  { name: 'Hugging Face', slug: 'huggingface' },
  { name: 'Perplexity', slug: 'perplexity' },
]

export function ToolsMarquee() {
  return (
    <section
      aria-label="Outils IA couverts par Le Club IA"
      className="bg-white py-12 sm:py-16"
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <Eyebrow>Outils couverts dans le club</Eyebrow>
            <h2 className="mt-5 font-display text-3xl font-bold leading-[1.05] tracking-tight text-[var(--foreground)] sm:text-4xl lg:text-5xl">
              Maîtrise les outils IA{' '}
              <span className="serif-accent">qui comptent.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-[var(--muted-foreground)] sm:text-lg">
              Du modèle de langage à l'automatisation, on couvre tout
              l'écosystème IA francophone.
            </p>
          </Reveal>
        </div>

        {/* Marquee : duplication 2× du tableau pour boucle infinie sans saut.
            Les masks gauche/droite font fade-in/fade-out propre sur les bords. */}
        <div
          className="relative mt-10 overflow-hidden sm:mt-12"
          style={{
            maskImage:
              'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
            WebkitMaskImage:
              'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
          }}
        >
          <div className="tools-marquee-track flex items-center gap-12 sm:gap-16">
            {[...TOOLS, ...TOOLS].map((tool, idx) => (
              <ToolLogo
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

function ToolLogo({
  tool,
  ...rest
}: {
  tool: Tool
  'aria-hidden'?: 'true' | undefined
}) {
  const [imgFailed, setImgFailed] = useState(false)
  const showText = !tool.slug || imgFailed

  return (
    <div
      {...rest}
      className="group flex h-8 w-[110px] shrink-0 items-center justify-center sm:h-9 sm:w-[140px]"
      title={tool.name}
    >
      {showText ? (
        <span className="select-none font-display text-base font-bold tracking-tight text-[#737373] opacity-60 transition-colors duration-200 group-hover:text-[#0A0A0A] group-hover:opacity-100 sm:text-lg">
          {tool.name}
        </span>
      ) : (
        <img
          src={`https://cdn.simpleicons.org/${tool.slug}`}
          alt={tool.name}
          loading="lazy"
          onError={() => setImgFailed(true)}
          className="h-7 w-auto max-w-full select-none opacity-50 grayscale transition-all duration-200 group-hover:opacity-100 group-hover:grayscale-0 sm:h-8"
        />
      )}
    </div>
  )
}
