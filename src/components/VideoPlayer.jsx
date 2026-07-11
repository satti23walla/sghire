import { useState } from 'react'

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
      const fnUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/clever-processor`
      const res = await fetch(fnUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ videoId: cloudflareVideoId }),
      })
      const data = await res.json()
      console.log('[VideoPlayer] cloudflareVideoId:', cloudflareVideoId)
      console.log('[VideoPlayer] response status:', res.status)
      console.log('[VideoPlayer] response data:', JSON.stringify(data))

      if (res.status === 202 || data?.error === 'processing') {
        setError('⏳ Video is still processing — try again in 1–2 minutes.')
        return
      }
      if (!res.ok || data?.error) throw new Error(data?.message || 'Failed to load video')

      setSignedUrl(data.signedUrl)
      setPlaying(true)
    } catch (err) {
      setError('Could not load video. Please try again.')
      console.error('VideoPlayer error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (playing && signedUrl) {
    return (
      <div style={{ borderRadius: 10, overflow: 'hidden', position: 'relative', paddingTop: '56.25%' }}>
        <iframe
          src={signedUrl}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
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
