import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

const STEPS = [
  { id: 'welcome',  title: null },
  { id: 'headline', title: 'What\'s your professional headline?', placeholder: 'e.g. Senior Data Analyst · 5 years · Open to work', field: 'headline', required: true },
  { id: 'skills',   title: 'What are your top skills?', placeholder: 'Type a skill and press Enter', field: 'skills', required: true },
  { id: 'location', title: 'Where are you based?', placeholder: 'e.g. Singapore', field: 'location', required: false },
  { id: 'linkedin', title: 'Add your LinkedIn profile', placeholder: 'https://linkedin.com/in/yourname', field: 'linkedin_url', required: false },
  { id: 'video',    title: 'Add a 1-min intro video URL', placeholder: 'https://loom.com/share/...', field: 'intro_video_url', required: false },
  { id: 'done',     title: null },
]

export default function OnboardingWizard({ onComplete }) {
  const { profile, refreshProfile } = useAuth()
  const [step, setStep] = useState(0)
  const [data, setData] = useState({ headline: '', skills: [], location: '', linkedin_url: '', intro_video_url: '' })
  const [skillInput, setSkillInput] = useState('')
  const [saving, setSaving] = useState(false)

  const current = STEPS[step]
  const progress = Math.round((step / (STEPS.length - 1)) * 100)

  function handleSkillKey(e) {
    if ((e.key === 'Enter' || e.key === ',') && skillInput.trim()) {
      e.preventDefault()
      const skill = skillInput.trim().replace(/,$/, '')
      if (skill && !data.skills.includes(skill)) {
        setData(prev => ({ ...prev, skills: [...prev.skills, skill] }))
      }
      setSkillInput('')
    }
  }

  function removeSkill(s) {
    setData(prev => ({ ...prev, skills: prev.skills.filter(x => x !== s) }))
  }

  async function handleNext() {
    if (step === STEPS.length - 2) {
      // Save everything before done screen
      setSaving(true)
      await supabase.rpc('update_my_profile', {
        p_full_name: profile.full_name,
        p_headline: data.headline || null,
        p_location: data.location || null,
        p_skills: data.skills.join(', ') || null,
        p_linkedin_url: data.linkedin_url || null,
        p_intro_video_url: data.intro_video_url || null,
      })
      await refreshProfile().catch(() => {})
      setSaving(false)
    }
    if (step === STEPS.length - 1) { onComplete(); return }
    setStep(s => s + 1)
  }

  function handleSkip() { setStep(s => s + 1) }

  const canContinue = current.required
    ? current.id === 'skills' ? data.skills.length > 0 : !!data[current.field]?.trim()
    : true

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16
    }}>
      <div style={{ background: '#fff', borderRadius: 16, maxWidth: 480, width: '100%', padding: 32, position: 'relative' }}>

        {/* Progress bar */}
        {step > 0 && step < STEPS.length - 1 && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: '#888' }}>Step {step} of {STEPS.length - 2}</span>
              <span style={{ fontSize: 12, color: '#1D9E75', fontWeight: 500 }}>{progress}%</span>
            </div>
            <div style={{ height: 4, background: '#f0f0ee', borderRadius: 4 }}>
              <div style={{ height: '100%', background: '#1D9E75', borderRadius: 4, width: `${progress}%`, transition: 'width 0.4s ease' }} />
            </div>
          </div>
        )}

        {/* Welcome screen */}
        {current.id === 'welcome' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>👋</div>
            <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>Welcome, {profile?.full_name?.split(' ')[0]}!</h2>
            <p style={{ color: '#666', fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
              Let's set up your profile in under 2 minutes so employers can see the real you — not just a CV.
            </p>
            <button className="btn btn-primary" style={{ width: '100%', fontSize: 15, padding: 14 }} onClick={handleNext}>
              Let's go →
            </button>
            <button onClick={onComplete} style={{ border: 'none', background: 'none', color: '#aaa', fontSize: 13, cursor: 'pointer', marginTop: 12, display: 'block', width: '100%' }}>
              Skip for now
            </button>
          </div>
        )}

        {/* Done screen */}
        {current.id === 'done' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
            <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>You're all set!</h2>
            <p style={{ color: '#666', fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
              Your profile is live. Here's what you can do next:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
              {[
                { icon: '💼', text: 'Browse open jobs and apply' },
                { icon: '🎯', text: 'Track roles from LinkedIn or Glassdoor' },
                { icon: '📁', text: 'Add portfolio items to stand out' },
              ].map((tip, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', background: '#f9f9f7', borderRadius: 10, padding: '10px 14px', textAlign: 'left' }}>
                  <span style={{ fontSize: 20 }}>{tip.icon}</span>
                  <p style={{ fontSize: 13, color: '#444' }}>{tip.text}</p>
                </div>
              ))}
            </div>
            <button className="btn btn-primary" style={{ width: '100%', fontSize: 15, padding: 14 }} onClick={handleNext}>
              Go to my dashboard →
            </button>
          </div>
        )}

        {/* Input steps */}
        {current.id !== 'welcome' && current.id !== 'done' && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 20 }}>{current.title}</h2>

            {current.id === 'skills' ? (
              <div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', minHeight: 44, border: '1px solid #e0e0dc', borderRadius: 8, padding: '8px 10px', marginBottom: 8, background: '#fff', cursor: 'text' }}
                  onClick={() => document.getElementById('skill-input').focus()}>
                  {data.skills.map(s => (
                    <span key={s} style={{ background: '#EEEDFE', color: '#534AB7', padding: '3px 10px', borderRadius: 20, fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
                      {s}
                      <button onClick={() => removeSkill(s)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#534AB7', fontSize: 14, padding: 0, lineHeight: 1 }}>×</button>
                    </span>
                  ))}
                  <input id="skill-input" value={skillInput} onChange={e => setSkillInput(e.target.value)}
                    onKeyDown={handleSkillKey}
                    placeholder={data.skills.length ? 'Add more...' : current.placeholder}
                    style={{ border: 'none', outline: 'none', fontSize: 14, flex: 1, minWidth: 120 }} />
                </div>
                <p style={{ fontSize: 11, color: '#888' }}>Press Enter or comma to add each skill</p>
              </div>
            ) : (
              <input className="form-input" type={current.field?.includes('url') ? 'url' : 'text'}
                placeholder={current.placeholder}
                value={data[current.field] || ''}
                onChange={e => setData(prev => ({ ...prev, [current.field]: e.target.value }))}
                autoFocus
                style={{ fontSize: 15, padding: '12px 14px' }}
              />
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              {!current.required && (
                <button className="btn btn-outline" onClick={handleSkip} style={{ flex: 1 }}>Skip</button>
              )}
              <button className="btn btn-primary" onClick={handleNext}
                disabled={!canContinue || saving}
                style={{ flex: 2, fontSize: 15, padding: 12 }}>
                {saving ? 'Saving...' : 'Continue →'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
