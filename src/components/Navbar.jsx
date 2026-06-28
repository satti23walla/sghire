import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Navbar() {
  const { pathname } = useLocation()
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()

  function handleSignOut() {
    signOut().catch(() => {})
    navigate('/')
  }

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  const isActive = (path) => ({
    padding: '5px 12px', borderRadius: 7, fontSize: 13, textDecoration: 'none',
    background: pathname === path ? '#E1F5EE' : 'transparent',
    color: pathname === path ? '#0F6E56' : '#666',
    fontWeight: pathname === path ? 500 : 400,
  })

  return (
    <nav style={{ borderBottom: '0.5px solid #e0e0dc', background: '#fff', position: 'sticky', top: 0, zIndex: 10 }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 16px', display: 'flex', alignItems: 'center', gap: 16, height: 54 }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0 }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: '#1D9E75', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#fff' }} />
          </div>
          <span style={{ fontWeight: 500, fontSize: 14, color: '#1a1a1a' }}>SG Hire Insight</span>
        </Link>

        <div style={{ display: 'flex', gap: 6, marginLeft: 'auto', alignItems: 'center' }}>
          <Link to="/jobs" style={isActive('/jobs')}>Jobs</Link>

          {user ? (
            <>
              <Link
                to={profile?.role === 'employer' ? '/employer' : '/candidate'}
                style={isActive(profile?.role === 'employer' ? '/employer' : '/candidate')}
              >
                Dashboard
              </Link>
              <Link to="/profile" title="Edit profile" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                <div style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: '#EEEDFE', color: '#534AB7',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 600, cursor: 'pointer'
                }}>
                  {initials}
                </div>
              </Link>
              <button onClick={handleSignOut} className="btn btn-outline" style={{ fontSize: 12, padding: '5px 12px' }}>
                Sign out
              </button>
            </>
          ) : (
            <Link to="/auth" className="btn btn-primary" style={{ fontSize: 13, padding: '6px 16px', textDecoration: 'none' }}>
              Sign in
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
