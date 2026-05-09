import { useCallback, useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from './supabase'
import { useAuthStore } from '@/stores/auth-store'

export interface ChapterProgressTracker {
  /**
   * À appeler depuis le player quand on a la position courante. Throttle
   * intégré : un appel RPC max toutes les 5 s, et seulement si le
   * pourcentage a augmenté. Pas de régression possible (le SQL fait
   * aussi un max() pour double-sécurité).
   */
  reportProgress: (currentSeconds: number, durationSeconds: number) => void

  /**
   * Force le chapitre à 100 % côté serveur (bouton "Marquer comme
   * terminé"). Renvoie une promesse pour permettre à l'appelant
   * d'afficher un état pending si voulu.
   */
  markComplete: () => Promise<void>

  /**
   * Envoie une dernière position (sans throttle) — typiquement appelé
   * au unmount ou au changement de chapitre pour ne pas perdre les
   * dernières secondes.
   */
  flushFinal: (currentSeconds?: number, durationSeconds?: number) => void
}

const MIN_INTERVAL_MS = 5_000

interface CallRpcArgs {
  chapterId: string
  percent: number
  positionSeconds: number
}

async function callUpdateChapterProgress({
  chapterId,
  percent,
  positionSeconds,
}: CallRpcArgs): Promise<void> {
  // @ts-expect-error - RPC custom non typée dans Database['public']['Functions']
  const { error } = await supabase.rpc('update_chapter_progress', {
    p_chapter_id: chapterId,
    p_progress_percent: Math.max(0, Math.min(100, Math.round(percent))),
    p_position_seconds: Math.max(0, Math.floor(positionSeconds)),
  })
  if (error) {
    console.warn('[chapter-progress] update_chapter_progress error', error)
  }
}

/**
 * Tracker de progression vidéo : un seul état par chapitre actif. Gère
 * throttle, anti-régression, fenêtre completed, et invalidations React
 * Query pour que le tube du catalogue se mette à jour en temps réel.
 *
 * Doit être appelé pour le chapitre courant. Quand chapterId change,
 * le tracker reset son état interne (lastSent, etc.).
 */
export function useChapterProgressTracker({
  chapterId,
  formationId,
  initialPercent,
  isCompleted,
  onJustCompleted,
}: {
  chapterId: string | null
  formationId: string | null
  initialPercent: number
  isCompleted: boolean
  /** Appelé une seule fois quand on franchit la barre des 90% pour ce chapitre. */
  onJustCompleted?: () => void
}): ChapterProgressTracker {
  const queryClient = useQueryClient()
  const userId = useAuthStore((s) => s.user?.id)

  // État interne par chapitre : on veut éviter les races quand le user
  // change de chapitre rapidement, donc on capture le chapterId au
  // moment de chaque tick.
  const lastSentPercentRef = useRef(initialPercent)
  const lastSentAtRef = useRef(0)
  const lastKnownPositionRef = useRef(0)
  const completedFiredRef = useRef(isCompleted)
  const onJustCompletedRef = useRef(onJustCompleted)
  onJustCompletedRef.current = onJustCompleted

  // Reset à chaque changement de chapitre.
  useEffect(() => {
    lastSentPercentRef.current = initialPercent
    lastSentAtRef.current = 0
    lastKnownPositionRef.current = 0
    completedFiredRef.current = isCompleted
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterId])

  const invalidateProgressQueries = useCallback(() => {
    if (!userId) return
    // Catalogue (tube Skool) — varie selon userId.
    queryClient.invalidateQueries({
      queryKey: ['formations', 'catalog', userId],
    })
    // Détail formation courante.
    if (formationId) {
      queryClient.invalidateQueries({
        queryKey: ['formation-progress', userId, formationId],
      })
    }
    // Card "Reprendre la formation" sur le dashboard.
    queryClient.invalidateQueries({
      queryKey: ['resume-formation', userId],
    })
    // Vue admin engagement (si présente).
    queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
  }, [queryClient, userId, formationId])

  const sendUpdate = useCallback(
    async (percent: number, positionSeconds: number) => {
      if (!chapterId || !userId) return
      const capturedChapterId = chapterId
      const wasCompleted = completedFiredRef.current
      lastSentPercentRef.current = Math.max(
        lastSentPercentRef.current,
        percent,
      )
      lastSentAtRef.current = Date.now()

      await callUpdateChapterProgress({
        chapterId: capturedChapterId,
        percent,
        positionSeconds,
      })

      // Bascule vers completed : trigger callback + invalidation.
      if (!wasCompleted && percent >= 90) {
        completedFiredRef.current = true
        onJustCompletedRef.current?.()
      }
      invalidateProgressQueries()
    },
    [chapterId, userId, invalidateProgressQueries],
  )

  const reportProgress = useCallback(
    (currentSeconds: number, durationSeconds: number) => {
      if (!chapterId || !durationSeconds || durationSeconds <= 0) return
      if (currentSeconds <= 0) return

      lastKnownPositionRef.current = currentSeconds
      const pct = Math.floor((currentSeconds / durationSeconds) * 100)

      // Anti-régression : on ne descend jamais.
      if (pct <= lastSentPercentRef.current) return

      // Throttle : 1 appel toutes les 5 s max.
      // Exception : on laisse passer le franchissement de 90% pour
      // déclencher l'auto-complete sans attendre.
      const now = Date.now()
      const justCrossed90 =
        !completedFiredRef.current &&
        pct >= 90 &&
        lastSentPercentRef.current < 90

      if (
        !justCrossed90 &&
        now - lastSentAtRef.current < MIN_INTERVAL_MS
      ) {
        return
      }

      void sendUpdate(pct, currentSeconds)
    },
    [chapterId, sendUpdate],
  )

  const markComplete = useCallback(async () => {
    if (!chapterId) return
    const pos = lastKnownPositionRef.current
    await sendUpdate(100, pos)
  }, [chapterId, sendUpdate])

  const flushFinal = useCallback(
    (currentSeconds?: number, durationSeconds?: number) => {
      if (!chapterId) return
      const pos = currentSeconds ?? lastKnownPositionRef.current
      const dur = durationSeconds ?? 0
      // Si on a une durée valide, recalcule un %. Sinon on n'envoie
      // que la position (le % reste celui déjà sauvegardé via max()).
      let pct = lastSentPercentRef.current
      if (dur > 0 && pos > 0) {
        pct = Math.max(pct, Math.floor((pos / dur) * 100))
      }
      void sendUpdate(pct, pos)
    },
    [chapterId, sendUpdate],
  )

  // Au unmount du composant qui utilise le tracker (changement de
  // chapitre, navigation ailleurs), on tente un dernier envoi si on a
  // une position connue mais qu'aucun tick n'a encore été envoyé pour
  // ce dernier état.
  useEffect(() => {
    return () => {
      const pos = lastKnownPositionRef.current
      if (pos > 0 && chapterId) {
        // On envoie ce qu'on sait — si on n'a jamais eu la durée,
        // on garde le pct courant.
        void callUpdateChapterProgress({
          chapterId,
          percent: lastSentPercentRef.current,
          positionSeconds: pos,
        })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterId])

  return { reportProgress, markComplete, flushFinal }
}
