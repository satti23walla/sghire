import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export default function Auth() {
  const { signIn, signUp, user, profile } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')
  const [step, setStep] = useState('form') // 'form' | 'otp'
  const [role, setRole] = useState('candidate')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const otpRefs = useRef([])

  useEffect(() => {
    if (user && profile) {
      navigate(profile.role === 'employer' ? '/employer' : '/candidate')
    }
  }, [user, profile])

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      if (mode === 'login') {
        await signIn({ email, password })
        setPassword('')
        navigate('/dashboard')
      } else {
        if (!fullName.trim()) throw new Error('Please enter your full name')
        if (role === 'employer' && !companyName.trim()) throw new Error('Please enter your company name')
        await signUp({ email, password, role, fullName: fullName.trim(), companyName: companyName.trim() })
        setPassword('')
        setStep('otp') // show OTP screen
      }
    } catch (err) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  function handleOtpChange(i, val) {
    if (!/^\d*$/.test(val)) return
    const next = [...otp]
    next[i] = val.slice(-1)
    setOtp(next)
    if (val && i < 5) otpRefs.current[i + 1]?.focus()
  }

  function handleOtpKeyDown(i, e) {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      otpRefs.current[i - 1]?.focus()
    }
  }

  function handleOtpPaste(e) {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (text.length === 6) {
      setOtp(text.split(''))
      otpRefs.current[5]?.focus()
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault()
    const token = otp.join('')
    if (token.length !== 6) { setError('Please enter the 6-digit code'); return }
    setLoading(true); setError('')
    try {
      const { error: verifyErr } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'signup'
      })
      if (verifyErr) throw verifyErr
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Invalid code — please try again')
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    setResending(true); setError(''); setSuccess('')
    try {
      const { error: resendErr } = await supabase.auth.resend({
        type: 'signup',
        email,
      })
      if (resendErr) throw resendErr
      setSuccess('A new code has been sent to your email.')
      setOtp(['', '', '', '', '', ''])
      otpRefs.current[0]?.focus()
    } catch (err) {
      setError(err.message || 'Could not resend code')
    } finally {
      setResending(false)
    }
  }

  // ── OTP SCREEN ─────────────────────────────────────────────────────────────
  if (step === 'otp') return (
    <div style={{ maxWidth: 400, margin: '40px auto' }}>
      <div className="card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>📧</div>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>Check your email</h2>
        <p style={{ fontSize: 13, color: '#666', marginBottom: 6, lineHeight: 1.6 }}>
          We sent a 6-digit verification code to
        </p>
        <p style={{ fontSize: 14, fontWeight: 500, color: '#1D9E75', marginBottom: 24 }}>{email}</p>

        {error && (
          <div style={{ background: '#FAECE7', color: '#D85A30', padding: '10px 12px', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{ background: '#E1F5EE', color: '#0F6E56', padding: '10px 12px', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>
            {success}
          </div>
        )}

        <form onSubmit={handleVerifyOtp}>
          {/* 6-digit OTP boxes */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 24 }}
            onPaste={handleOtpPaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={el => otpRefs.current[i] = el}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleOtpChange(i, e.target.value)}
                onKeyDown={e => handleOtpKeyDown(i, e)}
                autoFocus={i === 0}
                style={{
                  width: 44, height: 52, textAlign: 'center',
                  fontSize: 22, fontWeight: 600,
                  border: `1.5px solid ${digit ? '#1D9E75' : '#e0e0dc'}`,
                  borderRadius: 10, outline: 'none',
                  background: digit ? '#E1F5EE' : '#fff',
                  color: '#1a1a1a',
                  transition: 'border-color 0.15s',
                }}
              />
            ))}
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', fontSize: 15, padding: 13 }} disabled={loading || otp.join('').length !== 6}>
            {loading ? 'Verifying...' : 'Verify email →'}
          </button>
        </form>

        <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
          <p style={{ fontSize: 13, color: '#888' }}>
            Didn't get a code?{' '}
            <button type="button" onClick={handleResend} disabled={resending}
              style={{ border: 'none', background: 'none', color: '#1D9E75', cursor: 'pointer', fontWeight: 500, fontSize: 13, padding: 0 }}>
              {resending ? 'Sending...' : 'Resend code'}
            </button>
          </p>
          <button type="button" onClick={() => { setStep('form'); setOtp(['','','','','','']); setError('') }}
            style={{ border: 'none', background: 'none', color: '#aaa', cursor: 'pointer', fontSize: 12 }}>
            ← Back to sign up
          </button>
        </div>
      </div>
      <p style={{ fontSize: 12, color: '#888', textAlign: 'center', marginTop: 12 }}>
        Code expires in 10 minutes · Sent from noreply@hireitright.com
      </p>
    </div>
  )

  // ── LOGIN / SIGNUP FORM ────────────────────────────────────────────────────
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
          {mode === 'login' ? 'Welcome back' : 'Join HireItRight'}
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
                    <button key={r} type="button" onClick={() => setRole(r)}
                      style={{
                        flex: 1, padding: '9px', borderRadius: 8,
                        border: `1.5px solid ${role === r ? '#1D9E75' : '#e0e0dc'}`,
                        background: role === r ? '#E1F5EE' : '#fff',
                        color: role === r ? '#0F6E56' : '#666',
                        fontWeight: role === r ? 500 : 400,
                        fontSize: 14, cursor: 'pointer'
                      }}>
                      {r === 'candidate' ? '👤 Candidate' : '🏢 Employer'}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label className="form-label">Full name</label>
                <input className="form-input" type="text" placeholder="Your name" value={fullName}
                  onChange={e => setFullName(e.target.value)} required autoComplete="name" />
              </div>

              {role === 'employer' && (
                <div style={{ marginBottom: 12 }}>
                  <label className="form-label">Company name</label>
                  <input className="form-input" type="text" placeholder="Your company" value={companyName}
                    onChange={e => setCompanyName(e.target.value)} required autoComplete="organization" />
                </div>
              )}
            </>
          )}

          <div style={{ marginBottom: 12 }}>
            <label className="form-label">Email</label>
            <input className="form-input" type="email" placeholder="you@example.com" value={email}
              onChange={e => setEmail(e.target.value)} required autoComplete="email" name="email" />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label className="form-label">Password</label>
            <input className="form-input" type="password"
              placeholder={mode === 'signup' ? 'At least 6 characters' : 'Your password'}
              value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              name="password" />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account →'}
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
