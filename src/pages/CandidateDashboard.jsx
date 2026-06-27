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

const typeIcons = { project: '💼', website: '🌐', video: '🎥', article: '📝', other: '🔗' }

export default function CandidateDashboard() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('profile')
  const [applications, setApplications] = useState([])
  const [portfolio, setPortfolio] = useState([])
  const [loading, setLoading] = useState(true)
  const [dataError, setDataError] = useState('')

  useEffect(() => {
    if (profile?.id) {
      loadApplications()
      loadPortfolio()
    }
  }, [profile?.id])

  async function loadApplications() {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*, jobs (title, company_name, location), video_responses (id, type, video_url), projects (id, title, project_url)')
        .eq('candidate_id', profile.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      setApplications(data || [])
    } catch (e) {
      console.error('Applications error:', e)
    }
  }

  async function loadPortfolio() {
    try {
      const { data, error } = await supabase
        .from('portfolio_items')
        .select('*')
        .eq('candidate_id', profile.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      setPortfolio(data || [])
    } catch (e) {
      console.error('Portfolio error:', e)
      setDataError(e.message)
    } finally {
      setLoading(false)
    }
  }

  if (!profile) return <div style={{ padding: 40, textAlign: 'center', color: '#666' }}>Loading profile...</div>

  const initials = profile.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  const skillList = profile.skills
    ? profile.skills.split(',').map(s => s.trim()).filter(Boolean)
    : []

  const shortlisted = applications.filter(a => a.status === 'shortlisted').length

  return (
    <div>
      {dataError && (
        <div style={{ background: '#FAECE7', color: '#D85A30', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
          Error: {dataError}
        </div>
      )}

      <div className="subtabs">
        {['profile', 'portfolio', 'applications'].map(t => (
          <button key={t} className={`subtab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
            {t}{t === 'applications' && applications.length > 0 ? ` (${applications.length})` : ''}
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
                  {profile.full_name || 'Your Name'}
                </p>
                <p style={{ fontSize: 13, color: '#666', marginBottom: 3 }}>
                  {profile.headline || 'Add a headline to your profile'}
                </p>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {profile.location && <p style={{ fontSize: 12, color: '#888' }}>📍 {profile.location}</p>}
                  {profile.linkedin_url && (
                    <a href={profile.linkedin_url} target="_blank" rel="noreferrer"
                      style={{ fontSize: 12, color: '#0A66C2', textDecoration: 'none', fontWeight: 500 }}>
                      LinkedIn ↗
                    </a>
                  )}
                </div>
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

          {profile.intro_video_url && (
            <div className="card" style={{ marginTop: 10, background: '#E1F5EE', border: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="play-btn" style={{ background: '#1D9E75', flexShrink: 0 }}>
                  <div className="play-triangle" />
                </div>
                <div>
                  <p style={{ fontWeight: 500, fontSize: 13, color: '#0F6E56', margin: 0 }}>Intro video</p>
                  <a href={profile.intro_video_url} target="_blank" rel="noreferrer"
                    style={{ fontSize: 12, color: '#0F6E56', opacity: 0.8 }}>Watch ↗</a>
                </div>
              </div>
            </div>
          )}

          {(!profile.headline || skillList.length === 0) && (
            <Link to="/profile" style={{ textDecoration: 'none' }}>
              <div style={{ marginTop: 10, background: '#FAEEDA', borderRadius: 10, padding: '12px 14px', fontSize: 13, color: '#BA7517', cursor: 'pointer' }}>
                ✏️ Complete your profile — add a headline, skills, LinkedIn and intro video
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
            <div className="stat-card">
              <div className="stat-value" style={{ color: '#534AB7' }}>{portfolio.length}</div>
              <div className="stat-label">Portfolio</div>
            </div>
          </div>

          <button className="btn btn-primary" style={{ width: '100%', marginTop: 16 }} onClick={() => navigate('/jobs')}>
            Browse open jobs →
          </button>
        </div>
      )}

      {tab === 'portfolio' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <p style={{ fontSize: 15, fontWeight: 500 }}>Your portfolio</p>
            <Link to="/profile">
              <button className="btn btn-outline" style={{ fontSize: 12, padding: '5px 12px' }}>+ Add item</button>
            </Link>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>Loading...</div>
          ) : portfolio.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 40 }}>
              <p style={{ color: '#666', marginBottom: 6, fontSize: 14 }}>No portfolio items yet</p>
              <p style={{ color: '#888', fontSize: 12, marginBottom: 16 }}>Add projects, websites, videos, or articles</p>
              <Link to="/profile"><button className="btn btn-primary">Add your first item</button></Link>
            </div>
          ) : (
            portfolio.map(item => (
              <div key={item.id} className="card" style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: item.description ? 6 : 0 }}>
                  <span style={{ fontSize: 16 }}>{typeIcons[item.type] || '🔗'}</span>
                  <p style={{ fontWeight: 500, fontSize: 14, flex: 1 }}>{item.title}</p>
                  <span className="badge" style={{ background: '#f4f4f2', color: '#666', fontSize: 10 }}>{item.type}</span>
                </div>
                {item.description && (
                  <p style={{ fontSize: 13, color: '#666', lineHeight: 1.6, marginBottom: 6 }}>{item.description}</p>
                )}
                {item.url && (
                  <a href={item.url} target="_blank" rel="noreferrer"
                    style={{ fontSize: 13, color: '#1D9E75', textDecoration: 'none', fontWeight: 500 }}>
                    View ↗
                  </a>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'applications' && (
        <div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>Loading...</div>
          ) : applications.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 48 }}>
              <p style={{ color: '#666', marginBottom: 14 }}>No applications yet</p>
              <button className="btn btn-primary" onClick={() => navigate('/jobs')}>Browse jobs</button>
            </div>
          ) : (
            applications.map(app => {
              const sc = statusColors[app.status] || statusColors.submitted
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
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                    {app.video_responses?.some(v => v.type === 'introduction') && <span className="badge badge-green">🎥 Intro</span>}
                    {app.video_responses?.some(v => v.type === 'job_response') && <span className="badge badge-green">🎥 Response</span>}
                    {app.projects?.length > 0 && <span className="badge badge-purple">💼 Project</span>}
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
