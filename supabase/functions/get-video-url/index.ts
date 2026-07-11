import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const { videoId } = await req.json()

  if (!videoId) {
    return new Response(JSON.stringify({ error: 'videoId required' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }

  const ACCOUNT_ID = Deno.env.get('CLOUDFLARE_ACCOUNT_ID')
  const API_TOKEN = Deno.env.get('CLOUDFLARE_API_TOKEN')

  // Generate signed token (1 hour expiry)
  const exp = Math.floor(Date.now() / 1000) + 3600

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/stream/${videoId}/token`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ exp }),
    }
  )

  const data = await res.json()

  if (!res.ok) {
    return new Response(JSON.stringify({ error: data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }

  const token = data.result.token
  const signedUrl = `https://videodelivery.net/${videoId}/manifest/video.m3u8?token=${token}`
  const thumbnailUrl = `https://videodelivery.net/${videoId}/thumbnails/thumbnail.jpg?token=${token}`

  return new Response(
    JSON.stringify({ signedUrl, thumbnailUrl, token }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})
