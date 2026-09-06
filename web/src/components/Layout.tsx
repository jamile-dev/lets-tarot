import { NavLink } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import type { ReactNode } from 'react'

interface LayoutProps {
  children?: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout, isAuthenticated } = useAuth()

  const navItems = [
    { to: '/library', label: 'Biblioteca', icon: '📚' },
    { to: '/study', label: 'Estudiar', icon: '🎴' },
    { to: '/stats', label: 'Estatísticas', icon: '📊' },
  ]

  return (
    <div className="app-container">
      <nav style={{
        padding: '16px 20px',
        borderBottom: '4px solid var(--border)',
        background: 'var(--bg-card)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '4px 4px 0 var(--pink)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '28px' }}>🎴</span>
          <span style={{ fontWeight: 900, fontSize: '20px', textTransform: 'uppercase', color: 'var(--yellow)' }}>
            Lets-Tarot
          </span>
          {isAuthenticated && user && (
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>
              {user.email.split('@')[0]}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isAuthenticated && (
            <>
              {navItems.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  style={({ isActive }) => ({
                    padding: '10px 16px',
                    borderRadius: 'var(--radius)',
                    border: isActive ? '3px solid var(--pink)' : '3px solid transparent',
                    background: isActive ? 'var(--bg-elevated)' : 'transparent',
                    color: isActive ? 'var(--pink)' : 'var(--text-muted)',
                    fontWeight: isActive ? 700 : 400,
                    textTransform: 'uppercase',
                    fontSize: '13px',
                    letterSpacing: '0.5px',
                    boxShadow: isActive ? '3px 3px 0 var(--pink)' : 'none',
                    transition: 'all 0.1s ease'
                  })}
                >
                  <span style={{ marginRight: '4px' }}>{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
              <button
                onClick={logout}
                style={{
                  padding: '10px 16px',
                  borderRadius: 'var(--radius)',
                  border: '3px solid var(--border)',
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  fontSize: '13px',
                  cursor: 'pointer',
                  boxShadow: '3px 3px 0 var(--border)'
                }}
              >
                Sair
              </button>
            </>
          )}
        </div>
      </nav>
      <main className="main-content">
        {children}
      </main>
      {isAuthenticated && (
        <footer className="footer">
          <span>Lets-Tarot 🎴 — Aprendizado com repetição espaçada</span>
          <span style={{ marginLeft: '16px', fontFamily: 'var(--mono)', fontSize: '12px' }}>
            v1.0.0
          </span>
        </footer>
      )}
    </div>
  )
}
