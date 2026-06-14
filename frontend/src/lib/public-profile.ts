import { supabase } from './supabase'
import type { UserRole } from './database.types'

/**
 * Profil PUBLIC d'un membre (sans email, sans last_active_at quand non utile).
 * Utilisé pour hydrater les auteurs de posts/commentaires/notifications côté
 * communauté, sans fuiter l'adresse email.
 *
 * Côté backend : appelle la RPC `public_profiles_in(p_ids uuid[])` qui est
 * SECURITY DEFINER et ne retourne PAS l'email — la table profiles garde sa
 * RLS stricte "self or admin".
 */
export interface PublicProfile {
  id: string
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
  bio: string | null
  is_verified: boolean
  role: UserRole
  created_at: string
  last_active_at: string | null
  /** Numéro de membre — exposé par la RPC public_profiles_in (cf.
   *  migration 0039). Null tant que la migration n'est pas appliquée. */
  member_number?: number | null
}

export async function fetchPublicProfilesIn(
  ids: string[],
): Promise<PublicProfile[]> {
  const unique = [...new Set(ids.filter(Boolean))]
  if (unique.length === 0) return []
  // @ts-expect-error - RPC custom non typée dans Database['public']['Functions']
  const { data, error } = await supabase.rpc('public_profiles_in', {
    p_ids: unique,
  })
  if (error || !data) {
    if (error) console.error('public_profiles_in failed:', error)
    return []
  }
  return data as PublicProfile[]
}

export async function fetchPublicProfile(
  id: string,
): Promise<PublicProfile | null> {
  const list = await fetchPublicProfilesIn([id])
  return list[0] ?? null
}
