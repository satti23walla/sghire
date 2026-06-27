import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export default function Profile() {
  const { profile, refreshProfile } = useAuth()
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [headline, setHeadline] = useState(profile?.headline || '')
  const [location, setLocation] = useState(profile?.location || '')
  const [skills, setSkills] = useState(profile?.skills || '')
  const [companyName, setCompanyName] = useState(profile?.company_name || '')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  if (!profile) return null

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess(false)

    const updates = {
      full_name: fullName,
      location,
      ...(profile.role === 'candidate'
        ? { headline, skills }
        : { company_name: companyName }
      ),
    }

    const { error: err } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', profile.id)

    if (err) {
      setError(err.message)
    } else {
      setSuccess(true)
      await refreshProfile()
      setTimeout(() => setSuccess(false), 3000)
    }
    setSaving(false)
  }

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 500, marginBottom: 6 }}>Edit profile</h2>
      <p style={{ fontSize: 13, color: '#666', marginBottom: 20 }}>
        {profile.role === 'candidate'
          ? 'Your profile is visible to employers when you apply.'
          : 'Your company profile is shown on job listings.'}
      </p>

      <div className="card">
        {success && (
          <div style={{ background: '#E1F5EE', color: '#0F6E56', padding: '10px 12px', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>
            ✅ Profile saved successfully!
          </div>
        )}
        {error && (
          <div style={{ background: '#FAECE7', color: '#D85A30', padding: '10px 12px', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSave}>
          <div style={{ marginBottom: 14 }}>
            <label className="form-label">Full name</label>
            <input className="form-input" type="text" value={fullName} onChange={e => setFullName(e.target.value)} />
          </div>

          {profile.role === 'candidate' ? (
            <>
              <div style={{ marginBottom: 14 }}>
                <label className="form-label">Headline</label>
                <input className="form-input" type="text" placeholder="e.g. Senior Data Analyst · 5 years · Open to work"
                  value={headline} onChange={e => setHeadline(e.target.value)} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label className="form-label">Skills <span style={{ color: '#888', fontWeight: 400 }}>(comma-separated)</span></label>
                <input className="form-input" type="text" placeholder="e.g. Python, SQL, Tableau, Power BI"
                  value={skills} onChange={e => setSkills(e.target.value)} />
              </div>
            </>
          ) : (
            <div style={{ marginBottom: 14 }}>
              <label className="form-label">Company name</label>
              <input className="form-input" type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} />
            </div>
          )}

          <div style={{ marginBottom: 20 }}>
            <label className="form-label">Location</label>
            <input className="form-input" type="text" placeholder="e.g. Singapore" value={location} onChange={e => setLocation(e.target.value)} />
          </div>

          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </form>
      </div>

      <div className="card" style={{ marginTop: 12, background: '#f4f4f2', border: 'none' }}>
        <p style={{ fontSize: 12, color: '#666' }}>
          <strong>Email:</strong> {profile.email}<br />
          <strong>Role:</strong> {profile.role}<br />
          <strong>Member since:</strong> {new Date(profile.created_at).toLocaleDateString('en-SG')}
        </p>
      </div>
    </div>
  )
}
