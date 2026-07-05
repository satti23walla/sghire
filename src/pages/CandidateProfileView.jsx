import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { notify } from '../lib/notifications'

const typeIcons = { project: '💼', website: '🌐', video: '🎥', article: '📝', other: '🔗' }

export default function CandidateProfileView() {
  const { id } = useParams()
  const { profile: myProfile } = useAuth()
  const navigate = useNavigate()
  const [candidate, setCandidate] = useState(null)
  const [portfolio, setPortfolio] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCandidate()
  }, [id])

  async function loadCandidate() {
    const { data: prof } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .eq('role', 'candidate')
      .single()

    if (prof) {
      setCandidate(prof)
      const { data: port } = await supabase
        .from('portfolio_items')
        .select('*')
        .eq('candidate_id', id)
        .order('created_at', { ascending: false })
      setPortfolio(port || [])

      // Notify candidate their profile was viewed (only if viewer is employer)
      if (myProfile?.role === 'employer' && myProfile.id !== id) {
        notify({
          userId: id,
          type: 'profile_viewed',
          title: `${myProfile.company_name || 'An employer'} viewed your profile`,
          body: 'Your profile is getting attention!',
          link: '/candidate',
          recipientEmail: prof.email,
        }).catch(() => {})
      }
    }
    setLoading(false)
  }

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: '#666' }}>Loading...</div>
  if (!candidate) return <div style={{ padding: 60, textAlign: 'center', color: '#666' }}>Candidate not found.</div>

  const initials = candidate.full_name
    ? candidate.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'
  const skillList = candidate.skills
    ? candidate.skills.split(',').map(s => s.trim()).filter(Boolean)
    : []

  return (
    <div>
      <button onClick={() => navigate(-1)}
        style={{ border: 'none', background: 'none', color: '#666', fontSize: 13, cursor: 'pointer', marginBottom: 16, padding: 0 }}>
        ← Back
      </button>

      {/* Profile header */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: skillList.length > 0 ? 14 : 0 }}>
          {/* Avatar */}
          {candidate.avatar_url ? (
            <img src={candidate.avatar_url + '?v=1'} alt={candidate.full_name}
              style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid #e0e0dc' }} />
          ) : (
            <div style={{
              width: 64, height: 64, borderRadius: '50%', flexShrink: 0,
              background: '#EEEDFE', color: '#534AB7',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 600
            }}>
              {initials}
            </div>
          )}

          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontSize: 18, fontWeight: 500, marginBottom: 3 }}>{candidate.full_name}</h2>
            {candidate.headline && <p style={{ fontSize: 14, color: '#555', marginBottom: 6 }}>{candidate.headline}</p>}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {candidate.location && <p style={{ fontSize: 13, color: '#888' }}>📍 {candidate.location}</p>}
              {candidate.linkedin_url && (
                <a href={candidate.linkedin_url} target="_blank" rel="noreferrer"
                  style={{ fontSize: 13, color: '#0A66C2', textDecoration: 'none', fontWeight: 500 }}>
                  LinkedIn ↗
                </a>
              )}
            </div>
          </div>
        </div>

        {skillList.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {skillList.map(s => <span key={s} className="badge badge-purple">{s}</span>)}
          </div>
        )}
      </div>

      {/* Intro video */}
      {candidate.intro_video_url && (
        <div className="card" style={{ marginBottom: 12, background: '#E1F5EE', border: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="play-btn" style={{ background: '#1D9E75', flexShrink: 0 }}>
              <div className="play-triangle" />
            </div>
            <div>
              <p style={{ fontWeight: 500, fontSize: 14, color: '#0F6E56', margin: 0 }}>Intro video</p>
              <a href={candidate.intro_video_url} target="_blank" rel="noreferrer"
                style={{ fontSize: 13, color: '#0F6E56', opacity: 0.8 }}>Watch ↗</a>
            </div>
          </div>
        </div>
      )}

      {/* Portfolio */}
      {portfolio.length > 0 && (
        <div>
          <p className="section-label" style={{ marginBottom: 12 }}>Portfolio ({portfolio.length})</p>
          {portfolio.map(item => {
            const t = typeIcons[item.type] || '🔗'
            return (
              <div key={item.id} className="card" style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{t}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                      <p style={{ fontWeight: 500, fontSize: 14 }}>{item.title}</p>
                      <span style={{ fontSize: 10, background: '#f4f4f2', color: '#888', padding: '2px 7px', borderRadius: 10 }}>{item.type}</span>
                    </div>
                    {item.description && <p style={{ fontSize: 13, color: '#666', lineHeight: 1.5, marginBottom: 4 }}>{item.description}</p>}
                    {item.url && (
                      <a href={item.url} target="_blank" rel="noreferrer"
                        style={{ fontSize: 12, color: '#1D9E75', textDecoration: 'none', fontWeight: 500 }}>
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

      {portfolio.length === 0 && !candidate.intro_video_url && (
        <div className="card" style={{ textAlign: 'center', padding: 32, color: '#888', background: '#f9f9f7', border: 'none' }}>
          <p style={{ fontSize: 13 }}>No portfolio items added yet</p>
        </div>
      )}
    </div>
  )
}
