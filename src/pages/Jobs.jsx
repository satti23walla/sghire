import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const typeColors = {
  'full-time':  { bg: '#E1F5EE', tc: '#0F6E56' },
  'part-time':  { bg: '#EEEDFE', tc: '#534AB7' },
  'contract':   { bg: '#FAEEDA', tc: '#BA7517' },
  'internship': { bg: '#FAECE7', tc: '#D85A30' },
}

export default function Jobs() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [jobs, setJobs] = useState([])
  const [appliedJobIds, setAppliedJobIds] = useState(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadJobs()
  }, [user])

  async function loadJobs() {
    const { data: jobsData } = await supabase
      .from('jobs')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    setJobs(jobsData || [])

    if (user && profile?.role === 'candidate') {
      const { data: apps } = await supabase
        .from('applications')
        .select('job_id')
        .eq('candidate_id', user.id)
      if (apps) setAppliedJobIds(new Set(apps.map(a => a.job_id)))
    }
    setLoading(false)
  }

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: '#666' }}>Loading jobs...</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 500 }}>Open roles</h2>
        <span style={{ fontSize: 13, color: '#666' }}>{jobs.length} {jobs.length === 1 ? 'job' : 'jobs'}</span>
      </div>

      {!user && (
        <div style={{ background: '#E1F5EE', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#0F6E56', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Sign in to apply for roles</span>
          <button className="btn btn-primary" style={{ fontSize: 12, padding: '5px 14px' }} onClick={() => navigate('/auth')}>Sign in</button>
        </div>
      )}

      {jobs.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 48, color: '#666' }}>
          <p style={{ fontSize: 15, marginBottom: 6 }}>No jobs posted yet</p>
          <p style={{ fontSize: 13 }}>Employers: sign in to post your first role</p>
        </div>
      ) : (
        jobs.map(job => {
          const colors = typeColors[job.job_type] || typeColors['full-time']
          const applied = appliedJobIds.has(job.id)
          return (
            <div key={job.id} className="card" style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 500, fontSize: 15, color: '#1a1a1a', marginBottom: 3 }}>{job.title}</p>
                  <p style={{ fontSize: 13, color: '#666' }}>{job.company_name}</p>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0, marginLeft: 8 }}>
                  {applied && (
                    <span className="badge" style={{ background: '#E1F5EE', color: '#0F6E56' }}>✓ Applied</span>
                  )}
                  {job.job_type && (
                    <span className="badge" style={{ background: colors.bg, color: colors.tc }}>{job.job_type}</span>
                  )}
                </div>
              </div>

              {job.location && <p style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>📍 {job.location}</p>}

              {job.description && (
                <p style={{ fontSize: 13, color: '#555', lineHeight: 1.6, marginBottom: 10,
                  overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {job.description}
                </p>
              )}

              {job.video_question && (
                <div style={{ background: '#f4f4f2', borderRadius: 7, padding: '7px 10px', marginBottom: 10 }}>
                  <p style={{ fontSize: 12, color: '#666' }}>🎥 Video response: <em>{job.video_question}</em></p>
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <Link to={`/jobs/${job.id}`} style={{ textDecoration: 'none', flex: 1 }}>
                  <button className="btn btn-outline" style={{ fontSize: 13, width: '100%' }}>
                    View details
                  </button>
                </Link>
                {profile?.role === 'candidate' && (
                  <Link to={`/jobs/${job.id}`} style={{ textDecoration: 'none', flex: 1 }}>
                    <button
                      className="btn btn-primary"
                      style={{ fontSize: 13, width: '100%', background: applied ? '#aaa' : undefined }}
                      disabled={applied}
                    >
                      {applied ? '✓ Applied' : 'Apply →'}
                    </button>
                  </Link>
                )}
                {!user && (
                  <button className="btn btn-primary" style={{ fontSize: 13, flex: 1 }} onClick={() => navigate('/auth')}>
                    Sign in to apply
                  </button>
                )}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
