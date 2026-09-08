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
        <p>Preparando sessão...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <div className="page-header">
          <h1>Estudar 🎴</h1>
        </div>
        <div className="empty-state">
          <h3>⚠️ {error}</h3>
          <button className="btn btn-primary" onClick={() => navigate('/library')}>
            Voltar à Biblioteca
          </button>
        </div>
      </div>
    )
  }

  if (cardsToStudy.length === 0) {
    return (
      <div>
        <div className="page-header">
          <h1>Estudar 🎴</h1>
          <p>
            {deckId ? 'Sem cartas pendentes neste baralho.' : 'Nenhum baralho selecionado.'}
          </p>
        </div>
        <div className="empty-state">
          <h3>📚 Nenhum baralho para estudar</h3>
          <p>Crie um baralho na biblioteca para começar a revisar.</p>
          <div className="study-footer">
            <button
              className="btn btn-primary btn-lg"
              onClick={async () => {
                const name = prompt('Nome do seu primeiro baralho:', 'Meu Tarot')
                if (name) {
                  await api.createDeck(name, 'Baralho personalizado')
                  navigate('/library')
                }
              }}
            >
              ✨ Criar baralho
            </button>
            <button className="btn btn-outline" onClick={() => navigate('/library')}>📚 Biblioteca</button>
            <button className="btn btn-outline" onClick={handleRestart}>🔄 Recarregar</button>
          </div>
        </div>
      </div>
    )
  }

  const card = currentCard!.card

  return (
    <div className="study-container">
      <div className="study-progress-header">
        <span className="card-name">{card.name_pt}</span>
        <span className="progress mono">{progress}</span>
      </div>

      <div className="progress-bar">
        <div
          className="progress-bar-fill"
          style={{
            width: `${(currentIndex / cardsToStudy.length) * 100}%`
          }}
        />
      </div>

      <div className="study-card-back-wrapper" style={{ perspective: '1000px', marginBottom: '32px' }}>
        <div
          className="study-card-flip"
          style={{
            transformStyle: 'preserve-3d',
            transition: 'transform 0.5s ease',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
          }}
        >
          <div
            className="study-card study-card-back"
            style={{ opacity: flipped ? 0 : 1 }}
            onClick={handleFlip}
          >
            <span className="card-back-pattern">🎴</span>
            <h3>{card.name_pt}</h3>
            <span
              className="tap-hint"
            >
              🔄 Toque para revelar
            </span>
            <div className="card-placeholder-container">
              <img
                src={`${import.meta.env.VITE_CDN_BASE_URL || 'https://cdn.jsdelivr.net/gh/jamile-dev/lets-tarot@v0.1.0/cards'}/${card.id}.jpg`}
                alt={card.name_pt}
                className="card-placeholder-img"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            </div>
          </div>

          <div
            className="study-card study-card-front"
            style={{ transform: 'rotateY(180deg)' }}
          >
            <div className="card-header">
              <h2>{card.name_pt}</h2>
              <span className={`tag ${card.type === 'major' ? 'tag-major' : 'tag-minor'}`}>
                {card.type === 'major' ? 'Arcano Maior' : `Arcano Menor · ${card.suit || ''}`}
              </span>
            </div>
            <img
              src={`${import.meta.env.VITE_CDN_BASE_URL || 'https://cdn.jsdelivr.net/gh/jamile-dev/lets-tarot@v0.1.0/cards'}/${card.id}.jpg`}
              alt={card.name_pt}
              className="study-card-img"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
            <div className="meaning">
              <strong>⬆️ Sentido direto</strong>
              {card.meaning_up_pt}
            </div>
            <div className="meaning-rev">
              <strong>⬇️ Sentido reverso</strong>
              {card.meaning_rev_pt}
            </div>
            {card.desc_pt && (
              <p className="card-description">
                {card.desc_pt.substring(0, 200)}{card.desc_pt.length > 200 && '...'}
              </p>
            )}
          </div>
        </div>
      </div>

      {showRating && (
        <div className="rating-section">
          <p className="rating-prompt">Quão bem você lembra o significado?</p>
          <div className="rating-dots">
            {[1, 2, 3, 4, 5].map(r => (
              <button
                key={r}
                className={`rating-dot r${r} ${selectedRating === r ? 'active' : ''}`}
                onClick={() => handleRating(r)}
              >
                {r}
              </button>
            ))}
          </div>
          <div className="rating-legend">
            <span>1 = Não lembro</span>
            <span>3 = Dificuldade</span>
            <span>5 = Perfeito</span>
          </div>
        </div>
      )}

      {sessionCount > 0 && (
        <div className="study-stats">
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--green)' }}>{sessionCount}</div>
            <div className="stat-label">revisado(s)</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--blue)' }}>
              {cardsToStudy.length - currentIndex - 1}
            </div>
            <div className="stat-label">restantes</div>
          </div>
        </div>
      )}

      <div className="study-footer">
        <button className="btn btn-primary btn-lg" onClick={handleRestart}>🔄 Nova sessão</button>
        <button className="btn btn-secondary btn-lg" onClick={() => navigate('/library')}>📚 Biblioteca</button>
        <button className="btn btn-outline btn-lg" onClick={() => navigate('/stats')}>📊 Estatísticas</button>
      </div>
    </div>
  )
}
