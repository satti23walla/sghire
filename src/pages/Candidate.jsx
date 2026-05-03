import { useState } from 'react'

const skills = ['SQL', 'Python', 'Tableau', 'Fintech']

const matches = [
  { role: 'Data Analyst',   co: 'DBS Bank', pct: 94, c: '#1D9E75' },
  { role: 'Analytics Lead', co: 'Grab',     pct: 87, c: '#534AB7' },
  { role: 'BI Specialist',  co: 'Singtel',  pct: 79, c: '#BA7517' },
]

const insights = [
  {
    role: 'Senior Data Analyst', company: 'DBS Bank · Fintech',
    tags: ['SQL required', 'Hybrid', '~$7–9k/mo'],
    items: ['Strong SQL and Python is a hard requirement — not just a plus', 'Interview has 3 rounds: technical test, case study, culture fit', 'Expect to join an existing team, not a greenfield project', 'Work-life balance rated 4/5 by current employees'],
  },
  {
    role: 'Product Manager', company: 'Grab · Tech',
    tags: ['MBA preferred', 'On-site', '~$9–12k/mo'],
    items: ['They value speed and shipping — expect pressure to move fast', 'Must have experience with Southeast Asia consumer markets', 'Hiring panel includes cross-functional leads, not just HR'],
  },
]

const referrals = [
  { from: 'James Tan, Head of Analytics @ OCBC', name: 'Aisha Kumar', role: 'Senior Data Analyst', quote: 'One of the most thorough analysts I have worked with. She turned around complex dashboards in days...' },
  { from: 'Priya Nair, VP Product @ Shopee',     name: 'Aisha Kumar', role: 'Data & Insights',    quote: 'Aisha brings both technical rigour and genuine business curiosity — rare combination in my experience...' },
]

export default function Candidate() {
  const [tab, setTab] = useState('profile')
  return (
    <div>
      <div className="subtabs">
        {['profile', 'insights', 'referrals'].map(t => (
          <button key={t} className={`subtab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === 'profile' && (
        <div>
          <div className="card">
            <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
              <div className="avatar" style={{ background: '#EEEDFE', color: '#534AB7' }}>AK</div>
              <div>
                <p style={{ fontWeight: 500, fontSize: 15 }}>Aisha Kumar</p>
                <p style={{ fontSize: 12, color: '#666', margin: '2px 0 7px' }}>Senior Data Analyst · 6 years · Open to work</p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {skills.map(s => <span key={s} className="badge badge-purple">{s}</span>)}
                </div>
              </div>
            </div>
            <div className="video-placeholder" style={{ background: '#E1F5EE' }}>
              <div className="play-btn" style={{ background: '#1D9E75' }}><div className="play-triangle" /></div>
              <div>
                <p style={{ fontWeight: 500, fontSize: 13, color: '#0F6E56', margin: 0 }}>2-minute intro video</p>
                <p style={{ fontSize: 12, color: '#0F6E56', opacity: 0.7, margin: 0 }}>Recorded · 1:58 · 3 days ago</p>
              </div>
            </div>
          </div>

          <p className="section-label" style={{ marginTop: 20 }}>Matched roles</p>
          {matches.map(m => (
            <div key={m.role} className="card" style={{ marginBottom: 8 }}>
              <p style={{ fontWeight: 500, fontSize: 14, marginBottom: 2 }}>{m.role}</p>
              <p style={{ fontSize: 12, color: '#666', marginBottom: 10 }}>{m.co}</p>
              <div className="progress-wrap">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${m.pct}%`, background: m.c }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 500, color: m.c, minWidth: 36 }}>{m.pct}%</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'insights' && (
        <div>
          {insights.map(ins => (
            <div key={ins.role} className="card" style={{ marginBottom: 12 }}>
              <p style={{ fontWeight: 500, fontSize: 14, marginBottom: 2 }}>{ins.role}</p>
              <p style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>{ins.company}</p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                {ins.tags.map(t => <span key={t} className="badge badge-purple">{t}</span>)}
              </div>
              <ul style={{ paddingLeft: 16, fontSize: 13, color: '#555', lineHeight: 1.8 }}>
                {ins.items.map((it, i) => <li key={i}>{it}</li>)}
              </ul>
            </div>
          ))}
        </div>
      )}

      {tab === 'referrals' && (
        <div>
          <p style={{ fontSize: 13, color: '#666', marginBottom: 14 }}>Former colleagues have left you video referrals, available on demand for hiring managers.</p>
          {referrals.map((r, i) => (
            <div key={i} className="card" style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div>
                  <p style={{ fontWeight: 500, fontSize: 13 }}>{r.name}</p>
                  <p style={{ fontSize: 12, color: '#666', margin: '1px 0 0' }}>{r.role}</p>
                </div>
                <span className="badge badge-green">Video ref</span>
              </div>
              <div style={{ background: '#f4f4f2', borderRadius: 8, padding: '8px 10px', fontSize: 12, color: '#555', fontStyle: 'italic' }}>"{r.quote}"</div>
              <p style={{ fontSize: 11, color: '#999', marginTop: 6 }}>Referred by {r.from}</p>
            </div>
          ))}
          <div style={{ border: '0.5px dashed #ccc', borderRadius: 12, padding: 16, textAlign: 'center', marginTop: 4 }}>
            <p style={{ fontSize: 13, color: '#666', marginBottom: 10 }}>Request a referral from a former colleague</p>
            <button className="btn btn-primary" style={{ fontSize: 13, padding: '8px 18px' }}>Send referral request</button>
          </div>
        </div>
      )}
    </div>
  )
}
