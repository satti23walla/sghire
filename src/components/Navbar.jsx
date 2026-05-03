import { Link, useLocation } from 'react-router-dom'

const links = [
  { path: '/', label: 'Home' },
  { path: '/candidate', label: 'Candidate' },
  { path: '/hiring', label: 'Hiring Manager' },
]

export default function Navbar() {
  const { pathname } = useLocation()
  return (
    <nav style={{ borderBottom: '0.5px solid #e0e0dc', background: '#fff', position: 'sticky', top: 0, zIndex: 10 }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 16px', display: 'flex', alignItems: 'center', gap: 24, height: 54 }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: '#1D9E75', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#fff' }} />
          </div>
          <span style={{ fontWeight: 500, fontSize: 14, color: '#1a1a1a' }}>SG Hire Insight</span>
        </Link>
        <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
          {links.map(l => (
            <Link key={l.path} to={l.path} style={{
              padding: '5px 12px', borderRadius: 7, fontSize: 13, textDecoration: 'none',
              fontWeight: pathname === l.path ? 500 : 400,
              background: pathname === l.path ? '#E1F5EE' : 'transparent',
              color: pathname === l.path ? '#0F6E56' : '#666',
            }}>{l.label}</Link>
          ))}
        </div>
      </div>
    </nav>
  )
}