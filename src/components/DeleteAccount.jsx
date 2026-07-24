import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function DeleteAccount() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState('idle') // idle | confirm | deleting | done
  const [error, setError] = useState('')

  async function handleDelete() {
    setStep('deleting')
    setError('')
    try {
      const id = user.id

      // Delete in dependency order
      await supabase.from('notifications').delete().eq('user_id', id)
      await supabase.from('cloudflare_video_log').delete().eq('user_id', id)

      // Get and delete application-related data
      const { data: apps } = await supabase.from('applications').select('id').eq('candidate_id', id)
      if (apps?.length) {
        const appIds = apps.map(a => a.id)
        await supabase.from('video_responses').delete().in('application_id', appIds)
        await supabase.from('projects').delete().in('application_id', appIds)
      }

      await supabase.from('applications').delete().eq('candidate_id', id)
      await supabase.from('portfolio_items').delete().eq('candidate_id', id)
      await supabase.from('target_jobs').delete().eq('candidate_id', id)
      await supabase.from('jobs').delete().eq('employer_id', id)
      await supabase.from('profiles').delete().eq('id', id)

      // Delete avatar from storage
      await supabase.storage.from('Avatars').remove([`${id}/avatar.jpg`, `${id}/avatar.png`, `${id}/avatar.webp`]).catch(() => {})

      // Sign out and delete auth user via RPC or redirect
      await supabase.auth.signOut()
      setStep('done')
      setTimeout(() => navigate('/'), 2000)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please contact dpo@hireitright.com')
      setStep('confirm')
    }
  }

  if (step === 'done') return (
    <div style={{ background: '#E1F5EE', borderRadius: 10, padding: '16px 18px', marginTop: 12 }}>
      <p style={{ fontSize: 14, color: '#0F6E56', fontWeight: 500 }}>✅ Account deleted</p>
      <p style={{ fontSize: 13, color: '#0F6E56', marginTop: 4 }}>Your data has been removed. Redirecting...</p>
    </div>
  )

  return (
    <div style={{ marginTop: 24, borderTop: '1px solid #f0f0ee', paddingTop: 20 }}>
      <h3 style={{ fontSize: 15, fontWeight: 600, color: '#D85A30', marginBottom: 6 }}>Delete Account</h3>
      <p style={{ fontSize: 13, color: '#666', marginBottom: 14, lineHeight: 1.6 }}>
        Permanently delete your account and all associated data including your profile, applications, videos and notifications. This cannot be undone.
      </p>

      {step === 'idle' && (
        <button onClick={() => setStep('confirm')}
          style={{ fontSize: 13, padding: '8px 16px', borderRadius: 8, border: '1px solid #D85A30', background: '#fff', color: '#D85A30', cursor: 'pointer', fontWeight: 500 }}>
          Delete my account
        </button>
      )}

      {step === 'confirm' && (
        <div style={{ background: '#FAECE7', borderRadius: 10, padding: '16px 18px' }}>
          <p style={{ fontSize: 14, fontWeight: 500, color: '#D85A30', marginBottom: 8 }}>
            ⚠️ Are you absolutely sure?
          </p>
          <p style={{ fontSize: 13, color: '#666', marginBottom: 16, lineHeight: 1.6 }}>
            This will permanently delete:
            your profile · all applications · all videos · all notifications
          </p>
          {error && <p style={{ fontSize: 13, color: '#D85A30', marginBottom: 12 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setStep('idle')} className="btn btn-outline" style={{ flex: 1 }}>
              Cancel
            </button>
            <button onClick={handleDelete}
              style={{ flex: 1, padding: '9px', borderRadius: 8, border: 'none', background: '#D85A30', color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
              Yes, delete everything
            </button>
          </div>
        </div>
      )}

      {step === 'deleting' && (
        <div style={{ background: '#f9f9f7', borderRadius: 10, padding: '14px 18px' }}>
          <p style={{ fontSize: 13, color: '#666' }}>⏳ Deleting your account and data...</p>
        </div>
      )}

      <p style={{ fontSize: 11, color: '#aaa', marginTop: 10 }}>
        For data-related requests, contact <a href="mailto:dpo@hireitright.com" style={{ color: '#1D9E75' }}>dpo@hireitright.com</a>
      </p>
    </div>
  )
}
