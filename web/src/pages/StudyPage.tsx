import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api, ApiError } from '../services/api'
import type { Card, ReviewCard } from '../types'

function toReviewCard(card: Card, deckId?: string): ReviewCard {
  return {
    card,
    rating: 0,
    reviewed_at: '',
    next_review_at: '',
    interval_days: 0,
    ease_factor: 2.5,
    deck_id: deckId
  }
}

export default function StudyPage() {
  const { deckId } = useParams<{ deckId?: string }>()
  const navigate = useNavigate()

  const [queue, setQueue] = useState<ReviewCard[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [selectedRating, setSelectedRating] = useState(0)
  const [showRating, setShowRating] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sessionCount, setSessionCount] = useState(0)

  const cardsToStudy = queue
  const currentCard = cardsToStudy[currentIndex]
  const progress = cardsToStudy.length > 0
    ? `${currentIndex + 1} / ${cardsToStudy.length}`
    : '0 / 0'

  useEffect(() => {
    loadData()
  }, [deckId])

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      if (deckId) {
        const deckRes = await api.getDeck(deckId)
        const dueRes = await api.getDueReviews(deckId)
        const due: ReviewCard[] = dueRes.reviews || []
        const deckCards: Card[] = deckRes.cards || []

        if (due.length > 0) {
          setQueue(due)
        } else {
          const reviewedIds = new Set(due.map(r => r.card.id))
          const unreviewed = deckCards.filter(c => !reviewedIds.has(c.id))
          if (unreviewed.length > 0) {
            setQueue(unreviewed.map(c => toReviewCard(c, deckId)))
          } else {
            setQueue([])
          }
        }
        setCurrentIndex(0)
      } else {
        const randomRes = await api.getRandomCards(10)
        const cards: Card[] = randomRes.cards || []
        setQueue(cards.map(c => toReviewCard(c)))
        setCurrentIndex(0)
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao carregar')
    } finally {
      setLoading(false)
    }
  }

  const handleFlip = useCallback(() => {
    setFlipped(true)
    setShowRating(true)
  }, [])

  const handleRating = useCallback(async (rating: number) => {
    if (!currentCard) return
    setSelectedRating(rating)
    setShowRating(false)
    try {
      await api.createReview(
        currentCard.card.id,
        rating,
        undefined,
        currentCard.deck_id || undefined
      )
      setSessionCount(n => n + 1)
      setTimeout(() => {
        setFlipped(false)
        setSelectedRating(0)
        setShowRating(false)
        if (currentIndex < cardsToStudy.length - 1) {
          setCurrentIndex(i => i + 1)
        } else {
          setQueue([])
        }
      }, 500)
    } catch {
      setShowRating(true)
      setSelectedRating(0)
    }
  }, [currentCard, currentIndex, cardsToStudy.length])

  async function handleRestart() {
    setCurrentIndex(0)
    setFlipped(false)
    setSelectedRating(0)
    setShowRating(false)
    setSessionCount(0)
    await loadData()
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loader"></div>
        <p style={{ marginTop: '16px', color: 'var(--text-muted)' }}>Preparando sessão...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <div className="page-header"><h1>Estudiar 🎴</h1></div>
        <div className="empty-state" style={{ padding: '40px' }}>
          <h3 style={{ color: 'var(--red)' }}>⚠️ {error}</h3>
          <button className="btn btn-primary" onClick={() => navigate('/library')}>
            Voltar
          </button>
        </div>
      </div>
    )
  }

  if (cardsToStudy.length === 0) {
    return (
      <div>
        <div className="page-header">
          <h1>Estudiar 🎴</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '16px' }}>
            {deckId ? 'Sem cartas pendentes neste baralho.' : 'Nenhum baralho selecionado.'}
          </p>
        </div>
        <div className="empty-state" style={{ padding: '40px', textAlign: 'center' }}>
          <h3>📚 Nenhum baralho para estudar</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
            Crie um baralho na biblioteca para começar a revisar.
          </p>
          <button
            className="btn btn-primary btn-lg"
            onClick={() => {
              const name = prompt('Nome do seu primeiro baralho:', 'Meu Tarot')
              if (name) {
                api.createDeck(name, 'Baralho personalizado').then(() => {
                  navigate('/library')
                })
              }
            }}
          >
            ✨ Criar baralho
          </button>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '24px', flexWrap: 'wrap' }}>
            <button className="btn btn-outline" onClick={() => navigate('/library')}>📚 Biblioteca</button>
            <button className="btn btn-outline" onClick={handleRestart}>🔄 Recarregar</button>
          </div>
        </div>
      </div>
    )
  }

  const card = currentCard!.card

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '16px', padding: '12px 16px',
        background: 'var(--bg-card)', border: '2px solid var(--border)', borderRadius: 'var(--radius)'
      }}>
        <span style={{ fontWeight: 700, fontSize: '18px', color: 'var(--blue)' }}>
          {card.name_pt}
        </span>
        <span className="mono" style={{ color: 'var(--text-muted)' }}>{progress}</span>
      </div>

      <div style={{
        height: '6px', background: 'var(--bg-elevated)', borderRadius: '3px',
        overflow: 'hidden', marginBottom: '24px', border: '1px solid var(--border)'
      }}>
        <div style={{
          height: '100%',
          width: `${(currentIndex / cardsToStudy.length) * 100}%`,
          background: 'linear-gradient(90deg, var(--pink), var(--yellow))',
          transition: 'width 0.3s ease', borderRadius: '3px'
        }} />
      </div>

      <div style={{ perspective: '1000px', marginBottom: '32px' }}>
        <div style={{
          position: 'relative', width: '100%', minHeight: '400px',
          transformStyle: 'preserve-3d', transition: 'transform 0.5s ease',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
        }}>
          <div style={{
            position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
            border: flipped ? '3px solid var(--bg-elevated)' : '4px solid var(--yellow)',
            boxShadow: flipped ? 'none' : '8px 8px 0 var(--yellow)',
            cursor: flipped ? 'default' : 'pointer',
            opacity: flipped ? 0 : 1
          }} onClick={handleFlip}>
            <div style={{ textAlign: 'center', padding: '24px' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎴</div>
              <h3 style={{ fontSize: '22px', color: 'var(--yellow)', margin: '0 0 8px' }}>
                {card.name_pt}
              </h3>
              <div style={{
                color: 'var(--yellow)', fontSize: '14px', textTransform: 'uppercase',
                letterSpacing: '2px', fontWeight: 700, marginTop: '12px',
                animation: 'pulse 2s ease-in-out infinite'
              }}>
                🔄 Toque para revelar
              </div>
              <div style={{
                marginTop: '16px', width: '150px', height: '230px',
                border: '3px solid var(--border)', borderRadius: 'var(--radius)',
                overflow: 'hidden', background: 'var(--bg-elevated)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <img
                  src={`${import.meta.env.VITE_CDN_BASE_URL || 'https://cdn.jsdelivr.net/gh/jamile-dev/lets-tarot@v0.1.0/cards'}/${card.id}.jpg`}
                  alt={card.name_pt}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              </div>
            </div>
          </div>

          <div className="study-card-front" style={{
            position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            border: '4px solid var(--pink)',
            boxShadow: '8px 8px 0 var(--pink)',
            opacity: flipped ? 1 : 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <h2 style={{ fontSize: '24px', marginBottom: 0 }}>{card.name_pt}</h2>
              <span className={`tag ${card.type === 'major' ? 'tag-major' : 'tag-minor'}`} style={{ fontSize: '11px' }}>
                {card.type === 'major' ? 'Arcano Maior' : `Arcano Menor · ${card.suit || ''}`}
              </span>
            </div>
            <img
              src={`${import.meta.env.VITE_CDN_BASE_URL || 'https://cdn.jsdelivr.net/gh/jamile-dev/lets-tarot@v0.1.0/cards'}/${card.id}.jpg`}
              alt={card.name_pt}
              style={{ width: '160px', height: '260px', objectFit: 'cover', border: '2px solid var(--border)', borderRadius: '4px', marginBottom: '16px' }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
            <div className="meaning">
              <strong style={{ color: 'var(--yellow)', display: 'block', marginBottom: '4px', fontSize: '13px', textTransform: 'uppercase' }}>⬆️ Sentido direto</strong>
              {card.meaning_up_pt}
            </div>
            <div className="meaning-rev" style={{ marginTop: '12px' }}>
              <strong style={{ color: 'var(--blue)', display: 'block', marginBottom: '4px', fontSize: '13px', textTransform: 'uppercase' }}>⬇️ Sentido reverso</strong>
              {card.meaning_rev_pt}
            </div>
            {card.desc_pt && (
              <p style={{ fontSize: '13px', marginTop: '12px', padding: '12px', background: 'var(--bg-elevated)', borderLeft: '3px solid var(--text-muted)', fontStyle: 'italic' }}>
                {card.desc_pt.substring(0, 200)}{card.desc_pt.length > 200 && '...'}
              </p>
            )}
          </div>
        </div>
      </div>

      {showRating && (
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <p style={{ fontWeight: 700, textTransform: 'uppercase', color: 'var(--yellow)', marginBottom: '16px', fontSize: '14px', letterSpacing: '1px' }}>
            Quão bem você lembra o significado?
          </p>
          <div className="rating-dots">
            {[1, 2, 3, 4, 5].map(r => (
              <button key={r} className={`rating-dot r${r} ${selectedRating === r ? 'active' : ''}`} onClick={() => handleRating(r)}>
                {r}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
            <span style={{ color: 'var(--red)' }}>1 = Não lembro</span>
            <span style={{ color: 'var(--yellow)' }}>3 = Dificuldade</span>
            <span style={{ color: 'var(--blue)' }}>5 = Perfeito</span>
          </div>
        </div>
      )}

      {sessionCount > 0 && (
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '24px' }}>
          <div className="stat-card" style={{ padding: '16px', minWidth: '100px' }}>
            <div className="stat-value" style={{ fontSize: '28px', color: 'var(--green)' }}>{sessionCount}</div>
            <div className="stat-label">revisado(s)</div>
          </div>
          <div className="stat-card" style={{ padding: '16px', minWidth: '100px' }}>
            <div className="stat-value" style={{ fontSize: '28px', color: 'var(--blue)' }}>
              {cardsToStudy.length - currentIndex - 1}
            </div>
            <div className="stat-label">restantes</div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '32px', flexWrap: 'wrap' }}>
        <button className="btn btn-primary btn-lg" onClick={handleRestart}>🔄 Nova sessão</button>
        <button className="btn btn-secondary btn-lg" onClick={() => navigate('/library')}>📚 Biblioteca</button>
        <button className="btn btn-outline btn-lg" onClick={() => navigate('/stats')}>📊 Estatísticas</button>
      </div>
    </div>
  )
}
