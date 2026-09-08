import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Card, Deck } from '../types'
import { api } from '../services/api'

interface LibraryPageProps {
  onSelectDeck?: (deckId: string) => void
}

export default function LibraryPage({ onSelectDeck }: LibraryPageProps) {
  const navigate = useNavigate()
  const [cards, setCards] = useState<Card[]>([])
  const [decks, setDecks] = useState<Deck[]>([])
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null)
  const [deckCards, setDeckCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<'all' | 'major' | 'minor' | 'deck'>('all')
  const [searchResults, setSearchResults] = useState<Card[] | null>(null)
  const [showSearch, setShowSearch] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [cardsRes, decksRes] = await Promise.all([
        api.getCards(),
        api.getDecks()
      ])
      setCards(cardsRes.cards || [])
      setDecks(decksRes.decks || [])
    } catch (err) {
      console.error('Failed to load data:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleDeckSelect(deckId: string) {
    setSelectedDeckId(deckId)
    setActiveFilter('deck')
    try {
      const res = await api.getDeck(deckId)
      setDeckCards(res.cards || [])
    } catch (err) {
      console.error('Failed to load deck:', err)
      setDeckCards([])
    }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!searchQuery.trim()) {
      setSearchResults(null)
      return
    }
    try {
      const res = await api.searchCards(searchQuery)
      setSearchResults(res.cards || [])
      setShowSearch(true)
    } catch (err) {
      console.error('Search failed:', err)
    }
  }

  function clearSearch() {
    setShowSearch(false)
    setSearchResults(null)
    setSearchQuery('')
    setActiveFilter('all')
  }

  const displayCards = showSearch && searchResults ? searchResults :
    activeFilter === 'deck' ? deckCards :
    activeFilter === 'major' ? cards.filter(c => c.type === 'major') :
    activeFilter === 'minor' ? cards.filter(c => c.type === 'minor') :
    cards

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loader"></div>
        <p>Carregando baralho...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <h1>Biblioteca 📚</h1>
        <p>
          Explore todas as 78 cartas do baralho Rider-Waite-Smith. Pesquise por nome ou significado.
        </p>
        {decks.length === 0 && (
          <div className="create-deck-cta">
            <p>
              <strong>Você ainda não tem baralhos criados.</strong> Crie um para começar a estudar com repetição espaçada.
            </p>
            <div className="cta-buttons">
              <button
                className="btn btn-primary"
                onClick={async () => {
                  const name = prompt('Nome do seu primeiro baralho:', 'Meu Tarot')
                  if (name) {
                    try {
                      await api.createDeck(name, 'Baralho de estudo')
                      await loadData()
                    } catch (err) {
                      console.error(err)
                    }
                  }
                }}
              >
                ✨ Criar meu primeiro baralho
              </button>
              <button
                className="btn btn-outline"
                onClick={() => navigate('/study')}
              >
                🃏 Estudar cartas aleatórias
              </button>
            </div>
          </div>
        )}
        {decks.length > 0 && (
          <button
            className="btn btn-primary"
            style={{ marginTop: '16px', alignSelf: 'flex-start' }}
            onClick={async () => {
              const name = prompt('Nome do baralho:')
              if (name) {
                try {
                  await api.createDeck(name, '')
                  loadData()
                } catch {}
              }
            }}
          >
            + Novo baralho
          </button>
        )}
      </div>

      <div className="search-bar">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Pesquisar cartas..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className={showSearch ? 'input-focused' : ''}
            aria-label="Pesquisar cartas"
          />
          <span className="search-icon">🔍</span>
        </form>

        <div className="filter-chips">
          <FilterChip
            label="Todas"
            active={activeFilter === 'all' && !showSearch}
            onClick={() => { setActiveFilter('all'); clearSearch() }}
          />
          <FilterChip
            label="Arcana Maior"
            active={activeFilter === 'major'}
            onClick={() => { setActiveFilter('major'); clearSearch() }}
          />
          <FilterChip
            label="Arcana Menor"
            active={activeFilter === 'minor'}
            onClick={() => { setActiveFilter('minor'); clearSearch() }}
          />
          {decks.length > 0 && (
            <FilterChip
              label="Meus baralhos"
              active={activeFilter === 'deck'}
              onClick={() => { setActiveFilter('deck'); clearSearch() }}
            />
          )}
        </div>
      </div>

      {activeFilter === 'deck' && (
        <div className="deck-selector">
          <label>Escolha um baralho</label>
          {decks.length === 0 ? (
            <div className="empty-state">
              <p>Você ainda não criou nenhum baralho.</p>
              <button
                className="btn btn-primary"
                onClick={async () => {
                  const name = prompt('Nome do seu primeiro baralho:', 'Meu Tarot')
                  if (name) {
                    try {
                      await api.createDeck(name, 'Baralho personalizado')
                      loadData()
                    } catch (err) {
                      console.error(err)
                    }
                  }
                }}
              >
                ✨ Criar meu primeiro baralho
              </button>
              <p className="hint-text">
                Crie baralhos personalizados para estudar com repetição espaçada (SM-2).
              </p>
            </div>
          ) : (
            <div className="deck-chips">
              {decks.map(deck => (
                <button
                  key={deck.id}
                  className={`btn ${selectedDeckId === deck.id ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => handleDeckSelect(deck.id)}
                >
                  {deck.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="card-count-badge">
        <span className="badge-text">
          {displayCards.length} carta{displayCards.length !== 1 ? 's' : ''}
          {activeFilter === 'major' && ' (Arcana Maior)'}
          {activeFilter === 'minor' && ' (Arcana Menor)'}
          {activeFilter === 'deck' && ` (${decks.find(d => d.id === selectedDeckId)?.name || 'Baralho'})`}
          {showSearch && ' (pesquisa)'}
        </span>
        {showSearch && (
          <button className="btn btn-sm btn-outline" onClick={clearSearch}>
            Limpar ×
          </button>
        )}
      </div>

      <CardGrid
        cards={displayCards}
        onCardClick={() => {
          if (onSelectDeck && selectedDeckId) {
            onSelectDeck(selectedDeckId)
          }
        }}
      />

      {!loading && displayCards.length === 0 && (
        <div className="empty-state">
          <h3>🎴 Nenhuma carta encontrada</h3>
          <p>Tente ajustar sua pesquisa ou filtro.</p>
        </div>
      )}
    </div>
  )
}

function FilterChip({ label, active, onClick, color }: { label: string; active: boolean; onClick: () => void; color?: string }) {
  return (
    <button
      className={`btn btn-sm ${active ? 'btn-primary' : 'btn-outline'}`}
      onClick={onClick}
      style={color ? { background: color, borderColor: color } : {}}
    >
      {label}
    </button>
  )
}

interface CardGridProps {
  cards: Card[]
  onCardClick?: () => void
}

function CardGrid({ cards, onCardClick }: CardGridProps) {
  if (cards.length === 0) {
    return (
      <div className="empty-state">
        <h3>🎴 Nenhuma carta encontrada</h3>
        <p>Tente ajustar sua pesquisa ou filtro.</p>
      </div>
    )
  }
  return (
    <div className="card-grid">
      {cards.map(card => (
        <CardItem key={card.id} card={card} onCardClick={onCardClick} />
      ))}
    </div>
  )
}

interface CardItemProps {
  card: Card
  onCardClick?: () => void
}

function CardItem({ card, onCardClick }: CardItemProps) {
  const [imageLoaded, setImageLoaded] = useState(false)

  return (
    <div
      className="neobrutal-card"
      onClick={onCardClick}
      role="button"
      tabIndex={0}
      aria-label={`Ver detalhes da carta ${card.name_pt}`}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onCardClick?.()
        }
      }}
    >
      <div className="card-img-container">
        {!imageLoaded && <div className="card-img-placeholder" />}
        <img
          src={`${import.meta.env.VITE_CDN_BASE_URL || 'https://cdn.jsdelivr.net/gh/jamile-dev/lets-tarot@v0.1.0/cards'}/${card.id}.jpg`}
          alt={card.name_pt}
          className={imageLoaded ? '' : 'loading'}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageLoaded(true)}
        />
        {!imageLoaded && <span className="card-placeholder-icon">🎴</span>}
      </div>
      <div className="card-body">
        <div className="card-name-row">
          <h3 className="card-name">{card.name_pt}</h3>
          <span className={`tag ${card.type === 'major' ? 'tag-major' : 'tag-minor'}`}>
            {card.type === 'major' ? 'AM' : 'AMen'}
          </span>
        </div>
        <p className="mono card-desc">
          {card.id} · {card.meaning_up_pt.substring(0, 40)}...
        </p>
      </div>
    </div>
  )
}
