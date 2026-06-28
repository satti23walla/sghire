import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const typeColors = {
  'full-time':  { bg: '#E1F5EE', tc: '#0F6E56' },
  'part-time':  { bg: '#EEEDFE', tc: '#534AB7' },
  'contract':   { bg: '#FAEEDA', tc: '#BA7517' },
  'internship': { bg: '#FAECE7', tc: '#D85A30' },
}

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

  // Application form fields
  const [coverNote, setCoverNote] = useState('')
  const [referenceUrl, setReferenceUrl] = useState('')
  const [responseVideo, setResponseVideo] = useState('')

  useEffect(() => {
    supabase.from('jobs').select('*').eq('id', id).single()
      .then(({ data }) => { setJob(data); setLoading(false) })
  }, [id])

  useEffect(() => {
    if (user && id) {
      supabase.from('applications')
        .select('id').eq('job_id', id).eq('candidate_id', user.id).single()
        .then(({ data }) => { if (data) setHasApplied(true) })
    }
  }, [user, id])

  // Pre-fill reference URL with LinkedIn if available
  useEffect(() => {
    if (profile?.linkedin_url) setReferenceUrl(profile.linkedin_url)
    else if (profile?.intro_video_url) setReferenceUrl(profile.intro_video_url)
  }, [profile])

  async function handleApply(e) {
    e.preventDefault()
    if (!user) { navigate('/auth'); return }
    setApplying(true)
    setError('')

    try {
      const { data: app, error: appErr } = await supabase
        .from('applications')
        .insert({
          job_id: id,
          candidate_id: user.id,
          cover_note: coverNote.trim() || null,
          reference_url: referenceUrl.trim() || null,
        })
        .select().single()
      if (appErr) throw appErr

      // Add video response if provided
      if (responseVideo.trim()) {
        await supabase.from('video_responses').insert({
          application_id: app.id,
          type: 'job_response',
          video_url: responseVideo.trim(),
        })
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

  const colors = typeColors[job.job_type] || typeColors['full-time']
  const isCandidate = profile?.role === 'candidate'

  return (
    <div>
      <button onClick={() => navigate('/jobs')}
        style={{ border: 'none', background: 'none', color: '#666', fontSize: 13, cursor: 'pointer', marginBottom: 16, padding: 0 }}>
        ← Back to jobs
      </button>

      {/* Job header */}
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
          <p className="section-label" style={{ marginBottom: 8 }}>Requirements</p>
          <p style={{ fontSize: 14, color: '#555', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{job.requirements}</p>
        </div>
      )}

      {job.video_question && (
        <div className="card" style={{ marginBottom: 12, background: '#E1F5EE', border: 'none' }}>
          <p className="section-label" style={{ marginBottom: 6, color: '#0F6E56' }}>🎥 Video question from employer</p>
          <p style={{ fontSize: 14, color: '#0F6E56', fontWeight: 500 }}>{job.video_question}</p>
          <p style={{ fontSize: 12, color: '#0F6E56', opacity: 0.7, marginTop: 6 }}>
            Record a short response (1–3 min on Loom or YouTube) and paste the link when you apply.
          </p>
        </div>
      )}

      {/* Status messages */}
      {success && (
        <div style={{ background: '#E1F5EE', color: '#0F6E56', padding: '14px 16px', borderRadius: 10, fontSize: 14, marginBottom: 14 }}>
          ✅ Application sent! Track it in your <span style={{ fontWeight: 500, cursor: 'pointer', textDecoration: 'underline' }} onClick={() => navigate('/candidate')}>dashboard</span>.
        </div>
      )}
      {error && (
        <div style={{ background: '#FAECE7', color: '#D85A30', padding: '12px 14px', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>
          {error}
        </div>
      )}

      {/* Apply button or status */}
      {isCandidate && hasApplied && !success && (
        <div style={{ textAlign: 'center', padding: 16, background: '#E1F5EE', borderRadius: 10, color: '#0F6E56', fontSize: 14, marginBottom: 12 }}>
          ✅ You've already applied for this role
        </div>
      )}

      {isCandidate && !hasApplied && !showForm && !success && (
        <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setShowForm(true)}>
          Apply for this role →
        </button>
      )}

      {!user && (
        <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => navigate('/auth')}>
          Sign in to apply
        </button>
      )}

      {profile?.role === 'employer' && (
        <div style={{ textAlign: 'center', padding: 14, background: '#f4f4f2', borderRadius: 10, fontSize: 13, color: '#666' }}>
          You're viewing as an employer.{' '}
          <span style={{ color: '#1D9E75', cursor: 'pointer' }} onClick={() => navigate('/employer')}>
            Go to dashboard →
          </span>
        </div>
      )}

      {/* Application form */}
      {showForm && (
        <div className="card" style={{ marginTop: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 500 }}>Your application</h3>
            <button onClick={() => setShowForm(false)}
              style={{ border: 'none', background: 'none', color: '#aaa', fontSize: 20, cursor: 'pointer' }}>×</button>
          </div>

          <form onSubmit={handleApply}>
            {/* Note */}
            <div style={{ marginBottom: 14 }}>
              <label className="form-label">
                Note to employer <span style={{ color: '#888', fontWeight: 400 }}>(optional)</span>
              </label>
              <textarea className="form-input" rows={3}
                placeholder="Briefly introduce yourself and why you're interested in this role..."
                value={coverNote} onChange={e => setCoverNote(e.target.value)}
                maxLength={500}
                style={{ resize: 'vertical' }} />
              <p style={{ fontSize: 11, color: '#aaa', marginTop: 3, textAlign: 'right' }}>{coverNote.length}/500</p>
            </div>

            {/* Reference link */}
            <div style={{ marginBottom: 14 }}>
              <label className="form-label">
                Reference link <span style={{ color: '#888', fontWeight: 400 }}>(optional)</span>
              </label>
              <input className="form-input" type="url"
                placeholder="LinkedIn, portfolio, GitHub, resume link..."
                value={referenceUrl} onChange={e => setReferenceUrl(e.target.value)} />
              <p style={{ fontSize: 11, color: '#888', marginTop: 4 }}>
                Share your LinkedIn, portfolio site, GitHub, or any other relevant link. Pre-filled from your profile if available.
              </p>
            </div>

            {/* Video response - only if job requires it */}
            {job.video_question && (
              <div style={{ marginBottom: 14 }}>
                <label className="form-label">
                  Video response <span style={{ color: '#888', fontWeight: 400 }}>(optional but recommended)</span>
                </label>
                <div style={{ background: '#f4f4f2', borderRadius: 8, padding: '8px 12px', marginBottom: 8, fontSize: 12, color: '#555' }}>
                  Q: <em>{job.video_question}</em>
                </div>
                <input className="form-input" type="url"
                  placeholder="Paste your Loom or YouTube link here..."
                  value={responseVideo} onChange={e => setResponseVideo(e.target.value)} />
              </div>
            )}

            {/* Profile preview */}
            {(profile?.headline || profile?.skills) && (
              <div style={{ background: '#f4f4f2', borderRadius: 8, padding: '10px 12px', marginBottom: 16 }}>
                <p style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>YOUR PROFILE (shared automatically)</p>
                {profile.headline && <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{profile.headline}</p>}
                {profile.skills && (
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                    {profile.skills.split(',').map(s => s.trim()).filter(Boolean).map(s => (
                      <span key={s} className="badge badge-purple" style={{ fontSize: 10 }}>{s}</span>
                    ))}
                  </div>
                )}
              </div>
            )}

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
