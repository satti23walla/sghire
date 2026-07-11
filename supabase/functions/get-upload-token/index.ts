import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const ACCOUNT_ID = Deno.env.get('CLOUDFLARE_ACCOUNT_ID')
  const API_TOKEN = Deno.env.get('CLOUDFLARE_API_TOKEN')

  const expiry = new Date(Date.now() + 3600 * 1000).toISOString()

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/stream/direct_upload`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        maxDurationSeconds: 300,
        expiry,
        requireSignedURLs: true,
        allowedOrigins: ['hireitright.com', 'www.hireitright.com', 'localhost', '*.vercel.app'],
      }),
    }
  )

  const data = await res.json()

  if (!res.ok) {
    return new Response(JSON.stringify({ error: data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }

  return new Response(
    JSON.stringify({ uploadURL: data.result.uploadURL, uid: data.result.uid }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})
