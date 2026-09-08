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
  const progressPercent = cardsToStudy.length > 0
    ? ((currentIndex / cardsToStudy.length) * 100)
    : 0

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

  const handleFlipBack = useCallback(() => {
    setFlipped(false)
    setSelectedRating(0)
    setShowRating(false)
  }, [])

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
        <p>Preparando sessão de estudo...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="study-container">
        <div className="page-header">
          <h1>Estudar 🎴</h1>
        </div>
        <div className="empty-state" role="alert">
          <h3>⚠️ {error}</h3>
          <div className="study-footer">
            <button
              className="btn btn-primary btn-lg"
              onClick={() => navigate('/library')}
              aria-label="Voltar à biblioteca"
            >
              Voltar à Biblioteca
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (cardsToStudy.length === 0) {
    return (
      <div className="study-container">
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
              aria-label="Criar primeiro baralho"
            >
              ✨ Criar baralho
            </button>
            <button
              className="btn btn-outline"
              onClick={() => navigate('/library')}
              aria-label="Ir para biblioteca"
            >
              📚 Biblioteca
            </button>
          </div>
        </div>
      </div>
    )
  }

  const card = currentCard!.card

  return (
    <div className="study-container">
      {/* Progress Header */}
      <div className="study-progress-header">
        <div className="progress-left">
          <span className="progress mono" aria-label={`Progresso: ${progress}`}>
            {progress}
          </span>
          <span className="progress-label" aria-hidden="true">de cartas estudadas</span>
        </div>
        <div className="progress-right">
          <span className="card-name" aria-label={`Carta atual: ${card.name_pt}`}>
            {card.name_pt}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="progress-bar">
        <div
          className="progress-bar-fill"
          style={{ width: `${progressPercent}%` }}
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progresso da sessão"
        />
      </div>

      {/* Card Flip Area */}
      <div className="study-card-back-wrapper">
        <div
          className={`study-card-flip ${flipped ? 'flipped' : ''}`}
        >
          {/* Card Back (Question) */}
          <div
            className={`study-card study-card-back ${flipped ? 'flipped-away' : ''}`}
            onClick={handleFlip}
            role="button"
            tabIndex={0}
            aria-label="Clique ou pressione Enter para revelar a carta"
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handleFlip()
              }
            }}
          >
            <div className="card-back-content">
              <span className="card-back-pattern" aria-hidden="true">🎴</span>
              <h3 className="card-back-title">{card.name_pt}</h3>
              <span className="tap-hint">
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
          </div>

          {/* Card Front (Answer) */}
          <div className="study-card study-card-front">
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

            {/* Card Info Grid — inspired by Labyrinthos/ Trusted Tarot layout */}
            <div className="card-info-grid">
              <div className="card-info-section">
                <h4>Sentido direto ⬆️</h4>
                <p className="meaning-text">{card.meaning_up_pt}</p>
                {card.keywords_up && (
                  <div className="card-keywords">
                    <strong>Palavras-chave:</strong> {card.keywords_up}
                  </div>
                )}
              </div>

              <div className="card-info-section">
                <h4>Sentido reverso ⬇️</h4>
                <p className="meaning-rev-text">{card.meaning_rev_pt}</p>
                {card.keywords_rev && (
                  <div className="card-keywords card-keywords-rev">
                    <strong>Palavras-chave:</strong> {card.keywords_rev}
                  </div>
                )}
              </div>

              {/* Metadata section — astrology, element, crystal */}
              {(card.astrology || card.element || card.crystal) && (
                <div className="card-metadata">
                  <h4>Meta • Info</h4>
                  <div className="metadata-grid">
                    {card.element && (
                      <div className="metadata-item">
                        <span className="metadata-label">Elemento</span>
                        <span className="metadata-value">{card.element}</span>
                      </div>
                    )}
                    {card.astrology && (
                      <div className="metadata-item">
                        <span className="metadata-label">Astrologia</span>
                        <span className="metadata-value">{card.astrology}</span>
                      </div>
                    )}
                    {card.crystal && (
                      <div className="metadata-item">
                        <span className="metadata-label">Pedra</span>
                        <span className="metadata-value">{card.crystal}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {card.desc_pt && (
                <div className="card-description-section">
                  <h4>Descrição</h4>
                  <p className="card-description-text">{card.desc_pt}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Rating Section */}
      {showRating && (
        <div
          className="rating-section"
          role="group"
          aria-label="Avalie seu conhecimento desta carta"
        >
          <p className="rating-prompt">Quão bem você lembra o significado?</p>
          <div className="rating-dots">
            {[1, 2, 3, 4, 5].map(r => (
              <button
                key={r}
                className={`rating-dot r${r} ${selectedRating === r ? 'active' : ''}`}
                onClick={() => handleRating(r)}
                aria-label={`Avaliação ${r}: ${r === 1 ? 'Não lembro' : r === 2 ? 'Fraco' : r === 3 ? 'Dificuldade' : r === 4 ? 'Bom' : 'Perfeito'}`}
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

      {/* Session Stats */}
      {sessionCount > 0 && (
        <div className="study-stats">
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--gold)' }}>{sessionCount}</div>
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

      {/* Study Footer */}
      <div className="study-footer">
        <button
          className="btn btn-outline btn-lg"
          onClick={handleFlipBack}
          disabled={flipped}
          aria-label="Mostrar verso da carta"
        >
          🔄 Repescar carta
        </button>
        <button
          className="btn btn-primary btn-lg"
          onClick={handleRestart}
          aria-label="Nova sessão de estudo"
        >
          🔄 Nova sessão
        </button>
        <button
          className="btn btn-secondary btn-lg"
          onClick={() => navigate('/library')}
          aria-label="Voltar para a biblioteca"
        >
          📚 Biblioteca
        </button>
        <button
          className="btn btn-outline btn-lg"
          onClick={() => navigate('/stats')}
          aria-label="Ver estatísticas"
        >
          📊 Estatísticas
        </button>
      </div>
    </div>
  )
}
