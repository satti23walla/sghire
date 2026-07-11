import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useCountUp } from '../hooks/useCountUp'
import OnboardingWizard from '../components/OnboardingWizard'
import { supabase } from '../lib/supabase'
import AvatarImage from '../components/AvatarImage'
import VideoPlayer from '../components/VideoPlayer'

const statusColors = {
  submitted:    { bg: '#E1F5EE', tc: '#0F6E56' },
  reviewed:     { bg: '#EEEDFE', tc: '#534AB7' },
  shortlisted:  { bg: '#FAEEDA', tc: '#BA7517' },
  rejected:     { bg: '#FAECE7', tc: '#D85A30' },
}

const typeIcons = { project: '💼', website: '🌐', video: '🎥', article: '📝', other: '🔗' }

const SOURCES = [
  { key: 'linkedin',     label: 'LinkedIn',      icon: '💼', color: '#0A66C2', bg: '#E8F0FE' },
  { key: 'glassdoor',   label: 'Glassdoor',     icon: '🟢', color: '#0CAA41', bg: '#E6F7EC' },
  { key: 'company_site',label: 'Company site',  icon: '🏢', color: '#534AB7', bg: '#EEEDFE' },
  { key: 'other',       label: 'Other',         icon: '🔗', color: '#666',    bg: '#f4f4f2'  },
]

const TARGET_STATUSES = [
  { key: 'interested',   label: 'Interested',   icon: '👀', bg: '#E1F5EE', tc: '#0F6E56' },
  { key: 'applied',      label: 'Applied',      icon: '📨', bg: '#EEEDFE', tc: '#534AB7' },
  { key: 'interviewing', label: 'Interviewing', icon: '🤝', bg: '#FAEEDA', tc: '#BA7517' },
  { key: 'offer',        label: 'Offer',        icon: '🎉', bg: '#E1F5EE', tc: '#0F6E56' },
  { key: 'rejected',     label: 'Rejected',     icon: '❌', bg: '#FAECE7', tc: '#D85A30' },
]

