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
      <a href="#main-content" className="skip-link">Pular para o conteúdo principal</a>
      <nav className="nav-bar" role="navigation" aria-label="Navegação principal">
        <div className="nav-left">
          <span className="nav-logo-icon" aria-hidden="true">🎴</span>
          <span className="nav-logo-text">Lets-Tarot</span>
          {isAuthenticated && user && (
            <span className="nav-user" aria-label={`Usuário: ${user.email.split('@')[0]}`}>{user.email.split('@')[0]}</span>
          )}
        </div>
        {isAuthenticated && (
          <div className="nav-right">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              aria-label={item.label}
            >
                {({ isActive }) => (
                  <>
                    <span className="nav-link-icon" aria-hidden="true">{item.icon}</span>
                    <span className="nav-link-text">{item.label}</span>
                    {isActive && <span className="sr-only"> (atual)</span>}
                  </>
                )}
              </NavLink>
            ))}
            <button
              className="nav-logout"
              onClick={logout}
              aria-label="Sair da conta"
            >
              Sair
            </button>
          </div>
        )}
      </nav>
      <main className="main-content" id="main-content">
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
