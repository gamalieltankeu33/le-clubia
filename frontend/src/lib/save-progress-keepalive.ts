import { supabase } from './supabase'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

/**
 * Sauvegarde la position de visionnage avec `keepalive: true`.
 * Appelée typiquement dans `beforeunload` : la requête est autorisée à
 * survivre à la fermeture de l'onglet.
 *
 * On ne peut pas faire de "await" ici (l'évènement est synchrone), on lance
 * la requête en feu-et-oubli. C'est le compromis voulu.
 */
export async function saveProgressKeepalive(args: {
  userId: string
  formationId: string
  chapterId: string
  seconds: number
}): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return
  const { data } = await supabase.auth.getSession()
  const accessToken = data.session?.access_token
  if (!accessToken) return

  try {
    fetch(
      `${SUPABASE_URL}/rest/v1/user_formation_progress?on_conflict=user_id,chapter_id`,
      {
        method: 'POST',
        keepalive: true,
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          // Upsert
          Prefer: 'resolution=merge-duplicates,return=minimal',
        },
        body: JSON.stringify({
          user_id: args.userId,
          formation_id: args.formationId,
          chapter_id: args.chapterId,
          last_position_seconds: args.seconds,
        }),
      },
    ).catch(() => {})
  } catch {
    // noop : on est dans un beforeunload, le navigateur va couper
  }
}
