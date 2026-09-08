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
        <p>Carregando estatísticas...</p>
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
          <h3>⚠️ {error || 'Não foi possível carregar'}</h3>
          <button className="btn btn-primary" onClick={loadStats}>
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
        <p>
          Acompanhe seu progresso no aprendizado do tarot. Cada revisão conta.
        </p>
    </div>

      <div className="stats-grid">
        <StatCard value={stats.total_reviews} label="Total de revisões" color="var(--gold)" />
        <StatCard value={stats.due_today} label="Pendentes hoje" color="var(--blue)" />
        <StatCard value={stats.reviews_today} label="Revisões hoje" color="var(--purple)" />
        <StatCard value={stats.current_streak} label="Sequência atual" color="var(--green)" />
        <StatCard value={stats.cards_learnt} label="Cartas aprendidas" color="var(--purple)" />
        <StatCard
          value={stats.average_rating > 0 ? stats.average_rating.toFixed(1) : '—'}
          label="Avaliação média"
          color="var(--text-muted)"
        />
      </div>

      {/* Streak visualization */}
      <div className="streak-section">
        <h3>Sequência de estudos 🔥</h3>
        <p>
          Dias consecutivos estudando. Mantenha a sequência!
        </p>

        <div className="streak-calendar">
          {Array.from({ length: 30 }, (_, i) => (
            <div
              key={i}
              className={`streak-day ${i < stats.current_streak ? 'active' : ''}`}
            />
          ))}
        </div>

        <div className="streak-labels">
          <span>1 dia</span>
          <span>15 dias</span>
          <span>30 dias</span>
        </div>

        {stats.current_streak > 0 && (
          <p className="streak-count">
            {stats.current_streak} dia{stats.current_streak !== 1 ? 's' : ''} consecutivos
          </p>
        )}
      </div>

      {/* Progress info */}
      <div className="tips-section">
        <h3>Dicas para progressar 🚀</h3>
        <ul className="tips-list">
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

function StatCard({ value, label, color }: { value: number | string; label: string; color: string }) {
  return (
    <div className="stat-card">
      <div className="stat-value" style={{ color }}>{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  )
}
