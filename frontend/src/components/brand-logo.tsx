import { Link } from '@tanstack/react-router'
import { cn } from '@/lib/utils'

export type BrandLogoSize = 'sm' | 'md' | 'lg' | 'xl'
export type BrandLogoVariant = 'primary' | 'inverse'

interface BrandLogoProps {
  /** Taille visuelle du logo. Défaut : md. */
  size?: BrandLogoSize
  /**
   * 'primary' = capsule bleu profond + texte blanc (sur fond clair).
   * 'inverse' = capsule blanche + bordure bleue + texte bleu (sur fond bleu/sombre).
   */
  variant?: BrandLogoVariant
  className?: string
  /** Si true (défaut), le logo est un <Link> vers "/". */
  asLink?: boolean
}

// Capsule SVG de viewBox 200×72 (ratio ~2.78).
// Ratio resserré par rapport à la V1 (240×72) pour réduire le padding
// horizontal interne et donner plus de présence au texte "leclub.ia".
// Toutes les tailles gardent ce ratio pour éviter toute distorsion.
const SIZE_STYLE: Record<BrandLogoSize, { width: number; height: number }> = {
  sm: { width: 100, height: 36 },
  md: { width: 140, height: 50 },
  lg: { width: 175, height: 63 },
  xl: { width: 240, height: 86 },
}

const PRIMARY_BG = '#1E40AF'
const INVERSE_BG = '#FFFFFF'
const ACCENT = '#F97316'

export function BrandLogo({
  size = 'md',
  variant = 'primary',
  className,
  asLink = true,
}: BrandLogoProps) {
  const isInverse = variant === 'inverse'
  const fillBg = isInverse ? INVERSE_BG : PRIMARY_BG
  const textColor = isInverse ? PRIMARY_BG : '#FFFFFF'
  const dimensions = SIZE_STYLE[size]

  const svg = (
    <svg
      role="img"
      aria-label="Le Club IA"
      width={dimensions.width}
      height={dimensions.height}
      viewBox="0 0 200 72"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('block', className)}
    >
      {/* Capsule pilule — rx = height/2 pour un arrondi parfait */}
      <rect
        x={isInverse ? 1.5 : 0}
        y={isInverse ? 1.5 : 0}
        width={isInverse ? 197 : 200}
        height={isInverse ? 69 : 72}
        rx={36}
        fill={fillBg}
        stroke={isInverse ? PRIMARY_BG : 'none'}
        strokeWidth={isInverse ? 3 : 0}
      />
      {/* "leclub.ia" — point orange. Centré x=100 sur viewBox 200. */}
      <text
        x="100"
        y="48"
        fontFamily="'Bricolage Grotesque', Inter, system-ui, sans-serif"
        fontWeight={700}
        fontSize={32}
        fill={textColor}
        textAnchor="middle"
        letterSpacing="-0.02em"
      >
        leclub
        <tspan fill={ACCENT} fontWeight={800}>
          .
        </tspan>
        ia
      </text>
    </svg>
  )

  if (!asLink) return svg
  return (
    <Link to="/" className="inline-flex shrink-0" aria-label="Le Club IA — Accueil">
      {svg}
    </Link>
  )
}
