import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function HomePage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  if (isAuthenticated) {
    navigate('/library')
    return null
  }

  return (
    <>
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <span className="hero-icon">🎴</span>
          <h1 className="hero-title">Lets-Tarot</h1>
          <p className="hero-subtitle">
            Aprenda tarô com repetição espaçada (SM-2).<br />
            78 cartas Rider-Waite-Smith em português, com significados diretos e reversos.
          </p>
          <div className="btn-group-hero">
            <button
              className="btn btn-primary btn-lg"
              onClick={() => navigate('/register')}
            >
              Começar agora 🚀
            </button>
            <button
              className="btn btn-outline btn-lg"
              onClick={() => navigate('/login')}
            >
              Já tenho conta 🔓
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="feature-card">
          <span className="feature-icon">🃏</span>
          <h3>78 Cartas</h3>
          <p>Todas as cartas do baralho Rider-Waite-Smith com significados completos em português.</p>
        </div>
        <div className="feature-card">
          <span className="feature-icon">🧠</span>
          <h3>SM-2</h3>
          <p>Algoritmo de repetição espaçada como Anki. Revisões no momento certo para fixar no longo prazo.</p>
        </div>
        <div className="feature-card">
          <span className="feature-icon">📊</span>
          <h3>Estatísticas</h3>
          <p>Acompanhe seu progresso, sequências e cartas aprendidas. Nunca perca o ritmo!</p>
        </div>
      </section>

      {/* How it works */}
      <section className="howto-section">
        <h2 className="howto-title">Como funciona</h2>
        <div className="howto-steps">
          <div className="howto-step">
            <span className="step-number" style={{ background: 'var(--gold)' }}>1</span>
            <div>
              <h3>Crie sua conta</h3>
              <p>Cadastre-se com seu email em segundos. Sem complicação.</p>
            </div>
          </div>
          <div className="howto-step">
            <span className="step-number" style={{ background: 'var(--purple)' }}>2</span>
            <div>
              <h3>Crie um baralho</h3>
              <p>Monte baralhos personalizados ou use o baralho padrão com as 78 cartas.</p>
            </div>
          </div>
          <div className="howto-step">
            <span className="step-number" style={{ background: 'var(--green)' }}>3</span>
            <div>
              <h3>Estude e repita</h3>
              <p>Revise as cartas pelo algoritmo SM-2. Avalie seu conhecimento (1-5) e o sistema agenda as próximas revisões.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
