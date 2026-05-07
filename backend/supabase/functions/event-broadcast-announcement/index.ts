// Le Club IA — Edge Function "event-broadcast-announcement"
// Envoie l'email d'annonce d'un événement à tous les membres actifs avec
// opt-in (email_pref_event_announce = true), au moment de la publication.
//
// Appelée par :
//   • Le frontend admin (events.tsx) immédiatement après publication.
//   • Endpoint manuel (bouton "Re-annoncer") en cas d'urgence.
//
// Idempotence stricte :
//   - Refuse l'envoi si announcement_sent_at IS NOT NULL (sauf si force=true).
//   - Met à jour announcement_sent_at = now() AU DÉBUT de l'envoi pour
//     verrouiller le créneau et éviter une 2ème exécution concurrente.
//
// Auth bi-mode :
//   - service-role (Bearer = SUPABASE_SERVICE_ROLE_KEY) — pour appels
//     server-to-server (cron, autres edge functions).
//   - admin JWT (Bearer = JWT utilisateur, role=admin dans profiles) —
//     pour l'appel direct depuis la page admin events.
//
// Body :
//   {
//     "event_id": "uuid",
//     "force": false  // optionnel, bypasse le check announcement_sent_at
//   }
//
// Retour : { ok, sent_count, failed_count, skipped?, reason? }

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface Body {
  event_id: string
  force?: boolean
}

interface EventRow {
  id: string
  title: string
  description: string | null
  speaker_name: string | null
  starts_at: string
  meet_url: string | null
  cover_image_url: string | null
  is_published: boolean
  notify_on_publish: boolean
  announcement_sent_at: string | null
}

interface ProfileRow {
  id: string
  email: string
  first_name: string | null
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return jsonResponse(405, { ok: false, error: 'Méthode non autorisée.' })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  if (!supabaseUrl || !serviceKey) {
    return jsonResponse(200, {
      ok: false,
      error: 'Configuration Supabase manquante.',
    })
  }

