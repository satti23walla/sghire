import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const industries = ['Fintech', 'Tech', 'Healthcare', 'Government / Statutory', 'Consulting', 'FMCG', 'Logistics', 'Real Estate']

const steps = [
  { n: '1', title: 'Record your 2-min video', desc: 'Candidate or HM records a short intro or role overview', bg: '#E1F5EE', tc: '#0F6E56' },
  { n: '2', title: 'Browse & match', desc: 'See real role expectations and candidate profiles before committing', bg: '#EEEDFE', tc: '#534AB7' },
  { n: '3', title: 'Apply with context', desc: 'Submit your intro video, job response, and project showcase', bg: '#FAEEDA', tc: '#BA7517' },
  { n: '4', title: 'Pre-screen confidently', desc: 'Both sides save time — only connect when there is a real fit', bg: '#FAECE7', tc: '#D85A30' },
]

const stats = [
  { v: '4,200+', l: 'Candidate profiles', c: '#1D9E75' },
  { v: '890+',   l: 'Role insights shared', c: '#534AB7' },
  { v: '1,300+', l: 'Video referrals', c: '#BA7517' },
  { v: '62%',    l: 'Fewer wasted interviews', c: '#D85A30' },
]

export default function Landing() {
  const nav = useNavigate()
  const { user, profile } = useAuth()

  function handleCandidate() {
    if (user) nav(profile?.role === 'candidate' ? '/candidate' : '/employer')
    else nav('/auth')
  }

  function handleHiring() {
    if (user) nav(profile?.role === 'employer' ? '/employer' : '/candidate')
    else nav('/auth')
  }

  return (
    <div>
      <div style={{ textAlign: 'center', padding: '36px 0 28px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#E1F5EE', borderRadius: 20, padding: '4px 14px', marginBottom: 16 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#1D9E75' }} />
          <span style={{ fontSize: 12, color: '#0F6E56', fontWeight: 500 }}>Making hiring human</span>
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 500, lineHeight: 1.3, marginBottom: 12 }}>Hire the person,<br />not the résumé.</h1>
        <p style={{ color: '#666', maxWidth: 460, margin: '0 auto 24px', lineHeight: 1.7, fontSize: 14 }}>
          Let's make hiring human. Video-first pre-screening for SG candidates and hiring managers — see real people, real expectations, before you commit to an interview.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={handleCandidate}>
            {user && profile?.role === 'candidate' ? 'My dashboard →' : "I'm a candidate"}
          </button>
          <button className="btn btn-outline" onClick={handleHiring}>
            {user && profile?.role === 'employer' ? 'My dashboard →' : "I'm hiring"}
          </button>
        </div>
      </div>

      <div className="stat-grid" style={{ marginBottom: 28 }}>
        {stats.map(s => (
          <div key={s.l} className="stat-card">
            <div className="stat-value" style={{ color: s.c }}>{s.v}</div>
            <div className="stat-label">{s.l}</div>
          </div>
        ))}
      </div>

      <p className="section-label">How it works</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))', gap: 10, marginBottom: 28 }}>
        {steps.map(s => (
          <div key={s.n} style={{ background: s.bg, borderRadius: 12, padding: '14px' }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: s.tc, marginBottom: 5 }}>Step {s.n}</div>
            <p style={{ fontWeight: 500, fontSize: 13, marginBottom: 4 }}>{s.title}</p>
            <p style={{ fontSize: 12, color: '#555', lineHeight: 1.5 }}>{s.desc}</p>
          </div>
        ))}
      </div>

      <p className="section-label">Featured industries</p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {industries.map(ind => (
          <span key={ind} style={{ fontSize: 12, padding: '5px 12px', borderRadius: 20, border: '0.5px solid #e0e0dc', color: '#666', cursor: 'pointer', background: '#fff' }}>{ind}</span>
        ))}
      </div>
    </div>
  )
}
