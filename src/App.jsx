import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Landing from './pages/Landing'
import Auth from './pages/Auth'
import CandidateDashboard from './pages/CandidateDashboard'
import EmployerDashboard from './pages/EmployerDashboard'
import Jobs from './pages/Jobs'
import JobDetail from './pages/JobDetail'
import Profile from './pages/Profile'
import CandidateProfileView from './pages/CandidateProfileView'
import Notifications from './pages/Notifications'
import { useAuth } from './contexts/AuthContext'

function ProtectedRoute({ children, requiredRole }) {
  const { user, profile, loading } = useAuth()
  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: '#666' }}>Loading...</div>
  if (!user) return <Navigate to="/auth" replace />
  if (requiredRole && profile?.role !== requiredRole) {
    return <Navigate to={profile?.role === 'employer' ? '/employer' : '/candidate'} replace />
  }
  return children
}

function DashboardRedirect() {
  const { user, profile, loading } = useAuth()
  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: '#666' }}>Loading...</div>
  if (!user) return <Navigate to="/auth" replace />
  if (profile?.role === 'employer') return <Navigate to="/employer" replace />
  return <Navigate to="/candidate" replace />
}

export default function App() {
  return (
    <div className="app">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/jobs/:id" element={<JobDetail />} />
          <Route path="/dashboard" element={<DashboardRedirect />} />
          <Route path="/candidate" element={
            <ProtectedRoute requiredRole="candidate">
              <CandidateDashboard />
            </ProtectedRoute>
          } />
          <Route path="/employer" element={
            <ProtectedRoute requiredRole="employer">
              <EmployerDashboard />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/notifications" element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          } />
          <Route path="/candidate/:id" element={
            <ProtectedRoute>
              <CandidateProfileView />
            </ProtectedRoute>
          } />
        </Routes>
      </main>
    </div>
  )
}
