import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Landing from './pages/Landing'
import Candidate from './pages/Candidate'
import HiringManager from './pages/HiringManager'

export default function App() {
  return (
    <div className="app">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/candidate" element={<Candidate />} />
          <Route path="/hiring" element={<HiringManager />} />
        </Routes>
      </main>
    </div>
  )
}