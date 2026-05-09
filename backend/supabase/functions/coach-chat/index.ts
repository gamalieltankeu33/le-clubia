// Le Club IA — Edge Function "coach-chat" (streaming SSE)
// Coach IA conversationnel propulsé par OpenAI gpt-4o-mini, en mode stream.
//
// Variable d'env requise : OPENAI_API_KEY (la même que pour news-agent).
//
// Pipeline :
//   1. Auth JWT user
//   2. Vérification is_active_member (membres uniquement)
//   3. Quota 30 messages/jour par utilisateur (UTC) — vérifié AVANT le stream
//   4. Validation longueur message (≤ MAX_USER_MESSAGE_CHARS)
//   5. Création ou réutilisation de la conversation
//   6. Insert message user en DB
//   7. Appel OpenAI gpt-4o-mini avec stream:true
//   8. Pipe les chunks SSE vers le client + accumulation côté serveur
//   9. À la fin du stream : insert message assistant complet en DB
//  10. Émission événement SSE final 'done' avec conversation_id + quota
//
// Format SSE renvoyé au client (pour chaque ligne) :
//   data: {"type":"chunk","text":"..."}
//   data: {"type":"done","conversation_id":"...","quota":{"used":N,"limit":30}}
//   data: {"type":"error","message":"..."}
//
// Déployable via : `cd backend && supabase functions deploy coach-chat`

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'
import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts'

const SYSTEM_PROMPT = `Tu es le Coach IA du Club IA, une communauté francophone premium dédiée aux passionnés d'intelligence artificielle. Tu réponds en français, tutoiement obligatoire.

Ton rôle : aider les membres à progresser en IA. Tu réponds à toutes leurs questions sur :
- L'utilisation pratique d'outils IA (ChatGPT, Claude, Gemini, Midjourney, etc.)
- L'automatisation (n8n, Make, Zapier)
- La création de contenu IA (textes, images, vidéos)
- Le développement avec IA (no-code, vibe-coding, prompts)
- Le prompt engineering
- Les modèles IA et leurs cas d'usage
- La stratégie business autour de l'IA

Style :
- Tutoiement systématique
- Ton chaleureux, accessible, jamais condescendant
- Réponses pédagogiques et structurées
- Utilise des listes à puces quand c'est pertinent
- Reste concis : 2-5 paragraphes max sauf si la question demande explicitement plus
- Si tu ne sais pas, dis-le honnêtement
- Si la question concerne le Club IA lui-même (formations, fonctionnement), invite à explorer le catalogue
- Ne fais JAMAIS de code production complet, donne plutôt des pistes et concepts
- Ne réponds PAS aux questions hors-sujet IA (médical, juridique, etc.) : redirige gentiment vers ton scope.

Format des réponses : markdown léger (gras pour mots-clés, listes pour énumérations, code inline avec backticks pour noms d'outils).`

const DAILY_LIMIT = 30
const MAX_TOKENS = 1024
const MAX_USER_MESSAGE_CHARS = 8000
const TEMPERATURE = 0.7
const MODEL = 'gpt-4o-mini'

