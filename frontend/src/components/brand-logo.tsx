import { Link } from '@tanstack/react-router'
import { cn } from '@/lib/utils'

export type BrandLogoSize = 'sm' | 'md' | 'lg' | 'xl'
export type BrandLogoVariant = 'primary' | 'inverse'

interface BrandLogoProps {
  size?: BrandLogoSize
  /**
   * - `primary` : wordmark complet (symbole + texte noir + ".ia" bleu).
   *               Pour fonds clairs.
   * - `inverse` : sur fond sombre, on rabat sur le symbole SEUL (les arcs
   *               bleus restent lisibles). On n'a pas de version "Leclub"
   *               en blanc côté designer pour l'instant ; quand elle
   *               arrivera, on changera ce branchement.
   */
  variant?: BrandLogoVariant
  className?: string
  /** Si true (défaut), le logo est un <Link> vers "/". */
  asLink?: boolean
  /**
   * `wordmark` (défaut) : symbole + texte "Leclub.ia" côte à côte.
   * `mark`              : symbole seul, format carré.
   *
   * Note : si `variant === 'inverse'`, on force toujours `mark` quel
   * que soit ce prop (texte noir illisible sur fond sombre).
   */
  display?: 'wordmark' | 'mark'
  /**
   * Si true, affiche l'eyebrow signature "L'INTÉRIEUR DU CERCLE" sous le
   * logo (uppercase, tracking large, très petit). Réservé au footer
   * landing.
   */
  showSignature?: boolean
}

// Le wordmark fait 1820×415 en source (ratio ~4.4:1) — on respecte ce
// ratio pour éviter toute distorsion. Le mark est carré 410×410.
const WORDMARK_SIZE: Record<BrandLogoSize, { width: number; height: number }> = {
  sm: { width: 100, height: 24 },
  md: { width: 150, height: 34 },
  lg: { width: 190, height: 43 },
  xl: { width: 250, height: 58 },
}

const MARK_SIZE: Record<BrandLogoSize, number> = {
  sm: 24,
  md: 34,
  lg: 43,
  xl: 58,
}

const WORDMARK_SRC = '/brand/wordmark.png'
const MARK_SRC = '/brand/mark.png'

export function BrandLogo({
  size = 'md',
  variant = 'primary',
  className,
  asLink = true,
  display = 'wordmark',
  showSignature = false,
}: BrandLogoProps) {
  // Sur fond sombre, on tombe sur le mark seul (les arcs bleus passent
  // bien) — voir docstring de `variant` ci-dessus.
  const effectiveDisplay: 'wordmark' | 'mark' =
    variant === 'inverse' ? 'mark' : display

  // ── Variante "mark" : symbole seul, carré ────────────────────────────
  if (effectiveDisplay === 'mark') {
    const sideLength = MARK_SIZE[size]
    const markImg = (
      <img
        src={MARK_SRC}
        alt="Leclub.ia"
        width={sideLength}
        height={sideLength}
        decoding="async"
        className={cn('block select-none', className)}
        draggable={false}
      />
    )
    if (!asLink) return markImg
    return (
      <Link
        to="/"
        className="inline-flex shrink-0"
        aria-label="Leclub.ia — Accueil"
      >
        {markImg}
      </Link>
    )
  }

  // ── Variante "wordmark" : symbole + texte côte à côte ────────────────
  const { width, height } = WORDMARK_SIZE[size]
  const wordmarkImg = (
    <img
      src={WORDMARK_SRC}
      alt="Leclub.ia"
      width={width}
      height={height}
      decoding="async"
      className={cn('block select-none', className)}
      draggable={false}
    />
  )

  const content = showSignature ? (
    <div className="inline-flex flex-col items-center gap-1.5">
      {wordmarkImg}
      <span
        className="text-[9px] font-medium uppercase tracking-[0.28em]"
        style={{ color: 'var(--muted-foreground)' }}
      >
        L'intérieur du cercle
      </span>
    </div>
  ) : (
    wordmarkImg
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
