import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

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

  const steps = [
    { n: '01', title: 'Build your profile', desc: 'Add a 1-min video of who you are and your professional journey' },
    { n: '02', title: 'Browse & match', desc: 'See real people on both sides before committing' },
    { n: '03', title: 'Connect when it fits', desc: 'Only meet when there\'s a genuine fit — no wasted calls' },
  ]

  return (
    <div style={{ background: '#fff', minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>

      {/* Hero */}
      <section style={{ padding: '72px 40px 56px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>

        {/* Badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#E1F5EE', padding: '5px 14px', borderRadius: 20, fontSize: 12, color: '#0F6E56', fontWeight: 500, marginBottom: 28 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#1D9E75' }} />
          Making hiring human
        </div>

        {/* Headline */}
        <h1 style={{ fontSize: 46, fontWeight: 400, color: '#1a1a1a', lineHeight: 1.12, marginBottom: 18, maxWidth: 540, letterSpacing: -1, fontFamily: 'Georgia, serif' }}>
          Hire the person,<br />not the <em style={{ color: '#1D9E75', fontStyle: 'italic' }}>résumé.</em>
        </h1>

        {/* Sub */}
        <p style={{ fontSize: 15, color: '#888', maxWidth: 320, lineHeight: 1.75, marginBottom: 40 }}>
          Video-first hiring where both sides show up as real people.
        </p>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 72 }}>
          <button onClick={handleCandidate}
            style={{ background: '#1D9E75', color: '#fff', padding: '13px 28px', borderRadius: 9, fontSize: 15, fontWeight: 500, cursor: 'pointer', border: 'none' }}>
            {user && profile?.role === 'candidate' ? 'My dashboard →' : 'Show the real you'}
          </button>
          <button onClick={handleHiring}
            style={{ background: '#fff', color: '#444', padding: '13px 28px', borderRadius: 9, fontSize: 15, cursor: 'pointer', border: '0.5px solid #ddd' }}>
            {user && profile?.role === 'employer' ? 'My dashboard →' : 'Find real people'}
          </button>
        </div>

        {/* Two cards */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', maxWidth: 620, width: '100%', position: 'relative' }}>

          {/* Candidate card */}
          <div style={{ background: '#fff', border: '0.5px solid #e0e0dc', borderRadius: 16, padding: 20, width: 215, transform: 'rotate(-2.5deg)', zIndex: 2, boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#EEEDFE', color: '#534AB7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, flexShrink: 0 }}>KS</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a' }}>Kunal Satija</div>
                <div style={{ fontSize: 11, color: '#999' }}>Builder & Seller · Singapore</div>
              </div>
            </div>
            <div style={{ background: 'linear-gradient(135deg,#0F6E56,#1D9E75)', borderRadius: 10, height: 88, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, position: 'relative' }}>
              <div style={{ width: 30, height: 30, background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 0, height: 0, borderStyle: 'solid', borderWidth: '6px 0 6px 11px', borderColor: 'transparent transparent transparent rgba(255,255,255,0.9)', marginLeft: 2 }} />
              </div>
              <span style={{ position: 'absolute', bottom: 8, left: 10, fontSize: 10, color: 'rgba(255,255,255,0.8)' }}>1-min intro</span>
              <span style={{ position: 'absolute', bottom: 8, right: 10, fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>1:02</span>
            </div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {['Security', 'B2B Sales'].map(s => (
                <span key={s} style={{ background: '#f4f4f2', color: '#888', fontSize: 10, padding: '3px 8px', borderRadius: 10 }}>{s}</span>
              ))}
              <span style={{ background: '#E1F5EE', color: '#0F6E56', fontSize: 10, padding: '3px 8px', borderRadius: 10 }}>Open to work</span>
            </div>
          </div>

          {/* Connector */}
          <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', zIndex: 5, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 1, height: 20, background: '#e0e0dc' }} />
            <div style={{ background: '#1D9E75', color: '#fff', borderRadius: 20, padding: '5px 12px', fontSize: 11, fontWeight: 500, whiteSpace: 'nowrap' }}>real fit</div>
            <div style={{ width: 1, height: 20, background: '#e0e0dc' }} />
          </div>

          {/* Employer card */}
          <div style={{ background: '#fff', border: '0.5px solid #e0e0dc', borderRadius: 16, padding: 20, width: 215, transform: 'rotate(2.5deg)', zIndex: 1, boxShadow: '0 4px 24px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#f4f4f2', color: '#666', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>🏢</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a' }}>Hireright</div>
                <div style={{ fontSize: 11, color: '#999' }}>Hiring · Senior Sales</div>
              </div>
            </div>
            <div style={{ background: 'linear-gradient(135deg,#534AB7,#3C3489)', borderRadius: 10, height: 88, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, position: 'relative' }}>
              <div style={{ width: 30, height: 30, background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 0, height: 0, borderStyle: 'solid', borderWidth: '6px 0 6px 11px', borderColor: 'transparent transparent transparent rgba(255,255,255,0.9)', marginLeft: 2 }} />
              </div>
              <span style={{ position: 'absolute', bottom: 8, left: 10, fontSize: 10, color: 'rgba(255,255,255,0.8)' }}>Meet the team</span>
              <span style={{ position: 'absolute', bottom: 8, right: 10, fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>0:58</span>
            </div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {['SaaS', 'Remote-friendly'].map(s => (
                <span key={s} style={{ background: '#f4f4f2', color: '#888', fontSize: 10, padding: '3px 8px', borderRadius: 10 }}>{s}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section style={{ padding: '52px 40px', background: '#fafafa', borderTop: '0.5px solid #efefed' }}>
        <p style={{ textAlign: 'center', fontSize: 11, color: '#bbb', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 28 }}>How it works</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, maxWidth: 620, margin: '0 auto' }}>
          {steps.map(s => (
            <div key={s.n} style={{ background: '#fff', border: '0.5px solid #e8e8e4', borderRadius: 12, padding: 20 }}>
              <p style={{ fontSize: 11, color: '#ccc', marginBottom: 10 }}>{s.n}</p>
              <p style={{ fontSize: 15, fontWeight: 400, color: '#1a1a1a', marginBottom: 6, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>{s.title}</p>
              <p style={{ fontSize: 12, color: '#999', lineHeight: 1.6 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Proof bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 40, padding: '24px 40px', borderTop: '0.5px solid #efefed', flexWrap: 'wrap' }}>
        {[
          { num: 'Two-sided', label: 'Both candidate and employer show up' },
          { num: 'Video-first', label: 'Before any interview' },
          { num: 'Zero CVs', label: 'Just real people' },
        ].map((p, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 14, fontWeight: 500, color: '#1D9E75' }}>{p.num}</p>
            <p style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>{p.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
