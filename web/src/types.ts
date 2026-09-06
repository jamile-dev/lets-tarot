export interface Card {
  id: string
  name_pt: string
  name_short: string
  type: 'major' | 'minor'
  suit?: string
  value_int: number
  meaning_up_pt: string
  meaning_rev_pt: string
  desc_pt?: string
  image_url: string
}

export interface Suit {
  name_en: string
  name_pt: string
}

export interface Deck {
  id: string
  user_id: string
  name: string
  description?: string
  is_default: boolean
  created_at: string
  updated_at?: string
}

export interface Review {
  id: string
  user_id: string
  card_id: string
  deck_id?: string
  rating: number
  notes?: string
  reviewed_at: string
  next_review_at: string
  interval_days: number
  ease_factor: number
}

export interface ReviewCard {
  card: Card
  rating: number
  notes?: string
  reviewed_at: string
  next_review_at: string
  interval_days: number
  ease_factor: number
  deck_id?: string
}

export interface UserStats {
  total_reviews: number
  due_today: number
  reviews_today: number
  current_streak: number
  longest_streak: number
  cards_learnt: number
  average_rating: number
}

export interface AuthUser {
  id: string
  email: string
  created_at: string
}
