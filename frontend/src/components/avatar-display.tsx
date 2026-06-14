import { Crown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { InitialsAvatar } from './initials-avatar'
import { VerifiedBadge } from './verified-badge'

type Size = 'sm' | 'md' | 'lg' | 'xl'

const SIZE_CLASSES: Record<Size, string> = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-9 w-9 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-20 w-20 text-2xl',
}

const BADGE_SIZE: Record<Size, string> = {
  sm: 'h-3.5 w-3.5 -bottom-0.5 -right-0.5',
  md: 'h-4 w-4 -bottom-0.5 -right-0.5',
  lg: 'h-5 w-5 -bottom-0.5 -right-0.5',
  xl: 'h-7 w-7 bottom-0 right-0',
}

const CROWN_SIZE: Record<Size, string> = {
  sm: 'h-4 w-4 -top-1.5 -right-1',
  md: 'h-4 w-4 -top-1.5 -right-1',
  lg: 'h-5 w-5 -top-2 -right-1.5',
  xl: 'h-7 w-7 -top-2.5 -right-2',
}

export function AvatarDisplay({
  avatarUrl,
  firstName,
  lastName,
  email,
  size = 'md',
  isVerified = false,
  isMonthlyWinner = false,
  className,
}: {
  avatarUrl?: string | null
  firstName?: string | null
  lastName?: string | null
  email?: string | null
  size?: Size
  isVerified?: boolean
  /** Membre du mois en cours : affiche une couronne ambre en haut-droite. */
  isMonthlyWinner?: boolean
  className?: string
}) {
  const wrapper = cn('relative inline-block shrink-0', className)
  const fullName =
    [firstName, lastName].filter(Boolean).join(' ').trim() || email || 'Membre'

  return (
    <span className={wrapper}>
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={fullName}
          loading="lazy"
          className={cn('rounded-full object-cover', SIZE_CLASSES[size])}
        />
      ) : (
        <InitialsAvatar
          firstName={firstName}
          lastName={lastName}
          email={email}
          size={size}
        />
      )}
      {isVerified && (
        <VerifiedBadge className={cn('absolute', BADGE_SIZE[size])} />
      )}
      {isMonthlyWinner && (
        <span
          className={cn(
            'absolute flex items-center justify-center rounded-full bg-[var(--or)] text-[var(--noir)] shadow-sm ring-2 ring-white',
            CROWN_SIZE[size],
          )}
          aria-label="Membre du mois"
          title="Membre du mois"
        >
          <Crown
            className="h-2.5 w-2.5 sm:h-3 sm:w-3"
            strokeWidth={2.5}
          />
        </span>
      )}
    </span>
  )
}
