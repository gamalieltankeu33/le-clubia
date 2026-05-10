import { Link } from '@tanstack/react-router'
import { cn } from '@/lib/utils'

export type BrandLogoSize = 'sm' | 'md' | 'lg' | 'xl'
export type BrandLogoVariant = 'primary' | 'inverse'

interface BrandLogoProps {
  size?: BrandLogoSize
  /**
   * - `primary` : capsule bleu Bloomberg + texte blanc cassé + point
   *   émeraude (par défaut).
   * - `inverse` : capsule blanche + bordure bleue + texte bleu + point
   *   émeraude. À utiliser sur fond très foncé/coloré où la capsule
   *   bleue serait peu lisible.
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

// Capsule SVG de viewBox 200×72.
const SIZE_STYLE: Record<BrandLogoSize, { width: number; height: number }> = {
  sm: { width: 100, height: 36 },
  md: { width: 140, height: 50 },
  lg: { width: 175, height: 63 },
  xl: { width: 240, height: 86 },
}

const BLEU = '#0F1E4D'
const BLANC = '#FAFAF9'
const BLEU_CIEL = '#60A5FA'

export function BrandLogo({
  size = 'md',
  variant = 'primary',
  className,
  asLink = true,
  showSignature = false,
}: BrandLogoProps) {
  const isInverse = variant === 'inverse'
  const fillBg = isInverse ? BLANC : BLEU
  const textColor = isInverse ? BLEU : BLANC
  const strokeColor = isInverse ? BLEU : 'none'
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
      <defs>
        {/* Halo bleu ciel derrière le point — signature harmonique bleue */}
        <radialGradient id="bleuCielHalo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={BLEU_CIEL} stopOpacity="0.55" />
          <stop offset="100%" stopColor={BLEU_CIEL} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Capsule pilule */}
      <rect
        x={isInverse ? 1.5 : 0}
        y={isInverse ? 1.5 : 0}
        width={isInverse ? 197 : 200}
        height={isInverse ? 69 : 72}
        rx={36}
        fill={fillBg}
        stroke={strokeColor}
        strokeWidth={isInverse ? 2.5 : 0}
      />

      {/* "leclub.ia" — point bleu ciel (harmonie chromatique avec la
          capsule bleu Bloomberg). */}
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
        <tspan fill={BLEU_CIEL} fontWeight={800} fontSize={36}>
          .
        </tspan>
        ia
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
