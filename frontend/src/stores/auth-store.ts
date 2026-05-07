import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Profile, Subscription } from '@/lib/database.types'

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
  signInWithGoogle: () => Promise<{ error: string | null }>
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

async function fetchProfileAndSubscription(userId: string): Promise<{
  profile: Profile | null
  subscription: Subscription | null
}> {
  const [profileRes, subRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
    supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  return {
    profile: (profileRes.data as Profile | null) ?? null,
    subscription: (subRes.data as Subscription | null) ?? null,
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

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (session?.user) {
      const { profile, subscription } = await fetchProfileAndSubscription(
        session.user.id,
      )
      set({ user: session.user, profile, subscription })
    }

    // Listener cross-tab : recharge le store si la session change ailleurs
    supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (event === 'SIGNED_OUT' || !newSession) {
        set({ user: null, profile: null, subscription: null })
        return
      }
      if (
        event === 'SIGNED_IN' ||
        event === 'TOKEN_REFRESHED' ||
        event === 'USER_UPDATED'
      ) {
        const { profile, subscription } = await fetchProfileAndSubscription(
          newSession.user.id,
        )
        set({ user: newSession.user, profile, subscription })
      }
    })

    set({ isLoading: false, isInitialized: true })
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

  signInWithGoogle: async () => {
    // Lance l'OAuth Google. Le navigateur est redirigé vers Google,
    // puis revient sur l'app avec un access_token. Le listener
    // onAuthStateChange (dans initialize) hydratera le store automatiquement.
    // Pré-requis : provider Google activé dans Supabase Auth → Providers.
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth`,
      },
    })
    if (error) {
      return { error: humanizeAuthError(error.message) }
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
    await supabase.auth.signOut()
    set({ user: null, profile: null, subscription: null, isLoading: false })
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
    return sub?.status === 'active' || sub?.status === 'trialing'
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
