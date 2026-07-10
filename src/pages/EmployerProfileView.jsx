import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import AvatarImage from '../components/AvatarImage'

export default function EmployerProfileView() {
  const { id } = useParams()
  const { profile: myProfile } = useAuth()
  const navigate = useNavigate()
  const [employer, setEmployer] = useState(null)
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [accessDenied, setAccessDenied] = useState(false)

  useEffect(() => {
    if (myProfile) loadEmployer()
  }, [id, myProfile])

  async function loadEmployer() {
    // Candidates can only view employers whose jobs they've applied to
    if (myProfile?.role === 'candidate') {
      // Step 1: get all applications by this candidate
      const { data: apps } = await supabase
        .from('applications')
        .select('job_id, jobs!inner(employer_id)')
        .eq('candidate_id', myProfile.id)

      // Step 2: check if any application's job belongs to this employer
      const hasAccess = (apps || []).some(a => a.jobs?.employer_id === id)
      if (!hasAccess) {
        setAccessDenied(true)
        setLoading(false)
        return
      }
    }

    const { data: emp } = await supabase
      .from('profiles').select('*').eq('id', id).eq('role', 'employer').single()

    if (emp) {
      setEmployer(emp)
      const { data: activeJobs } = await supabase
        .from('jobs').select('id, title, location, job_type, created_at')
        .eq('employer_id', id).eq('is_active', true)
        .order('created_at', { ascending: false })
      setJobs(activeJobs || [])
    }
    setLoading(false)
  }

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: '#666' }}>Loading...</div>

  if (accessDenied) return (
    <div>
      <button onClick={() => navigate(-1)} style={{ border: 'none', background: 'none', color: '#666', fontSize: 13, cursor: 'pointer', marginBottom: 16, padding: 0 }}>← Back</button>
      <div className="card" style={{ textAlign: 'center', padding: 48 }}>
        <p style={{ fontSize: 32, marginBottom: 12 }}>🔒</p>
        <p style={{ fontWeight: 500, fontSize: 16, marginBottom: 8 }}>Access restricted</p>
        <p style={{ fontSize: 14, color: '#666', lineHeight: 1.6, maxWidth: 320, margin: '0 auto' }}>
          You can only view profiles of employers whose jobs you've applied to.
        </p>
        <button className="btn btn-outline" style={{ marginTop: 20 }} onClick={() => navigate('/candidate')}>Go to dashboard</button>
      </div>
    </div>
  )

  if (!employer) return <div style={{ padding: 60, textAlign: 'center', color: '#666' }}>Employer not found.</div>

  const typeColors = {
    'full-time':  { bg: '#E1F5EE', tc: '#0F6E56' },
    'part-time':  { bg: '#EEEDFE', tc: '#534AB7' },
    'contract':   { bg: '#FAEEDA', tc: '#BA7517' },
    'internship': { bg: '#FAECE7', tc: '#D85A30' },
  }

  return (
    <div>
      <button onClick={() => navigate(-1)} style={{ border: 'none', background: 'none', color: '#666', fontSize: 13, cursor: 'pointer', marginBottom: 16, padding: 0 }}>← Back</button>

      {/* Employer header */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 14 }}>
          <AvatarImage src={employer.avatar_url} name={employer.company_name || employer.full_name} size={64} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontSize: 18, fontWeight: 500, marginBottom: 3 }}>{employer.company_name || employer.full_name}</h2>
            {employer.full_name && employer.company_name && (
              <p style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>Hiring manager: {employer.full_name}</p>
            )}
            {employer.location && <p style={{ fontSize: 13, color: '#888' }}>📍 {employer.location}</p>}
          </div>
        </div>

        {/* Links */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {employer.company_url && (
            <a href={employer.company_url} target="_blank" rel="noreferrer"
              style={{ fontSize: 12, color: '#534AB7', textDecoration: 'none', background: '#EEEDFE', padding: '5px 12px', borderRadius: 20, fontWeight: 500 }}>
              🏢 Company profile ↗
            </a>
          )}
          {employer.linkedin_url && (
            <a href={employer.linkedin_url} target="_blank" rel="noreferrer"
              style={{ fontSize: 12, color: '#0A66C2', textDecoration: 'none', background: '#E8F0FE', padding: '5px 12px', borderRadius: 20, fontWeight: 500 }}>
              LinkedIn ↗
            </a>
          )}
          {employer.meet_team_url && (
            <a href={employer.meet_team_url} target="_blank" rel="noreferrer"
              style={{ fontSize: 12, color: '#0F6E56', textDecoration: 'none', background: '#E1F5EE', padding: '5px 12px', borderRadius: 20, fontWeight: 500 }}>
              👥 Meet the team ↗
            </a>
          )}
        </div>
      </div>

      {/* Hiring manager intro video */}
      {employer.intro_video_url && employer.video_visibility !== 'private' && (
        <div className="card" style={{ marginBottom: 12, background: '#EEEDFE', border: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="play-btn" style={{ background: '#534AB7', flexShrink: 0 }}>
              <div className="play-triangle" />
            </div>
            <div>
              <p style={{ fontWeight: 500, fontSize: 13, color: '#534AB7', margin: 0 }}>Meet your hiring manager</p>
              <a href={employer.intro_video_url} target="_blank" rel="noreferrer"
                style={{ fontSize: 12, color: '#534AB7', opacity: 0.8 }}>Watch intro video ↗</a>
            </div>
          </div>
        </div>
      )}

      {/* Active jobs */}
      {jobs.length > 0 && (
        <div>
          <p className="section-label" style={{ marginBottom: 12 }}>Open roles ({jobs.length})</p>
          {jobs.map(job => {
            const colors = typeColors[job.job_type] || typeColors['full-time']
            return (
              <div key={job.id} className="card" style={{ marginBottom: 8, cursor: 'pointer' }}
                onClick={() => navigate(`/jobs/${job.id}`)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontWeight: 500, fontSize: 14, marginBottom: 2 }}>{job.title}</p>
                    {job.location && <p style={{ fontSize: 12, color: '#888' }}>📍 {job.location}</p>}
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {job.job_type && <span className="badge" style={{ background: colors.bg, color: colors.tc }}>{job.job_type}</span>}
                    <span style={{ fontSize: 12, color: '#1D9E75' }}>View →</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
