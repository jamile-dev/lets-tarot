import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import Layout from './components/Layout'
import LibraryPage from './pages/LibraryPage'
import StudyPage from './pages/StudyPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import StatsPage from './pages/StatsPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <div className="loading-screen"><div className="loader"></div></div>
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <div className="loading-screen"><div className="loader"></div></div>
  if (isAuthenticated) return <Navigate to="/library" replace />
  return <>{children}</>
}

export default function App() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return <div className="loading-screen"><div className="loader"></div></div>
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to={isAuthenticated ? "/library" : "/login"} replace />} />
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route element={<Layout />}>
        <Route path="/library" element={<ProtectedRoute><LibraryPage /></ProtectedRoute>} />
        <Route path="/study" element={<ProtectedRoute><StudyPage /></ProtectedRoute>} />
        <Route path="/study/:deckId" element={<ProtectedRoute><StudyPage /></ProtectedRoute>} />
        <Route path="/stats" element={<ProtectedRoute><StatsPage /></ProtectedRoute>} />
      </Route>
    </Routes>
  )
}
