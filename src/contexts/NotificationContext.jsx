import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

const NotificationContext = createContext({
  notifications: [], unread: 0, loading: true,
  markAllRead: () => {}, markRead: () => {}
})

export function NotificationProvider({ children }) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); setNotifications([]); setUnread(0); return }
    loadNotifications()

    let channel
    try {
      channel = supabase
        .channel(`notif-${user.id}`)
        .on('postgres_changes', {
          event: 'INSERT', schema: 'public', table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        }, (payload) => {
          setNotifications(prev => [payload.new, ...prev])
          setUnread(prev => prev + 1)
        })
        .subscribe()
    } catch (e) { console.log('Realtime error:', e.message) }

    return () => { if (channel) supabase.removeChannel(channel) }
  }, [user?.id])

  async function loadNotifications() {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('notifications').select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30)
      setNotifications(data || [])
      setUnread((data || []).filter(n => !n.read).length)
    } catch (e) {
      console.error('Notifications load error:', e.message)
    } finally {
      setLoading(false)
    }
  }

  async function markAllRead() {
    try {
      await supabase.from('notifications')
        .update({ read: true }).eq('user_id', user.id).eq('read', false)
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnread(0)
    } catch (e) { console.error(e) }
  }

  async function markRead(id) {
    try {
      await supabase.from('notifications').update({ read: true }).eq('id', id)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
      setUnread(prev => Math.max(0, prev - 1))
    } catch (e) { console.error(e) }
  }

  return (
    <NotificationContext.Provider value={{ notifications, unread, loading, markAllRead, markRead }}>
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotifications = () => useContext(NotificationContext)
