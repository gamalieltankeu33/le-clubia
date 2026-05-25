import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { queryClient } from '@/lib/query-client'
import type { Profile, Subscription } from '@/lib/database.types'
import { setSentryUser } from '@/lib/sentry'
import { useNotificationsStore } from './notifications-store'
import { useCoachStore } from './coach-store'

/**
 * Cleanup complet à exécuter au logout (clic explicite OU SIGNED_OUT
 * cross-tab / token expiré). Vide TOUTES les sources de données du user
 * courant pour empêcher toute fuite vers un user qui se reconnecterait
 * juste après sur le même navigateur. RLS protège déjà côté DB, mais
 * sans ce cleanup les caches et stores satellites afficheraient ~500ms
 * les anciennes données avant de re-fetcher.
 *
 * Ordre :
 *   1. cancelQueries → stoppe les requêtes en cours (évite les toasts
 *      "Erreur réseau" malvenus pendant la déconnexion).
 *   2. queryClient.clear() → vide tous les caches React Query.
 *   3. notifications-store.reset() → vide les notifs + ferme les
 *      channels Realtime.
 *   4. coach-store.reset() → vide les conversations Coach IA.
 */
function clearAuthSideEffects() {
  void queryClient.cancelQueries()
  queryClient.clear()
  useNotificationsStore.getState().reset()
  useCoachStore.getState().reset()
  setSentryUser(null)
}

interface AuthState {
  user: User | null
  profile: Profile | null
  subscription: Subscription | null
  isLoading: boolean
  isInitialized: boolean

  // actions
  initialize: () => Promise<void>
  signUp: (email: string, password: string) => Promise<{ error: string | null }>
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  /** Envoie l'email de réinitialisation Supabase (lien valide ~1h). */
  requestPasswordReset: (email: string) => Promise<{ error: string | null }>
  /** Met à jour le mot de passe de l'utilisateur (session recovery active). */
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshUserData: () => Promise<void>

  // computed selectors (helpers, called as functions)
  isAuthenticated: () => boolean
  isMember: () => boolean
  isAdmin: () => boolean
}

