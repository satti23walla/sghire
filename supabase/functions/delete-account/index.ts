import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// Only allow calls from our own origins. Vercel preview URLs are permitted
// so the flow can be tested before merging to main.
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
    // ---------------------------------------------------------------
    // 1. IDENTITY — the caller can only ever delete themselves.
    //    userId comes from the verified token, never from the body.
    //    getUser() validates against the Supabase auth server, so it
    //    works regardless of ES256/HS256 signing keys.
    // ---------------------------------------------------------------
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Not authenticated' }, 401)

    // Supabase normally injects SUPABASE_ANON_KEY automatically, but this
    // project had trouble with the auto-injected service role var, so fall
    // back to a manually-set ANON_KEY secret if it is missing.
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? Deno.env.get('ANON_KEY')
    if (!anonKey) return json({ error: 'Server misconfigured: no anon key' }, 500)

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      anonKey,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: userErr } = await userClient.auth.getUser()
    if (userErr || !user) return json({ error: 'Not authenticated' }, 401)

    const userId = user.id

    const ACCOUNT_ID = Deno.env.get('CLOUDFLARE_ACCOUNT_ID')
    const API_TOKEN = Deno.env.get('CLOUDFLARE_API_TOKEN')

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SERVICE_ROLE_KEY')!
    )

    // ---------------------------------------------------------------
    // 2. COLLECT every Cloudflare video id BEFORE deleting any rows.
    //    Once the rows are gone the ids are unrecoverable and the
    //    videos would sit in Cloudflare forever, still billing.
    // ---------------------------------------------------------------
    const videoIds = new Set<string>()

    const { data: profile } = await adminClient
      .from('profiles')
      .select('cloudflare_intro_video_id, avatar_url')
      .eq('id', userId)
      .maybeSingle()

    if (profile?.cloudflare_intro_video_id) {
      videoIds.add(profile.cloudflare_intro_video_id)
    }

    // (a) applications this user made as a candidate
    const { data: ownApps } = await adminClient
      .from('applications')
      .select('id')
      .eq('candidate_id', userId)
    const ownAppIds = (ownApps ?? []).map((a: { id: string }) => a.id)

    // (b) applications other candidates made to this user's jobs
    const { data: jobs } = await adminClient
      .from('jobs')
      .select('id')
      .eq('employer_id', userId)
    const jobIds = (jobs ?? []).map((j: { id: string }) => j.id)

    let inboundAppIds: string[] = []
    if (jobIds.length > 0) {
      const { data: inboundApps } = await adminClient
        .from('applications')
        .select('id')
        .in('job_id', jobIds)
      inboundAppIds = (inboundApps ?? []).map((a: { id: string }) => a.id)
    }

    const allAppIds = [...new Set([...ownAppIds, ...inboundAppIds])]

    if (allAppIds.length > 0) {
      const { data: videos } = await adminClient
        .from('video_responses')
        .select('cloudflare_video_id')
        .in('application_id', allAppIds)

      for (const v of videos ?? []) {
        if (v.cloudflare_video_id) videoIds.add(v.cloudflare_video_id)
      }
    }

    // ---------------------------------------------------------------
    // 3. DELETE videos from Cloudflare Stream.
    // ---------------------------------------------------------------
    const idList = [...videoIds]
    let videosDeleted = 0
    const videosFailed: string[] = []

    const cfResults = await Promise.allSettled(
      idList.map(id =>
        fetch(
          `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/stream/${id}`,
          { method: 'DELETE', headers: { 'Authorization': `Bearer ${API_TOKEN}` } }
        )
      )
    )

    cfResults.forEach((r, i) => {
      // Cloudflare returns 404 if already gone — treat that as success.
      if (r.status === 'fulfilled' && (r.value.ok || r.value.status === 404)) {
        videosDeleted++
      } else {
        videosFailed.push(idList[i])
        console.error(`Cloudflare delete failed for ${idList[i]}`)
      }
    })

    // ---------------------------------------------------------------
    // 4. DELETE avatar. List the folder rather than guessing extensions
    //    — uploads keep the original extension, so .jpeg was surviving.
    // ---------------------------------------------------------------
    let avatarDeleted = true
    const { data: avatarFiles } = await adminClient.storage
      .from('Avatars')
      .list(userId)

    if (avatarFiles && avatarFiles.length > 0) {
      const paths = avatarFiles.map(f => `${userId}/${f.name}`)
      const { error: rmErr } = await adminClient.storage
        .from('Avatars')
        .remove(paths)
      if (rmErr) {
        avatarDeleted = false
        console.error('Avatar delete failed:', rmErr.message)
      }
    }

    // Fallback in case avatar_url points outside the user folder
    if (profile?.avatar_url && !profile.avatar_url.startsWith('http')) {
      await adminClient.storage.from('Avatars').remove([profile.avatar_url])
    }

    // ---------------------------------------------------------------
    // 5. DELETE database rows in dependency order.
    // ---------------------------------------------------------------
    await adminClient.from('notifications').delete().eq('user_id', userId)
    await adminClient.from('cloudflare_video_log').delete().eq('user_id', userId)

    if (allAppIds.length > 0) {
      await adminClient.from('video_responses').delete().in('application_id', allAppIds)
      await adminClient.from('projects').delete().in('application_id', allAppIds)
      await adminClient.from('applications').delete().in('id', allAppIds)
    }

    await adminClient.from('portfolio_items').delete().eq('candidate_id', userId)
    await adminClient.from('target_jobs').delete().eq('candidate_id', userId)
    await adminClient.from('jobs').delete().eq('employer_id', userId)
    await adminClient.from('profiles').delete().eq('id', userId)

    // ---------------------------------------------------------------
    // 6. DELETE the auth user last, so a mid-way failure is retryable.
    // ---------------------------------------------------------------
    const { error: deleteErr } = await adminClient.auth.admin.deleteUser(userId)
    if (deleteErr) throw deleteErr

    // Report what actually happened — the UI should not claim a
    // complete wipe if part of it failed (PDPA representation).
    return json({
      success: true,
      complete: videosFailed.length === 0 && avatarDeleted,
      videosDeleted,
      videosTotal: idList.length,
      videosFailed,
    })

  } catch (err) {
    console.error('Delete account error:', err)
    return json({ error: (err as Error).message }, 400)
  }
})
