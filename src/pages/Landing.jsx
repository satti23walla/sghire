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

  const page = { background: '#0F0F0F', minHeight: '100vh', fontFamily: 'Georgia, serif' }
  const sans = { fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }

  return (
    <div style={page}>

      {/* Hero */}
      <section style={{ padding: '72px 40px 56px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>

        {/* Badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(212,240,96,0.1)', border: '0.5px solid rgba(212,240,96,0.3)', padding: '5px 14px', borderRadius: 20, fontSize: 12, color: '#D4F060', fontWeight: 500, marginBottom: 28, ...sans }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#D4F060' }} />
          Making hiring human
        </div>

        {/* Headline */}
        <h1 style={{ fontSize: 48, fontWeight: 400, color: '#fff', lineHeight: 1.12, marginBottom: 20, maxWidth: 560, letterSpacing: -1 }}>
          Hire the person,<br />not the <em style={{ color: '#D4F060' }}>résumé.</em>
        </h1>

        {/* Sub */}
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', maxWidth: 320, lineHeight: 1.75, marginBottom: 40, ...sans }}>
          Video-first hiring where both sides show up as real people.
        </p>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 72 }}>
          <button onClick={handleCandidate}
            style={{ background: '#D4F060', color: '#0F0F0F', padding: '13px 28px', borderRadius: 9, fontSize: 15, fontWeight: 600, cursor: 'pointer', border: 'none', ...sans }}>
            {user && profile?.role === 'candidate' ? 'My dashboard →' : 'Show who I am'}
          </button>
          <button onClick={handleHiring}
            style={{ background: 'transparent', color: 'rgba(255,255,255,0.7)', padding: '13px 28px', borderRadius: 9, fontSize: 15, cursor: 'pointer', border: '0.5px solid rgba(255,255,255,0.15)', ...sans }}>
            {user && profile?.role === 'employer' ? 'My dashboard →' : 'Find real people'}
          </button>
        </div>

        {/* Two cards */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', maxWidth: 620, width: '100%', position: 'relative' }}>

          {/* Candidate card */}
          <div style={{ background: '#1A1A1A', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 20, width: 215, transform: 'rotate(-2.5deg)', zIndex: 2, position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(212,240,96,0.15)', color: '#D4F060', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, flexShrink: 0, ...sans }}>KS</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#fff', ...sans }}>Kunal Satija</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', ...sans }}>Builder & Seller · Singapore</div>
              </div>
            </div>
            <div style={{ background: 'linear-gradient(135deg,#1E3320,#2A4A2E)', borderRadius: 10, height: 88, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, position: 'relative' }}>
              <div style={{ width: 30, height: 30, background: 'rgba(255,255,255,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 0, height: 0, borderStyle: 'solid', borderWidth: '6px 0 6px 11px', borderColor: 'transparent transparent transparent rgba(255,255,255,0.9)', marginLeft: 2 }} />
              </div>
              <span style={{ position: 'absolute', bottom: 8, left: 10, fontSize: 10, color: 'rgba(255,255,255,0.6)', ...sans }}>1-min intro</span>
              <span style={{ position: 'absolute', bottom: 8, right: 10, fontSize: 10, color: 'rgba(255,255,255,0.4)', ...sans }}>1:02</span>
            </div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {['Security', 'B2B Sales'].map(s => (
                <span key={s} style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)', fontSize: 10, padding: '3px 8px', borderRadius: 10, ...sans }}>{s}</span>
              ))}
              <span style={{ background: 'rgba(212,240,96,0.12)', color: '#D4F060', fontSize: 10, padding: '3px 8px', borderRadius: 10, ...sans }}>Open to work</span>
            </div>
          </div>

          {/* Connector */}
          <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', zIndex: 5, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 1, height: 20, background: 'rgba(212,240,96,0.3)' }} />
            <div style={{ background: '#D4F060', color: '#0F0F0F', borderRadius: 20, padding: '5px 12px', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', ...sans }}>real fit</div>
            <div style={{ width: 1, height: 20, background: 'rgba(212,240,96,0.3)' }} />
          </div>

          {/* Employer card */}
          <div style={{ background: '#1A1A1A', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 20, width: 215, transform: 'rotate(2.5deg)', zIndex: 1, position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>🏢</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#fff', ...sans }}>Hireright</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', ...sans }}>Hiring · Senior Sales</div>
              </div>
            </div>
            <div style={{ background: 'linear-gradient(135deg,#1A1A2E,#252540)', borderRadius: 10, height: 88, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, position: 'relative' }}>
              <div style={{ width: 30, height: 30, background: 'rgba(255,255,255,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 0, height: 0, borderStyle: 'solid', borderWidth: '6px 0 6px 11px', borderColor: 'transparent transparent transparent rgba(255,255,255,0.9)', marginLeft: 2 }} />
              </div>
              <span style={{ position: 'absolute', bottom: 8, left: 10, fontSize: 10, color: 'rgba(255,255,255,0.6)', ...sans }}>Meet the team</span>
              <span style={{ position: 'absolute', bottom: 8, right: 10, fontSize: 10, color: 'rgba(255,255,255,0.4)', ...sans }}>0:58</span>
            </div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {['SaaS', 'Remote-friendly'].map(s => (
                <span key={s} style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)', fontSize: 10, padding: '3px 8px', borderRadius: 10, ...sans }}>{s}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section style={{ padding: '52px 40px', borderTop: '0.5px solid rgba(255,255,255,0.06)' }}>
        <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.25)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 28, ...sans }}>How it works</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, maxWidth: 620, margin: '0 auto' }}>
          {steps.map(s => (
            <div key={s.n} style={{ background: '#161616', border: '0.5px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 20 }}>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', marginBottom: 10, ...sans }}>{s.n}</p>
              <p style={{ fontSize: 15, fontWeight: 400, color: '#fff', marginBottom: 6, fontStyle: 'italic' }}>{s.title}</p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', lineHeight: 1.6, ...sans }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Proof bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 32, padding: '24px 40px', borderTop: '0.5px solid rgba(255,255,255,0.06)', flexWrap: 'wrap' }}>
        {[
          { num: 'Two-sided', label: 'Both candidate and employer show up' },
          { num: 'Video-first', label: 'Before any interview' },
          { num: 'Zero CVs', label: 'Just real people' },
        ].map((p, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 14, fontWeight: 500, color: '#D4F060', ...sans }}>{p.num}</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2, ...sans }}>{p.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
