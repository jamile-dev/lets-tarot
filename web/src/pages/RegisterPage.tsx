import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError('As senhas não coincidem')
      return
    }
    if (password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await register(email, password)
      setSuccess(true)
      setTimeout(() => navigate('/library'), 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar conta')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-header">
            <span className="auth-icon">✅</span>
            <h1 className="auth-title">Conta criada!</h1>
            <p className="auth-subtitle">Redirecionando para a biblioteca...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-icon">🎴</span>
          <h1 className="auth-title">Lets-Tarot</h1>
          <p className="auth-subtitle">Crie sua conta e comece a estudar</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Senha</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
              required
              minLength={8}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmar senha</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Repita a senha"
              autoComplete="new-password"
              required
            />
          </div>

          {error && <div className="form-error">{error}</div>}

          <button
            type="submit"
            className="btn btn-secondary btn-lg"
            disabled={loading}
          >
            {loading ? 'Criando...' : 'Criar conta 🎴'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Já tem uma conta?</p>
          <Link to="/login" className="btn btn-outline btn-sm">
            Fazer login
          </Link>
        </div>
      </div>
    </div>
  )
}
