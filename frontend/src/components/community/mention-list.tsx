import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import { AvatarDisplay } from '@/components/avatar-display'
import { VerifiedBadge } from '@/components/verified-badge'
import { cn } from '@/lib/utils'

export interface MentionItem {
  id: string
  full_name: string | null
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
  bio: string | null
  is_verified: boolean
}

export interface MentionListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean
}

interface MentionListProps {
  items: MentionItem[]
  command: (item: { id: string; label: string }) => void
}

/**
 * Liste des suggestions affichée dans le popover Tippy au-dessus du
 * champ d'édition Tiptap. Gère la navigation clavier (↑↓ Enter Esc).
 */
export const MentionList = forwardRef<MentionListRef, MentionListProps>(
  function MentionList({ items, command }, ref) {
    const [selectedIndex, setSelectedIndex] = useState(0)

    useEffect(() => {
      setSelectedIndex(0)
    }, [items])

    function selectItem(index: number) {
      const item = items[index]
      if (!item) return
      const label =
        item.full_name ||
        [item.first_name, item.last_name].filter(Boolean).join(' ') ||
        'Membre'
      command({ id: item.id, label })
    }

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }) => {
        if (event.key === 'ArrowUp') {
          setSelectedIndex(
            (i) => (i + items.length - 1) % Math.max(items.length, 1),
          )
          return true
        }
        if (event.key === 'ArrowDown') {
          setSelectedIndex((i) => (i + 1) % Math.max(items.length, 1))
          return true
        }
        if (event.key === 'Enter') {
          selectItem(selectedIndex)
          return true
        }
        return false
      },
    }))

    if (items.length === 0) {
      return (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-3 text-xs text-[var(--muted-foreground)] shadow-lg">
          Aucun membre trouvé
        </div>
      )
    }

    return (
      <div className="max-h-72 w-72 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--card)] p-1 shadow-lg">
        {items.map((item, index) => {
          const fullName =
            item.full_name ||
            [item.first_name, item.last_name].filter(Boolean).join(' ') ||
            'Membre'
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => selectItem(index)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={cn(
                'flex w-full items-start gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm transition-colors',
                index === selectedIndex
                  ? 'bg-[var(--secondary)]'
                  : 'hover:bg-[var(--secondary)]',
              )}
            >
              <AvatarDisplay
                avatarUrl={item.avatar_url}
                firstName={item.first_name}
                lastName={item.last_name}
                email={null}
                isVerified={item.is_verified}
                size="sm"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <span className="truncate font-semibold">{fullName}</span>
                  {item.is_verified && (
                    <VerifiedBadge className="h-3 w-3 shrink-0" />
                  )}
                </div>
                {item.bio && (
                  <p className="line-clamp-1 text-xs text-[var(--muted-foreground)]">
                    {item.bio}
                  </p>
                )}
              </div>
            </button>
          )
        })}
      </div>
    )
  },
)
