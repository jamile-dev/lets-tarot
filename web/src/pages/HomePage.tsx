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
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Hero Section */}
      <div style={{
        textAlign: 'center',
        padding: '80px 20px 60px'
      }}>
        <div style={{ fontSize: '80px', marginBottom: '20px' }}>🎴</div>
        <h1 style={{
          fontSize: '48px',
          color: 'var(--yellow)',
          marginBottom: '12px',
          textShadow: '4px 4px 0 var(--pink)'
        }}>
          Lets-Tarot
        </h1>
        <p style={{
          fontSize: '20px',
          color: 'var(--text-muted)',
          maxWidth: '600px',
          margin: '0 auto 32px',
          lineHeight: 1.6
        }}>
          Aprenda tarô com repetição espaçada (SM-2).<br/>
          78 cartas Rider-Waite-Smith em português, com significados diretos e reversos.
        </p>

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary btn-lg"
            onClick={() => navigate('/register')}
            style={{ minWidth: '200px' }}
          >
            Começar agora 🚀
          </button>
          <button
            className="btn btn-outline btn-lg"
            onClick={() => navigate('/login')}
            style={{ minWidth: '200px' }}
          >
            Já tenho conta 🔓
          </button>
        </div>
      </div>

      {/* Features Section */}
      <div style={{
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '40px 20px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px'
      }}>
        <div style={{
          background: 'var(--bg-card)',
          border: '3px solid var(--pink)',
          borderRadius: 'var(--radius)',
          padding: '24px',
          textAlign: 'center',
          boxShadow: 'var(--shadow)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🃏</div>
          <h3 style={{ color: 'var(--pink)', marginBottom: '12px' }}>78 Cartas</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1.6 }}>
            Todas as cartas do baralho Rider-Waite-Smith com significados completos em português.
          </p>
        </div>

        <div style={{
          background: 'var(--bg-card)',
          border: '3px solid var(--blue)',
          borderRadius: 'var(--radius)',
          padding: '24px',
          textAlign: 'center',
          boxShadow: 'var(--shadow)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🧠</div>
          <h3 style={{ color: 'var(--blue)', marginBottom: '12px' }}>SM-2</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1.6 }}>
            Algoritmo de repetição espaçada como Anki. Revisões no momento certo para fixar no memorize longo prazo.
          </p>
        </div>

        <div style={{
          background: 'var(--bg-card)',
          border: '3px solid var(--yellow)',
          borderRadius: 'var(--radius)',
          padding: '24px',
          textAlign: 'center',
          boxShadow: 'var(--shadow)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📊</div>
          <h3 style={{ color: 'var(--yellow)', marginBottom: '12px' }}>Estatísticas</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1.6 }}>
            Acompanhe seu progresso, sequências e cartas aprendidas. Nunca perca o ritmo!
          </p>
        </div>
      </div>

      {/* How it works */}
      <div style={{
        maxWidth: '800px',
        margin: '40px auto 60px',
        padding: '32px 20px',
        background: 'var(--bg-card)',
        border: '3px solid var(--border)',
        borderRadius: 'var(--radius)',
        boxShadow: 'var(--shadow)'
      }}>
        <h2 style={{ textAlign: 'center', color: 'var(--blue)', marginBottom: '24px', fontSize: '28px' }}>
          Como funciona
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%',
              background: 'var(--pink)', color: 'white', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontWeight: 900, fontSize: '18px', flexShrink: 0
            }}>1</div>
            <div>
              <h3 style={{ color: 'var(--yellow)', marginBottom: '4px' }}>Crie sua conta</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1.6 }}>
                Cadastre-se com seu email em segundos. Sem complicação.
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%',
              background: 'var(--blue)', color: 'white', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontWeight: 900, fontSize: '18px', flexShrink: 0
            }}>2</div>
            <div>
              <h3 style={{ color: 'var(--yellow)', marginBottom: '4px' }}>Crie um baralho</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1.6 }}>
                Monte baralhos personalizados ou use o baralho padrão com as 78 cartas.
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%',
              background: 'var(--green)', color: '#0d0d2b', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontWeight: 900, fontSize: '18px', flexShrink: 0
            }}>3</div>
            <div>
              <h3 style={{ color: 'var(--yellow)', marginBottom: '4px' }}>Estude e repita</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1.6 }}>
                Revise as cartas pelo algoritmo SM-2. Avalie seu conhecimento (1-5) e o sistema agenda as próximas revisões.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