  // Auth bi-mode
  const authHeader = req.headers.get('Authorization') ?? ''
  const token = authHeader.replace(/^Bearer\s+/i, '').trim()
  if (!token) {
    return jsonResponse(401, { ok: false, error: 'Auth requise.' })
  }
  const isServiceRole = token === serviceKey.trim()
  if (!isServiceRole) {
    // Vérification que c'est un admin via son JWT
    if (!anonKey) {
      return jsonResponse(500, {
        ok: false,
        error: 'SUPABASE_ANON_KEY manquante côté serveur.',
      })
    }
    const sbUser = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    })
    const {
      data: { user },
      error: userErr,
    } = await sbUser.auth.getUser()
    if (userErr || !user) {
      return jsonResponse(401, { ok: false, error: 'Session invalide.' })
    }
    const sbCheck = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    })
    const { data: profile } = await sbCheck
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()
    if (!profile || profile.role !== 'admin') {
      return jsonResponse(403, {
        ok: false,
        error: 'Accès réservé aux administrateurs.',
      })
    }
  }

  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return jsonResponse(400, { ok: false, error: 'JSON invalide.' })
  }
  if (!body.event_id) {
    return jsonResponse(400, { ok: false, error: 'event_id requis.' })
  }

  const sb = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  })

  // Rate limit : 3 envois d'annonce/heure max — applique uniquement aux
  // appels admin via JWT (mode A service-role bypass car c'est un appel
  // server-to-server contrôlé). La RPC check_rate_limit utilise
  // auth.uid(), donc on l'appelle avec un client JWT user dédié.
  if (!isServiceRole) {
    try {
      const sbUser = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
        auth: { persistSession: false },
      })
      const { data: rlData, error: rlErr } = await sbUser.rpc(
        'check_rate_limit',
        {
          p_action_type: 'event_email_send',
          p_max_count: 3,
          p_window_seconds: 3600,
        },
      )
      if (rlErr) {
        console.warn('[event-broadcast] rate_limit RPC error → fail open:', rlErr)
      } else {
        const row = (Array.isArray(rlData) ? rlData[0] : rlData) as
          | {
              allowed: boolean
              current_count: number
              retry_after_seconds: number
            }
          | undefined
        if (row && !row.allowed) {
          console.log(
            `[event-broadcast] Rate limit BLOCKED count=${row.current_count} retry=${row.retry_after_seconds}s`,
          )
          return jsonResponse(200, {
            ok: false,
            error: `Limite atteinte (3 envois d'annonce événement par heure). Réessaie dans ${Math.ceil(row.retry_after_seconds / 60)} minutes.`,
            retry_after_seconds: row.retry_after_seconds,
          })
        }
      }
    } catch (err) {
      console.warn('[event-broadcast] rate_limit check failed:', err)
      // fail open
    }
  }

  console.log('[event-broadcast] event_id=', body.event_id, 'force=', !!body.force)

  // 1. Récupère l'event
  const { data: ev, error: evErr } = await sb
    .from('events')
    .select(
      'id, title, description, speaker_name, starts_at, meet_url, cover_image_url, is_published, notify_on_publish, announcement_sent_at',
    )
    .eq('id', body.event_id)
    .maybeSingle<EventRow>()
  if (evErr) {
    console.error('[event-broadcast] event fetch error:', evErr)
    return jsonResponse(200, {
      ok: false,
      error: `Lecture event impossible : ${evErr.message}`,
    })
  }
  if (!ev) {
    return jsonResponse(200, {
      ok: false,
      error: 'Événement introuvable.',
      skipped: true,
      reason: 'not_found',
    })
  }

  // 2. Vérifications de pré-envoi
  if (!ev.is_published) {
    return jsonResponse(200, {
      ok: true,
      sent_count: 0,
      failed_count: 0,
      skipped: true,
      reason: 'event_not_published',
    })
  }
  if (!ev.notify_on_publish) {
    return jsonResponse(200, {
      ok: true,
      sent_count: 0,
      failed_count: 0,
      skipped: true,
      reason: 'notify_on_publish_disabled',
    })
  }
  if (ev.announcement_sent_at && !body.force) {
    return jsonResponse(200, {
      ok: true,
      sent_count: 0,
      failed_count: 0,
      skipped: true,
      reason: 'already_sent',
      already_sent_at: ev.announcement_sent_at,
    })
  }

  // 3. Verrouille immédiatement (idempotence concurrente)
  //    Si force=true, on n'écrase pas tout de suite — on le fera en fin
  //    pour conserver la trace du dernier envoi.
  const lockTimestamp = new Date().toISOString()
  if (!ev.announcement_sent_at) {
    const { error: lockErr } = await sb
      .from('events')
      .update({ announcement_sent_at: lockTimestamp })
      .eq('id', body.event_id)
      .is('announcement_sent_at', null)
    if (lockErr) {
      console.error('[event-broadcast] lock error:', lockErr)
      return jsonResponse(200, {
        ok: false,
        error: `Verrou impossible : ${lockErr.message}`,
      })
    }
  }

  // 4. Liste des destinataires actifs avec opt-in event_announce
  const { data: profiles, error: profErr } = await sb
    .from('profiles')
    .select('id, email, first_name, email_pref_event_announce')
    .eq('email_pref_event_announce', true)
  if (profErr) {
    console.error('[event-broadcast] profiles fetch error:', profErr)
    return jsonResponse(200, {
      ok: false,
      error: `profiles fetch → ${profErr.message}`,
    })
  }

  const ids = (profiles ?? []).map((p) => p.id)
  let activeIds = new Set<string>()
  if (ids.length > 0) {
    const { data: subs } = await sb
      .from('subscriptions')
      .select('user_id, status')
      .in('user_id', ids)
      .in('status', ['active', 'trialing'])
    activeIds = new Set((subs ?? []).map((s) => s.user_id))
  }
  const recipients = ((profiles ?? []) as Array<ProfileRow & {
    email_pref_event_announce: boolean
  }>).filter((p) => activeIds.has(p.id) && p.email)

  console.log(
    `[event-broadcast] event="${ev.title}" recipients=${recipients.length}`,
  )

  if (recipients.length === 0) {
    return jsonResponse(200, {
      ok: true,
      sent_count: 0,
      failed_count: 0,
      skipped: true,
      reason: 'no_recipients',
    })
  }

  // 5. Envoi par batch de 10 (limite Resend gratuite + parallélisation safe)
  const sendUrl = `${supabaseUrl}/functions/v1/send-email`
  const BATCH = 10
  let sent = 0
  let failed = 0
  for (let i = 0; i < recipients.length; i += BATCH) {
    const slice = recipients.slice(i, i + BATCH)
    const results = await Promise.allSettled(
      slice.map((r) =>
        fetch(sendUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${serviceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'event-announcement',
            to: r.email,
            data: {
              member_first_name: r.first_name ?? '',
              event_id: ev.id,
              event_title: ev.title,
              event_starts_at: ev.starts_at,
              event_description: ev.description,
              event_speaker_name: ev.speaker_name,
              event_meet_url: ev.meet_url,
              event_cover_image_url: ev.cover_image_url,
            },
          }),
        }).then((res) => res.json()),
      ),
    )
    for (const res of results) {
      if (res.status === 'fulfilled' && (res.value as { ok?: boolean }).ok) {
        sent++
      } else {
        failed++
        if (res.status === 'rejected') {
          console.error('[event-broadcast] send rejected:', res.reason)
        } else if (!(res.value as { ok?: boolean }).ok) {
          console.error('[event-broadcast] send fail:', res.value)
        }
      }
    }
  }

  // 6. Si force=true, on met à jour le timestamp même si déjà sent.
  if (body.force) {
    await sb
      .from('events')
      .update({ announcement_sent_at: new Date().toISOString() })
      .eq('id', body.event_id)
  }

  console.log(
    `[event-broadcast] event="${ev.title}" sent=${sent}/${recipients.length} failed=${failed}`,
  )

  return jsonResponse(200, {
    ok: true,
    sent_count: sent,
    failed_count: failed,
    total: recipients.length,
  })
})

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
