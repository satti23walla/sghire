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
    // --- 1. Identity from the verified token, never from the body ---
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

    // --- 2. Ownership check. The job must belong to the caller. ---
    const { data: job } = await adminClient
      .from('jobs')
      .select('id, title, employer_id, company_name')
      .eq('id', jobId)
      .maybeSingle()

    if (!job) return json({ error: 'Job not found' }, 404)
    if (job.employer_id !== user.id) return json({ error: 'Not your job posting' }, 403)

    // --- 3. Collect Cloudflare video ids BEFORE deleting rows.
    //     applications.job_id is ON DELETE CASCADE, so once the job goes the
    //     application rows go with it and the video ids are unrecoverable. ---
    const { data: apps } = await adminClient
      .from('applications')
      .select('id, candidate_id')
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

    // --- 4. Delete the videos from Cloudflare Stream ---
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

    // --- 5. Delete. Cascade removes applications, video_responses, and any
    //     notifications tied to this job (notifications.job_id is ON DELETE
    //     CASCADE), so nothing is left pointing at a role that no longer exists. ---
    if (appIds.length > 0) {
      await adminClient.from('projects').delete().in('application_id', appIds)
    }

    const { error: delErr } = await adminClient.from('jobs').delete().eq('id', jobId)
    if (delErr) throw delErr

    // --- 6. Tell the candidates. Sent AFTER the delete and deliberately with
    //     no job_id, so the cascade above does not immediately remove it. ---
    if (candidateIds.length > 0) {
      const rows = candidateIds.map(cid => ({
        user_id: cid,
        type: 'job_removed',
        title: 'A role you applied to was removed',
        body: `${job.company_name || 'The employer'} has withdrawn "${job.title}". Your application for this role is no longer active.`,
        link: '/candidate',
        read: false,
      }))
      await adminClient.from('notifications').insert(rows)
    }

    return json({
      success: true,
      complete: videosFailed.length === 0,
      applicationsRemoved: appIds.length,
      videosDeleted,
      videosTotal: videoIds.length,
    })

  } catch (err) {
    console.error('Delete job error:', err)
    return json({ error: (err as Error).message }, 400)
  }
})
