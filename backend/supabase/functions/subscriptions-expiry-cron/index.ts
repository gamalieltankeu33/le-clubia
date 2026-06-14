// Le Club IA — Edge Function "subscriptions-expiry-cron"
//
// Scanne les subscriptions actives et envoie des rappels d'expiration :
//   - J-7 : entre J+6 et J+7 avant current_period_end
//   - J-1 : entre J et J+1 avant current_period_end
//
// Idempotence : on n'envoie chaque stage qu'une seule fois grâce aux
// colonnes `reminder_j7_sent_at` et `reminder_j1_sent_at` (migration 0041).
//
// Auth : appelable uniquement avec le SUPABASE_SERVICE_ROLE_KEY (depuis
// pg_cron via pg_net). Le verify_jwt est désactivé au déploiement car
// pg_cron envoie un JWT service-role différent de celui d'un user auth.
//
// Planification : pg_cron lance cette fonction tous les jours à 09:00 UTC
// (cf. migration 0041_cron_schedule).

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

interface ExpiringSubscription {
  id: string
  user_id: string
  plan_id: string | null
  current_period_end: string
  reminder_j7_sent_at: string | null
  reminder_j1_sent_at: string | null
  profiles: {
    email: string
    first_name: string | null
  } | null
  pricing_plans: {
    display_name: string
  } | null
}

serve(async (req: Request) => {
  // Auth service-role uniquement
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const auth = (req.headers.get('Authorization') ?? '')
    .replace(/^Bearer\s+/i, '')
    .trim()
  if (!serviceKey || auth !== serviceKey.trim()) {
    return new Response(JSON.stringify({ ok: false, error: 'Service-role requis.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  })

  const now = new Date()
  const j7Min = new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000)
  const j7Max = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000)
  const j1Min = new Date(now.getTime() + 0)
  const j1Max = new Date(now.getTime() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000)

  const sent = { j7: 0, j1: 0, errors: 0 }

  // ── Stage J-7 ───────────────────────────────────────────────────────
  {
    const { data, error } = await admin
      .from('subscriptions')
      .select(
        'id, user_id, plan_id, current_period_end, reminder_j7_sent_at, reminder_j1_sent_at, profiles(email, first_name), pricing_plans(display_name)',
      )
      .in('status', ['active', 'trialing'])
      .gte('current_period_end', j7Min.toISOString())
      .lte('current_period_end', j7Max.toISOString())
      .is('reminder_j7_sent_at', null)

    if (error) {
      console.error('[expiry-cron] query J-7 KO', error)
    } else {
      for (const row of (data ?? []) as unknown as ExpiringSubscription[]) {
        const ok = await sendReminder(supabaseUrl, serviceKey, row, 'j7')
        if (ok) {
          await admin
            .from('subscriptions')
            .update({ reminder_j7_sent_at: new Date().toISOString() })
            .eq('id', row.id)
          sent.j7++
        } else {
          sent.errors++
        }
      }
    }
  }

  // ── Stage J-1 ───────────────────────────────────────────────────────
  {
    const { data, error } = await admin
      .from('subscriptions')
      .select(
        'id, user_id, plan_id, current_period_end, reminder_j7_sent_at, reminder_j1_sent_at, profiles(email, first_name), pricing_plans(display_name)',
      )
      .in('status', ['active', 'trialing'])
      .gte('current_period_end', j1Min.toISOString())
      .lte('current_period_end', j1Max.toISOString())
      .is('reminder_j1_sent_at', null)

    if (error) {
      console.error('[expiry-cron] query J-1 KO', error)
    } else {
      for (const row of (data ?? []) as unknown as ExpiringSubscription[]) {
        const ok = await sendReminder(supabaseUrl, serviceKey, row, 'j1')
        if (ok) {
          await admin
            .from('subscriptions')
            .update({ reminder_j1_sent_at: new Date().toISOString() })
            .eq('id', row.id)
          sent.j1++
        } else {
          sent.errors++
        }
      }
    }
  }

  console.log(`[expiry-cron] sent j7=${sent.j7} j1=${sent.j1} errors=${sent.errors}`)
  return new Response(
    JSON.stringify({ ok: true, sent }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  )
})

async function sendReminder(
  supabaseUrl: string,
  serviceKey: string,
  sub: ExpiringSubscription,
  stage: 'j7' | 'j1',
): Promise<boolean> {
  if (!sub.profiles?.email) {
    console.warn(`[expiry-cron] sub ${sub.id} sans email — skip`)
    return false
  }
  try {
    const resp = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'subscription-expiring',
        to: sub.profiles.email,
        data: {
          member_first_name: sub.profiles.first_name ?? '',
          stage,
          plan_display_name: sub.pricing_plans?.display_name ?? '',
          period_end_iso: sub.current_period_end,
          renewal_plan_id: sub.plan_id === 'trimestrial' ? 'trimestrial' : 'semestrial',
        },
      }),
    })
    if (!resp.ok) {
      console.error(`[expiry-cron] send-email ${stage} KO status=${resp.status}`)
      return false
    }
    return true
  } catch (e) {
    console.error(`[expiry-cron] send-email ${stage} exception`, e)
    return false
  }
}
