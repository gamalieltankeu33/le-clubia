// Helper rate limiting côté client.
// Branché sur la RPC SECURITY DEFINER `check_rate_limit` (cf. migration
// 0024) qui vérifie ET log atomiquement l'action.
//
// Usage typique :
//
//   import { checkRateLimit, formatRateLimitToast } from '@/lib/use-rate-limit'
//
//   const rl = await checkRateLimit('post_create')
//   if (!rl.allowed) {
//     toast.error(formatRateLimitToast('post_create', rl))
//     return
//   }
//   // Procéder à la mutation...
//
// Important : le check INSÈRE le record de tracking en cas d'autorisation.
// Donc on l'appelle UNE SEULE FOIS par tentative d'action, juste avant la
// mutation principale. Si la mutation échoue après le check, le quota
// est quand même décompté — c'est volontaire (anti-spam : un attaquant
// qui spam des actions qui échouent doit aussi être ralenti).

import { supabase } from './supabase'

export type RateLimitAction =
  | 'post_create'
  | 'comment_create'
  | 'post_like'
  | 'mention_search'
  | 'news_manual'
  | 'event_email_send'

export interface RateLimitConfig {
  maxCount: number
  windowSeconds: number
  /** Libellé court affiché dans le toast (ex : "10 publications/heure"). */
  humanLimit: string
}

/**
 * Configuration centralisée des limites par action. À ajuster selon le
 * monitoring en prod. Les valeurs initiales sont calibrées pour :
 *   - être confortables pour un usage humain normal,
 *   - bloquer les bots / scripts d'abus.
 */
export const RATE_LIMITS: Record<RateLimitAction, RateLimitConfig> = {
  post_create:      { maxCount: 10,  windowSeconds: 3600,  humanLimit: '10 publications par heure' },
  comment_create:   { maxCount: 30,  windowSeconds: 3600,  humanLimit: '30 commentaires par heure' },
  post_like:        { maxCount: 100, windowSeconds: 60,    humanLimit: '100 likes par minute' },
  mention_search:   { maxCount: 20,  windowSeconds: 60,    humanLimit: '20 recherches @mention par minute' },
  news_manual:      { maxCount: 5,   windowSeconds: 86400, humanLimit: '5 lancements de l\'agent IA par jour' },
  event_email_send: { maxCount: 3,   windowSeconds: 3600,  humanLimit: '3 envois d\'annonce événement par heure' },
}

export interface RateLimitResult {
  allowed: boolean
  currentCount: number
  resetAt: Date | null
  retryAfterSeconds: number
  /** Phrase humaine "Réessaie dans X secondes/minutes/heures". Vide si allowed. */
  message: string
}

/**
 * Appelle la RPC check_rate_limit. Retourne { allowed, retryAfterSeconds,
 * message }. En cas d'erreur réseau ou DB, on ÉCHOUE OUVERT (allowed=true)
 * pour ne pas bloquer les utilisateurs si la table rate_limits a un
 * problème — c'est un mécanisme de protection, pas une fonctionnalité
 * critique. L'erreur est loggée en console pour monitoring.
 */
export async function checkRateLimit(
  action: RateLimitAction,
): Promise<RateLimitResult> {
  const config = RATE_LIMITS[action]
  // @ts-expect-error - check_rate_limit est une RPC custom non typée dans Database['public']['Functions']
  const { data, error } = await supabase.rpc('check_rate_limit', {
    p_action_type: action,
    p_max_count: config.maxCount,
    p_window_seconds: config.windowSeconds,
  })

  if (error) {
    console.warn('[rate-limit]', action, 'RPC error → fail open:', error)
    return {
      allowed: true,
      currentCount: 0,
      resetAt: null,
      retryAfterSeconds: 0,
      message: '',
    }
  }

  // La RPC retourne un set d'1 ligne : ARRAY ou single selon le client.
  const row = (Array.isArray(data) ? data[0] : data) as
    | {
        allowed: boolean
        current_count: number
        reset_at: string | null
        retry_after_seconds: number
      }
    | undefined

  if (!row) {
    // Cas exceptionnel — réponse vide, on échoue ouvert.
    console.warn('[rate-limit]', action, 'empty response → fail open')
    return {
      allowed: true,
      currentCount: 0,
      resetAt: null,
      retryAfterSeconds: 0,
      message: '',
    }
  }

  return {
    allowed: row.allowed,
    currentCount: row.current_count,
    resetAt: row.reset_at ? new Date(row.reset_at) : null,
    retryAfterSeconds: row.retry_after_seconds,
    message: row.allowed ? '' : formatRetryDelay(row.retry_after_seconds),
  }
}

/** Formate le délai d'attente en français, granularité humaine. */
function formatRetryDelay(seconds: number): string {
  if (seconds <= 1) return 'Réessaie dans 1 seconde.'
  if (seconds < 60) return `Réessaie dans ${seconds} secondes.`
  if (seconds < 3600) {
    const m = Math.ceil(seconds / 60)
    return `Réessaie dans ${m} minute${m > 1 ? 's' : ''}.`
  }
  const h = Math.ceil(seconds / 3600)
  return `Réessaie dans ${h} heure${h > 1 ? 's' : ''}.`
}

/**
 * Compose un message de toast complet pour l'utilisateur final, en
 * combinant la limite humaine de l'action + le délai de retry.
 */
export function formatRateLimitToast(
  action: RateLimitAction,
  result: RateLimitResult,
): string {
  if (result.allowed) return ''
  const config = RATE_LIMITS[action]
  return `Limite atteinte (${config.humanLimit}). ${result.message}`
}
