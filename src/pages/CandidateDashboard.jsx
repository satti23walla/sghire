import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

const statusColors = {
  submitted:   { bg: '#E1F5EE', tc: '#0F6E56' },
  reviewed:    { bg: '#EEEDFE', tc: '#534AB7' },
  shortlisted: { bg: '#FAEEDA', tc: '#BA7517' },
  rejected:    { bg: '#FAECE7', tc: '#D85A30' },
}

export default function CandidateDashboard() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('profile')
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile) {
      supabase
        .from('applications')
        .select(`
          *,
          jobs (title, company_name, location),
          video_responses (id, type, video_url),
          projects (id, title, project_url)
        `)
        .eq('candidate_id', profile.id)
        .order('created_at', { ascending: false })
        .then(({ data }) => {
          setApplications(data || [])
          setLoading(false)
        })
    }
  }, [profile])

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  const skillList = profile?.skills
    ? profile.skills.split(',').map(s => s.trim()).filter(Boolean)
    : []

  const shortlisted = applications.filter(a => a.status === 'shortlisted').length

  return (
    <div>
      <div className="subtabs">
        {['profile', 'applications'].map(t => (
          <button key={t} className={`subtab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
            {t} {t === 'applications' && applications.length > 0 ? `(${applications.length})` : ''}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <div>
          <div className="card">
            <div style={{ display: 'flex', gap: 12, marginBottom: skillList.length > 0 ? 14 : 0 }}>
              <div className="avatar" style={{ background: '#EEEDFE', color: '#534AB7', fontSize: 16, fontWeight: 600 }}>
                {initials}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 500, fontSize: 16, marginBottom: 2 }}>
                  {profile?.full_name || 'Your Name'}
                </p>
                <p style={{ fontSize: 13, color: '#666', marginBottom: profile?.location ? 3 : 0 }}>
                  {profile?.headline || 'Add a headline to your profile'}
                </p>
                {profile?.location && (
                  <p style={{ fontSize: 12, color: '#888' }}>📍 {profile.location}</p>
                )}
              </div>
              <Link to="/profile" style={{ flexShrink: 0 }}>
                <button className="btn btn-outline" style={{ fontSize: 12, padding: '5px 12px' }}>Edit</button>
              </Link>
            </div>

            {skillList.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {skillList.map(s => <span key={s} className="badge badge-purple">{s}</span>)}
              </div>
            )}
          </div>

          {(!profile?.headline || skillList.length === 0) && (
            <Link to="/profile" style={{ textDecoration: 'none' }}>
              <div style={{ marginTop: 10, background: '#FAEEDA', borderRadius: 10, padding: '12px 14px', fontSize: 13, color: '#BA7517', cursor: 'pointer' }}>
                ✏️ Complete your profile — add a headline and skills to stand out
              </div>
            </Link>
          )}

          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-value" style={{ color: '#1D9E75' }}>{applications.length}</div>
              <div className="stat-label">Applications</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: '#BA7517' }}>{shortlisted}</div>
              <div className="stat-label">Shortlisted</div>
            </div>
          </div>

          <button className="btn btn-primary" style={{ width: '100%', marginTop: 16 }} onClick={() => navigate('/jobs')}>
            Browse open jobs →
          </button>
        </div>
      )}

      {tab === 'applications' && (
        <div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>Loading applications...</div>
          ) : applications.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 48 }}>
              <p style={{ color: '#666', marginBottom: 14 }}>No applications yet</p>
              <button className="btn btn-primary" onClick={() => navigate('/jobs')}>Browse jobs</button>
            </div>
          ) : (
            applications.map(app => {
              const sc = statusColors[app.status] || statusColors.submitted
              const hasIntro = app.video_responses?.some(v => v.type === 'introduction')
              const hasResponse = app.video_responses?.some(v => v.type === 'job_response')
              const hasProject = app.projects?.length > 0
              return (
                <div key={app.id} className="card" style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div>
                      <p style={{ fontWeight: 500, fontSize: 14, marginBottom: 2 }}>{app.jobs?.title}</p>
                      <p style={{ fontSize: 13, color: '#666' }}>{app.jobs?.company_name}</p>
                      {app.jobs?.location && <p style={{ fontSize: 12, color: '#888', marginTop: 2 }}>📍 {app.jobs.location}</p>}
                    </div>
                    <span className="badge" style={{ background: sc.bg, color: sc.tc, flexShrink: 0 }}>{app.status}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                    {hasIntro && <span className="badge badge-green">🎥 Intro</span>}
                    {hasResponse && <span className="badge badge-green">🎥 Response</span>}
                    {hasProject && <span className="badge badge-purple">💼 Project</span>}
                  </div>
                  <p style={{ fontSize: 11, color: '#aaa', marginTop: 8 }}>
                    Applied {new Date(app.created_at).toLocaleDateString('en-SG')}
                  </p>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
