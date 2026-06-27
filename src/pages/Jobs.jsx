import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const typeColors = {
  'full-time':  { bg: '#E1F5EE', tc: '#0F6E56' },
  'part-time':  { bg: '#EEEDFE', tc: '#534AB7' },
  'contract':   { bg: '#FAEEDA', tc: '#BA7517' },
  'internship': { bg: '#FAECE7', tc: '#D85A30' },
}

export default function Jobs() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('jobs')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setJobs(data || [])
        setLoading(false)
      })
  }, [])

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: '#666' }}>Loading jobs...</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 500 }}>Open roles</h2>
        <span style={{ fontSize: 13, color: '#666' }}>{jobs.length} {jobs.length === 1 ? 'job' : 'jobs'}</span>
      </div>

      {jobs.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 48, color: '#666' }}>
          <p style={{ fontSize: 15, marginBottom: 6 }}>No jobs posted yet</p>
          <p style={{ fontSize: 13 }}>Employers: sign in to post your first role</p>
        </div>
      ) : (
        jobs.map(job => {
          const colors = typeColors[job.job_type] || typeColors['full-time']
          return (
            <Link key={job.id} to={`/jobs/${job.id}`} style={{ textDecoration: 'none' }}>
              <div className="card" style={{ marginBottom: 10, cursor: 'pointer', transition: 'border-color 0.15s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div>
                    <p style={{ fontWeight: 500, fontSize: 15, color: '#1a1a1a', marginBottom: 3 }}>{job.title}</p>
                    <p style={{ fontSize: 13, color: '#666' }}>{job.company_name}</p>
                  </div>
                  {job.job_type && (
                    <span className="badge" style={{ background: colors.bg, color: colors.tc, flexShrink: 0 }}>
                      {job.job_type}
                    </span>
                  )}
                </div>
                {job.location && (
                  <p style={{ fontSize: 12, color: '#888', marginTop: 8 }}>📍 {job.location}</p>
                )}
                {job.video_question && (
                  <div style={{ marginTop: 10, background: '#E1F5EE', borderRadius: 7, padding: '7px 10px' }}>
                    <p style={{ fontSize: 12, color: '#0F6E56' }}>🎥 Video response required</p>
                  </div>
                )}
              </div>
            </Link>
          )
        })
      )}
    </div>
  )
}
