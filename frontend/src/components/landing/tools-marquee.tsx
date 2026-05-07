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

/**
 * Section "Outils maîtrisés" — défilement infini des outils IA couverts.
 *
 * 100% Lucide React (déjà installé dans le projet) :
 *   - 0 dépendance CDN externe (RGPD : aucun partage d'IP visiteur).
 *   - 0 risque de 404 si un slug upstream est renommé.
 *   - Style cohérent avec le reste de l'app (toutes nos icônes sont Lucide).
 *
 * Sur desktop, le défilement se met en pause au survol (CSS dans
 * index.css `.tools-marquee-track`). Respect de `prefers-reduced-motion`
 * (animation désactivée si l'utilisateur a réduit les animations système).
 *
 * Position : entre <Hero /> et <FourPillars /> dans routes/index.tsx.
 */

interface Tool {
  name: string
  icon: LucideIcon
}

// Mapping IA-tool → icône Lucide. Choix d'icônes distinctes (pas deux
// outils avec la même icône dans la séquence) et reconnaissables.
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

        {/* Marquee : duplication 2× du tableau pour boucle infinie sans
            saut. Les masks gauche/droite font fade-in/fade-out propre sur
            les bords. */}
        <div
          className="relative mt-10 overflow-hidden sm:mt-12"
          style={{
            maskImage:
              'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
            WebkitMaskImage:
              'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
          }}
        >
          <div className="tools-marquee-track flex items-center">
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
      className="group flex shrink-0 flex-col items-center gap-2 px-6 text-[var(--muted-foreground)] transition-colors duration-200 hover:text-[var(--primary)] sm:px-8"
      title={tool.name}
    >
      <Icon className="h-8 w-8" aria-hidden="true" />
      <span className="select-none whitespace-nowrap text-xs font-medium sm:text-sm">
        {tool.name}
      </span>
    </div>
  )
}
