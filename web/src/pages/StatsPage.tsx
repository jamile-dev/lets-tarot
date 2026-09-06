import { useState, useEffect } from 'react'
import { api } from '../services/api'
import type { UserStats } from '../types'

export default function StatsPage() {
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    try {
      const res = await api.getStats()
      setStats(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar estatísticas')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loader"></div>
        <p style={{ marginTop: '16px', color: 'var(--text-muted)' }}>Carregando estatísticas...</p>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div>
        <div className="page-header">
          <h1>Estatísticas 📊</h1>
        </div>
        <div className="empty-state">
          <h3 style={{ color: 'var(--red)' }}>⚠️ {error || 'Não foi possível carregar'}</h3>
          <button className="btn btn-primary" onClick={loadStats} style={{ marginTop: '16px' }}>
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <h1>Estatísticas 📊</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '16px', maxWidth: '500px' }}>
          Acompanhe seu progresso no aprendizado do tarot. Cada revisão conta.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '32px'
      }}>
        <StatCard
          value={stats.total_reviews}
          label="Total de revisões"
          color="var(--pink)"
        />
        <StatCard
          value={stats.due_today}
          label="Pendentes hoje"
          color="var(--yellow)"
        />
        <StatCard
          value={stats.reviews_today}
          label="Revisões hoje"
          color="var(--blue)"
        />
        <StatCard
          value={stats.current_streak}
          label="Sequência atual"
          color="var(--green)"
        />
        <StatCard
          value={stats.cards_learnt}
          label="Cartas aprendidas"
          color="var(--purple, #9B5DE5)"
        />
        <StatCard
          value={stats.average_rating?.toFixed(1) || '—'}
          label="Avaliação média"
          color="var(--text-muted)"
        />
      </div>

      {/* Streak visualization */}
      <div style={{
        background: 'var(--bg-card)',
        border: '3px solid var(--border)',
        boxShadow: 'var(--shadow)',
        borderRadius: 'var(--radius)',
        padding: '24px',
        marginBottom: '24px'
      }}>
        <h3 style={{ marginBottom: '16px' }}>Sequência de estudos 🔥</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
          Dias consecutivos estudando. Mantenha a sequência!
        </p>

        <div style={{
          display: 'flex',
          gap: '4px',
          alignItems: 'center',
          marginBottom: '12px'
        }}>
          {Array.from({ length: 30 }, (_, i) => (
            <div
              key={i}
              style={{
                width: '100%',
                height: '40px',
                background: i < stats.current_streak ? 'var(--pink)' : 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                transition: 'background 0.3s ease',
                minHeight: '40px'
              }}
            />
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>
          <span>1 dia</span>
          <span>15 dias</span>
          <span>30 dias</span>
        </div>

        {stats.current_streak > 0 && (
          <p style={{ marginTop: '12px', color: 'var(--pink)', fontWeight: 700, fontSize: '16px' }}>
            {stats.current_streak} dia{stats.current_streak !== 1 ? 's' : ''} consecutivos
          </p>
        )}
      </div>

      {/* Progress info */}
      <div style={{
        background: 'var(--bg-card)',
        border: '3px solid var(--border)',
        boxShadow: 'var(--shadow)',
        borderRadius: 'var(--radius)',
        padding: '24px'
      }}>
        <h3 style={{ marginBottom: '16px' }}>Dicas para progressar 🚀</h3>
        <ul style={{ paddingLeft: '20px', color: 'var(--text-muted)', lineHeight: '1.8' }}>
          <li>Estude todos os dias para manter sua sequência 🔥</li>
          <li>Revise as cartas pendentes todos os dias</li>
          <li>Seja honesto nas avaliações — isso ajuda o algoritmo a ajustar os intervalos</li>
          <li>Crie baralhos personalizados para focar em cartas específicas</li>
          <li>Use os significados diretos e reversos para interpretações mais ricas</li>
        </ul>
      </div>
    </div>
  )
}

function StatCard({ value, label, color }: { value: number | string, label: string, color: string }) {
  return (
    <div className="stat-card">
      <div className="stat-value" style={{ color }}>
        {value}
      </div>
      <div className="stat-label">{label}</div>
    </div>
  )
}
