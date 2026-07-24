import { useState, useEffect } from 'react'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const accepted = localStorage.getItem('cookie_consent')
    if (!accepted) setVisible(true)
  }, [])

  function accept() {
    localStorage.setItem('cookie_consent', 'essential_only')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000,
      background: '#1a1a1a', color: '#fff', padding: '14px 24px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 16, flexWrap: 'wrap',
      boxShadow: '0 -2px 16px rgba(0,0,0,0.15)',
    }}>
      <p style={{ fontSize: 13, margin: 0, color: 'rgba(255,255,255,0.85)', flex: 1, lineHeight: 1.5 }}>
        🍪 We use only <strong style={{ color: '#fff' }}>essential cookies</strong> to keep you logged in and protect the platform. No tracking or advertising cookies.{' '}
        <a href="/privacy" style={{ color: '#1D9E75', textDecoration: 'none' }}>Privacy Policy</a>
      </p>
      <button onClick={accept} style={{
        background: '#1D9E75', color: '#fff', border: 'none', borderRadius: 8,
        padding: '8px 20px', fontSize: 13, fontWeight: 500, cursor: 'pointer', flexShrink: 0,
      }}>
        Got it
      </button>
    </div>
  )
}
