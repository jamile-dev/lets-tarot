import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Layout() {
  const { user, logout, isAuthenticated } = useAuth()
  const navItems = [
    { to: '/library', label: 'Biblioteca', icon: '📚' },
    { to: '/study', label: 'Estudar', icon: '🎴' },
    { to: '/stats', label: 'Estatísticas', icon: '📊' },
  ]

  return (
    <div className="app-container">
      <nav className="nav-bar">
        <div className="nav-left">
          <span className="nav-logo-icon">🎴</span>
          <span className="nav-logo-text">Lets-Tarot</span>
          {isAuthenticated && user && (
            <span className="nav-user">{user.email.split('@')[0]}</span>
          )}
        </div>
        {isAuthenticated && (
          <div className="nav-right">
            {navItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <span className="nav-link-icon">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
            <button className="nav-logout" onClick={logout}>
              Sair
            </button>
          </div>
        )}
      </nav>
      <main className="main-content">
        <Outlet />
      </main>
      {isAuthenticated && (
        <footer className="footer">
          <span>Lets-Tarot 🎴 — Aprendizado com repetição espaçada</span>
          <span className="footer-version">v1.0.0</span>
        </footer>
      )}
    </div>
  )
}
