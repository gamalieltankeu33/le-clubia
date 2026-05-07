import { useCallback, useRef, useState } from 'react'
import {
  ConfirmDialog as ConfirmDialogPrimitive,
  type ConfirmDialogProps,
} from '@/components/ui/confirm-dialog'

/** Options acceptées par `confirm()`. Tout sauf isOpen/onClose/onConfirm
 *  qui sont gérés par le hook. */
export type ConfirmOptions = Omit<
  ConfirmDialogProps,
  'isOpen' | 'onClose' | 'onConfirm'
>

interface UseConfirmReturn {
  /** Ouvre le dialog. Retourne une promesse qui résout :
   *  - true : l'utilisateur a cliqué Confirmer
   *  - false : l'utilisateur a cliqué Annuler / Échap / overlay */
  confirm: (options: ConfirmOptions) => Promise<boolean>
  /** Composant à monter dans le JSX (généralement en fin de return).
   *  Le rendu interne est conditionnel (return null tant que pas appelé)
   *  donc poser <ConfirmDialog /> n'a aucun coût avant la première
   *  utilisation. */
  ConfirmDialog: () => React.ReactElement | null
}

/**
 * Hook pour remplacer window.confirm() par un dialog premium branded.
 *
 * Usage :
 *   const { confirm, ConfirmDialog } = useConfirm()
 *
 *   async function handleDelete(post) {
 *     const ok = await confirm({
 *       title: 'Supprimer cette publication ?',
 *       contentPreview: post.content,
 *       description: 'Cette action est irréversible.',
 *       confirmLabel: 'Supprimer',
 *       variant: 'destructive',
 *     })
 *     if (!ok) return
 *     deleteMutation.mutate(post)
 *   }
 *
 *   return (
 *     <>
 *       <button onClick={() => handleDelete(post)}>…</button>
 *       <ConfirmDialog />
 *     </>
 *   )
 *
 * Le composant ConfirmDialog ne se monte effectivement (DOM + écouteurs)
 * que lorsqu'un confirm() a été déclenché — pas de coût initial.
 */
export function useConfirm(): UseConfirmReturn {
  const [opts, setOpts] = useState<ConfirmOptions | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const resolverRef = useRef<((value: boolean) => void) | null>(null)

  const confirm = useCallback(
    (options: ConfirmOptions): Promise<boolean> => {
      // Si un dialog précédent est encore en cours, on le résout à false
      // avant de l'écraser — sinon la promesse précédente resterait
      // pendante pour toujours.
      if (resolverRef.current) {
        resolverRef.current(false)
        resolverRef.current = null
      }
      return new Promise<boolean>((resolve) => {
        resolverRef.current = resolve
        setOpts(options)
        setIsOpen(true)
      })
    },
    [],
  )

  const close = useCallback((result: boolean) => {
    if (resolverRef.current) {
      resolverRef.current(result)
      resolverRef.current = null
    }
    setIsOpen(false)
    // On laisse `opts` en place pour que l'animation de sortie
    // (AnimatePresence) ait toujours du contenu à afficher pendant son
    // exit — il sera écrasé au prochain confirm().
  }, [])

  const handleClose = useCallback(() => close(false), [close])
  const handleConfirm = useCallback(() => close(true), [close])

  const ConfirmDialog = useCallback(() => {
    // Pas de premier confirm() encore appelé → rien à monter.
    if (!opts) return null
    return (
      <ConfirmDialogPrimitive
        {...opts}
        isOpen={isOpen}
        onClose={handleClose}
        onConfirm={handleConfirm}
      />
    )
  }, [opts, isOpen, handleClose, handleConfirm])

  return { confirm, ConfirmDialog }
}
