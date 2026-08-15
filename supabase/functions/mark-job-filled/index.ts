import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

function corsFor(origin: string | null) {
  const allowed =
    origin === 'https://www.hireitright.com' ||
    origin === 'https://hireitright.com' ||
    (origin?.endsWith('.vercel.app') ?? false) ||
    origin === 'http://localhost:5173'

  return {
    'Access-Control-Allow-Origin': allowed ? origin! : 'https://www.hireitright.com',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}

serve(async (req) => {
  const cors = corsFor(req.headers.get('Origin'))
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      headers: { ...cors, 'Content-Type': 'application/json' },
      status,
    })

  try {
    // --- 1. Identity from the verified token ---
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Not authenticated' }, 401)

    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? Deno.env.get('ANON_KEY')
    if (!anonKey) return json({ error: 'Server misconfigured: no anon key' }, 500)

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      anonKey,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: userErr } = await userClient.auth.getUser()
    if (userErr || !user) return json({ error: 'Not authenticated' }, 401)

    const { jobId } = await req.json()
    if (!jobId) return json({ error: 'No jobId provided' }, 400)

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SERVICE_ROLE_KEY')!
    )

    // --- 2. Ownership check ---
    const { data: job } = await adminClient
      .from('jobs')
      .select('id, title, employer_id, company_name, filled_at')
      .eq('id', jobId)
      .maybeSingle()

    if (!job) return json({ error: 'Job not found' }, 404)
    if (job.employer_id !== user.id) return json({ error: 'Not your job posting' }, 403)
    if (job.filled_at) return json({ error: 'This role is already marked as filled' }, 400)

    // --- 3. Gather every application and its videos ---
    const { data: apps } = await adminClient
      .from('applications')
      .select('id, candidate_id, status')
      .eq('job_id', jobId)

    const appIds = (apps ?? []).map((a: { id: string }) => a.id)
    const candidateIds = [...new Set((apps ?? []).map((a: { candidate_id: string }) => a.candidate_id))]

    const videoIds: string[] = []
    if (appIds.length > 0) {
      const { data: videos } = await adminClient
        .from('video_responses')
        .select('cloudflare_video_id')
        .in('application_id', appIds)

      for (const v of videos ?? []) {
        if (v.cloudflare_video_id) videoIds.push(v.cloudflare_video_id)
      }
    }

    // --- 4. Purge the videos from Cloudflare Stream.
    //     Once the role is filled these are dead weight: still billing for
    //     storage, and personal data with no remaining purpose under PDPA. ---
    const ACCOUNT_ID = Deno.env.get('CLOUDFLARE_ACCOUNT_ID')
    const API_TOKEN = Deno.env.get('CLOUDFLARE_API_TOKEN')

    let videosDeleted = 0
    const videosFailed: string[] = []

    const results = await Promise.allSettled(
      videoIds.map(id =>
        fetch(
          `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/stream/${id}`,
          { method: 'DELETE', headers: { 'Authorization': `Bearer ${API_TOKEN}` } }
        )
      )
    )

    results.forEach((r, i) => {
      if (r.status === 'fulfilled' && (r.value.ok || r.value.status === 404)) videosDeleted++
      else videosFailed.push(videoIds[i])
    })

    // --- 5. Drop the video rows. The application row itself stays: it is the
    //     record of who applied and what was decided, which the employer needs
    //     and which is tiny. Only the heavy, sensitive payload goes. ---
    if (appIds.length > 0) {
      await adminClient.from('video_responses').delete().in('application_id', appIds)

      const now = new Date().toISOString()
      await adminClient
        .from('applications')
        .update({ videos_purged_at: now })
        .in('id', appIds)

      // Anyone never actioned gets an honest outcome rather than sitting on
      // 'submitted' indefinitely.
      await adminClient
        .from('applications')
        .update({ status: 'closed' })
        .in('id', appIds)
        .in('status', ['submitted', 'reviewed'])
    }

    // --- 6. Close the role ---
    await adminClient
      .from('jobs')
      .update({ is_active: false, filled_at: new Date().toISOString() })
      .eq('id', jobId)

    // --- 7. Close the loop with candidates ---
    if (candidateIds.length > 0) {
      const rows = candidateIds.map(cid => ({
        user_id: cid,
        type: 'job_filled',
        title: 'A role you applied to has been filled',
        body: `${job.company_name || 'The employer'} has filled "${job.title}". Your video response for this role has been deleted.`,
        link: '/dashboard',
        read: false,
      }))
      await adminClient.from('notifications').insert(rows)
    }

    return json({
      success: true,
      complete: videosFailed.length === 0,
      applicationsClosed: appIds.length,
      videosDeleted,
      videosTotal: videoIds.length,
      minutesFreed: Math.round(videosDeleted * 2), // 2 min cap per video
    })

  } catch (err) {
    console.error('Mark job filled error:', err)
    return json({ error: (err as Error).message }, 400)
  }
})
