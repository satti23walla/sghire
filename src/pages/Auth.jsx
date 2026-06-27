import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Auth() {
  const { signIn, signUp, user, profile } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')
  const [role, setRole] = useState('candidate')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user && profile) {
      navigate(profile.role === 'employer' ? '/employer' : '/candidate')
    }
  }, [user, profile])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') {
        await signIn({ email, password })
        navigate('/dashboard')
      } else {
        if (!fullName.trim()) throw new Error('Please enter your full name')
        if (role === 'employer' && !companyName.trim()) throw new Error('Please enter your company name')
        await signUp({ email, password, role, fullName: fullName.trim(), companyName: companyName.trim() })
        navigate('/dashboard')
      }
    } catch (err) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: '40px auto' }}>
      <div className="subtabs" style={{ marginBottom: 24 }}>
        <button className={`subtab${mode === 'login' ? ' active' : ''}`} onClick={() => { setMode('login'); setError('') }}>
          Sign in
        </button>
        <button className={`subtab${mode === 'signup' ? ' active' : ''}`} onClick={() => { setMode('signup'); setError('') }}>
          Create account
        </button>
      </div>

      <div className="card">
        <h2 style={{ fontSize: 17, fontWeight: 500, marginBottom: 18 }}>
          {mode === 'login' ? 'Welcome back' : 'Join HireRight SG'}
        </h2>

        {error && (
          <div style={{ background: '#FAECE7', color: '#D85A30', padding: '10px 12px', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <>
              <div style={{ marginBottom: 14 }}>
                <label className="form-label">I am a</label>
                <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                  {['candidate', 'employer'].map(r => (
                    <button
                      key={r} type="button"
                      onClick={() => setRole(r)}
                      style={{
                        flex: 1, padding: '9px', borderRadius: 8,
                        border: `1.5px solid ${role === r ? '#1D9E75' : '#e0e0dc'}`,
                        background: role === r ? '#E1F5EE' : '#fff',
                        color: role === r ? '#0F6E56' : '#666',
                        fontWeight: role === r ? 500 : 400,
                        fontSize: 14, cursor: 'pointer'
                      }}
                    >
                      {r === 'candidate' ? '👤 Candidate' : '🏢 Employer'}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label className="form-label">Full name</label>
                <input className="form-input" type="text" placeholder="Your name" value={fullName}
                  onChange={e => setFullName(e.target.value)} required />
              </div>

              {role === 'employer' && (
                <div style={{ marginBottom: 12 }}>
                  <label className="form-label">Company name</label>
                  <input className="form-input" type="text" placeholder="Your company" value={companyName}
                    onChange={e => setCompanyName(e.target.value)} required />
                </div>
              )}
            </>
          )}

          <div style={{ marginBottom: 12 }}>
            <label className="form-label">Email</label>
            <input className="form-input" type="email" placeholder="you@example.com" value={email}
              onChange={e => setEmail(e.target.value)} required />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label className="form-label">Password</label>
            <input className="form-input" type="password"
              placeholder={mode === 'signup' ? 'At least 6 characters' : 'Your password'}
              value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>
      </div>

      {mode === 'signup' && (
        <p style={{ fontSize: 12, color: '#888', textAlign: 'center', marginTop: 12 }}>
          By creating an account you agree to our terms of service.
        </p>
      )}
    </div>
  )
}
