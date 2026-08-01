import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function DeleteAccount() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState('idle')
  const [error, setError] = useState('')
  const [partial, setPartial] = useState(false)

  async function handleDelete() {
    setStep('deleting')
    setError('')
    try {
      // Call Edge Function — handles Cloudflare video deletion + auth user removal.
      // The function derives the user from this token; it does NOT accept a
      // userId from the body, so a caller can only ever delete themselves.
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Your session has expired. Please log in again.')

      const fnUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-account`

      const res = await fetch(fnUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Deletion failed')

      setPartial(result.complete === false)

      // Sign out locally
      // Local-only sign out. The auth user is already deleted server-side,
      // so a normal signOut() would POST to /auth/v1/logout and 403.
      await supabase.auth.signOut({ scope: 'local' }).catch(() => {})
      setStep('done')
      if (result.complete !== false) setTimeout(() => navigate('/'), 2000)

    } catch (err) {
      setError(err.message || 'Something went wrong. Please contact hireitrightdpo@gmail.com')
      setStep('confirm')
    }
  }

  if (step === 'done') return (
    <div style={{ background: partial ? '#FDF6E3' : '#E1F5EE', borderRadius: 10, padding: '16px 18px', marginTop: 12 }}>
      <p style={{ fontSize: 14, color: partial ? '#8A6D1F' : '#0F6E56', fontWeight: 500 }}>
        {partial ? '⚠️ Account deleted — one item needs follow-up' : '✅ Account deleted'}
      </p>
      <p style={{ fontSize: 13, color: partial ? '#8A6D1F' : '#0F6E56', marginTop: 4, lineHeight: 1.6 }}>
        {partial
          ? <>Your account and data have been removed, but we could not confirm deletion of every stored file. We have logged this and will complete it. For confirmation contact <a href="mailto:hireitrightdpo@gmail.com" style={{ color: '#8A6D1F' }}>hireitrightdpo@gmail.com</a>.</>
          : 'All your data and videos have been permanently removed. Redirecting...'}
      </p>
    </div>
  )

  return (
    <div style={{ marginTop: 8 }}>
      <h3 style={{ fontSize: 15, fontWeight: 600, color: '#D85A30', marginBottom: 6 }}>Delete Account</h3>
      <p style={{ fontSize: 13, color: '#666', marginBottom: 14, lineHeight: 1.6 }}>
        Permanently delete your account and all data — profile, applications, videos and notifications.
        Videos are also removed from Cloudflare. This cannot be undone.
      </p>

      {step === 'idle' && (
        <button onClick={() => setStep('confirm')}
          style={{ fontSize: 13, padding: '8px 16px', borderRadius: 8, border: '1px solid #D85A30', background: '#fff', color: '#D85A30', cursor: 'pointer', fontWeight: 500 }}>
          Delete my account
        </button>
      )}

      {step === 'confirm' && (
        <div style={{ background: '#FAECE7', borderRadius: 10, padding: '16px 18px' }}>
          <p style={{ fontSize: 14, fontWeight: 500, color: '#D85A30', marginBottom: 8 }}>⚠️ Are you absolutely sure?</p>
          <p style={{ fontSize: 13, color: '#666', marginBottom: 16, lineHeight: 1.6 }}>
            This permanently deletes: your profile · all applications · all videos (including from Cloudflare) · all notifications
          </p>
          {error && <p style={{ fontSize: 13, color: '#D85A30', marginBottom: 12 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setStep('idle')} className="btn btn-outline" style={{ flex: 1 }}>Cancel</button>
            <button onClick={handleDelete}
              style={{ flex: 1, padding: '9px', borderRadius: 8, border: 'none', background: '#D85A30', color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
              Yes, delete everything
            </button>
          </div>
        </div>
      )}

      {step === 'deleting' && (
        <div style={{ background: '#f9f9f7', borderRadius: 10, padding: '14px 18px' }}>
          <p style={{ fontSize: 13, color: '#666' }}>⏳ Deleting your account, data and videos from Cloudflare...</p>
        </div>
      )}

      <p style={{ fontSize: 11, color: '#aaa', marginTop: 10 }}>
        For data requests contact <a href="mailto:hireitrightdpo@gmail.com" style={{ color: '#1D9E75' }}>hireitrightdpo@gmail.com</a>
      </p>
    </div>
  )
}
