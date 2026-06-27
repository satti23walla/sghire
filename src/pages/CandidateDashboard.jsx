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

const TYPES = [
  { key: 'project',  icon: '💼', label: 'Project',  hint: 'Something you built or led' },
  { key: 'website',  icon: '🌐', label: 'Website',  hint: 'Live site, portfolio, or product' },
  { key: 'video',    icon: '🎥', label: 'Video',    hint: 'YouTube, Loom, or presentation' },
  { key: 'article',  icon: '📝', label: 'Article',  hint: 'Blog post, case study, write-up' },
  { key: 'other',    icon: '🔗', label: 'Other',    hint: 'GitHub, Behance, Dribbble, etc.' },
]

export default function CandidateDashboard() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('profile')
  const [applications, setApplications] = useState([])
  const [portfolio, setPortfolio] = useState([])
  const [loadingApps, setLoadingApps] = useState(true)
  const [loadingPortfolio, setLoadingPortfolio] = useState(true)

  // Add item form state
  const [showForm, setShowForm] = useState(false)
  const [newType, setNewType] = useState('project')
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    if (!profile?.id) return
    loadApplications()
    loadPortfolio()
  }, [profile?.id])

  async function loadApplications() {
    setLoadingApps(true)
    try {
      const { data } = await supabase
        .from('applications')
        .select('*, jobs (title, company_name, location), video_responses (id, type, video_url), projects (id, title, project_url)')
        .eq('candidate_id', profile.id)
        .order('created_at', { ascending: false })
      setApplications(data || [])
    } catch (e) {
      setApplications([])
    } finally {
      setLoadingApps(false)
    }
  }

  async function loadPortfolio() {
    setLoadingPortfolio(true)
    try {
      const { data } = await supabase
        .from('portfolio_items')
        .select('*')
        .eq('candidate_id', profile.id)
        .order('created_at', { ascending: false })
      setPortfolio(data || [])
    } catch (e) {
      setPortfolio([])
    } finally {
      setLoadingPortfolio(false)
    }
  }

  async function handleAddItem(e) {
    e.preventDefault()
    if (!newTitle.trim()) return
    setAdding(true)
    const { error } = await supabase.from('portfolio_items').insert({
      candidate_id: profile.id,
      title: newTitle.trim(),
      description: newDesc.trim() || null,
      type: newType,
      url: newUrl.trim() || null,
    })
    if (!error) {
      setNewTitle(''); setNewDesc(''); setNewUrl(''); setNewType('project')
      setShowForm(false)
      await loadPortfolio()
    }
    setAdding(false)
  }

  async function handleDelete(id) {
    await supabase.from('portfolio_items').delete().eq('id', id)
    setPortfolio(prev => prev.filter(p => p.id !== id))
  }

  if (!profile) return <div style={{ padding: 40, textAlign: 'center', color: '#666' }}>Loading...</div>

  const initials = profile.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'
  const skillList = profile.skills
    ? profile.skills.split(',').map(s => s.trim()).filter(Boolean)
    : []
  const shortlisted = applications.filter(a => a.status === 'shortlisted').length

  return (
    <div>
      <div className="subtabs">
        {['profile', 'portfolio', 'applications'].map(t => (
          <button key={t} className={`subtab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
            {t}{t === 'applications' && applications.length > 0 ? ` (${applications.length})` : ''}
            {t === 'portfolio' && portfolio.length > 0 ? ` (${portfolio.length})` : ''}
          </button>
        ))}
      </div>

      {/* PROFILE TAB */}
      {tab === 'profile' && (
        <div>
          <div className="card">
            <div style={{ display: 'flex', gap: 12, marginBottom: skillList.length > 0 ? 14 : 0 }}>
              <div className="avatar" style={{ background: '#EEEDFE', color: '#534AB7', fontSize: 16, fontWeight: 600 }}>
                {initials}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 500, fontSize: 16, marginBottom: 2 }}>{profile.full_name || 'Your Name'}</p>
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

      {/* PORTFOLIO TAB */}
      {tab === 'portfolio' && (
        <div>
          {/* Type picker when adding */}
          {!showForm && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 13, color: '#666', marginBottom: 10 }}>What would you like to add?</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8 }}>
                {TYPES.map(t => (
                  <button key={t.key} onClick={() => { setNewType(t.key); setShowForm(true) }}
                    style={{
                      padding: '12px 8px', borderRadius: 10,
                      border: '0.5px solid #e0e0dc', background: '#fff',
                      cursor: 'pointer', textAlign: 'center',
                    }}>
                    <div style={{ fontSize: 22, marginBottom: 4 }}>{t.icon}</div>
                    <p style={{ fontWeight: 500, fontSize: 13, marginBottom: 2 }}>{t.label}</p>
                    <p style={{ fontSize: 11, color: '#888', lineHeight: 1.4 }}>{t.hint}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Add item form */}
          {showForm && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 20 }}>{TYPES.find(t => t.key === newType)?.icon}</span>
                  <p style={{ fontWeight: 500, fontSize: 15 }}>Add {newType}</p>
                </div>
                <button onClick={() => setShowForm(false)}
                  style={{ border: 'none', background: 'none', color: '#aaa', fontSize: 20, cursor: 'pointer' }}>×</button>
              </div>

              {/* Type switcher */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                {TYPES.map(t => (
                  <button key={t.key} type="button" onClick={() => setNewType(t.key)}
                    style={{
                      padding: '4px 10px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                      border: `1px solid ${newType === t.key ? '#1D9E75' : '#e0e0dc'}`,
                      background: newType === t.key ? '#E1F5EE' : '#fff',
                      color: newType === t.key ? '#0F6E56' : '#666',
                      fontWeight: newType === t.key ? 500 : 400,
                    }}>
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>

              <form onSubmit={handleAddItem}>
                <div style={{ marginBottom: 12 }}>
                  <label className="form-label">Title *</label>
                  <input className="form-input" type="text" autoFocus
                    placeholder={
                      newType === 'project' ? 'e.g. Sales Dashboard · DBS Bank' :
                      newType === 'website' ? 'e.g. My Portfolio Site' :
                      newType === 'video' ? 'e.g. Product Demo — Shopee Analytics' :
                      newType === 'article' ? 'e.g. How I built a real-time dashboard in 2 days' :
                      'e.g. GitHub Profile'
                    }
                    value={newTitle} onChange={e => setNewTitle(e.target.value)} required />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label className="form-label">Description <span style={{ color: '#888', fontWeight: 400 }}>(optional)</span></label>
                  <textarea className="form-input" rows={2}
                    placeholder={
                      newType === 'project' ? 'What did you build? What tools did you use? What was the impact?' :
                      newType === 'video' ? 'What does this video show?' :
                      newType === 'article' ? 'What is this article about?' :
                      'Brief description'
                    }
                    value={newDesc} onChange={e => setNewDesc(e.target.value)}
                    style={{ resize: 'vertical' }} />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label className="form-label">
                    Link <span style={{ color: '#888', fontWeight: 400 }}>
                      ({newType === 'project' ? 'GitHub, live demo, case study' :
                        newType === 'video' ? 'YouTube, Loom, Google Drive' :
                        newType === 'article' ? 'Medium, Substack, company blog' :
                        newType === 'website' ? 'URL of the site' :
                        'Any relevant link'})
                    </span>
                  </label>
                  <input className="form-input" type="url" placeholder="https://..."
                    value={newUrl} onChange={e => setNewUrl(e.target.value)} />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={adding}>
                    {adding ? 'Adding...' : `Add ${newType}`}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Portfolio list */}
          {loadingPortfolio ? (
            <div style={{ textAlign: 'center', padding: 32, color: '#aaa', fontSize: 13 }}>Loading...</div>
          ) : portfolio.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 32, color: '#888' }}>
              <p style={{ fontSize: 13 }}>Nothing added yet — pick a type above to get started</p>
            </div>
          ) : (
            <div>
              {!showForm && <p className="section-label" style={{ marginBottom: 12 }}>Your items ({portfolio.length})</p>}
              {portfolio.map(item => {
                const t = TYPES.find(x => x.key === item.type) || TYPES[4]
                return (
                  <div key={item.id} className="card" style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <span style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>{t.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <p style={{ fontWeight: 500, fontSize: 14, marginBottom: 2 }}>{item.title}</p>
                          <button onClick={() => handleDelete(item.id)}
                            style={{ border: 'none', background: 'none', color: '#ccc', fontSize: 16, cursor: 'pointer', padding: '0 0 0 8px', flexShrink: 0 }}>×</button>
                        </div>
                        <span style={{ fontSize: 10, background: '#f4f4f2', color: '#888', padding: '2px 7px', borderRadius: 10 }}>{t.label}</span>
                        {item.description && (
                          <p style={{ fontSize: 12, color: '#666', lineHeight: 1.5, marginTop: 6 }}>{item.description}</p>
                        )}
                        {item.url && (
                          <a href={item.url} target="_blank" rel="noreferrer"
                            style={{ fontSize: 12, color: '#1D9E75', textDecoration: 'none', fontWeight: 500, display: 'inline-block', marginTop: 6 }}>
                            View ↗
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* APPLICATIONS TAB */}
      {tab === 'applications' && (
        <div>
          {loadingApps ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#aaa', fontSize: 13 }}>Loading...</div>
          ) : applications.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 48 }}>
              <p style={{ fontSize: 32, marginBottom: 10 }}>📋</p>
              <p style={{ fontWeight: 500, fontSize: 15, marginBottom: 6 }}>No applications yet</p>
              <p style={{ color: '#666', fontSize: 13, marginBottom: 16 }}>Browse open roles and apply to get started</p>
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
