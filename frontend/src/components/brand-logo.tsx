import { Link } from '@tanstack/react-router'
import { cn } from '@/lib/utils'

export type BrandLogoSize = 'sm' | 'md' | 'lg' | 'xl'
export type BrandLogoVariant = 'primary' | 'inverse'

interface BrandLogoProps {
  size?: BrandLogoSize
  /**
   * - `primary` : texte noir "Leclub" + ".ia" bleu vif. Pour fonds clairs.
   * - `inverse` : texte blanc "Leclub" + ".ia" bleu vif. Pour fonds foncés.
   *   Le symbole bleu reste identique dans les deux cas — il est lisible
   *   sur fonds clairs comme sombres grâce à sa saturation élevée.
   */
  variant?: BrandLogoVariant
  className?: string
  /** Si true (défaut), le logo est un <Link> vers "/". */
  asLink?: boolean
  /**
   * `wordmark` (défaut) : symbole + texte "Leclub.ia" côte à côte (horizontal).
   * `mark`              : symbole seul, format carré — pour sidebar collapsée,
   *                       mobile, ou tout emplacement où le wordmark complet
   *                       est trop large.
   */
  display?: 'wordmark' | 'mark'
  /**
   * Si true, affiche l'eyebrow signature "L'INTÉRIEUR DU CERCLE" sous le
   * logo (uppercase, tracking large, très petit). Réservé au footer
   * landing pour poser l'identité — pas dans la sidebar app.
   */
  showSignature?: boolean
}

// Dimensions calibrées : le wordmark a un ratio ~5:1 (symbole carré à
// gauche + ".ia" qui mange ~4x sa largeur), le mark seul est carré.
const WORDMARK_SIZE: Record<BrandLogoSize, { width: number; height: number }> = {
  sm: { width: 120, height: 24 },
  md: { width: 170, height: 34 },
  lg: { width: 215, height: 43 },
  xl: { width: 290, height: 58 },
}

const MARK_SIZE: Record<BrandLogoSize, number> = {
  sm: 24,
  md: 34,
  lg: 43,
  xl: 58,
}

// Palette officielle du nouveau branding.
const NOIR = '#0A0A0A'
const BLANC = '#FAFAF9'
const BLEU_IA = '#2563EB'

/**
 * Bloc <g> qui rend le symbole (carré arrondi bleu + 2 arcs blancs).
 * On le rend EN LIGNE dans le SVG du wordmark plutôt que de référencer
 * `/brand/mark.svg` — ça évite un round-trip réseau et garantit que
 * le logo apparaît instantanément, même avant l'hydratation.
 */
function MarkPaths() {
  return (
    <>
      <rect width="100" height="100" rx="22" fill={BLEU_IA} />
      <path
        d="M30 60 L30 50 A20 18 0 0 1 70 50 L70 60"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M41 80 L41 75 A9 7 0 0 1 59 75 L59 80"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  )
}

export function BrandLogo({
  size = 'md',
  variant = 'primary',
  className,
  asLink = true,
  display = 'wordmark',
  showSignature = false,
}: BrandLogoProps) {
  const isInverse = variant === 'inverse'
  const textColor = isInverse ? BLANC : NOIR

  // ── Variante "mark" : symbole seul, carré ────────────────────────────
  if (display === 'mark') {
    const sideLength = MARK_SIZE[size]
    const markSvg = (
      <svg
        role="img"
        aria-label="Leclub.ia"
        width={sideLength}
        height={sideLength}
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        className={cn('block', className)}
      >
        <MarkPaths />
      </svg>
    )
    if (!asLink) return markSvg
    return (
      <Link
        to="/"
        className="inline-flex shrink-0"
        aria-label="Leclub.ia — Accueil"
      >
        {markSvg}
      </Link>
    )
  }

  // ── Variante "wordmark" : symbole + texte côte à côte ────────────────
  const dimensions = WORDMARK_SIZE[size]
  // viewBox composé : 100 unités pour le symbole + 20 de gap + ~180 pour
  // le texte = 300. Hauteur 100 pour matcher la grille du symbole.
  const wordmark = (
    <svg
      role="img"
      aria-label="Leclub.ia"
      width={dimensions.width}
      height={dimensions.height}
      viewBox="0 0 300 100"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('block', className)}
    >
      {/* Symbole, calé à gauche, format 100x100 */}
      <g>
        <MarkPaths />
      </g>
      {/* Wordmark, démarre après le symbole + gap */}
      <text
        x="125"
        y="72"
        fontFamily="'Bricolage Grotesque', Inter, system-ui, sans-serif"
        fontWeight={800}
        fontSize={76}
        fill={textColor}
        letterSpacing="-0.045em"
      >
        Leclub
        <tspan fill={BLEU_IA}>.ia</tspan>
      </text>
    </svg>
  )

  const content = showSignature ? (
    <div className="inline-flex flex-col items-center gap-1.5">
      {wordmark}
      <span
        className="text-[9px] font-medium uppercase tracking-[0.28em]"
        style={{ color: 'var(--muted-foreground)' }}
      >
        L'intérieur du cercle
      </span>
    </div>
  ) : (
    wordmark
  )

  if (!asLink) return content
  return (
    <Link
      to="/"
      className="inline-flex shrink-0"
      aria-label="Leclub.ia — Accueil"
    >
      {content}
    </Link>
  )
}
