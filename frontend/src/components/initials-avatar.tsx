import { cn } from '@/lib/utils'

export function InitialsAvatar({
  firstName,
  lastName,
  email,
  size = 'md',
  className,
}: {
  firstName?: string | null
  lastName?: string | null
  email?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}) {
  const initials = computeInitials(firstName, lastName, email)
  const sizes = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-9 w-9 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-20 w-20 text-2xl',
  }
  return (
    <span
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center rounded-full bg-[var(--primary)] font-semibold text-[var(--primary-foreground)]',
        sizes[size],
        className,
      )}
      aria-hidden="true"
    >
      {initials}
    </span>
  )
}

function computeInitials(
  firstName?: string | null,
  lastName?: string | null,
  email?: string | null,
): string {
  const f = firstName?.trim()?.[0]
  const l = lastName?.trim()?.[0]
  if (f && l) return (f + l).toUpperCase()
  if (f) return f.toUpperCase()
  if (email) return email.trim()[0]?.toUpperCase() ?? 'M'
  return 'M'
}
