import { useState, useRef, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function VideoRecorder({ onVideoRecorded, onCancel, maxSeconds = 120, label = 'Record video', userId = null, context = 'unknown' }) {
  const [state, setState] = useState('idle') // idle|requesting|ready|recording|preview|uploading|done
  const [countdown, setCountdown] = useState(maxSeconds)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')

  const videoRef = useRef(null)
  const previewRef = useRef(null)
  const streamRef = useRef(null)
  const recorderRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)
  const blobRef = useRef(null)

  useEffect(() => {
    return () => { stopStream(); if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  function stopStream() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
  }

  async function startCamera() {
    setState('requesting')
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: 'user' },
        audio: true,
      })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
      setState('ready')
    } catch {
      setError('Could not access camera. Please allow camera access and try again.')
      setState('idle')
    }
  }

  function startRecording() {
    chunksRef.current = []
    setCountdown(maxSeconds)
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9' : 'video/webm'
    const recorder = new MediaRecorder(streamRef.current, { mimeType })
    recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
    recorder.onstop = () => {
      blobRef.current = new Blob(chunksRef.current, { type: 'video/webm' })
      setState('preview')
    }
    recorder.start(1000)
    recorderRef.current = recorder
    setState('recording')
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          // Auto-stop at limit
          stopRecording()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  function stopRecording() {
    if (timerRef.current) clearInterval(timerRef.current)
    if (recorderRef.current?.state !== 'inactive') recorderRef.current.stop()
    stopStream()
  }

  function reRecord() {
    setError(''); setCountdown(maxSeconds); setState('idle'); startCamera()
  }

  async function uploadVideo() {
    setState('uploading')
    setProgress(10)
    try {
      // Call Edge Function directly — slug is bright-responder
      const fnUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bright-responder`
      const fnRes = await fetch(fnUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ userId, context }),
      })

      if (!fnRes.ok) {
        const errText = await fnRes.text()
        throw new Error(`Edge function error: ${fnRes.status} ${errText}`)
      }

      const tokenData = await fnRes.json()
      if (tokenData?.error) throw new Error(tokenData.error)

      const { uploadURL, uid } = tokenData
      setProgress(20)

      // Upload via POST — Cloudflare Stream direct upload
      setProgress(40)
      const formData = new FormData()
      formData.append('file', blobRef.current, 'recording.webm')

      const uploadRes = await fetch(uploadURL, {
        method: 'POST',
        body: formData,
      })

      if (!uploadRes.ok) {
        const errText = await uploadRes.text()
        throw new Error(`Upload failed (${uploadRes.status}): ${errText}`)
      }

      setProgress(100)
      setState('done')
      onVideoRecorded({ cloudflare_video_id: uid })
    } catch (err) {
      console.error('Video upload error:', err)
      setError(err.message || 'Upload failed — please try again')
      setState('preview')
    }
  }

  const fmt = s => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`

  return (
    <div style={{ border: '0.5px solid #e0e0dc', borderRadius: 12, padding: 14, background: '#fafafa' }}>
      {/* IDLE */}
      {state === 'idle' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🎥</div>
          <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>{label}</p>
          <p style={{ fontSize: 12, color: '#888', marginBottom: 14 }}>
            Max {Math.floor(maxSeconds / 60)} min · Stored securely · Domain-locked
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            {onCancel && <button className="btn btn-outline" style={{ flex: 1 }} onClick={onCancel}>Cancel</button>}
            <button className="btn btn-primary" style={{ flex: 2 }} onClick={startCamera}>
              Open camera
            </button>
          </div>
        </div>
      )}

      {/* REQUESTING */}
      {state === 'requesting' && (
        <div style={{ textAlign: 'center', padding: 20, color: '#666', fontSize: 13 }}>
          Requesting camera access...
        </div>
      )}

      {/* READY / RECORDING */}
      {(state === 'ready' || state === 'recording') && (
        <div>
          <video
            ref={(el) => {
              videoRef.current = el
              // Only set srcObject if not already set — prevents flicker on re-render
              if (el && streamRef.current && !el.srcObject) {
                el.srcObject = streamRef.current
              }
            }}
            autoPlay muted playsInline
            style={{ width: '100%', borderRadius: 8, background: '#000', maxHeight: 220, objectFit: 'cover', display: 'block' }} />
          <div style={{ display: 'flex', gap: 10, marginTop: 10, alignItems: 'center' }}>
            {state === 'ready' && (
              <button className="btn btn-primary" style={{ flex: 1, padding: 11 }} onClick={startRecording}>
                ● Start recording
              </button>
            )}
            {state === 'recording' && (
              <>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#D85A30' }} />
                  <span style={{ fontSize: 13, color: '#D85A30', fontWeight: 500 }}>REC</span>
                  <span style={{ fontSize: 13, color: countdown <= 10 ? '#D85A30' : '#666', fontWeight: countdown <= 10 ? 600 : 400 }}>
                    {fmt(countdown)} {countdown <= 10 ? '⚠️' : 'left'}
                  </span>
                </div>
                <button className="btn btn-outline"
                  style={{ padding: '8px 16px', color: '#D85A30', borderColor: '#D85A30' }}
                  onClick={stopRecording}>
                  ■ Stop
                </button>
              </>
            )}
          </div>
          {state === 'ready' && (
            <p style={{ fontSize: 11, color: '#aaa', marginTop: 6, textAlign: 'center' }}>
              Recording will auto-stop at {fmt(maxSeconds)}
            </p>
          )}
        </div>
      )}

      {/* PREVIEW */}
      {state === 'preview' && (
        <div>
          <video
            ref={(el) => {
              previewRef.current = el
              if (el && blobRef.current && !el.src) {
                el.src = URL.createObjectURL(blobRef.current)
                el.play().catch(() => {})
              }
            }}
            controls playsInline
            style={{ width: '100%', borderRadius: 8, background: '#000', maxHeight: 220, display: 'block' }} />
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button className="btn btn-outline" style={{ flex: 1 }} onClick={reRecord}>↺ Re-record</button>
            <button className="btn btn-outline" style={{ flex: 1 }}
              onClick={() => { if (previewRef.current) { previewRef.current.currentTime = 0; previewRef.current.play() } }}>
              ▶ Replay
            </button>
            <button className="btn btn-primary" style={{ flex: 2 }} onClick={uploadVideo}>
              ✓ Use this video
            </button>
          </div>
          <p style={{ fontSize: 11, color: '#aaa', marginTop: 6, textAlign: 'center' }}>
            Watch your recording before saving — click Replay to watch again
          </p>
        </div>
      )}

      {/* UPLOADING */}
      {state === 'uploading' && (
        <div style={{ textAlign: 'center', padding: 16 }}>
          <p style={{ fontSize: 13, color: '#666', marginBottom: 10 }}>Uploading securely...</p>
          <div style={{ height: 6, background: '#f0f0ee', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: '#1D9E75', borderRadius: 4, width: `${progress}%`, transition: 'width 0.4s ease' }} />
          </div>
          <p style={{ fontSize: 11, color: '#aaa', marginTop: 6 }}>{progress}%</p>
        </div>
      )}

      {/* DONE */}
      {state === 'done' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 24 }}>✅</span>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 500, color: '#0F6E56' }}>Video uploaded securely</p>
            <p style={{ fontSize: 11, color: '#888' }}>Cloudflare Stream · Domain-locked · Signed URL</p>
          </div>
          <button onClick={reRecord}
            style={{ border: 'none', background: 'none', color: '#888', fontSize: 12, cursor: 'pointer' }}>
            Re-record
          </button>
        </div>
      )}

      {error && (
        <div style={{ background: '#FAECE7', color: '#D85A30', padding: '10px 12px', borderRadius: 8, fontSize: 13, marginTop: 8 }}>
          {error}
        </div>
      )}
    </div>
  )
}
