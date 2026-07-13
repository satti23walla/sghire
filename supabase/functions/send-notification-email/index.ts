import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const { to, subject, html, attachments } = await req.json()

  const body: Record<string, unknown> = {
    from: 'Hire It Right <noreply@hireitright.com>',
    to: [to],
    subject,
    html,
  }

  if (attachments && attachments.length > 0) {
    body.attachments = attachments.map((a: { filename: string; content: string }) => ({
      filename: a.filename,
      content: a.content,
    }))
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const data = await res.json()
  console.log('Resend response:', JSON.stringify(data))

  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: res.ok ? 200 : 400,
  })
})
