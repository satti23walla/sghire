import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ALERT_MINUTES = 800
const HARD_STOP_MINUTES = 1000
const MAX_UPLOADS_PER_DAY = 3
const ADMIN_EMAIL = 'kunalsatija@gmail.com'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const { userId, context } = await req.json()

  if (!userId) {
    return new Response(JSON.stringify({ error: 'userId required' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }

  // Init Supabase with service role to bypass RLS for checks
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // --- Check 1: Per-user rate limit (max 3 uploads per 24 hours) ---
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { count: userCount } = await supabase
    .from('cloudflare_video_log')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', yesterday)

  if ((userCount ?? 0) >= MAX_UPLOADS_PER_DAY) {
    return new Response(JSON.stringify({
      error: `Daily limit reached. You can upload max ${MAX_UPLOADS_PER_DAY} videos per 24 hours.`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 429,
    })
  }

  // --- Check 2: Platform-wide usage (800 min alert, 1000 min hard stop) ---
  const { data: usageData } = await supabase
    .from('cloudflare_video_log')
    .select('duration_seconds')

  const totalSeconds = (usageData ?? []).reduce((sum, r) => sum + (r.duration_seconds ?? 120), 0)
  const totalMinutes = Math.round(totalSeconds / 60)

  // Hard stop at 1000 minutes
  if (totalMinutes >= HARD_STOP_MINUTES) {
    return new Response(JSON.stringify({
      error: 'Video recording is temporarily unavailable. Please contact support.'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 503,
    })
  }

  // Alert email at 800 minutes (only send once — check if we just crossed the threshold)
  if (totalMinutes >= ALERT_MINUTES && totalMinutes < ALERT_MINUTES + 5) {
    try {
      const resendKey = Deno.env.get('RESEND_API_KEY')
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Hire It Right <noreply@hireitright.com>',
          to: [ADMIN_EMAIL],
          subject: '⚠️ HireItRight: 800 minutes of Cloudflare video storage used',
          html: `
            <p>Your HireItRight platform has reached <strong>${totalMinutes} minutes</strong> of video storage on Cloudflare Stream.</p>
            <p>Cost so far: ~$${Math.round(totalMinutes / 1000 * 5 * 100) / 100}/month</p>
            <p>Recording will be disabled at 1,000 minutes. Consider upgrading your Cloudflare plan.</p>
            <p>Total videos: ${(usageData ?? []).length}</p>
          `,
        }),
      })
    } catch (e) {
      console.error('Alert email failed:', e)
    }
  }

  // --- Get Cloudflare upload token ---
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
        maxDurationSeconds: 120, // Hard 2-min limit at Cloudflare level too
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

  // --- Log the upload ---
  await supabase.from('cloudflare_video_log').insert({
    user_id: userId,
    cloudflare_video_id: data.result.uid,
    duration_seconds: 120, // assume max; updated when video processes
    context: context ?? 'unknown',
  })

  return new Response(
    JSON.stringify({
      uploadURL: data.result.uploadURL,
      uid: data.result.uid,
      usageMinutes: totalMinutes,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})