export default function CandidateDashboard() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('profile')
  const [applications, setApplications] = useState([])
  const [portfolio, setPortfolio] = useState([])
  const [targets, setTargets] = useState([])
  const [loadingApps, setLoadingApps] = useState(true)
  const [showWizard, setShowWizard] = useState(false)
  const [loadingPortfolio, setLoadingPortfolio] = useState(true)
  const [loadingTargets, setLoadingTargets] = useState(true)

  // Add portfolio item
  const [showPortfolioForm, setShowPortfolioForm] = useState(false)
  const [newType, setNewType] = useState('project')
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [addingPortfolio, setAddingPortfolio] = useState(false)

  // Add target job
  const [showTargetForm, setShowTargetForm] = useState(false)
  const [tTitle, setTTitle] = useState('')
  const [tCompany, setTCompany] = useState('')
  const [tSource, setTSource] = useState('linkedin')
  const [tUrl, setTUrl] = useState('')
  const [tNotes, setTNotes] = useState('')
  const [tVideo, setTVideo] = useState('')
  const [addingTarget, setAddingTarget] = useState(false)

  const PORTFOLIO_TYPES = [
    { key: 'project', icon: '💼', label: 'Project',  hint: 'Something you built or led' },
    { key: 'website', icon: '🌐', label: 'Website',  hint: 'Live site, portfolio, or product' },
    { key: 'video',   icon: '🎥', label: 'Video',    hint: 'YouTube, Loom, or presentation' },
    { key: 'article', icon: '📝', label: 'Article',  hint: 'Blog post, case study, write-up' },
    { key: 'other',   icon: '🔗', label: 'Other',    hint: 'GitHub, Behance, Dribbble, etc.' },
  ]

  useEffect(() => {
    if (!profile?.id) return
    loadApplications()
    loadPortfolio()
    loadTargets()
  }, [profile?.id])

  async function loadApplications() {
    setLoadingApps(true)
    try {
      const { data } = await supabase
        .from('applications')
        .select('*, jobs (id, title, company_name, location, employer_id), video_responses (id, type, video_url), projects (id, title, project_url)')
        .eq('candidate_id', profile.id)
        .order('created_at', { ascending: false })
      setApplications(data || [])
    } finally { setLoadingApps(false) }
  }

  async function loadPortfolio() {
    setLoadingPortfolio(true)
    try {
      const { data } = await supabase
        .from('portfolio_items').select('*')
        .eq('candidate_id', profile.id)
        .order('created_at', { ascending: false })
      setPortfolio(data || [])
    } finally { setLoadingPortfolio(false) }
  }

  async function loadTargets() {
    setLoadingTargets(true)
    try {
      const { data } = await supabase
        .from('target_jobs').select('*')
        .eq('candidate_id', profile.id)
        .order('created_at', { ascending: false })
      setTargets(data || [])
    } finally { setLoadingTargets(false) }
  }

  async function handleWithdraw(appId) {
    if (!window.confirm('Withdraw this application? This cannot be undone.')) return
    const { error } = await supabase.from('applications').delete().eq('id', appId)
    if (!error) {
      setApplications(prev => prev.filter(a => a.id !== appId))
    }
  }

  async function handleAddPortfolio(e) {
    e.preventDefault()
    if (!newTitle.trim()) return
    setAddingPortfolio(true)
    const { error } = await supabase.from('portfolio_items').insert({
      candidate_id: profile.id, title: newTitle.trim(),
      description: newDesc.trim() || null, type: newType, url: newUrl.trim() || null,
    })
    if (!error) {
      setNewTitle(''); setNewDesc(''); setNewUrl(''); setNewType('project')
      setShowPortfolioForm(false)
      await loadPortfolio()
    }
    setAddingPortfolio(false)
  }

  async function handleAddTarget(e) {
    e.preventDefault()
    if (!tTitle.trim() || !tCompany.trim()) return
    setAddingTarget(true)
    const { error } = await supabase.from('target_jobs').insert({
      candidate_id: profile.id, title: tTitle.trim(), company: tCompany.trim(),
      source: tSource, url: tUrl.trim() || null, notes: tNotes.trim() || null,
    })
    if (!error) {
      setTTitle(''); setTCompany(''); setTUrl(''); setTNotes(''); setTVideo(''); setTSource('linkedin')
      setShowTargetForm(false)
      await loadTargets()
    }
    setAddingTarget(false)
  }

  async function updateTargetStatus(id, status) {
    await supabase.from('target_jobs').update({ status }).eq('id', id)
    setTargets(prev => prev.map(t => t.id === id ? { ...t, status } : t))
  }

  async function deleteTarget(id) {
    await supabase.from('target_jobs').delete().eq('id', id)
    setTargets(prev => prev.filter(t => t.id !== id))
  }

  async function deletePortfolio(id) {
    await supabase.from('portfolio_items').delete().eq('id', id)
    setPortfolio(prev => prev.filter(p => p.id !== id))
  }

  if (!profile) return <div style={{ padding: 40, textAlign: 'center', color: '#666' }}>Loading...</div>

  // Show onboarding for new users who haven't seen it
  const isNewUser = !profile.headline && !profile.skills && !profile.avatar_url

  const initials = profile.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '?'
  const skillList = profile.skills
    ? profile.skills.split(',').map(s => s.trim()).filter(Boolean) : []
  const shortlisted = applications.filter(a => a.status === 'shortlisted').length

  // Profile strength
  const strengthItems = [
    { done: !!profile.full_name, label: 'Full name', points: 10 },
    { done: !!profile.headline, label: 'Headline', points: 15 },
    { done: skillList.length > 0, label: 'Skills', points: 15 },
    { done: !!profile.location, label: 'Location', points: 10 },
    { done: !!profile.avatar_url, label: 'Profile photo', points: 10 },
    { done: !!profile.linkedin_url, label: 'LinkedIn URL', points: 15 },
    { done: !!(profile.intro_video_url || profile.cloudflare_intro_video_id), label: 'Intro video', points: 20 },
    { done: portfolio.length > 0, label: 'Portfolio item', points: 5 },
  ]
  const strengthScore = strengthItems.reduce((sum, i) => i.done ? sum + i.points : sum, 0)
  const nextItem = strengthItems.find(i => !i.done)
  const radius = 28, circumference = 2 * Math.PI * radius
  const strokeOffset = circumference - (strengthScore / 100) * circumference

  // Animated stats
  const animApps = useCountUp(applications.length)
  const animShortlisted = useCountUp(shortlisted)
  const animTargets = useCountUp(targets.length)
  const animPortfolio = useCountUp(portfolio.length)

  const tabs = [
    { key: 'profile', label: 'Profile' },
    { key: 'targets', label: 'Targets', count: targets.length },
    { key: 'portfolio', label: 'Portfolio', count: portfolio.length },
    { key: 'applications', label: 'Applications', count: applications.length },
  ]

  return (
    <>
      {isNewUser && showWizard && (
        <OnboardingWizard onComplete={() => setShowWizard(false)} />
      )}
    <div>
      <div className="subtabs">
        {tabs.map(t => (
          <button key={t.key} className={`subtab${tab === t.key ? ' active' : ''}`} onClick={() => setTab(t.key)}>
            {t.label}{t.count > 0 ? ` (${t.count})` : ''}
          </button>
        ))}
      </div>

      {/* PROFILE TAB */}
      {tab === 'profile' && (
        <div>
          {/* First-time welcome card */}
          {!profile.headline && !profile.skills && !profile.avatar_url && (
            <div style={{ background: 'linear-gradient(135deg, #E1F5EE 0%, #EEEDFE 100%)', borderRadius: 14, padding: '20px', marginBottom: 16 }}>
              <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Welcome to SG Hire Insight! 👋</p>
              <p style={{ fontSize: 13, color: '#555', marginBottom: 16, lineHeight: 1.6 }}>
                Set up your profile to get noticed by employers. Complete these steps to get started:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                {[
                  { done: !!profile.full_name, label: 'Create your account', sub: 'Done!', link: null },
                  { done: !!profile.headline, label: 'Add your headline & skills', sub: 'e.g. Senior Analyst · 5 years · Open to work', link: '/profile' },
                  { done: !!profile.avatar_url, label: 'Upload a profile photo', sub: 'First impressions matter', link: '/profile' },
                  { done: !!profile.linkedin_url, label: 'Add your LinkedIn & intro video', sub: 'Let employers know more about you', link: '/profile' },
                  { done: portfolio.length > 0, label: 'Add a portfolio item', sub: 'Projects, websites, videos, articles', link: null, tab: 'portfolio' },
                ].map((step, i) => (
                  <div key={i}
                    onClick={() => step.link ? navigate(step.link) : step.tab ? setTab(step.tab) : null}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fff', borderRadius: 10, padding: '10px 14px', cursor: step.done ? 'default' : 'pointer', opacity: step.done ? 0.6 : 1 }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', border: `2px solid ${step.done ? '#1D9E75' : '#ccc'}`, background: step.done ? '#1D9E75' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {step.done && <span style={{ color: '#fff', fontSize: 12 }}>✓</span>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: step.done ? 400 : 500, textDecoration: step.done ? 'line-through' : 'none', color: step.done ? '#888' : '#1a1a1a' }}>{step.label}</p>
                      {!step.done && <p style={{ fontSize: 11, color: '#888', marginTop: 1 }}>{step.sub}</p>}
                    </div>
                    {!step.done && <span style={{ fontSize: 14, color: '#999' }}>→</span>}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => navigate('/profile')}>Complete profile →</button>
                <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => navigate('/jobs')}>Browse open jobs</button>
              </div>
            </div>
          )}
          <div className="card">
            <div style={{ display: 'flex', gap: 12, marginBottom: skillList.length > 0 ? 14 : 0 }}>
              <AvatarImage src={profile.avatar_url} name={profile.full_name} size={48} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 500, fontSize: 16, marginBottom: 2 }}>{profile.full_name || 'Your Name'}</p>
                <p style={{ fontSize: 13, color: '#666', marginBottom: 3 }}>{profile.headline || 'Add a headline'}</p>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {profile.location && <p style={{ fontSize: 12, color: '#888' }}>📍 {profile.location}</p>}
                  {profile.linkedin_url && (
                    <a href={profile.linkedin_url} target="_blank" rel="noreferrer"
                      style={{ fontSize: 12, color: '#0A66C2', textDecoration: 'none', fontWeight: 500 }}>LinkedIn ↗</a>
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

          {/* Profile strength meter */}
          <div className="card" style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <svg width="70" height="70" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="35" cy="35" r={radius} fill="none" stroke="#f0f0ee" strokeWidth="6" />
                <circle cx="35" cy="35" r={radius} fill="none"
                  stroke={strengthScore >= 80 ? '#1D9E75' : strengthScore >= 50 ? '#BA7517' : '#D85A30'}
                  strokeWidth="6" strokeLinecap="round"
                  strokeDasharray={circumference} strokeDashoffset={strokeOffset}
                  style={{ transition: 'stroke-dashoffset 1s ease' }} />
              </svg>
              <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>
                {strengthScore}%
              </span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: 500, fontSize: 14, marginBottom: 2 }}>Profile strength</p>
              {nextItem ? (
                <p style={{ fontSize: 12, color: '#666' }}>
                  Add <strong>{nextItem.label}</strong> to reach {Math.min(strengthScore + nextItem.points, 100)}% →{' '}
                  <span style={{ color: '#1D9E75', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => navigate('/profile')}>Edit profile</span>
                </p>
              ) : (
                <p style={{ fontSize: 12, color: '#1D9E75', fontWeight: 500 }}>✅ Profile complete!</p>
              )}
            </div>
          </div>

          {(profile.intro_video_url || profile.cloudflare_intro_video_id) && (
            <div className="card" style={{ marginTop: 10, background: '#E1F5EE', border: 'none' }}>
              <VideoPlayer
                cloudflareVideoId={profile.cloudflare_intro_video_id}
                fallbackUrl={profile.intro_video_url}
                label="Watch intro video"
              />
            </div>
          )}

          {isNewUser && (
            <div style={{ marginTop: 10, background: '#E1F5EE', borderRadius: 10, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontSize: 13, color: '#0F6E56' }}>✨ Complete your profile with our quick setup wizard</p>
              <button className="btn btn-primary" style={{ fontSize: 12, padding: '5px 14px', flexShrink: 0 }} onClick={() => setShowWizard(true)}>
                Start →
              </button>
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
              <div className="stat-value" style={{ color: '#1D9E75' }}>{animApps}</div>
              <div className="stat-label">Applied</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: '#BA7517' }}>{animShortlisted}</div>
              <div className="stat-label">Shortlisted</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: '#534AB7' }}>{animTargets}</div>
              <div className="stat-label">Tracking</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: '#0F6E56' }}>{animPortfolio}</div>
              <div className="stat-label">Portfolio</div>
            </div>
          </div>

          <button className="btn btn-primary" style={{ width: '100%', marginTop: 16 }} onClick={() => navigate('/jobs')}>
            Browse open jobs →
          </button>
        </div>
      )}

      {/* TARGETS TAB */}
      {tab === 'targets' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <p style={{ fontSize: 15, fontWeight: 500 }}>Job tracker</p>
              <p style={{ fontSize: 12, color: '#666' }}>Roles you found on LinkedIn, Glassdoor, or company sites</p>
            </div>
            {!showTargetForm && (
              <button className="btn btn-primary" style={{ fontSize: 12, padding: '6px 14px', flexShrink: 0 }}
                onClick={() => setShowTargetForm(true)}>+ Add role</button>
            )}
          </div>

          {/* Add target form */}
          {showTargetForm && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <p style={{ fontWeight: 500, fontSize: 14 }}>Add a role you're tracking</p>
                <button onClick={() => setShowTargetForm(false)}
                  style={{ border: 'none', background: 'none', color: '#aaa', fontSize: 20, cursor: 'pointer' }}>×</button>
              </div>

              {/* Source picker */}
              <div style={{ marginBottom: 14 }}>
                <label className="form-label">Where did you find it?</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                  {SOURCES.map(s => (
                    <button key={s.key} type="button" onClick={() => setTSource(s.key)}
                      style={{
                        padding: '6px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                        border: `1.5px solid ${tSource === s.key ? s.color : '#e0e0dc'}`,
                        background: tSource === s.key ? s.bg : '#fff',
                        color: tSource === s.key ? s.color : '#666',
                        fontWeight: tSource === s.key ? 500 : 400,
                      }}>
                      {s.icon} {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleAddTarget}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                  <div>
                    <label className="form-label">Job title *</label>
                    <input className="form-input" type="text" placeholder="e.g. Senior Sales Manager"
                      value={tTitle} onChange={e => setTTitle(e.target.value)} required />
                  </div>
                  <div>
                    <label className="form-label">Company *</label>
                    <input className="form-input" type="text" placeholder="e.g. Grab"
                      value={tCompany} onChange={e => setTCompany(e.target.value)} required />
                  </div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label className="form-label">Job posting URL</label>
                  <input className="form-input" type="url" placeholder="Paste the link to the job posting..."
                    value={tUrl} onChange={e => setTUrl(e.target.value)} />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label className="form-label">Notes <span style={{ color: '#888', fontWeight: 400 }}>(optional)</span></label>
                  <textarea className="form-input" rows={2}
                    placeholder="Why you're interested, key requirements, who to contact..."
                    value={tNotes} onChange={e => setTNotes(e.target.value)} style={{ resize: 'vertical' }} />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label className="form-label">🎥 Why you? video <span style={{ color: '#888', fontWeight: 400 }}>(optional)</span></label>
                  <input className="form-input" type="url"
                    placeholder="Record a 1–2 min Loom video: why you're a great fit for this role..."
                    value={tVideo} onChange={e => setTVideo(e.target.value)} />
                  <p style={{ fontSize: 11, color: '#888', marginTop: 4 }}>Record on Loom (free) and paste the link. Shows alongside your application.</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" className="btn btn-outline" onClick={() => setShowTargetForm(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={addingTarget}>
                    {addingTarget ? 'Adding...' : 'Track this role'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Target jobs list */}
          {loadingTargets ? (
            <div style={{ textAlign: 'center', padding: 32, color: '#aaa', fontSize: 13 }}>Loading...</div>
          ) : targets.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 40, background: '#f9f9f7', border: 'none' }}>
              <p style={{ fontSize: 32, marginBottom: 10 }}>🎯</p>
              <p style={{ fontWeight: 500, fontSize: 15, marginBottom: 6 }}>No roles tracked yet</p>
              <p style={{ color: '#666', fontSize: 13, lineHeight: 1.6 }}>
                Found a role on LinkedIn or Glassdoor?<br />Add it here to track your progress.
              </p>
            </div>
          ) : (
            targets.map(t => {
              const src = SOURCES.find(s => s.key === t.source) || SOURCES[3]
              const st = TARGET_STATUSES.find(s => s.key === t.status) || TARGET_STATUSES[0]
              return (
                <div key={t.id} className="card" style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2, flexWrap: 'wrap' }}>
                        <p style={{ fontWeight: 500, fontSize: 14 }}>{t.title}</p>
                        <span style={{ fontSize: 11, background: src.bg, color: src.color, padding: '2px 8px', borderRadius: 10, fontWeight: 500 }}>
                          {src.icon} {src.label}
                        </span>
                      </div>
                      <p style={{ fontSize: 13, color: '#666' }}>{t.company}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0, marginLeft: 8 }}>
                      <span className="badge" style={{ background: st.bg, color: st.tc }}>{st.icon} {st.label}</span>
                      <button onClick={() => deleteTarget(t.id)}
                        style={{ border: 'none', background: 'none', color: '#ccc', fontSize: 16, cursor: 'pointer', padding: 0 }}>×</button>
                    </div>
                  </div>

                  {t.notes && (
                    <p style={{ fontSize: 12, color: '#666', lineHeight: 1.5, marginBottom: 8, fontStyle: 'italic' }}>{t.notes}</p>
                  )}

                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    {t.url && (
                      <a href={t.url} target="_blank" rel="noreferrer"
                        style={{ fontSize: 12, color: src.color, textDecoration: 'none', fontWeight: 500, background: src.bg, padding: '4px 10px', borderRadius: 20 }}>
                        View posting ↗
                      </a>
                    )}
                    {t.video_url && (
                      <a href={t.video_url} target="_blank" rel="noreferrer"
                        style={{ fontSize: 12, color: '#0F6E56', textDecoration: 'none', fontWeight: 500, background: '#E1F5EE', padding: '4px 10px', borderRadius: 20 }}>
                        🎥 Why me? ↗
                      </a>
                    )}
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {TARGET_STATUSES.map(s => (
                        <button key={s.key} onClick={() => updateTargetStatus(t.id, s.key)}
                          style={{
                            fontSize: 11, padding: '3px 8px', borderRadius: 12, cursor: 'pointer',
                            border: `1px solid ${t.status === s.key ? s.tc : '#e0e0dc'}`,
                            background: t.status === s.key ? s.bg : '#fff',
                            color: t.status === s.key ? s.tc : '#888',
                            fontWeight: t.status === s.key ? 500 : 400,
                          }}>
                          {s.icon} {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* PORTFOLIO TAB */}
      {tab === 'portfolio' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <p style={{ fontSize: 15, fontWeight: 500 }}>Your portfolio</p>
              <p style={{ fontSize: 12, color: '#666' }}>Projects · Websites · Videos · Articles</p>
            </div>
            {!showPortfolioForm && (
              <button className="btn btn-outline" style={{ fontSize: 12, padding: '5px 12px' }} onClick={() => setShowPortfolioForm(true)}>+ Add item</button>
            )}
          </div>

          {showPortfolioForm && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <p style={{ fontSize: 14, fontWeight: 500 }}>New portfolio item</p>
                <button onClick={() => setShowPortfolioForm(false)} style={{ border: 'none', background: 'none', color: '#aaa', fontSize: 20, cursor: 'pointer' }}>×</button>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                {PORTFOLIO_TYPES.map(t => (
                  <button key={t.key} type="button" onClick={() => setNewType(t.key)}
                    style={{
                      padding: '5px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                      border: `1px solid ${newType === t.key ? '#1D9E75' : '#e0e0dc'}`,
                      background: newType === t.key ? '#E1F5EE' : '#fff',
                      color: newType === t.key ? '#0F6E56' : '#666',
                    }}>
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>
              <form onSubmit={handleAddPortfolio}>
                <div style={{ marginBottom: 10 }}>
                  <label className="form-label">Title *</label>
                  <input className="form-input" type="text" placeholder="e.g. Sales Dashboard · DBS"
                    value={newTitle} onChange={e => setNewTitle(e.target.value)} required />
                </div>
                <div style={{ marginBottom: 10 }}>
                  <label className="form-label">Description</label>
                  <textarea className="form-input" rows={2} placeholder="What did you build? What was the impact?"
                    value={newDesc} onChange={e => setNewDesc(e.target.value)} style={{ resize: 'vertical' }} />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label className="form-label">Link</label>
                  <input className="form-input" type="url" placeholder="https://..."
                    value={newUrl} onChange={e => setNewUrl(e.target.value)} />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" className="btn btn-outline" onClick={() => setShowPortfolioForm(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={addingPortfolio}>
                    {addingPortfolio ? 'Adding...' : 'Add to portfolio'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {loadingPortfolio ? (
            <div style={{ textAlign: 'center', padding: 32, color: '#aaa', fontSize: 13 }}>Loading...</div>
          ) : portfolio.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 40, background: '#f9f9f7', border: 'none' }}>
              <p style={{ fontSize: 13, color: '#888' }}>No portfolio items yet — add your first above</p>
            </div>
          ) : (
            portfolio.map(item => {
              const t = typeIcons[item.type] || '🔗'
              return (
                <div key={item.id} className="card" style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{t}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 500, fontSize: 14, marginBottom: 2 }}>{item.title}</p>
                      {item.description && <p style={{ fontSize: 12, color: '#666', lineHeight: 1.5, marginBottom: 4 }}>{item.description}</p>}
                      {item.url && (
                        <a href={item.url} target="_blank" rel="noreferrer"
                          style={{ fontSize: 12, color: '#1D9E75', textDecoration: 'none', fontWeight: 500 }}>View ↗</a>
                      )}
                    </div>
                    <button onClick={() => deletePortfolio(item.id)}
                      style={{ border: 'none', background: 'none', color: '#ccc', fontSize: 16, cursor: 'pointer', padding: 0 }}>×</button>
                  </div>
                </div>
              )
            })
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
              <p style={{ color: '#666', fontSize: 13, marginBottom: 16 }}>Browse open roles on HireRight SG to apply</p>
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                    <p style={{ fontSize: 11, color: '#aaa' }}>
                      Applied {new Date(app.created_at).toLocaleDateString('en-SG')}
                    </p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {app.jobs?.employer_id && (
                        <button className="btn btn-outline" style={{ fontSize: 11, padding: '4px 10px' }}
                          onClick={() => navigate(`/employer/${app.jobs.employer_id}`)}>
                          View employer →
                        </button>
                      )}
                      <button
                        onClick={() => handleWithdraw(app.id)}
                        style={{ fontSize: 11, padding: '4px 10px', borderRadius: 8, cursor: 'pointer', border: '1px solid #FAECE7', background: '#FAECE7', color: '#D85A30' }}>
                        Withdraw
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
    </>
  )
}
