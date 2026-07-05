import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { notify } from '../lib/notifications'

const statusColors = {
  submitted:   { bg: '#E1F5EE', tc: '#0F6E56' },
  reviewed:    { bg: '#EEEDFE', tc: '#534AB7' },
  shortlisted: { bg: '#FAEEDA', tc: '#BA7517' },
  rejected:    { bg: '#FAECE7', tc: '#D85A30' },
}

export default function EmployerDashboard() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('jobs')
  const [jobs, setJobs] = useState([])
  const [selectedJob, setSelectedJob] = useState(null)
  const [applications, setApplications] = useState([])
  const [loadingJobs, setLoadingJobs] = useState(true)
  const [loadingApps, setLoadingApps] = useState(false)
  const [showCreate, setShowCreate] = useState(false)

  const [jobTitle, setJobTitle] = useState('')
  const [jobDesc, setJobDesc] = useState('')
  const [jobReq, setJobReq] = useState('')
  const [jobLocation, setJobLocation] = useState('')
  const [jobType, setJobType] = useState('full-time')
  const [jobQuestion, setJobQuestion] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  useEffect(() => {
    if (profile) loadJobs()
  }, [profile])

  async function loadJobs() {
    const { data } = await supabase
      .from('jobs').select('*')
      .eq('employer_id', profile.id)
      .order('created_at', { ascending: false })
    setJobs(data || [])
    setLoadingJobs(false)
  }

  async function loadApplications(jobId) {
    setLoadingApps(true)
    const { data } = await supabase
      .from('applications')
      .select(`
        *,
        profiles!candidate_id (full_name, headline, location, skills, linkedin_url, intro_video_url, avatar_url, email, video_visibility),
        video_responses (id, type, video_url),
        projects (id, title, description, project_url)
      `)
      .eq('job_id', jobId)
      .order('created_at', { ascending: false })
    setApplications(data || [])
    setLoadingApps(false)
  }

  async function handleCreateJob(e) {
    e.preventDefault()
    setCreating(true)
    setCreateError('')
    const { error } = await supabase.from('jobs').insert({
      employer_id: profile.id,
      title: jobTitle,
      company_name: profile.company_name,
      description: jobDesc,
      requirements: jobReq,
      location: jobLocation,
      job_type: jobType,
      video_question: jobQuestion || null,
    })
    if (error) {
      setCreateError(error.message)
    } else {
      setShowCreate(false)
      setJobTitle(''); setJobDesc(''); setJobReq('')
      setJobLocation(''); setJobQuestion('')
      await loadJobs()
    }
    setCreating(false)
  }

  async function toggleJobStatus(job) {
    await supabase.from('jobs').update({ is_active: !job.is_active }).eq('id', job.id)
    await loadJobs()
  }

  async function updateStatus(appId, status) {
    await supabase.from('applications').update({ status }).eq('id', appId)

    // Notify candidate of status change
    const app = applications.find(a => a.id === appId)
    if (app) {
      const statusMessages = {
        reviewed:    'Your application is being reviewed',
        shortlisted: '🎉 You\'ve been shortlisted!',
        rejected:    'Your application was not progressed',
      }
      notify({
        userId: app.candidate_id,
        type: 'status_changed',
        title: `Application update: ${selectedJob?.title}`,
        body: statusMessages[status] || `Status updated to ${status}`,
        link: '/candidate',
        recipientEmail: app.profiles?.email,
      }).catch(() => {})
    }

    if (selectedJob) await loadApplications(selectedJob.id)
  }

  function pickJob(job) {
    setSelectedJob(job)
    setTab('applications')
    loadApplications(job.id)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 500 }}>{profile?.company_name || 'Dashboard'}</h2>
          <p style={{ fontSize: 13, color: '#666' }}>Employer · {jobs.length} {jobs.length === 1 ? 'role' : 'roles'} posted</p>
        </div>
        <button className="btn btn-outline" style={{ fontSize: 12, padding: '5px 12px' }} onClick={() => navigate('/profile')}>
          Edit profile
        </button>
      </div>

      <div className="subtabs">
        {['jobs', 'applications'].map(t => (
          <button key={t} className={`subtab${tab === t ? ' active' : ''}`}
            onClick={() => { setTab(t); if (t === 'jobs') { setSelectedJob(null); setApplications([]) } }}>
            {t}
          </button>
        ))}
      </div>

      {/* JOBS TAB */}
      {tab === 'jobs' && (
        <div>
          {/* First-time welcome */}
          {!loadingJobs && jobs.length === 0 && !showCreate && (
            <div style={{ background: 'linear-gradient(135deg, #E1F5EE 0%, #EEEDFE 100%)', borderRadius: 14, padding: '20px', marginBottom: 16 }}>
              <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Welcome to SG Hire Insight! 👋</p>
              <p style={{ fontSize: 13, color: '#555', marginBottom: 16, lineHeight: 1.6 }}>
                Singapore's video-first hiring platform. Post a role and start receiving candidate applications with video introductions and portfolio showcases.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {[
                  { icon: '📋', title: 'Post a job listing', sub: 'Add title, description, requirements and a video question for candidates' },
                  { icon: '🎥', title: 'Candidates apply with video', sub: 'Get intro videos, why-me responses and portfolio links — before any interview' },
                  { icon: '⚡', title: 'Pre-screen in minutes', sub: 'Shortlist or reject with one click. No wasted calls.' },
                ].map((tip, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, background: '#fff', borderRadius: 10, padding: '10px 14px' }}>
                    <span style={{ fontSize: 20, flexShrink: 0 }}>{tip.icon}</span>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{tip.title}</p>
                      <p style={{ fontSize: 12, color: '#666', lineHeight: 1.5 }}>{tip.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button className="btn btn-primary" style={{ width: '100%', fontSize: 15 }} onClick={() => setShowCreate(true)}>
                + Post your first role →
              </button>
            </div>
          )}
          {!showCreate && jobs.length > 0 && (
            <button className="btn btn-primary" style={{ width: '100%', marginBottom: 16 }} onClick={() => setShowCreate(true)}>
              + Post a new role
            </button>
          )}

          {showCreate && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: 15, fontWeight: 500 }}>New job listing</h3>
                <button onClick={() => setShowCreate(false)} style={{ border: 'none', background: 'none', color: '#888', fontSize: 18, cursor: 'pointer' }}>×</button>
              </div>
              {createError && (
                <div style={{ background: '#FAECE7', color: '#D85A30', padding: '10px 12px', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>{createError}</div>
              )}
              <form onSubmit={handleCreateJob}>
                <div style={{ marginBottom: 12 }}>
                  <label className="form-label">Job title *</label>
                  <input className="form-input" type="text" placeholder="e.g. Senior Data Analyst" value={jobTitle}
                    onChange={e => setJobTitle(e.target.value)} required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                  <div>
                    <label className="form-label">Location</label>
                    <input className="form-input" type="text" placeholder="e.g. Singapore (Hybrid)" value={jobLocation}
                      onChange={e => setJobLocation(e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label">Type</label>
                    <select className="form-input" value={jobType} onChange={e => setJobType(e.target.value)}>
                      <option value="full-time">Full-time</option>
                      <option value="part-time">Part-time</option>
                      <option value="contract">Contract</option>
                      <option value="internship">Internship</option>
                    </select>
                  </div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label className="form-label">Role description</label>
                  <textarea className="form-input" rows={3} placeholder="Overview, team context, responsibilities..."
                    value={jobDesc} onChange={e => setJobDesc(e.target.value)} style={{ resize: 'vertical' }} />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label className="form-label">Requirements</label>
                  <textarea className="form-input" rows={3} placeholder="Must-haves, experience level, skills..."
                    value={jobReq} onChange={e => setJobReq(e.target.value)} style={{ resize: 'vertical' }} />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label className="form-label">Video question for candidates <span style={{ color: '#888', fontWeight: 400 }}>(optional)</span></label>
                  <input className="form-input" type="text" placeholder="e.g. Walk us through a project you're most proud of"
                    value={jobQuestion} onChange={e => setJobQuestion(e.target.value)} />
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="button" className="btn btn-outline" onClick={() => setShowCreate(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={creating}>
                    {creating ? 'Posting...' : 'Post job'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {loadingJobs ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>Loading...</div>
          ) : jobs.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 48, color: '#666' }}>
              No jobs posted yet. Post your first role above.
            </div>
          ) : (
            jobs.map(job => (
              <div key={job.id} className="card" style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <p style={{ fontWeight: 500, fontSize: 14, marginBottom: 2 }}>{job.title}</p>
                    <p style={{ fontSize: 12, color: '#666' }}>
                      {[job.location, job.job_type].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <span className="badge" style={job.is_active
                    ? { background: '#E1F5EE', color: '#0F6E56' }
                    : { background: '#f4f4f2', color: '#888' }}>
                    {job.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                  <button className="btn btn-outline" style={{ fontSize: 12, padding: '5px 12px' }} onClick={() => pickJob(job)}>
                    View applications
                  </button>
                  <button
                    className="btn btn-outline"
                    style={{ fontSize: 12, padding: '5px 12px', color: job.is_active ? '#D85A30' : '#1D9E75' }}
                    onClick={() => toggleJobStatus(job)}
                  >
                    {job.is_active ? 'Deactivate' : 'Reactivate'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* APPLICATIONS TAB */}
      {tab === 'applications' && (
        <div>
          {!selectedJob ? (
            <div>
              <p style={{ fontSize: 13, color: '#666', marginBottom: 14 }}>Select a role to view its applicants:</p>
              {jobs.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: 40, color: '#666' }}>
                  No jobs posted yet. <span style={{ color: '#1D9E75', cursor: 'pointer' }} onClick={() => setTab('jobs')}>Post a role →</span>
                </div>
              ) : (
                jobs.map(job => (
                  <div key={job.id} className="card" style={{ marginBottom: 8, cursor: 'pointer' }} onClick={() => pickJob(job)}>
                    <p style={{ fontWeight: 500, fontSize: 14 }}>{job.title}</p>
                    <p style={{ fontSize: 12, color: '#666', marginTop: 3 }}>{job.location} · {job.job_type}</p>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16 }}>
                <button onClick={() => { setSelectedJob(null); setApplications([]) }}
                  style={{ border: 'none', background: 'none', color: '#666', fontSize: 13, cursor: 'pointer', padding: 0 }}>
                  ← Back
                </button>
                <div>
                  <p style={{ fontWeight: 500, fontSize: 15 }}>{selectedJob.title}</p>
                  <p style={{ fontSize: 12, color: '#666' }}>{applications.length} applicant{applications.length !== 1 ? 's' : ''}</p>
                </div>
              </div>

              {loadingApps ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>Loading applicants...</div>
              ) : applications.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: 48, color: '#666' }}>No applications for this role yet.</div>
              ) : (
                applications.map(app => {
                  const sc = statusColors[app.status] || statusColors.submitted
                  const skillList = app.profiles?.skills
                    ? app.profiles.skills.split(',').map(s => s.trim()).filter(Boolean)
                    : []
                  const appInitials = app.profiles?.full_name
                    ? app.profiles.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                    : '?'
                  return (
                    <div key={app.id} className="card" style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                        {app.profiles?.avatar_url ? (
                          <img src={app.profiles.avatar_url + '?v=1'} alt={app.profiles.full_name}
                            style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '1.5px solid #e0e0dc' }} />
                        ) : (
                          <div className="avatar" style={{ background: '#EEEDFE', color: '#534AB7', fontSize: 13, fontWeight: 600 }}>
                            {appInitials}
                          </div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                            <p style={{ fontWeight: 500, fontSize: 14 }}>{app.profiles?.full_name}</p>
                            <Link to={`/candidate/${app.candidate_id}`}
                              style={{ fontSize: 11, color: '#1D9E75', textDecoration: 'none', fontWeight: 500 }}>
                              View profile ↗
                            </Link>
                          </div>
                          <p style={{ fontSize: 12, color: '#666', marginTop: 1 }}>{app.profiles?.headline}</p>
                          {app.profiles?.location && <p style={{ fontSize: 11, color: '#888', marginTop: 1 }}>📍 {app.profiles.location}</p>}
                        </div>
                        <span className="badge" style={{ background: sc.bg, color: sc.tc, flexShrink: 0, alignSelf: 'flex-start' }}>{app.status}</span>
                      </div>

                      {skillList.length > 0 && (
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 10 }}>
                          {skillList.map(s => <span key={s} className="badge badge-purple">{s}</span>)}
                        </div>
                      )}

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
                        {app.profiles?.linkedin_url && (
                          <a href={app.profiles.linkedin_url} target="_blank" rel="noreferrer"
                            style={{ fontSize: 12, color: '#0A66C2', textDecoration: 'none', background: '#E8F0FE', padding: '4px 10px', borderRadius: 20, fontWeight: 500 }}>
                            LinkedIn ↗
                          </a>
                        )}
                        {app.profiles?.intro_video_url && (
                          <a href={app.profiles.intro_video_url} target="_blank" rel="noreferrer"
                            style={{ fontSize: 12, color: '#0F6E56', textDecoration: 'none', background: '#E1F5EE', padding: '4px 10px', borderRadius: 20, fontWeight: 500 }}>
                            🎥 Intro video ↗
                          </a>
                        )}
                        {app.profiles?.intro_video_url && ['public', 'applications'].includes(app.profiles?.video_visibility) && (
                          <div key="intro" style={{ marginBottom: 6 }}>
                            <a href={app.profiles.intro_video_url} target="_blank" rel="noreferrer"
                              style={{ fontSize: 13, color: '#1D9E75', textDecoration: 'none' }}>
                              🎥 Watch candidate intro video ↗
                            </a>
                          </div>
                        )}
                        {app.video_responses?.map(v => (
                          <a key={v.id} href={v.video_url} target="_blank" rel="noreferrer"
                            style={{ fontSize: 12, color: '#0F6E56', textDecoration: 'none', background: '#E1F5EE', padding: '4px 10px', borderRadius: 20, fontWeight: 500 }}>
                            🎥 {v.type === 'job_response' ? 'Video response' : 'Intro video'} ↗
                          </a>
                        ))}
                      </div>

                      {/* Projects */}
                      {app.projects?.map(p => (
                        <div key={p.id} style={{ background: '#f4f4f2', borderRadius: 8, padding: '8px 10px', marginBottom: 6 }}>
                          <p style={{ fontSize: 13, fontWeight: 500 }}>💼 {p.title}</p>
                          {p.description && <p style={{ fontSize: 12, color: '#666', marginTop: 3, lineHeight: 1.5 }}>{p.description}</p>}
                          {p.project_url && (
                            <a href={p.project_url} target="_blank" rel="noreferrer"
                              style={{ fontSize: 12, color: '#534AB7', display: 'inline-block', marginTop: 4 }}>
                              View project ↗
                            </a>
                          )}
                        </div>
                      ))}

                      <div style={{ marginTop: 12, display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span style={{ fontSize: 11, color: '#aaa' }}>Move to:</span>
                        {['reviewed', 'shortlisted', 'rejected'].map(s => (
                          <button key={s} onClick={() => updateStatus(app.id, s)}
                            className="btn btn-outline"
                            style={{
                              fontSize: 11, padding: '4px 10px',
                              background: app.status === s ? statusColors[s].bg : undefined,
                              color: app.status === s ? statusColors[s].tc : undefined,
                              borderColor: app.status === s ? 'transparent' : undefined,
                            }}>
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
