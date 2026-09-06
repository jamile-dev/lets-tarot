import { Card, Suit, Deck, ReviewCard, Review, AuthUser, UserStats } from '../types'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080'

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}))
    throw new ApiError(response.status, errorBody.error || 'Request failed')
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

export const api = {
  // Cards
  getCards: () => request<{ cards: Card[] }>('/api/v1/cards'),
  getCard: (id: string) => request<Card>(`/api/v1/cards/${id}`),
  getRandomCards: (n: number = 1) => request<{ cards: Card[] }>(`/api/v1/cards/random?n=${n}`),
  searchCards: (q: string) => request<{ cards: Card[] }>(`/api/v1/cards/search?q=${encodeURIComponent(q)}`),
  getMajorArcana: () => request<{ cards: Card[] }>('/api/v1/cards/major'),
  getMinorArcana: () => request<{ cards: Card[] }>('/api/v1/cards/minor'),
  getSuits: () => request<{ suits: Suit[] }>('/api/v1/suits'),

  // Auth
  register: (email: string, password: string) =>
    request<{ user: AuthUser; token: string }>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),
  login: (email: string, password: string) =>
    request<{ user: AuthUser; token: string }>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),
  getMe: () => request<AuthUser>('/api/v1/auth/me'),

  // Decks
  getDecks: () => request<{ decks: Deck[] }>('/api/v1/users/me/decks'),
  createDeck: (name: string, description?: string) =>
    request<Deck>('/api/v1/users/me/decks', {
      method: 'POST',
      body: JSON.stringify({ name, description })
    }),
  getDeck: (id: string) => request<{ deck: Deck; cards: Card[] }>(`/api/v1/users/me/decks/${id}`),
  updateDeck: (id: string, name: string, description?: string) =>
    request<Deck>(`/api/v1/users/me/decks/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name, description })
    }),
  deleteDeck: (id: string) =>
    request<void>(`/api/v1/users/me/decks/${id}`, { method: 'DELETE' }),
  addCardToDeck: (deckId: string, cardId: string) =>
    request<void>(`/api/v1/users/me/decks/${deckId}/cards`, {
      method: 'POST',
      body: JSON.stringify({ card_id: cardId })
    }),
  removeCardFromDeck: (deckId: string, cardId: string) =>
    request<void>(`/api/v1/users/me/decks/${deckId}/cards/${cardId}`, {
      method: 'DELETE'
    }),

  // Reviews
  getReviews: () => request<{ reviews: ReviewCard[] }>('/api/v1/users/me/reviews'),
  createReview: (cardId: string, rating: number, notes?: string, deckId?: string) =>
    request<{ review: Review }>('/api/v1/users/me/reviews', {
      method: 'POST',
      body: JSON.stringify({ card_id: cardId, rating, notes, deck_id: deckId })
    }),
  getDueReviews: (deckId?: string) => {
    const params = deckId ? `?deck_id=${deckId}` : ''
    return request<{ reviews: ReviewCard[] }>(`/api/v1/users/me/reviews/due${params}`)
  },
  getReviewHistory: (limit?: number, offset?: number) => {
    const params = new URLSearchParams()
    if (limit) params.set('limit', limit.toString())
    if (offset) params.set('offset', offset.toString())
    return request<{ reviews: ReviewCard[] }>(`/api/v1/users/me/reviews/history?${params}`)
  },

  // Stats
  getStats: () => request<UserStats>('/api/v1/users/me/stats')
}

export { ApiError }
