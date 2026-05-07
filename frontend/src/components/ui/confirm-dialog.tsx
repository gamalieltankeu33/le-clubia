import { useEffect, useId, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, Trash2, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: string
  description?: string
  /** Aperçu du contenu concerné (titre du post, nom de la formation…)
   *  affiché entre guillemets typographiques. */
  contentPreview?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'destructive'
  /** Icône custom. Sinon Trash2 pour destructive, AlertCircle pour default. */
  icon?: LucideIcon
}

const VARIANT_TONES: Record<
  NonNullable<ConfirmDialogProps['variant']>,
  { iconBg: string; iconText: string; defaultIcon: LucideIcon }
> = {
  destructive: {
    iconBg: 'bg-red-100',
    iconText: 'text-red-600',
    defaultIcon: Trash2,
  },
  default: {
    iconBg: 'bg-[var(--primary)]/10',
    iconText: 'text-[var(--primary)]',
    defaultIcon: AlertCircle,
  },
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  contentPreview,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  variant = 'destructive',
  icon,
}: ConfirmDialogProps) {
  const tones = VARIANT_TONES[variant]
  const Icon = icon ?? tones.defaultIcon

  const titleId = useId()
  const descId = useId()
  const confirmBtnRef = useRef<HTMLButtonElement>(null)

  // Échap pour fermer + body scroll lock + focus auto sur Confirmer
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    // Focus sur le bouton Confirmer pour permettre Enter direct.
    // Petit délai pour laisser le temps à l'animation de mount + à React
    // de poser le ref.
    const focusTimer = setTimeout(() => confirmBtnRef.current?.focus(), 50)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      clearTimeout(focusTimer)
    }
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            key="confirm-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Wrapper centrage : flex en bas (sheet) sur mobile, centré
              en desktop. z-index supérieur aux autres modales (60). */}
          <div
            className="pointer-events-none fixed inset-0 z-[61] flex items-end justify-center sm:items-center sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descId : undefined}
          >
            <motion.div
              key="confirm-dialog"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="pointer-events-auto flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-[var(--border)] bg-[var(--card)] shadow-2xl sm:rounded-2xl"
            >
              {/* Header avec icône */}
              <div className="flex shrink-0 items-start gap-4 px-6 pt-6">
                <span
                  className={cn(
                    'flex h-12 w-12 shrink-0 items-center justify-center rounded-full',
                    tones.iconBg,
                    tones.iconText,
                  )}
                  aria-hidden="true"
                >
                  <Icon className="h-6 w-6" />
                </span>
                <div className="min-w-0 flex-1 pt-1">
                  <h2
                    id={titleId}
                    className="font-display text-xl font-semibold tracking-tight"
                  >
                    {title}
                  </h2>
                </div>
              </div>

              {/* Body — scroll interne si très long */}
              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
                {contentPreview && (
                  <p className="rounded-lg border border-[var(--border)] bg-[var(--secondary)]/40 px-3 py-2 text-sm italic text-[var(--foreground-soft)]">
                    «&nbsp;{truncate(contentPreview, 160)}&nbsp;»
                  </p>
                )}
                {description && (
                  <p
                    id={descId}
                    className={cn(
                      'text-sm leading-relaxed text-[var(--muted-foreground)]',
                      contentPreview && 'mt-3',
                    )}
                  >
                    {description}
                  </p>
                )}
              </div>

              {/* Footer */}
              <div className="flex shrink-0 items-center justify-end gap-2 border-t border-[var(--border)] bg-[var(--background)] px-5 py-3">
                <Button variant="ghost" onClick={onClose}>
                  {cancelLabel}
                </Button>
                <Button
                  ref={confirmBtnRef}
                  onClick={onConfirm}
                  className={cn(
                    variant === 'destructive' &&
                      'bg-red-600 text-white hover:bg-red-700',
                  )}
                >
                  {confirmLabel}
                </Button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

function truncate(s: string, max: number): string {
  if (!s) return ''
  if (s.length <= max) return s
  return s.slice(0, max - 1).trimEnd() + '…'
}
