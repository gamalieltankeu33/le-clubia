import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WhatsAppPayload {
  recipient_phone: string
  first_name: string
  vip_group_url?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { recipient_phone, first_name, vip_group_url } = (await req.json()) as WhatsAppPayload

    if (!recipient_phone || !first_name) {
      return new Response(
        JSON.stringify({ error: 'recipient_phone and first_name are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const cleanPhone = recipient_phone.replace(/[^0-9]/g, '')
    const whatsappToken = Deno.env.get('WHATSAPP_CLOUD_API_TOKEN')
    const whatsappPhoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')
    const groupUrl = vip_group_url || 'https://chat.whatsapp.com/LtTDYyQ2YZVERhAEsGTaJX?mode=gi_t'

    const messageText = `Bonjour ${first_name} ! Merci pour ton inscription au Blueprint IA. As-tu bien rejoint notre groupe VIP WhatsApp ? Sinon, voici le lien direct : ${groupUrl}`

    // If Meta WhatsApp Cloud API credentials are set, trigger API call
    if (whatsappToken && whatsappPhoneNumberId) {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${whatsappPhoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${whatsappToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: cleanPhone,
            type: 'text',
            text: { body: messageText },
          }),
        },
      )

      const result = await response.json()
      return new Response(JSON.stringify({ success: true, meta_result: result }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Fallback response with generated wa.me link
    const waLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`
    return new Response(
      JSON.stringify({
        success: true,
        message: 'WhatsApp wa.me link generated',
        wa_link: waLink,
        text: messageText,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