const sseHeaders = {
  'Content-Type': 'text/event-stream; charset=utf-8',
  'Cache-Control': 'no-cache, no-transform',
  Connection: 'keep-alive',
  // Disable Nginx-style buffering pour que les chunks arrivent en temps réel
  'X-Accel-Buffering': 'no',
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface ChatRequest {
  conversation_id?: string
  messages: ChatMessage[]
  context?: string
}

serve(async (req: Request) => {
  const preflight = handleCorsPreflight(req)
  if (preflight) return preflight
  const headers = getCorsHeaders(req)
  if (req.method !== 'POST') {
    return jsonResponse(405, { error: 'Méthode non autorisée.' }, headers)
  }

  // ============== Phase synchrone — toute erreur renvoie un JSON ==========
  const openaiKey = Deno.env.get('OPENAI_API_KEY')
  if (!openaiKey) {
    console.error('[coach-chat] OPENAI_API_KEY manquante')
    return jsonResponse(503, {
      error:
        "Coach IA temporairement indisponible. La clé OPENAI_API_KEY n'est pas configurée côté serveur.",
    }, headers)
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return jsonResponse(401, { error: 'Non authentifié.' }, headers)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  if (!supabaseUrl || !supabaseAnonKey) {
    return jsonResponse(500, {
      error: 'Configuration Supabase manquante côté serveur.',
    }, headers)
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  })

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    return jsonResponse(401, { error: 'Session invalide ou expirée.' }, headers)
  }

  // Membre actif requis
  const { data: isActive, error: activeErr } = await supabase.rpc(
    'is_active_member',
    { uid: user.id },
  )
  if (activeErr) {
    console.error('[coach-chat] is_active_member RPC error:', activeErr)
    return jsonResponse(500, {
      error: 'Impossible de vérifier ton abonnement.',
    }, headers)
  }
  if (!isActive) {
    return jsonResponse(403, {
      error:
        'Le Coach IA est réservé aux membres actifs. Rejoins Le Club pour y accéder.',
    }, headers)
  }

  // Parse body
  let body: ChatRequest
  try {
    body = await req.json()
  } catch {
    return jsonResponse(400, { error: 'Corps de requête JSON invalide.' }, headers)
  }

  const { conversation_id, messages, context } = body
  if (!Array.isArray(messages) || messages.length === 0) {
    return jsonResponse(400, { error: 'Messages manquants.' }, headers)
  }

  const lastMessage = messages[messages.length - 1]
  if (
    !lastMessage ||
    lastMessage.role !== 'user' ||
    typeof lastMessage.content !== 'string' ||
    !lastMessage.content.trim()
  ) {
    return jsonResponse(400, {
      error: 'Le dernier message doit être un message utilisateur non-vide.',
    }, headers)
  }
  if (lastMessage.content.length > MAX_USER_MESSAGE_CHARS) {
    return jsonResponse(400, {
      error: `Message trop long (max ${MAX_USER_MESSAGE_CHARS} caractères).`,
    }, headers)
  }

  // Quota AVANT le stream (le decrement effectif = insert user msg ci-dessous)
  const todayStart = new Date()
  todayStart.setUTCHours(0, 0, 0, 0)

  const { count, error: countError } = await supabase
    .from('coach_messages')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'user')
    .gte('created_at', todayStart.toISOString())
  if (countError) {
    console.error('[coach-chat] Quota count error:', countError)
    return jsonResponse(500, { error: 'Erreur de lecture du quota.' }, headers)
  }
  const used = count ?? 0
  if (used >= DAILY_LIMIT) {
    return jsonResponse(429, {
      error: `Tu as atteint la limite de ${DAILY_LIMIT} messages aujourd'hui. Reviens demain pour reprendre la conversation.`,
      quota: { used, limit: DAILY_LIMIT },
    }, headers)
  }

  // Conversation
  let convId = conversation_id ?? null
  if (convId) {
    const { data: existing, error: convError } = await supabase
      .from('coach_conversations')
      .select('id')
      .eq('id', convId)
      .maybeSingle()
    if (convError || !existing) {
      return jsonResponse(404, { error: 'Conversation introuvable.' }, headers)
    }
  } else {
    const trimmed = lastMessage.content.trim()
    const title =
      trimmed.length > 30 ? trimmed.slice(0, 30).trimEnd() + '…' : trimmed
    const { data: newConv, error: createError } = await supabase
      .from('coach_conversations')
      .insert({ user_id: user.id, title })
      .select('id')
      .single()
    if (createError || !newConv) {
      console.error('[coach-chat] Create conv error:', createError)
      return jsonResponse(500, {
        error: 'Impossible de créer la conversation.',
      }, headers)
    }
    convId = newConv.id
  }

  // Insert message user AVANT le stream — comptabilise immédiatement le quota
  const { error: insertUserError } = await supabase
    .from('coach_messages')
    .insert({
      conversation_id: convId,
      role: 'user',
      content: lastMessage.content,
    })
  if (insertUserError) {
    console.error('[coach-chat] Insert user msg error:', insertUserError)
    return jsonResponse(500, { error: "Impossible d'enregistrer ton message." }, headers)
  }

  // Récupération du profil pour personnalisation
  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name, bio, interests')
    .eq('id', user.id)
    .single()

  const userName = profile?.first_name || 'Membre'
  const userContext = `
INFOS SUR L'APPRENANT :
- Nom : ${userName} ${profile?.last_name || ''}
- Bio : ${profile?.bio || 'Non renseignée'}
- Centres d'intérêt : ${Array.isArray(profile?.interests) ? profile.interests.join(', ') : 'Non renseignés'}
`.trim()

  // ============== Phase streaming ==========
  const usedAfter = used + 1
  const openaiMessages = [
    {
      role: 'system' as const,
      content: `${SYSTEM_PROMPT}

${userContext}

CONTEXTE DE NAVIGATION :
${context ? `L'utilisateur consulte actuellement la formation : "${context}".` : "L'utilisateur navigue sur la plateforme."}

CONSIGNE DE PERSONNALISATION :
- Appelle l'utilisateur par son prénom (${userName}) de temps en temps, mais naturellement.
- Utilise ses centres d'intérêt pour illustrer tes explications avec des exemples concrets qui lui parlent.
- Si sa bio indique un niveau (débutant/expert), adapte la complexité de tes réponses.`
    },
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ]

  console.log(
    `[coach-chat] Appel OpenAI (stream) — modèle ${MODEL}, ${openaiMessages.length} messages, max_tokens=${MAX_TOKENS}, temperature=${TEMPERATURE}`,
  )

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder()
      let assembled = ''
      let totalTokens = 0
      let closed = false

      const send = (event: Record<string, unknown>) => {
        if (closed) return
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`),
          )
        } catch {
          // Client a déjà fermé la connexion
          closed = true
        }
      }

      const finishWithError = async (message: string) => {
        if (assembled) {
          // Sauvegarde le partiel — on perd rien si le stream a craché en cours
          await supabase
            .from('coach_messages')
            .insert({
              conversation_id: convId,
              role: 'assistant',
              content: assembled,
              tokens_used: totalTokens || null,
            })
            .then(
              () => {},
              (err) =>
                console.error(
                  '[coach-chat] Insert assistant partial error:',
                  err,
                ),
            )
        }
        send({ type: 'error', message })
      }

      try {
        const apiResponse = await fetch(
          'https://api.openai.com/v1/chat/completions',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${openaiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: MODEL,
              messages: openaiMessages,
              max_tokens: MAX_TOKENS,
              temperature: TEMPERATURE,
              stream: true,
              stream_options: { include_usage: true },
            }),
          },
        )

        if (apiResponse.status === 401) {
          const t = await apiResponse.text()
          console.error('[coach-chat] OpenAI 401 :', t.slice(0, 200))
          await finishWithError(
            "Coach IA temporairement indisponible. La clé OPENAI_API_KEY n'est pas configurée côté serveur.",
          )
          return
        }
        if (apiResponse.status === 429) {
          const t = await apiResponse.text()
          console.error('[coach-chat] OpenAI 429 :', t.slice(0, 200))
          await finishWithError(
            'Le coach est très demandé en ce moment, essaie dans quelques secondes.',
          )
          return
        }
        if (!apiResponse.ok || !apiResponse.body) {
          const t = apiResponse.body ? await apiResponse.text() : ''
          console.error(
            `[coach-chat] OpenAI ${apiResponse.status} :`,
            t.slice(0, 200),
          )
          await finishWithError(
            'Le coach a rencontré une erreur. Réessaie dans un instant.',
          )
          return
        }

        const reader = apiResponse.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })

          // Les events SSE OpenAI sont séparés par "\n\n"
          const events = buffer.split('\n\n')
          buffer = events.pop() ?? ''

          for (const evt of events) {
            const trimmed = evt.trim()
            if (!trimmed) continue
            for (const line of trimmed.split('\n')) {
              if (!line.startsWith('data:')) continue
              const data = line.slice(5).trim()
              if (!data || data === '[DONE]') continue
              try {
                const parsed = JSON.parse(data) as {
                  choices?: Array<{ delta?: { content?: string } }>
                  usage?: { total_tokens?: number }
                }
                const delta = parsed.choices?.[0]?.delta?.content
                if (typeof delta === 'string' && delta.length > 0) {
                  assembled += delta
                  send({ type: 'chunk', text: delta })
                }
                if (parsed.usage?.total_tokens) {
                  totalTokens = parsed.usage.total_tokens
                }
              } catch (parseErr) {
                console.error(
                  '[coach-chat] SSE parse error:',
                  parseErr,
                  'data=',
                  data.slice(0, 200),
                )
              }
            }
          }
        }

        // Insert assistant complet — uniquement si on a quelque chose
        if (assembled) {
          const { error: insertAssistantError } = await supabase
            .from('coach_messages')
            .insert({
              conversation_id: convId,
              role: 'assistant',
              content: assembled,
              tokens_used: totalTokens || null,
            })
          if (insertAssistantError) {
            console.error(
              '[coach-chat] Insert assistant final error:',
              insertAssistantError,
            )
          }
          console.log(
            `[coach-chat] Réponse OK (stream) — ${assembled.length} chars, ${totalTokens || '?'} tokens`,
          )
        } else {
          console.error('[coach-chat] Stream terminé sans contenu')
        }

        send({
          type: 'done',
          conversation_id: convId,
          quota: { used: usedAfter, limit: DAILY_LIMIT },
        })
      } catch (err) {
        console.error('[coach-chat] Stream error:', err)
        await finishWithError(
          'Le coach a rencontré une erreur. Réessaie dans un instant.',
        )
      } finally {
        try {
          if (!closed) controller.close()
        } catch {
          // déjà fermé
        }
      }
    },
  })

  return new Response(stream, { status: 200, headers: { ...headers, ...sseHeaders } })
})

function jsonResponse(status: number, body: unknown, headers: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' },
  })
}