async function fetchProfileAndSubscription(_userId: string): Promise<{
  profile: Profile | null
  subscription: Subscription | null
}> {
  // 1 RPC consolidée au lieu de 2 queries parallèles : économise 1
  // round-trip réseau + 1 preflight CORS sur le hot path d'auth.
  // La RPC lit auth.uid() côté serveur, donc on n'a plus besoin de
  // passer userId — on garde le paramètre pour ne pas casser les
  // call sites (il est juste ignoré).
  // Voir migration rpc_get_my_app_bootstrap.
  // @ts-expect-error - get_my_app_bootstrap est une RPC custom non typée dans Database['public']['Functions']
  const { data, error } = await supabase.rpc('get_my_app_bootstrap')
  if (error) {
    console.warn('[auth-store] get_my_app_bootstrap error:', error)
    return { profile: null, subscription: null }
  }
  const obj = data as
    | { profile?: Profile | null; subscription?: Subscription | null }
    | null
  return {
    profile: obj?.profile ?? null,
    subscription: obj?.subscription ?? null,
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  subscription: null,
  isLoading: false,
  isInitialized: false,

  initialize: async () => {
    if (get().isInitialized) return
    set({ isLoading: true })

    // Marque l'app comme initialisée une seule fois (idempotent).
    const markReady = () => {
      if (!get().isInitialized) {
        set({ isLoading: false, isInitialized: true })
      }
    }

    // ── 1. Listener AVANT tout await ───────────────────────────────────
    // Enregistré en premier (synchrone) pour ne rater aucun event émis
    // pendant le detectSessionInUrl du flow de récupération de mot de
    // passe (PASSWORD_RECOVERY / SIGNED_IN). C'est aussi ce listener qui
    // hydratera le user si getSession() était lent.
    //
    // ⚠️ DEADLOCK supabase-js : ce callback est invoqué PENDANT que le
    // verrou d'auth interne est tenu (ex. à l'intérieur de
    // signInWithPassword / signUp). Tout appel Supabase qui réclame ce
    // verrou — et supabase.rpc() en a besoin pour lire le token via
    // getSession() — provoque une attente circulaire : signInWithPassword
    // attend la fin du callback, qui attend la RPC, qui attend le verrou
    // tenu par signInWithPassword. Conséquence observée : au login d'un
    // nouveau membre (connexion fraîche), le spinner tourne à l'infini.
    // Fix (reco officielle Supabase) : on met le user à jour de façon
    // synchrone (aucun verrou requis) et on DÉFÈRE l'appel RPC hors du
    // callback via setTimeout(…, 0), une fois le verrou relâché.
    supabase.auth.onAuthStateChange((event, newSession) => {
      if (event === 'SIGNED_OUT') {
        clearAuthSideEffects()
        set({ user: null, profile: null, subscription: null })
        return
      }
      if (!newSession) {
        if (!get().user) {
          set({ user: null, profile: null, subscription: null })
        }
        return
      }
      if (
        event === 'SIGNED_IN' ||
        event === 'TOKEN_REFRESHED' ||
        event === 'USER_UPDATED' ||
        event === 'INITIAL_SESSION' ||
        event === 'PASSWORD_RECOVERY'
      ) {
        // user dispo immédiatement (pas de verrou nécessaire).
        set({ user: newSession.user })
        // Sentry connaît maintenant l'identité → quand ce user plantera,
        // on saura qui c'est dans le rapport d'erreur.
        setSentryUser({ id: newSession.user.id, email: newSession.user.email })
        // profil + abonnement : déférés HORS du verrou pour éviter le
        // deadlock (cf. note ci-dessus).
        setTimeout(async () => {
          try {
            const { profile, subscription } = await fetchProfileAndSubscription(
              newSession.user.id,
            )
            set({ profile, subscription })
          } catch {
            /* on garde au moins le user hydraté */
          }
          markReady()
        }, 0)
      }
    })

    // ── 2. Failsafe absolu ─────────────────────────────────────────────
    // L'écran de chargement (BootLoader) bloque tant que isInitialized
    // est false. Si getSession() se bloque (échange du code de
    // récupération PKCE, lock auth, réseau), l'app resterait figée à
    // l'infini. Ce timeout GARANTIT l'affichage en 3s max, quoi qu'il
    // arrive. Le listener ci-dessus complétera l'hydratation ensuite.
    const failsafe = window.setTimeout(markReady, 3000)

    // ── 3. Hydratation locale (rapide) ─────────────────────────────────
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const user = session?.user ?? null
      if (user) {
        const { profile, subscription } = await fetchProfileAndSubscription(
          user.id,
        )
        set({ user, profile, subscription })
      }
    } catch (e) {
      console.error('[auth] initialize: échec hydratation initiale', e)
    } finally {
      window.clearTimeout(failsafe)
      markReady()
    }
  },

  signUp: async (email, password) => {
    set({ isLoading: true })
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) {
      set({ isLoading: false })
      return { error: humanizeAuthError(error.message) }
    }
    if (data.user) {
      // Le trigger handle_new_user crée la ligne profiles. On la lit.
      const { profile, subscription } = await fetchProfileAndSubscription(
        data.user.id,
      )
      set({ user: data.user, profile, subscription, isLoading: false })

      // Best-effort : envoie l'email "Finalise ton inscription".
      // L'utilisateur a déjà sa session active à ce stade, donc supabase
      // injectera son JWT automatiquement. Si l'envoi échoue (Resend
      // down, etc.) on log mais on ne bloque pas — l'inscription reste
      // valide et l'utilisateur voit déjà la page abonnement.
      void supabase.functions
        .invoke('send-signup-email', { body: {} })
        .catch((err) => {
          console.warn('[signUp] send-signup-email failed', err)
        })
    } else {
      set({ isLoading: false })
    }
    return { error: null }
  },

  signIn: async (email, password) => {
    set({ isLoading: true })
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) {
      set({ isLoading: false })
      return { error: humanizeAuthError(error.message) }
    }
    if (data.user) {
      const { profile, subscription } = await fetchProfileAndSubscription(
        data.user.id,
      )
      set({ user: data.user, profile, subscription, isLoading: false })
    } else {
      set({ isLoading: false })
    }
    return { error: null }
  },

  requestPasswordReset: async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) return { error: humanizeAuthError(error.message) }
    return { error: null }
  },

  updatePassword: async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) return { error: humanizeAuthError(error.message) }
    return { error: null }
  },

  signOut: async () => {
    set({ isLoading: true })
    // Ordre : on cleanup AVANT le signOut côté Supabase pour annuler
    // les mutations en cours pendant que le JWT est encore valide
    // (sinon une mutation tardive partirait avec un JWT révoqué et
    // déclencherait un toast d'erreur 401).
    clearAuthSideEffects()
    await supabase.auth.signOut()
    set({ user: null, profile: null, subscription: null, isLoading: false })
    // Note : le listener onAuthStateChange ci-dessus va lui aussi être
    // déclenché par supabase.auth.signOut() avec event=SIGNED_OUT et
    // re-exécuter clearAuthSideEffects(). L'opération est idempotente
    // (clear sur cache vide = no-op, reset() sur store déjà vide aussi)
    // donc pas de souci.
  },

  refreshUserData: async () => {
    const user = get().user
    if (!user) return
    const { profile, subscription } = await fetchProfileAndSubscription(user.id)
    set({ profile, subscription })
  },

  isAuthenticated: () => get().user !== null,
  isMember: () => {
    const sub = get().subscription
    if (!sub) return false
    if (sub.status !== 'active' && sub.status !== 'trialing') return false
    // Cohérence avec is_active_member() côté DB (cf. 0001) qui exige
    // current_period_end IS NULL OR current_period_end > now(). Sans ce
    // check, l'UI peut considérer un membre "actif" alors que sa période
    // est techniquement expirée → toutes ses mutations seraient ensuite
    // bloquées par RLS sans que l'UI ne l'explique clairement.
    if (
      sub.current_period_end &&
      new Date(sub.current_period_end) < new Date()
    ) {
      return false
    }
    return true
  },
  isAdmin: () => get().profile?.role === 'admin',
}))

function humanizeAuthError(msg: string): string {
  const m = msg.toLowerCase()
  if (m.includes('invalid login') || m.includes('invalid credentials')) {
    return 'Email ou mot de passe incorrect.'
  }
  if (m.includes('user already registered') || m.includes('already exists')) {
    return 'Un compte existe déjà avec cet email.'
  }
  if (m.includes('password') && m.includes('characters')) {
    return 'Le mot de passe doit contenir au moins 8 caractères.'
  }
  if (m.includes('email') && m.includes('valid')) {
    return 'Adresse email invalide.'
  }
  if (m.includes('rate limit')) {
    return 'Trop de tentatives. Réessaie dans quelques minutes.'
  }
  return msg
}
