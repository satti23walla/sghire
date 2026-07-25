import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // Get user from JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('No auth header')

    // Create user-scoped client to verify identity
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: userErr } = await userClient.auth.getUser()
    if (userErr || !user) throw new Error('Unauthorised')

    const userId = user.id
    const ACCOUNT_ID = Deno.env.get('CLOUDFLARE_ACCOUNT_ID')
    const API_TOKEN = Deno.env.get('CLOUDFLARE_API_TOKEN')

    // Admin client (service role) for privileged operations
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SERVICE_ROLE_KEY')!
    )

    // 1. Get all Cloudflare video IDs for this user
    const videoIds: string[] = []

    // Profile intro video
    const { data: profile } = await adminClient
      .from('profiles')
      .select('cloudflare_intro_video_id')
      .eq('id', userId)
      .single()
    if (profile?.cloudflare_intro_video_id) {
      videoIds.push(profile.cloudflare_intro_video_id)
    }

    // Video responses from applications
    const { data: apps } = await adminClient
      .from('applications')
      .select('id')
      .eq('candidate_id', userId)
    if (apps?.length) {
      const appIds = apps.map((a: { id: string }) => a.id)
      const { data: videos } = await adminClient
        .from('video_responses')
        .select('cloudflare_video_id')
        .in('application_id', appIds)
      videos?.forEach((v: { cloudflare_video_id: string }) => {
        if (v.cloudflare_video_id) videoIds.push(v.cloudflare_video_id)
      })
    }

    // 2. Delete videos from Cloudflare Stream
    const cfResults = await Promise.allSettled(
      videoIds.map(id =>
        fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/stream/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${API_TOKEN}` }
        })
      )
    )
    console.log(`Deleted ${cfResults.filter(r => r.status === 'fulfilled').length}/${videoIds.length} Cloudflare videos`)

    // 3. Delete avatar from Supabase Storage
    await adminClient.storage.from('Avatars')
      .remove([`${userId}/avatar.jpg`, `${userId}/avatar.png`, `${userId}/avatar.webp`])
      .catch(() => {})

    // 4. Delete all DB data in dependency order
    await adminClient.from('notifications').delete().eq('user_id', userId)
    await adminClient.from('cloudflare_video_log').delete().eq('user_id', userId)

    if (apps?.length) {
      const appIds = apps.map((a: { id: string }) => a.id)
      await adminClient.from('video_responses').delete().in('application_id', appIds)
      await adminClient.from('projects').delete().in('application_id', appIds)
      await adminClient.from('applications').delete().in('id', appIds)
    }

    // Employer applications (where they are the employer via jobs)
    const { data: jobs } = await adminClient.from('jobs').select('id').eq('employer_id', userId)
    if (jobs?.length) {
      const jobIds = jobs.map((j: { id: string }) => j.id)
      const { data: empApps } = await adminClient.from('applications').select('id').in('job_id', jobIds)
      if (empApps?.length) {
        const empAppIds = empApps.map((a: { id: string }) => a.id)
        await adminClient.from('video_responses').delete().in('application_id', empAppIds)
        await adminClient.from('notifications').delete().in('id', empAppIds) // clean up related notifications
        await adminClient.from('applications').delete().in('id', empAppIds)
      }
    }

    await adminClient.from('portfolio_items').delete().eq('candidate_id', userId)
    await adminClient.from('target_jobs').delete().eq('candidate_id', userId)
    await adminClient.from('jobs').delete().eq('employer_id', userId)
    await adminClient.from('profiles').delete().eq('id', userId)

    // 5. Delete auth user (permanent, irreversible)
    const { error: deleteErr } = await adminClient.auth.admin.deleteUser(userId)
    if (deleteErr) throw deleteErr

    return new Response(
      JSON.stringify({ success: true, videosDeleted: videoIds.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('Delete account error:', err)
    return new Response(
      JSON.stringify({ error: err.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
