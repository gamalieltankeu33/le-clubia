// Le Club IA — Edge Function "events-reminder-cron"
// Déclenchée tous les jours à 9h UTC par pg_cron (cf. migration 0017).
// Envoie 2 vagues de rappels :
//   • J-1  : aux events publiés qui démarrent demain
//   • Today : aux events publiés qui démarrent aujourd'hui
//
// Pour chaque event éligible, l'envoi est idempotent grâce aux colonnes
// `reminder_1day_sent_at` / `reminder_today_sent_at` mises à jour après
// envoi. Le cron peut être relancé sans risque de double envoi.
//
// Auth : service-role uniquement (cron pg_cron OU test admin curl).

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'
import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts'

interface EventRow {
  id: string
  title: string
  description: string | null
  speaker_name: string | null
  starts_at: string
  meet_url: string | null
  cover_image_url: string | null
  notify_1_day_before: boolean
  notify_on_day: boolean
  reminder_1day_sent_at: string | null
  reminder_today_sent_at: string | null
}

interface ProfileRow {
  id: string
  email: string
  first_name: string | null
  email_pref_event_reminders: boolean
}

interface RunStats {
  ok: boolean
  started_at: string
  finished_at: string
  events_today: number
  events_tomorrow: number
  emails_sent: number
  emails_failed: number
  errors: string[]
}

serve(async (req: Request) => {
  const preflight = handleCorsPreflight(req)
  if (preflight) return preflight
  const corsHeaders = getCorsHeaders(req)
  const jsonResponse = (status: number, body: unknown): Response =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  if (req.method !== 'POST') {
    return jsonResponse(405, { error: 'Méthode non autorisée.' })
  }

  // Config
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  if (!supabaseUrl || !serviceKey) {
    console.error('[events-reminder-cron] Config Supabase manquante')
    return jsonResponse(200, {
      ok: false,
      error: 'Configuration Supabase manquante.',
    })
  }

  // Auth service-role uniquement
  const auth = (req.headers.get('Authorization') ?? '')
    .replace(/^Bearer\s+/i, '')
    .trim()
  if (auth !== serviceKey.trim()) {
    return jsonResponse(401, { error: 'Service-role requis.' })
  }

  const sb = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  })

  const stats: RunStats = {
    ok: true,
    started_at: new Date().toISOString(),
    finished_at: '',
    events_today: 0,
    events_tomorrow: 0,
    emails_sent: 0,
    emails_failed: 0,
    errors: [],
  }
  console.log('[events-reminder-cron] Pipeline démarré')

  try {
    // Fenêtres temporelles UTC : aujourd'hui [00:00, 24:00) et demain
    const now = new Date()
    const startToday = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        0,
        0,
        0,
      ),
    )
    const startTomorrow = new Date(startToday.getTime() + 86400 * 1000)
    const startDayAfter = new Date(startToday.getTime() + 2 * 86400 * 1000)

    // Récupère TOUS les events qui démarrent dans les 48h, publiés, et avec
    // au moins une notif activée non encore envoyée.
    const { data: events, error: evErr } = await sb
      .from('events')
      .select(
        'id, title, description, speaker_name, starts_at, meet_url, cover_image_url, notify_1_day_before, notify_on_day, reminder_1day_sent_at, reminder_today_sent_at',
      )
      .eq('is_published', true)
      .gte('starts_at', startToday.toISOString())
      .lt('starts_at', startDayAfter.toISOString())
    if (evErr) {
      console.error('[events-reminder-cron] events fetch error:', evErr)
      stats.errors.push(`events fetch → ${evErr.message}`)
      stats.ok = false
      stats.finished_at = new Date().toISOString()
      return jsonResponse(200, stats)
    }

    const allEvents = (events ?? []) as EventRow[]
    const todayEvents: EventRow[] = []
    const tomorrowEvents: EventRow[] = []
    for (const ev of allEvents) {
      const t = new Date(ev.starts_at).getTime()
      if (t >= startToday.getTime() && t < startTomorrow.getTime()) {
        if (ev.notify_on_day && !ev.reminder_today_sent_at) {
          todayEvents.push(ev)
        }
      } else if (t >= startTomorrow.getTime() && t < startDayAfter.getTime()) {
        if (ev.notify_1_day_before && !ev.reminder_1day_sent_at) {
          tomorrowEvents.push(ev)
        }
      }
    }
    stats.events_today = todayEvents.length
    stats.events_tomorrow = tomorrowEvents.length
    console.log(
      `[events-reminder-cron] events_today=${stats.events_today}, events_tomorrow=${stats.events_tomorrow}`,
    )

    if (todayEvents.length === 0 && tomorrowEvents.length === 0) {
      stats.finished_at = new Date().toISOString()
      console.log('[events-reminder-cron] Rien à envoyer.')
      return jsonResponse(200, stats)
    }

    // Charge la liste des destinataires actifs avec email_pref_event_reminders=true
    const { data: profiles, error: profErr } = await sb
      .from('profiles')
      .select('id, email, first_name, email_pref_event_reminders')
      .eq('email_pref_event_reminders', true)
    if (profErr) {
      console.error('[events-reminder-cron] profiles fetch error:', profErr)
      stats.errors.push(`profiles fetch → ${profErr.message}`)
      stats.ok = false
      stats.finished_at = new Date().toISOString()
      return jsonResponse(200, stats)
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
    const recipients = ((profiles ?? []) as ProfileRow[]).filter(
      (p) => activeIds.has(p.id) && p.email,
    )
    console.log(
      `[events-reminder-cron] ${recipients.length} destinataires actifs avec opt-in`,
    )

    // Envoi : pour chaque event, batch d'emails à tous les destinataires.
    const sendUrl = `${supabaseUrl}/functions/v1/send-email`

    async function broadcast(
      ev: EventRow,
      type: 'event-reminder-1day' | 'event-reminder-today',
    ) {
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
                type,
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
          if (
            res.status === 'fulfilled' &&
            (res.value as { ok?: boolean }).ok
          ) {
            sent++
          } else {
            failed++
          }
        }
      }
      stats.emails_sent += sent
      stats.emails_failed += failed
      console.log(
        `[events-reminder-cron] event=${ev.id} type=${type} sent=${sent} failed=${failed}`,
      )

      // Marquer l'envoi pour idempotence
      const updateField =
        type === 'event-reminder-1day'
          ? 'reminder_1day_sent_at'
          : 'reminder_today_sent_at'
      const { error: updErr } = await sb
        .from('events')
        .update({ [updateField]: new Date().toISOString() })
        .eq('id', ev.id)
      if (updErr) {
        console.error(
          `[events-reminder-cron] update ${updateField} error:`,
          updErr,
        )
        stats.errors.push(
          `update ${updateField} ${ev.id} → ${updErr.message}`,
        )
      }
    }

    for (const ev of tomorrowEvents) {
      await broadcast(ev, 'event-reminder-1day')
    }
    for (const ev of todayEvents) {
      await broadcast(ev, 'event-reminder-today')
    }
  } catch (err) {
    console.error('[events-reminder-cron] Pipeline error:', err)
    stats.errors.push(
      `pipeline → ${err instanceof Error ? err.message : String(err)}`,
    )
    stats.ok = false
  }

  stats.finished_at = new Date().toISOString()
  console.log(
    `[events-reminder-cron] Fin — sent=${stats.emails_sent} failed=${stats.emails_failed} errors=${stats.errors.length}`,
  )
  return jsonResponse(200, stats)
})

