import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, ApiError } from '../services/api'

export default function RegisterPage() {
  const navigate = useNavigate()
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
      await api.register(email, password)
      setSuccess(true)
      setTimeout(() => navigate('/library'), 1500)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao criar conta')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)'
      }}>
        <div style={{
          textAlign: 'center',
          padding: '40px',
          background: 'var(--bg-card)',
          border: '4px solid var(--green)',
          boxShadow: '8px 8px 0 var(--green)',
          borderRadius: '12px'
        }}>
          <span style={{ fontSize: '64px', display: 'block', marginBottom: '16px' }}>✅</span>
          <h2 style={{ color: 'var(--green)', marginBottom: '8px' }}>Conta criada!</h2>
          <p style={{ color: 'var(--text-muted)' }}>Redirecionando para a biblioteca...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      background: 'var(--bg)'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        background: 'var(--bg-card)',
        border: '4px solid var(--blue)',
        boxShadow: '8px 8px 0 var(--blue)',
        borderRadius: '12px',
        padding: '40px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <span style={{ fontSize: '56px', display: 'block', marginBottom: '8px' }}>🎴</span>
          <h1 style={{ fontSize: '32px', color: 'var(--blue)' }}>Criar conta</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
            Comece a aprender tarot hoje
          </p>
        </div>

        <form onSubmit={handleSubmit}>
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

          {error && (
            <div className="form-error" style={{
              padding: '12px',
              background: 'rgba(255,64,64,0.1)',
              border: '2px solid var(--red)',
              borderRadius: 'var(--radius)',
              marginBottom: '16px'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-secondary btn-lg"
            style={{ width: '100%', marginTop: '8px' }}
            disabled={loading}
          >
            {loading ? 'Criando...' : 'Criar conta 🎴'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Já tem uma conta?{' '}
            <a href="/login" style={{ color: 'var(--pink)', fontWeight: 700, textDecoration: 'none' }}>
              Faça login
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
