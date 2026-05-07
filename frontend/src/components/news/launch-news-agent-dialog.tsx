import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader2, Mail, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface LaunchNewsAgentDialogProps {
  isOpen: boolean
  onClose: () => void
  /** Callback exécuté après le clic sur "Lancer la recherche".
   *  Reçoit le flag `sendEmail` choisi par l'admin. La modale gère
   *  l'état "loading" en attendant que la promise se résolve, puis
   *  ferme automatiquement. */
  onConfirm: (input: { sendEmail: boolean }) => Promise<void>
}

/**
 * Modale dédiée au lancement manuel de l'agent IA. Diffère du
 * ConfirmDialog standard car elle expose une checkbox interactive
 * "Envoyer un email à tous les membres" (cochée par défaut) et garde
 * le dialog ouvert avec un loader pendant l'appel à l'edge function
 * (qui peut prendre 30-60s à cause d'OpenAI).
 */
export function LaunchNewsAgentDialog({
  isOpen,
  onClose,
  onConfirm,
}: LaunchNewsAgentDialogProps) {
  const [sendEmail, setSendEmail] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Reset à chaque réouverture
  useEffect(() => {
    if (isOpen) {
      setSendEmail(true)
      setSubmitting(false)
    }
  }, [isOpen])

  // Échap + body scroll lock
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) onClose()
    }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [isOpen, submitting, onClose])

  async function handleLaunch() {
    if (submitting) return
    setSubmitting(true)
    try {
      await onConfirm({ sendEmail })
      // Le parent décide quand fermer (typiquement au succès ou au
      // toast d'erreur) — on ferme par défaut côté ici aussi pour
      // simplifier le caller.
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="launch-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
            onClick={submitting ? undefined : onClose}
            aria-hidden="true"
          />
          <div
            className="pointer-events-none fixed inset-0 z-[61] flex items-end justify-center sm:items-center sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-label="Lancer l'agent IA"
          >
            <motion.div
              key="launch-dialog"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="pointer-events-auto flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-[var(--border)] bg-[var(--card)] shadow-2xl sm:rounded-2xl"
            >
              {/* Header */}
              <div className="flex shrink-0 items-start gap-4 px-6 pt-6">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/10 text-[var(--primary)]">
                  <Sparkles className="h-6 w-6" />
                </span>
                <div className="min-w-0 flex-1 pt-1">
                  <h2 className="font-display text-xl font-semibold tracking-tight">
                    Lancer une nouvelle recherche IA ?
                  </h2>
                </div>
                {!submitting && (
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Fermer"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Body */}
              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4 space-y-4">
                <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">
                  L'agent va scraper les sources RSS et générer un article
                  spécial sur l'actualité IA la plus marquante des dernières
                  48h. Cela peut prendre 30 à 60 secondes.
                </p>

                <label
                  className={cn(
                    'flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--background)] p-3 transition-colors',
                    !submitting && 'hover:bg-[var(--secondary)]/40',
                    submitting && 'opacity-60 cursor-not-allowed',
                  )}
                >
                  <input
                    type="checkbox"
                    checked={sendEmail}
                    onChange={(e) => setSendEmail(e.target.checked)}
                    disabled={submitting}
                    className="mt-0.5 h-4 w-4 cursor-pointer accent-[var(--primary)]"
                  />
                  <span className="flex-1">
                    <span className="flex items-center gap-1.5 text-sm font-medium">
                      <Mail className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
                      Envoyer un email à tous les membres
                    </span>
                    <span className="mt-0.5 block text-xs text-[var(--muted-foreground)]">
                      Tous les membres actifs avec opt-in recevront l'article
                      par email. Une notification in-app est envoyée dans
                      tous les cas.
                    </span>
                  </span>
                </label>

                {submitting && (
                  <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--secondary)]/40 px-4 py-3 text-sm">
                    <Loader2 className="h-4 w-4 animate-spin text-[var(--primary)]" />
                    <span className="text-[var(--muted-foreground)]">
                      Recherche en cours… ne ferme pas cet onglet.
                    </span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex shrink-0 items-center justify-end gap-2 border-t border-[var(--border)] bg-[var(--background)] px-5 py-3">
                <Button
                  variant="ghost"
                  onClick={onClose}
                  disabled={submitting}
                >
                  Annuler
                </Button>
                <Button onClick={handleLaunch} disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Recherche en cours…
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Lancer la recherche
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
