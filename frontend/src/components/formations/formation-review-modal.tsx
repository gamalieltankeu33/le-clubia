import { useState, useId, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Star, Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

interface FormationReviewModalProps {
  isOpen: boolean
  onClose: () => void
  formationId: string
  formationTitle: string
  chapterId?: string | null // Nouveau
  chapterTitle?: string | null // Nouveau
  userId: string
}

export function FormationReviewModal({
  isOpen,
  onClose,
  formationId,
  formationTitle,
  chapterId = null,
  chapterTitle = null,
  userId,
}: FormationReviewModalProps) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const queryClient = useQueryClient()
  const titleId = useId()

  const isChapterReview = !!chapterId

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setRating(0)
      setHoverRating(0)
      setComment('')
    }
  }, [isOpen])

  const mutation = useMutation({
    mutationFn: async () => {
      if (rating === 0) throw new Error('Note requise')
      const { error } = await supabase.from('formation_reviews').insert({
        user_id: userId,
        formation_id: formationId,
        chapter_id: chapterId,
        rating,
        comment: comment.trim() || null,
      })
      if (error) throw error
    },
    // Optimistic update : on ajoute l'avis dans le cache AVANT le retour
    // serveur. Sans ça, le useEffect parent qui surveille `reviewedChapterIds`
    // peut redéclencher le modal en boucle juste après fermeture car
    // l'invalidate refetch est asynchrone (latence réseau).
    onMutate: async () => {
      const key = ['formation-reviews', userId, formationId]
      await queryClient.cancelQueries({ queryKey: key })
      const prev = queryClient.getQueryData(key)
      queryClient.setQueryData(key, (data: unknown) => {
        const list = Array.isArray(data) ? data : []
        return [
          ...list,
          {
            user_id: userId,
            formation_id: formationId,
            chapter_id: chapterId,
            rating,
            comment: comment.trim() || null,
            created_at: new Date().toISOString(),
          },
        ]
      })
      return { prev }
    },
    onSuccess: () => {
      toast.success('Merci pour ton avis !')
      queryClient.invalidateQueries({
        queryKey: ['formation-reviews', userId, formationId],
      })
      onClose()
    },
    onError: (err: any, _vars, ctx: unknown) => {
      const c = ctx as { prev?: unknown } | undefined
      if (c?.prev !== undefined) {
        queryClient.setQueryData(
          ['formation-reviews', userId, formationId],
          c.prev,
        )
      }
      toast.error(err.message || 'Une erreur est survenue.')
    },
  })

  // Body scroll lock
  useEffect(() => {
    if (!isOpen) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            key="review-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-md"
            onClick={onClose}
          />

          <div className="fixed inset-0 z-[71] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              key="review-dialog"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--card)] p-8 shadow-2xl md:p-10"
            >
              {/* Cinematic Background */}
              <div className="pointer-events-none absolute inset-0 -z-10 opacity-30">
                <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[var(--primary)] blur-[80px]" />
                <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-[var(--accent)] blur-[80px]" />
              </div>

              <div className="text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)]">
                  <Sparkles className="h-8 w-8" />
                </div>
                
                <h2 id={titleId} className="font-display text-2xl font-bold tracking-tight md:text-3xl">
                  {isChapterReview ? 'Module terminé ! 📖' : 'Félicitations ! 🎉'}
                </h2>
                <p className="mt-2 text-[var(--muted-foreground)]">
                  {isChapterReview ? (
                    <>
                      Tu as validé : <br />
                      <span className="font-semibold text-[var(--foreground)]">« {chapterTitle} »</span>
                    </>
                  ) : (
                    <>
                      Tu as terminé la formation :<br />
                      <span className="font-semibold text-[var(--foreground)]">« {formationTitle} »</span>
                    </>
                  )}
                </p>
                
                <p className="mt-6 text-sm font-medium uppercase tracking-widest text-[var(--muted-foreground)]">
                  {isChapterReview ? "Qu'as-tu pensé de ce module ?" : "Qu'en as-tu pensé au global ?"}
                </p>

                {/* Star Rating */}
                <div className="mt-4 flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="group relative p-1 transition-transform hover:scale-110 active:scale-95"
                    >
                      <Star
                        className={cn(
                          "h-10 w-10 transition-colors duration-300",
                          (hoverRating || rating) >= star
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-[var(--border)]"
                        )}
                      />
                      {(hoverRating || rating) >= star && (
                         <motion.div
                           layoutId="star-glow"
                           className="absolute inset-0 -z-10 blur-xl bg-yellow-400/20 rounded-full"
                         />
                      )}
                    </button>
                  ))}
                </div>

                <div className="mt-8 space-y-4">
                  <Textarea
                    placeholder="Un petit mot sur ce que tu as appris ou ce qu'on peut améliorer ? (optionnel)"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="min-h-[120px] resize-none rounded-2xl border-[var(--border)] bg-[var(--secondary)]/30 p-4 focus:ring-[var(--primary)]"
                  />
                  
                  <div className="flex flex-col gap-3 pt-2">
                    <Button
                      onClick={() => mutation.mutate()}
                      disabled={rating === 0 || mutation.isPending}
                      className="cta-primary w-full py-6 text-lg"
                    >
                      {mutation.isPending ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        'Envoyer mon avis'
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={onClose}
                      disabled={mutation.isPending}
                      className="text-[var(--muted-foreground)]"
                    >
                      Passer pour l'instant
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
