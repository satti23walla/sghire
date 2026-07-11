import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { notify } from '../lib/notifications'
import AvatarImage from '../components/AvatarImage'
import VideoPlayer from '../components/VideoPlayer'

const typeIcons = { project: '💼', website: '🌐', video: '🎥', article: '📝', other: '🔗' }
const statusColors = {
  submitted:   { bg: '#E1F5EE', tc: '#0F6E56' },
  reviewed:    { bg: '#EEEDFE', tc: '#534AB7' },
  shortlisted: { bg: '#FAEEDA', tc: '#BA7517' },
  rejected:    { bg: '#FAECE7', tc: '#D85A30' },
}

export default function CandidateProfileView() {
  const { id } = useParams()
  const { profile: myProfile } = useAuth()
  const navigate = useNavigate()
  const [candidate, setCandidate] = useState(null)
  const [portfolio, setPortfolio] = useState([])
  const [applications, setApplications] = useState([]) // candidate's applications to employer's jobs
  const [loading, setLoading] = useState(true)
  const [accessDenied, setAccessDenied] = useState(false)

  useEffect(() => {
    if (myProfile) loadData()
  }, [id, myProfile])

  async function loadData() {
    // Level 1 access control for employers
    if (myProfile?.role === 'employer') {
      // Get employer's job IDs
      const { data: jobs } = await supabase
        .from('jobs').select('id').eq('employer_id', myProfile.id)
      const jobIds = (jobs || []).map(j => j.id)

      if (!jobIds.length) { setAccessDenied(true); setLoading(false); return }

      // Check candidate applied to one of their jobs
      const { data: apps } = await supabase
        .from('applications')
        .select(`
          *,
          jobs (title, company_name, location),
          video_responses (id, type, video_url, cloudflare_video_id),
          projects (id, title, description, project_url)
        `)
        .eq('candidate_id', id)
        .in('job_id', jobIds)

      if (!apps || apps.length === 0) {
        setAccessDenied(true)
        setLoading(false)
        return
      }
      setApplications(apps)
    }

    // Load candidate profile
    const { data: prof } = await supabase
      .from('profiles').select('*').eq('id', id).eq('role', 'candidate').single()

    if (prof) {
      setCandidate(prof)
      const { data: port } = await supabase
        .from('portfolio_items').select('*').eq('candidate_id', id)
        .order('created_at', { ascending: false })
      setPortfolio(port || [])

      // Send notification to candidate
      if (myProfile?.role === 'employer' && myProfile.id !== id) {
        const latestJob = applications[0]?.jobs
        notify({
          userId: id,
          type: 'profile_viewed',
          title: `${myProfile.company_name || 'An employer'} viewed your profile`,
          body: latestJob ? `They are hiring for: ${latestJob.title}` : 'Your profile is getting attention!',
          link: '/candidate',
          recipientEmail: prof.email,
        }).catch(() => {})
      }
    }
    setLoading(false)
  }

  async function updateStatus(appId, status) {
    await supabase.from('applications').update({ status }).eq('id', appId)
    setApplications(prev => prev.map(a => a.id === appId ? { ...a, status } : a))
  }

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: '#666' }}>Loading...</div>

  if (accessDenied) return (
    <div>
      <button onClick={() => navigate(-1)} style={{ border: 'none', background: 'none', color: '#666', fontSize: 13, cursor: 'pointer', marginBottom: 16, padding: 0 }}>← Back</button>
      <div className="card" style={{ textAlign: 'center', padding: 48 }}>
        <p style={{ fontSize: 32, marginBottom: 12 }}>🔒</p>
        <p style={{ fontWeight: 500, fontSize: 16, marginBottom: 8 }}>Access restricted</p>
        <p style={{ fontSize: 14, color: '#666', lineHeight: 1.6, maxWidth: 320, margin: '0 auto' }}>
          You can only view profiles of candidates who have applied to your job listings.
        </p>
        <button className="btn btn-outline" style={{ marginTop: 20 }} onClick={() => navigate('/employer')}>Go to dashboard</button>
      </div>
    </div>
  )

  if (!candidate) return <div style={{ padding: 60, textAlign: 'center', color: '#666' }}>Candidate not found.</div>

  const skillList = candidate.skills ? candidate.skills.split(',').map(s => s.trim()).filter(Boolean) : []

  return (
    <div>
      <button onClick={() => navigate(-1)} style={{ border: 'none', background: 'none', color: '#666', fontSize: 13, cursor: 'pointer', marginBottom: 16, padding: 0 }}>← Back</button>

      {/* Profile header */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: skillList.length ? 14 : 0 }}>
          <AvatarImage src={candidate.avatar_url} name={candidate.full_name} size={64} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontSize: 18, fontWeight: 500, marginBottom: 4 }}>{candidate.full_name}</h2>
            {candidate.headline && <p style={{ fontSize: 14, color: '#555', marginBottom: 6 }}>{candidate.headline}</p>}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {candidate.location && <p style={{ fontSize: 13, color: '#888' }}>📍 {candidate.location}</p>}
              {candidate.email && <p style={{ fontSize: 13, color: '#888' }}>✉️ {candidate.email}</p>}
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 6 }}>
              {candidate.linkedin_url && (
                <a href={candidate.linkedin_url} target="_blank" rel="noreferrer"
                  style={{ fontSize: 13, color: '#0A66C2', textDecoration: 'none', fontWeight: 500 }}>LinkedIn ↗</a>
              )}
              {candidate.intro_video_url && candidate.video_visibility !== 'private' && (
                <a href={candidate.intro_video_url} target="_blank" rel="noreferrer"
                  style={{ fontSize: 13, color: '#0F6E56', textDecoration: 'none', fontWeight: 500 }}>🎥 Intro video ↗</a>
              )}
            </div>
          </div>
        </div>
        {skillList.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {skillList.map(s => <span key={s} className="badge badge-purple">{s}</span>)}
          </div>
        )}
      </div>

      {/* Applications to employer's jobs */}
      {applications.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <p className="section-label" style={{ marginBottom: 10 }}>Applications</p>
          {applications.map(app => {
            const sc = statusColors[app.status] || statusColors.submitted
            return (
              <div key={app.id} className="card" style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <p style={{ fontWeight: 500, fontSize: 15 }}>{app.jobs?.title}</p>
                    <p style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                      Applied {new Date(app.created_at).toLocaleDateString('en-SG')}
                    </p>
                  </div>
                  <span className="badge" style={{ background: sc.bg, color: sc.tc }}>{app.status}</span>
                </div>

                {/* Cover note */}
                {app.cover_note && (
                  <div style={{ background: '#f9f9f7', borderRadius: 8, padding: '10px 12px', marginBottom: 10, borderLeft: '3px solid #1D9E75' }}>
                    <p style={{ fontSize: 11, color: '#888', marginBottom: 4, fontWeight: 500 }}>NOTE FROM CANDIDATE</p>
                    <p style={{ fontSize: 13, color: '#444', lineHeight: 1.6 }}>{app.cover_note}</p>
                  </div>
                )}

                {/* Links */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                  {app.reference_url && (
                    <a href={app.reference_url} target="_blank" rel="noreferrer"
                      style={{ fontSize: 12, color: '#534AB7', textDecoration: 'none', background: '#EEEDFE', padding: '4px 10px', borderRadius: 20, fontWeight: 500 }}>
                      🔗 Reference link ↗
                    </a>
                  )}
                  {app.video_responses?.map(v => (
                    <div key={v.id} style={{ marginBottom: 8 }}>
                      <VideoPlayer
                        cloudflareVideoId={v.cloudflare_video_id}
                        fallbackUrl={v.video_url}
                        label={v.type === 'job_response' ? 'Watch video response' : 'Watch intro video'}
                      />
                    </div>
                  ))}
                </div>

                {/* Projects */}
                {app.projects?.map(p => (
                  <div key={p.id} style={{ background: '#f4f4f2', borderRadius: 8, padding: '8px 10px', marginBottom: 6 }}>
                    <p style={{ fontSize: 13, fontWeight: 500 }}>💼 {p.title}</p>
                    {p.description && <p style={{ fontSize: 12, color: '#666', marginTop: 3, lineHeight: 1.5 }}>{p.description}</p>}
                    {p.project_url && <a href={p.project_url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#534AB7', display: 'inline-block', marginTop: 4 }}>View ↗</a>}
                  </div>
                ))}

                {/* Status update */}
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, color: '#aaa' }}>Move to:</span>
                  {['reviewed', 'shortlisted', 'rejected'].map(s => (
                    <button key={s} onClick={() => updateStatus(app.id, s)}
                      className="btn btn-outline"
                      style={{ fontSize: 11, padding: '4px 10px', background: app.status === s ? statusColors[s].bg : undefined, color: app.status === s ? statusColors[s].tc : undefined }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Portfolio */}
      {portfolio.length > 0 && (
        <div>
          <p className="section-label" style={{ marginBottom: 10 }}>Portfolio ({portfolio.length})</p>
          {portfolio.map(item => {
            const icon = typeIcons[item.type] || '🔗'
            return (
              <div key={item.id} className="card" style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                      <p style={{ fontWeight: 500, fontSize: 14 }}>{item.title}</p>
                      <span style={{ fontSize: 10, background: '#f4f4f2', color: '#888', padding: '2px 7px', borderRadius: 10 }}>{item.type}</span>
                    </div>
                    {item.description && <p style={{ fontSize: 13, color: '#666', lineHeight: 1.5, marginBottom: 4 }}>{item.description}</p>}
                    {item.url && <a href={item.url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#1D9E75', textDecoration: 'none', fontWeight: 500 }}>View ↗</a>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {portfolio.length === 0 && applications.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: 32, color: '#888', background: '#f9f9f7', border: 'none' }}>
          <p style={{ fontSize: 13 }}>No additional portfolio items</p>
        </div>
      )}
    </div>
  )
}
