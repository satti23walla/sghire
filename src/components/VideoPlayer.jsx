import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function VideoPlayer({ cloudflareVideoId, fallbackUrl, label = 'Watch video' }) {
  const [signedUrl, setSignedUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [error, setError] = useState('')

  // External URL (Loom, YouTube etc.) — just a link
  if (!cloudflareVideoId && fallbackUrl) {
    return (
      <a href={fallbackUrl} target="_blank" rel="noreferrer"
        style={{ fontSize: 13, color: '#1D9E75', textDecoration: 'none', fontWeight: 500 }}>
        🎥 {label} ↗
      </a>
    )
  }

  if (!cloudflareVideoId) return null

  async function loadVideo() {
    setLoading(true)
    setError('')
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('get-video-url', {
        body: { videoId: cloudflareVideoId }
      })
      if (fnErr) throw new Error(fnErr.message)
      setSignedUrl(data.signedUrl)
      setPlaying(true)
    } catch (err) {
      setError('Could not load video. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (playing && signedUrl) {
    return (
      <div style={{ borderRadius: 10, overflow: 'hidden', background: '#000', position: 'relative' }}>
        <video src={signedUrl} controls autoPlay playsInline
          style={{ width: '100%', maxHeight: 300, display: 'block' }}
          onError={() => setError('Video failed to load — the link may have expired.')} />
        {error && (
          <div style={{ padding: 12, background: '#FAECE7', color: '#D85A30', fontSize: 12 }}>{error}</div>
        )}
      </div>
    )
  }

  return (
    <div>
      <button onClick={loadVideo} disabled={loading}
        style={{
          display: 'flex', alignItems: 'center', gap: 10, width: '100%',
          background: '#E1F5EE', border: 'none', borderRadius: 10,
          padding: '10px 14px', cursor: loading ? 'not-allowed' : 'pointer',
        }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%', background: '#1D9E75', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {loading
            ? <span style={{ color: '#fff', fontSize: 10 }}>...</span>
            : <div style={{ width: 0, height: 0, borderStyle: 'solid', borderWidth: '6px 0 6px 11px', borderColor: 'transparent transparent transparent #fff', marginLeft: 2 }} />
          }
        </div>
        <div style={{ textAlign: 'left' }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: '#0F6E56', margin: 0 }}>
            {loading ? 'Loading...' : label}
          </p>
          <p style={{ fontSize: 11, color: '#0F6E56', opacity: 0.7, margin: 0 }}>
            Secure · Expires after 1 hour
          </p>
        </div>
      </button>
      {error && <p style={{ fontSize: 12, color: '#D85A30', marginTop: 6 }}>{error}</p>}
    </div>
  )
}
