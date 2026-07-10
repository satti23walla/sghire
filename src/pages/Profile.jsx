import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

const PORTFOLIO_TYPES = [
  { key: 'project',  icon: '💼', label: 'Project' },
  { key: 'website',  icon: '🌐', label: 'Website' },
  { key: 'video',    icon: '🎥', label: 'Video' },
  { key: 'article',  icon: '📝', label: 'Article' },
  { key: 'other',    icon: '🔗', label: 'Other' },
]

export default function Profile() {
  const { profile, user, refreshProfile } = useAuth()

  const [fullName, setFullName] = useState('')
  const [headline, setHeadline] = useState('')
  const [location, setLocation] = useState('')
  const [skills, setSkills] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [companyUrl, setCompanyUrl] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [introVideoUrl, setIntroVideoUrl] = useState('')
  const [videoVisibility, setVideoVisibility] = useState('applications')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarError, setAvatarError] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const [portfolio, setPortfolio] = useState([])
  const [loadingPortfolio, setLoadingPortfolio] = useState(false)
  const [showAddItem, setShowAddItem] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newType, setNewType] = useState('project')
  const [newUrl, setNewUrl] = useState('')
  const [addingItem, setAddingItem] = useState(false)

  // Sync form state when profile loads
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '')
      setHeadline(profile.headline || '')
      setLocation(profile.location || '')
      setSkills(profile.skills || '')
      setCompanyName(profile.company_name || '')
      setCompanyUrl(profile.company_url || '')
      setLinkedinUrl(profile.linkedin_url || '')
      setIntroVideoUrl(profile.intro_video_url || '')
      setVideoVisibility(profile.video_visibility || 'applications')
      setAvatarUrl(profile.avatar_url || '')
      if (profile.role === 'candidate') loadPortfolio()
    }
  }, [profile?.id])

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

  async function handleAvatarUpload(e) {
    const file = e.target.files[0]
    if (!file) return

    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!allowed.includes(file.type)) {
      setAvatarError('Please upload a JPEG, PNG, WebP, or GIF image')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('Image must be under 5MB')
      return
    }

    setUploadingAvatar(true)
    setAvatarError('')

    try {
      const ext = file.name.split('.').pop().toLowerCase()
      const filePath = `${profile.id}/avatar.${ext}`

      const { error: uploadErr } = await supabase.storage
        .from('Avatars')
        .upload(filePath, file, { upsert: true, contentType: file.type })

      if (uploadErr) throw uploadErr

      // Generate signed URL for immediate preview (1 hour)
      const { data: signed } = await supabase.storage
        .from('Avatars').createSignedUrl(filePath, 3600)
      if (signed?.signedUrl) setAvatarUrl(signed.signedUrl)

      // Save file PATH to profile (not URL) — signed URLs generated on display
      await supabase.rpc('update_my_profile', {
        p_full_name: fullName,
        p_avatar_url: filePath,
      })
      await refreshProfile().catch(() => {})
    } catch (err) {
      setAvatarError(err.message || 'Upload failed')
    } finally {
      setUploadingAvatar(false)
    }
  }

  async function handleRemoveAvatar() {
    setAvatarUrl('')
    await supabase.rpc('update_my_profile', {
      p_full_name: fullName,
      p_avatar_url: null,
    })
    await refreshProfile().catch(() => {})
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess(false)

    try {
      const updates = {
        full_name: fullName,
        location,
        ...(profile.role === 'candidate'
          ? { headline, skills, linkedin_url: linkedinUrl, intro_video_url: introVideoUrl }
          : { company_name: companyName, company_url: companyUrl }
        ),
      }


      const { error: err } = await supabase.rpc('update_my_profile', {
        p_full_name: fullName,
        p_headline: headline || null,
        p_location: location || null,
        p_skills: skills || null,
        p_company_name: companyName || null,
        p_company_url: companyUrl || null,
        p_linkedin_url: linkedinUrl || null,
        p_intro_video_url: introVideoUrl || null,
        p_video_visibility: videoVisibility,
        p_avatar_url: avatarUrl || null,
      })

      if (err) {
        setError(err.message)
      } else {
        setSuccess(true)
        refreshProfile().catch(() => {})
        setTimeout(() => setSuccess(false), 3000)
      }
    } catch (e) {
      console.log('6. Exception:', e)
      setError(e.message || 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  async function handleAddItem(e) {
    e.preventDefault()
    if (!newTitle.trim()) return
    setAddingItem(true)
    try {
      const { error: err } = await supabase.from('portfolio_items').insert({
        candidate_id: profile.id,
        title: newTitle.trim(),
        description: newDesc.trim() || null,
        type: newType,
        url: newUrl.trim() || null,
      })
      if (!err) {
        setNewTitle(''); setNewDesc(''); setNewUrl(''); setNewType('project')
        setShowAddItem(false)
        await loadPortfolio()
      }
    } finally {
      setAddingItem(false)
    }
  }

  async function handleDeleteItem(id) {
    await supabase.from('portfolio_items').delete().eq('id', id)
    setPortfolio(prev => prev.filter(p => p.id !== id))
  }

  if (!profile) return <div style={{ padding: 40, textAlign: 'center', color: '#666' }}>Loading...</div>

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 500, marginBottom: 6 }}>Edit profile</h2>
      <p style={{ fontSize: 13, color: '#666', marginBottom: 20 }}>
        {profile.role === 'candidate'
          ? 'Your profile is visible to employers when you apply.'
          : 'Your company profile is shown on job listings.'}
      </p>

      <div className="card" style={{ marginBottom: 12 }}>
        <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 14, color: '#444' }}>Basic info</p>

        {success && (
          <div style={{ background: '#E1F5EE', color: '#0F6E56', padding: '10px 12px', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>
            ✅ Profile saved!
          </div>
        )}
        {error && (
          <div style={{ background: '#FAECE7', color: '#D85A30', padding: '10px 12px', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSave}>
          <div style={{ marginBottom: 12 }}>
            <label className="form-label">Full name</label>
            <input className="form-input" type="text" value={fullName} onChange={e => setFullName(e.target.value)} />
          </div>

          {profile.role === 'candidate' ? (
            <>
              <div style={{ marginBottom: 12 }}>
                <label className="form-label">Headline</label>
                <input className="form-input" type="text"
                  placeholder="e.g. Senior Data Analyst · 5 years · Open to work"
                  value={headline} onChange={e => setHeadline(e.target.value)} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label className="form-label">Skills <span style={{ color: '#888', fontWeight: 400 }}>(comma-separated)</span></label>
                <input className="form-input" type="text"
                  placeholder="e.g. Python, SQL, Tableau, Power BI"
                  value={skills} onChange={e => setSkills(e.target.value)} />
              </div>
            </>
          ) : (
            <>
              <div style={{ marginBottom: 12 }}>
                <label className="form-label">Company name</label>
                <input className="form-input" type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label className="form-label">Company website / LinkedIn company page</label>
                <input className="form-input" type="url"
                  placeholder="https://linkedin.com/company/yourcompany or https://yourcompany.com"
                  value={companyUrl} onChange={e => setCompanyUrl(e.target.value)} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label className="form-label">Your LinkedIn profile</label>
                <input className="form-input" type="url"
                  placeholder="https://linkedin.com/in/yourname"
                  value={linkedinUrl} onChange={e => setLinkedinUrl(e.target.value)} />
              </div>
            </>
          )}

          <div style={{ marginBottom: 12 }}>
            <label className="form-label">Location</label>
            <input className="form-input" type="text" placeholder="e.g. Singapore" value={location} onChange={e => setLocation(e.target.value)} />
          </div>

          {profile.role === 'candidate' && (
            <>
              <div style={{ marginBottom: 12 }}>
                <label className="form-label">LinkedIn URL</label>
                <input className="form-input" type="url"
                  placeholder="https://linkedin.com/in/yourname"
                  value={linkedinUrl} onChange={e => setLinkedinUrl(e.target.value)} />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label className="form-label">
                  {profile.role === 'candidate' ? '🎥 Intro video — who you are' : '🎥 Meet your hiring manager video'}
                  <span style={{ color: '#888', fontWeight: 400 }}> (Loom, YouTube, Google Drive)</span>
                </label>
                <input className="form-input" type="url"
                  placeholder="https://loom.com/share/..."
                  value={introVideoUrl} onChange={e => setIntroVideoUrl(e.target.value)} />
                <p style={{ fontSize: 11, color: '#888', marginTop: 4 }}>
                  {profile.role === 'candidate'
                    ? 'A 1–2 min video: who you are, what you do, what you\'re looking for.'
                    : 'A 1–2 min video: who you are, your team, what makes your company a great place to work.'}
                </p>

                {/* Visibility control */}
                {introVideoUrl && (
                  <div style={{ marginTop: 10 }}>
                    <label className="form-label">Who can see this video?</label>
                    <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                      {[
                        { key: 'public', icon: '🌐', label: 'Public', sub: 'Anyone on the platform' },
                        { key: 'applications', icon: '📨', label: profile.role === 'candidate' ? 'With applications' : 'On job posts', sub: profile.role === 'candidate' ? 'Only employers you apply to' : 'Shown on your job listings' },
                        { key: 'private', icon: '🔒', label: 'Private', sub: 'Saved but not shown' },
                      ].map(v => (
                        <button key={v.key} type="button" onClick={() => setVideoVisibility(v.key)}
                          style={{
                            flex: 1, minWidth: 100, padding: '8px 10px', borderRadius: 8, cursor: 'pointer', textAlign: 'left',
                            border: `1.5px solid ${videoVisibility === v.key ? '#1D9E75' : '#e0e0dc'}`,
                            background: videoVisibility === v.key ? '#E1F5EE' : '#fff',
                          }}>
                          <p style={{ fontSize: 13, fontWeight: 500, color: videoVisibility === v.key ? '#0F6E56' : '#444' }}>{v.icon} {v.label}</p>
                          <p style={{ fontSize: 10, color: '#888', marginTop: 2 }}>{v.sub}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </>
          )}

          {/* Profile photo - available for both candidates and employers */}
          <div style={{ marginBottom: 20 }}>
                <label className="form-label">Profile photo</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 6 }}>
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    {avatarUrl ? (
                      <img src={avatarUrl.startsWith('http') ? avatarUrl + '?v=1' : avatarUrl} alt="Profile"
                        style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '2px solid #e0e0dc' }} />
                    ) : (
                      <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#EEEDFE', color: '#534AB7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 600 }}>
                        {profile.full_name ? profile.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '?'}
                      </div>
                    )}
                    {uploadingAvatar && (
                      <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ color: '#fff', fontSize: 11 }}>...</span>
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                      <label style={{ padding: '6px 14px', borderRadius: 8, fontSize: 13, border: '1px solid #e0e0dc', background: '#fff', cursor: uploadingAvatar ? 'not-allowed' : 'pointer', color: uploadingAvatar ? '#aaa' : '#444', fontWeight: 500 }}>
                        {uploadingAvatar ? 'Uploading...' : '📷 Upload photo'}
                        <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp,image/gif" style={{ display: 'none' }} disabled={uploadingAvatar} onChange={handleAvatarUpload} />
                      </label>
                      {avatarUrl && (
                        <button type="button" onClick={handleRemoveAvatar} style={{ padding: '6px 12px', borderRadius: 8, fontSize: 12, border: '1px solid #FAECE7', background: '#FAECE7', color: '#D85A30', cursor: 'pointer' }}>
                          Remove
                        </button>
                      )}
                    </div>
                    <p style={{ fontSize: 11, color: '#888' }}>JPEG, PNG, WebP or GIF · Max 3MB</p>
                    {avatarError && <p style={{ fontSize: 12, color: '#D85A30', marginTop: 4 }}>{avatarError}</p>}
                  </div>
                </div>
              </div>

          {profile.role === 'employer' && <div style={{ marginBottom: 4 }} />}

          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </form>
      </div>

      {/* Portfolio — candidates only */}
      {profile.role === 'candidate' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 8 }}>
            <div>
              <p style={{ fontWeight: 500, fontSize: 15 }}>Portfolio</p>
              <p style={{ fontSize: 12, color: '#666' }}>Projects, websites, videos, articles</p>
            </div>
            {!showAddItem && (
              <button className="btn btn-outline" style={{ fontSize: 12, padding: '5px 14px' }} onClick={() => setShowAddItem(true)}>
                + Add item
              </button>
            )}
          </div>

          {showAddItem && (
            <div className="card" style={{ marginBottom: 12, background: '#f9f9f7' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <p style={{ fontSize: 13, fontWeight: 500 }}>New portfolio item</p>
                <button onClick={() => setShowAddItem(false)}
                  style={{ border: 'none', background: 'none', color: '#aaa', fontSize: 18, cursor: 'pointer' }}>×</button>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                {PORTFOLIO_TYPES.map(t => (
                  <button key={t.key} type="button" onClick={() => setNewType(t.key)}
                    style={{
                      padding: '4px 10px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                      border: `1px solid ${newType === t.key ? '#1D9E75' : '#e0e0dc'}`,
                      background: newType === t.key ? '#E1F5EE' : '#fff',
                      color: newType === t.key ? '#0F6E56' : '#666',
                    }}>
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>
              <form onSubmit={handleAddItem}>
                <div style={{ marginBottom: 10 }}>
                  <label className="form-label">Title *</label>
                  <input className="form-input" type="text"
                    placeholder="e.g. Sales Dashboard · DBS Bank"
                    value={newTitle} onChange={e => setNewTitle(e.target.value)} required />
                </div>
                <div style={{ marginBottom: 10 }}>
                  <label className="form-label">Description</label>
                  <textarea className="form-input" rows={2}
                    placeholder="What did you build? What was the impact?"
                    value={newDesc} onChange={e => setNewDesc(e.target.value)}
                    style={{ resize: 'vertical' }} />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label className="form-label">Link</label>
                  <input className="form-input" type="url" placeholder="https://..."
                    value={newUrl} onChange={e => setNewUrl(e.target.value)} />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" className="btn btn-outline" onClick={() => setShowAddItem(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={addingItem}>
                    {addingItem ? 'Adding...' : 'Add to portfolio'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {loadingPortfolio ? (
            <div style={{ textAlign: 'center', padding: 24, color: '#aaa', fontSize: 13 }}>Loading...</div>
          ) : portfolio.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 32, color: '#888', background: '#f9f9f7', border: 'none' }}>
              <p style={{ fontSize: 13 }}>No portfolio items yet — add your first above</p>
            </div>
          ) : (
            portfolio.map(item => {
              const t = PORTFOLIO_TYPES.find(x => x.key === item.type) || PORTFOLIO_TYPES[4]
              return (
                <div key={item.id} className="card" style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <span style={{ fontSize: 18, flexShrink: 0 }}>{t.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 500, fontSize: 14, marginBottom: 2 }}>{item.title}</p>
                      {item.description && <p style={{ fontSize: 12, color: '#666', lineHeight: 1.5, marginBottom: 4 }}>{item.description}</p>}
                      {item.url && (
                        <a href={item.url} target="_blank" rel="noreferrer"
                          style={{ fontSize: 12, color: '#1D9E75', textDecoration: 'none' }}>View ↗</a>
                      )}
                    </div>
                    <button onClick={() => handleDeleteItem(item.id)}
                      style={{ border: 'none', background: 'none', color: '#ccc', fontSize: 16, cursor: 'pointer', padding: 0 }}>×</button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      <div className="card" style={{ marginTop: 16, background: '#f4f4f2', border: 'none' }}>
        <p style={{ fontSize: 12, color: '#666' }}>
          <strong>Email:</strong> {profile.email} &nbsp;·&nbsp;
          <strong>Role:</strong> {profile.role} &nbsp;·&nbsp;
          <strong>Joined:</strong> {new Date(profile.created_at).toLocaleDateString('en-SG')}
        </p>
      </div>
    </div>
  )
}
