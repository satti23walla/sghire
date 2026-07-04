import { useNavigate } from 'react-router-dom'
import { useNotifications } from '../hooks/useNotifications'
import { useAuth } from '../contexts/AuthContext'

const typeIcons = {
  profile_viewed:        { icon: '👁️', color: '#534AB7', bg: '#EEEDFE' },
  application_received:  { icon: '📨', color: '#0F6E56', bg: '#E1F5EE' },
  status_changed:        { icon: '🔔', color: '#BA7517', bg: '#FAEEDA' },
  new_application:       { icon: '✉️', color: '#0F6E56', bg: '#E1F5EE' },
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hrs = Math.floor(mins / 60)
  const days = Math.floor(hrs / 24)
  if (days > 0) return `${days}d ago`
  if (hrs > 0) return `${hrs}h ago`
  if (mins > 0) return `${mins}m ago`
  return 'just now'
}

export default function Notifications() {
  const { notifications, unread, loading, markAllRead, markRead } = useNotifications()
  const { profile } = useAuth()
  const navigate = useNavigate()

  function handleClick(notif) {
    if (!notif.read) markRead(notif.id)
    if (notif.link) navigate(notif.link)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 500, marginBottom: 2 }}>Notifications</h2>
          {unread > 0 && <p style={{ fontSize: 13, color: '#0F6E56' }}>{unread} unread</p>}
        </div>
        {unread > 0 && (
          <button className="btn btn-outline" style={{ fontSize: 12, padding: '5px 14px' }} onClick={markAllRead}>
            Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#aaa', fontSize: 13 }}>Loading...</div>
      ) : notifications.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 48, background: '#f9f9f7', border: 'none' }}>
          <p style={{ fontSize: 32, marginBottom: 10 }}>🔔</p>
          <p style={{ fontWeight: 500, fontSize: 15, marginBottom: 6 }}>No notifications yet</p>
          <p style={{ color: '#666', fontSize: 13 }}>
            {profile?.role === 'candidate'
              ? 'You\'ll be notified when employers view your profile or update your application.'
              : 'You\'ll be notified when candidates apply to your roles.'}
          </p>
        </div>
      ) : (
        notifications.map(n => {
          const t = typeIcons[n.type] || { icon: '🔔', color: '#666', bg: '#f4f4f2' }
          return (
            <div key={n.id}
              onClick={() => handleClick(n)}
              className="card"
              style={{
                marginBottom: 8, cursor: n.link ? 'pointer' : 'default',
                background: n.read ? '#fff' : '#fafffe',
                borderLeft: n.read ? undefined : '3px solid #1D9E75',
              }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                  background: t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16
                }}>
                  {t.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <p style={{ fontWeight: n.read ? 400 : 600, fontSize: 14, marginBottom: 2 }}>{n.title}</p>
                    <span style={{ fontSize: 11, color: '#aaa', flexShrink: 0 }}>{timeAgo(n.created_at)}</span>
                  </div>
                  {n.body && <p style={{ fontSize: 13, color: '#666', lineHeight: 1.5 }}>{n.body}</p>}
                  {n.link && <p style={{ fontSize: 12, color: '#1D9E75', marginTop: 4 }}>View →</p>}
                </div>
                {!n.read && (
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1D9E75', flexShrink: 0, marginTop: 4 }} />
                )}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
