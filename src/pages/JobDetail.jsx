import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function JobDetail() {
  const { id } = useParams()
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [hasApplied, setHasApplied] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [applying, setApplying] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const [introVideo, setIntroVideo] = useState('')
  const [responseVideo, setResponseVideo] = useState('')
  const [projectTitle, setProjectTitle] = useState('')
  const [projectDesc, setProjectDesc] = useState('')
  const [projectUrl, setProjectUrl] = useState('')

  useEffect(() => {
    supabase.from('jobs').select('*').eq('id', id).single().then(({ data }) => {
      setJob(data)
      setLoading(false)
    })
  }, [id])

  useEffect(() => {
    if (user && id) {
      supabase.from('applications')
        .select('id').eq('job_id', id).eq('candidate_id', user.id).single()
        .then(({ data }) => { if (data) setHasApplied(true) })
    }
  }, [user, id])

  async function handleApply(e) {
    e.preventDefault()
    if (!user) { navigate('/auth'); return }
    setApplying(true)
    setError('')

    try {
      const { data: app, error: appErr } = await supabase
        .from('applications')
        .insert({ job_id: id, candidate_id: user.id })
        .select().single()
      if (appErr) throw appErr

      const videos = []
      if (introVideo) videos.push({ application_id: app.id, type: 'introduction', video_url: introVideo })
      if (responseVideo) videos.push({ application_id: app.id, type: 'job_response', video_url: responseVideo })
      if (videos.length > 0) {
        const { error: vidErr } = await supabase.from('video_responses').insert(videos)
        if (vidErr) throw vidErr
      }

      if (projectTitle) {
        const { error: projErr } = await supabase.from('projects').insert({
          application_id: app.id,
          candidate_id: user.id,
          title: projectTitle,
          description: projectDesc,
          project_url: projectUrl || null,
        })
        if (projErr) throw projErr
      }

      setSuccess(true)
      setHasApplied(true)
      setShowForm(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setApplying(false)
    }
  }

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: '#666' }}>Loading...</div>
  if (!job) return <div style={{ padding: 60, textAlign: 'center', color: '#666' }}>Job not found.</div>

  const typeColors = {
    'full-time':  { bg: '#E1F5EE', tc: '#0F6E56' },
    'part-time':  { bg: '#EEEDFE', tc: '#534AB7' },
    'contract':   { bg: '#FAEEDA', tc: '#BA7517' },
    'internship': { bg: '#FAECE7', tc: '#D85A30' },
  }
  const colors = typeColors[job.job_type] || typeColors['full-time']

  const isCandidate = profile?.role === 'candidate'

  return (
    <div>
      <button onClick={() => navigate('/jobs')}
        style={{ border: 'none', background: 'none', color: '#666', fontSize: 13, cursor: 'pointer', marginBottom: 16, padding: 0 }}>
        ← Back to jobs
      </button>

      <div className="card" style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 500, marginBottom: 3 }}>{job.title}</h2>
            <p style={{ color: '#666', fontSize: 14 }}>{job.company_name}</p>
          </div>
          {job.job_type && <span className="badge" style={{ background: colors.bg, color: colors.tc }}>{job.job_type}</span>}
        </div>
        {job.location && <p style={{ fontSize: 13, color: '#888', marginBottom: 10 }}>📍 {job.location}</p>}
        {job.description && <p style={{ fontSize: 14, color: '#555', lineHeight: 1.7 }}>{job.description}</p>}
      </div>

      {job.requirements && (
        <div className="card" style={{ marginBottom: 12 }}>
          <p className="section-label" style={{ marginBottom: 10 }}>Requirements</p>
          <p style={{ fontSize: 14, color: '#555', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{job.requirements}</p>
        </div>
      )}

      {job.video_question && (
        <div className="card" style={{ marginBottom: 12, background: '#E1F5EE', border: 'none' }}>
          <p className="section-label" style={{ marginBottom: 8, color: '#0F6E56' }}>🎥 Video question</p>
          <p style={{ fontSize: 14, color: '#0F6E56', fontWeight: 500 }}>{job.video_question}</p>
          <p style={{ fontSize: 12, color: '#0F6E56', opacity: 0.7, marginTop: 6 }}>Record a short video response (1–3 min) and paste the link below when you apply.</p>
        </div>
      )}

      {success && (
        <div style={{ background: '#E1F5EE', color: '#0F6E56', padding: '14px 16px', borderRadius: 10, fontSize: 14, marginBottom: 14 }}>
          ✅ Application submitted! Track it in your <span style={{ fontWeight: 500, cursor: 'pointer', textDecoration: 'underline' }} onClick={() => navigate('/candidate')}>dashboard</span>.
        </div>
      )}

      {error && (
        <div style={{ background: '#FAECE7', color: '#D85A30', padding: '12px 14px', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>
          {error}
        </div>
      )}

      {isCandidate && !hasApplied && !showForm && (
        <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setShowForm(true)}>
          Apply for this role
        </button>
      )}

      {isCandidate && hasApplied && !success && (
        <div style={{ textAlign: 'center', padding: 16, color: '#0F6E56', fontSize: 14, background: '#E1F5EE', borderRadius: 10 }}>
          ✅ You've already applied for this role
        </div>
      )}

      {!user && (
        <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => navigate('/auth')}>
          Sign in to apply
        </button>
      )}

      {profile?.role === 'employer' && (
        <div style={{ textAlign: 'center', padding: 16, color: '#666', fontSize: 13, background: '#f4f4f2', borderRadius: 10 }}>
          You're viewing this as an employer. <span style={{ cursor: 'pointer', color: '#1D9E75', textDecoration: 'underline' }} onClick={() => navigate('/employer')}>Go to dashboard →</span>
        </div>
      )}

      {showForm && (
        <div className="card" style={{ marginTop: 14 }}>
          <h3 style={{ fontSize: 15, fontWeight: 500, marginBottom: 16 }}>Your application</h3>
          <form onSubmit={handleApply}>
            <div style={{ marginBottom: 14 }}>
              <label className="form-label">
                Intro video URL <span style={{ color: '#888', fontWeight: 400 }}>(YouTube, Loom, Google Drive, etc.)</span>
              </label>
              <input className="form-input" type="url" placeholder="https://..." value={introVideo}
                onChange={e => setIntroVideo(e.target.value)} />
              <p style={{ fontSize: 11, color: '#888', marginTop: 4 }}>A 1–2 min intro about yourself. Record on Loom (free) and paste the link.</p>
            </div>

            {job.video_question && (
              <div style={{ marginBottom: 14 }}>
                <label className="form-label">Video response to: <em>"{job.video_question}"</em></label>
                <input className="form-input" type="url" placeholder="https://..." value={responseVideo}
                  onChange={e => setResponseVideo(e.target.value)} />
              </div>
            )}

            <hr style={{ border: 'none', borderTop: '0.5px solid #e0e0dc', margin: '16px 0' }} />

            <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>
              Project showcase <span style={{ color: '#888', fontWeight: 400 }}>(optional but recommended)</span>
            </p>
            <div style={{ marginBottom: 12 }}>
              <label className="form-label">Project title</label>
              <input className="form-input" type="text" placeholder="e.g. Revenue Dashboard · DBS" value={projectTitle}
                onChange={e => setProjectTitle(e.target.value)} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label className="form-label">What did you build and what was the impact?</label>
              <textarea className="form-input" rows={3} placeholder="Describe the project, tools used, and outcome..."
                value={projectDesc} onChange={e => setProjectDesc(e.target.value)} style={{ resize: 'vertical' }} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label className="form-label">Project link <span style={{ color: '#888', fontWeight: 400 }}>(GitHub, live demo, case study, etc.)</span></label>
              <input className="form-input" type="url" placeholder="https://..." value={projectUrl}
                onChange={e => setProjectUrl(e.target.value)} />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={applying}>
                {applying ? 'Submitting...' : 'Submit application'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
