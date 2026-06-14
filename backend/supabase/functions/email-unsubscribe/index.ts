// Le Club IA — Edge Function "email-unsubscribe"
//
// Lien de désinscription des emails de relance (séquence nurture). Mis
// dans le pied de chaque relance + dans l'en-tête List-Unsubscribe.
//
// Public (verify_jwt = false) : l'utilisateur n'est pas connecté. On
// sécurise par un token signé = sha256(userId + UNSUB_SECRET), impossible
// à forger sans le secret. Au clic → email_pref_nurture = false.
//
// GET /email-unsubscribe?u=<userId>&t=<token>

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

const UNSUB_SECRET = 'lcia_unsub_3f9a1c7e8b2d4a6f90c5e1b8d72a4f63'

async function sign(userId: string): Promise<string> {
  const data = new TextEncoder().encode(`${userId}:${UNSUB_SECRET}`)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function page(title: string, message: string, status = 200): Response {
  const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>${title}</title></head>
<body style="margin:0;font-family:Inter,Arial,sans-serif;background:#FAFAF9;color:#0A0A0A;">
<div style="max-width:480px;margin:64px auto;padding:0 24px;text-align:center;">
  <div style="display:inline-block;background:#1E40AF;color:#fff;font-family:Georgia,serif;font-weight:700;font-size:20px;padding:8px 20px;border-radius:9999px;">leclub<span style="color:#F97316;">.</span>ia</div>
  <h1 style="font-family:Georgia,serif;font-size:22px;margin:32px 0 12px;">${title}</h1>
  <p style="color:#525252;line-height:1.6;font-size:15px;">${message}</p>
  <a href="https://leclub-ia.com" style="display:inline-block;margin-top:24px;color:#1E40AF;font-weight:600;text-decoration:none;">← Retour au site</a>
</div>
</body></html>`
  return new Response(html, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

Deno.serve(async (req: Request) => {
  const url = new URL(req.url)
  const userId = (url.searchParams.get('u') ?? '').trim()
  const token = (url.searchParams.get('t') ?? '').trim()

  if (!userId || !token) {
    return page('Lien invalide', "Ce lien de désinscription est incomplet.", 400)
  }

  const expected = await sign(userId)
  if (token !== expected) {
    return page('Lien invalide', "Ce lien de désinscription n'est pas valide ou a expiré.", 400)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const sb = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })

  const { error } = await sb
    .from('profiles')
    .update({ email_pref_nurture: false })
    .eq('id', userId)
  if (error) {
    console.error('[email-unsubscribe] update KO', error)
    return page('Oups', "Une erreur est survenue. Réessaie dans un instant.", 500)
  }

  return page(
    'Tu es désinscrit·e',
    "Tu ne recevras plus nos emails de rappel d'inscription. Tu peux revenir t'inscrire au Club quand tu veux.",
  )
})
