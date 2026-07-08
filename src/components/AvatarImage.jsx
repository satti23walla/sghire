import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

// Displays a profile photo using signed URL (private bucket)
// Falls back to initials if no photo or URL fails
export default function AvatarImage({ src, name, size = 40, style = {} }) {
  const [url, setUrl] = useState(null)

  const initials = name
    ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  useEffect(() => {
    if (!src) { setUrl(null); return }

    // Old Supabase public URL — extract path and generate signed URL
    if (src.includes('supabase.co/storage/v1/object/public/Avatars/')) {
      const path = src.split('/object/public/Avatars/')[1]?.split('?')[0]
      if (path) {
        supabase.storage.from('Avatars').createSignedUrl(path, 3600)
          .then(({ data }) => setUrl(data?.signedUrl || null))
          .catch(() => setUrl(null))
        return
      }
    }

    // New: file path — generate signed URL (1 hour expiry)
    if (!src.startsWith('http')) {
      supabase.storage.from('Avatars')
        .createSignedUrl(src, 3600)
        .then(({ data }) => setUrl(data?.signedUrl || null))
        .catch(() => setUrl(null))
      return
    }

    // Any other https URL — use directly
    setUrl(src)
  }, [src])

  const baseStyle = {
    width: size, height: size, borderRadius: '50%', flexShrink: 0,
    ...style
  }

  if (url) {
    return (
      <img src={url} alt={name || 'Avatar'}
        style={{ ...baseStyle, objectFit: 'cover', border: '1.5px solid #e0e0dc' }}
        onError={() => setUrl(null)} />
    )
  }

  return (
    <div style={{
      ...baseStyle,
      background: '#EEEDFE', color: '#534AB7',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.32, fontWeight: 600
    }}>
      {initials}
    </div>
  )
}
