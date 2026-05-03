import { useState } from 'react'

const expectations = [
  'Team is 8 people, 3 senior analysts — collaborative, not siloed',
  'Must be comfortable presenting to C-suite stakeholders monthly',
  'Strong SQL is non-negotiable; Python experience a strong plus',
  'Typical first 90 days: shadow existing projects, then own one stream',
  'Salary band is firm; no equity currently offered',
]

const candidates = [
  { initials: 'AK', name: 'Aisha Kumar', role: 'Sr. Data Analyst', co: 'Ex-OCBC',    pct: 94, bg: '#534AB7', tc: '#EEEDFE' },
  { initials: 'BL', name: 'Ben Lim',     role: 'BI Analyst',       co: 'Ex-Lazada',  pct: 87, bg: '#1D9E75', tc: '#E1F5EE' },
  { initials: 'SR', name: 'Siti Rahmat', role: 'Data Scientist',   co: 'Ex-GovTech', pct: 82, bg: '#534AB7', tc: '#EEEDFE' },
]

const pipeline = [
  { name: 'Aisha Kumar', stage: 'Video reviewed',      bg: '#E1F5EE', tc: '#0F6E56' },
  { name: 'Ben Lim',     stage: 'Interview scheduled', bg: '#EEEDFE', tc: '#534AB7' },
  { name: 'Siti Rahmat', stage: 'Referrals checked',  bg: '#FAEEDA', tc: '#BA7517' },
]

export default function HiringManager() {
  const [tab, setTab] = useState('role')
  return (
    <div>
      <div className="subtabs">
        {['role', 'candidates', 'pipeline'].map(t => (
          <button key={t} className={`subtab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === 'role' && (
        <div>
          <div className="card" style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <p style={{ fontWeight: 500, fontSize: 15 }}>Senior Data Analyst</p>
                <p style={{ fontSize: 12, color: '#666', margin: '2px 0' }}>DBS Bank · Fintech · Hybrid · $7,000–9,000/mo</p>
              </div>
              <span className="badge badge-green">Active</span>
            </div>
            <div className="video-placeholder" style={{ background: '#E1F5EE' }}>
              <div className="play-btn" style={{ background: '#1D9E75' }}><div className="play-triangle" /></div>
              <div>
                <p style={{ fontWeight: 500, fontSize: 13, color: '#0F6E56', margin: 0 }}>Role expectations video</p>
                <p style={{ fontSize: 12, color: '#0F6E56', opacity: 0.7, margin: 0 }}>1:52 · Posted 5 days ago · 214 views</p>
              </div>
            </div>
          </div>

          <p className="section-label">What you shared beyond the JD</p>
          <div className="card">
            <ul style={{ paddingLeft: 16, fontSize: 13, color: '#555', lineHeight: 1.9 }}>
              {expectations.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </div>
        </div>
      )}

      {tab === 'candidates' && (
        <div>
          <p style={{ fontSize: 13, color: '#666', marginBottom: 14 }}>Pre-screened candidates matched to your role. Browse videos before requesting an interview.</p>
          {candidates.map(c => (
            <div key={c.name} className="card" style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
                <div className="avatar" style={{ background: c.bg, color: c.tc }}>{c.initials}</div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 500, fontSize: 14, margin: 0 }}>{c.name}</p>
                  <p style={{ fontSize: 12, color: '#666', margin: '2px 0 0' }}>{c.role} · {c.co}</p>
                </div>
                <span className="badge badge-green">{c.pct}% match</span>
              </div>
              <div style={{ height: 80, background: '#f4f4f2', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                <div className="play-btn" style={{ background: '#1D9E75', width: 30, height: 30 }}><div className="play-triangle" style={{ borderLeftWidth: 10 }} /></div>
                <span style={{ fontSize: 12, color: '#666' }}>2-min intro video</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'pipeline' && (
        <div>
          <p style={{ fontSize: 13, color: '#666', marginBottom: 14 }}>Your hiring pipeline — only candidates who match your video expectations.</p>
          {pipeline.map(p => (
            <div key={p.name} className="pipeline-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="avatar" style={{ background: p.bg, color: p.tc, width: 36, height: 36, fontSize: 13 }}>
                  {p.name.split(' ').map(n => n[0]).join('')}
                </div>
                <p style={{ fontWeight: 500, fontSize: 13 }}>{p.name}</p>
              </div>
              <span className="badge" style={{ background: p.bg, color: p.tc }}>{p.stage}</span>
            </div>
          ))}
          <div className="stat-grid">
            <div className="stat-card"><div className="stat-value" style={{ color: '#1D9E75' }}>3</div><div className="stat-label">In pipeline</div></div>
            <div className="stat-card"><div className="stat-value" style={{ color: '#D85A30' }}>0</div><div className="stat-label">Wasted interviews</div></div>
            <div className="stat-card"><div className="stat-value" style={{ color: '#534AB7' }}>214</div><div className="stat-label">Video views</div></div>
          </div>
        </div>
      )}
    </div>
  )
}