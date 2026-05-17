import { Link } from '@tanstack/react-router'
import { cn } from '@/lib/utils'

export type BrandLogoSize = 'sm' | 'md' | 'lg' | 'xl'
export type BrandLogoVariant = 'primary' | 'inverse'

interface BrandLogoProps {
  size?: BrandLogoSize
  /**
   * - `primary` : texte noir "leclub" + ".ia" bleu vif. Pour fonds clairs.
   * - `inverse` : texte blanc "leclub" + ".ia" bleu vif. Pour fonds foncés.
   */
  variant?: BrandLogoVariant
  className?: string
  /** Si true (défaut), le logo est un <Link> vers "/". */
  asLink?: boolean
  /**
   * Si true, affiche l'eyebrow signature "L'INTÉRIEUR DU CERCLE" sous le
   * logo (uppercase, tracking large, très petit). Réservé au footer
   * landing pour poser l'identité — pas dans la sidebar app. Défaut: false.
   */
  showSignature?: boolean
}

// SVG sans capsule — texte pur. viewBox 200×48 plus compact.
const SIZE_STYLE: Record<BrandLogoSize, { width: number; height: number }> = {
  sm: { width: 100, height: 24 },
  md: { width: 140, height: 34 },
  lg: { width: 180, height: 43 },
  xl: { width: 240, height: 58 },
}

// Couleurs du nouveau logo : noir profond pour "leclub", bleu vif
// pour ".ia" (aligné sur --bleu-ciel-deep = #2563EB du design system).
const NOIR = '#0A0A0A'
const BLANC = '#FAFAF9'
const BLEU_IA = '#2563EB'

export function BrandLogo({
  size = 'md',
  variant = 'primary',
  className,
  asLink = true,
  showSignature = false,
}: BrandLogoProps) {
  const isInverse = variant === 'inverse'
  const textColor = isInverse ? BLANC : NOIR
  const dimensions = SIZE_STYLE[size]

  const svg = (
    <svg
      role="img"
      aria-label="Le Club IA"
      width={dimensions.width}
      height={dimensions.height}
      viewBox="0 0 200 48"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('block', className)}
    >
      <text
        x="100"
        y="36"
        fontFamily="'Bricolage Grotesque', Inter, system-ui, sans-serif"
        fontWeight={800}
        fontSize={36}
        fill={textColor}
        textAnchor="middle"
        letterSpacing="-0.045em"
      >
        leclub
        <tspan fill={BLEU_IA}>.ia</tspan>
      </text>
    </svg>
  )

  const content = showSignature ? (
    <div className="inline-flex flex-col items-center gap-1.5">
      {svg}
      <span
        className="text-[9px] font-medium uppercase tracking-[0.28em]"
        style={{ color: 'var(--muted-foreground)' }}
      >
        L'intérieur du cercle
      </span>
    </div>
  ) : (
    svg
  )

  if (!asLink) return content
  return (
    <Link
      to="/"
      className="inline-flex shrink-0"
      aria-label="Le Club IA — Accueil"
    >
      {content}
    </Link>
  )
}
