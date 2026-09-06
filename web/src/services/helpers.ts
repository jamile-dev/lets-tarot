import { Card, Suit } from '../types'

export function getCardImageUrl(card: Card): string {
  const cdnBase = import.meta.env.VITE_CDN_BASE_URL || 'https://cdn.jsdelivr.net/gh/jamile-dev/lets-tarot@main/cards'
  return `${cdnBase}/${card.id}.jpg`
}

export function getSuitIcon(suit: string | undefined): string {
  if (!suit) return '🎴' // Arcana Maior
  switch (suit) {
    case 'wands': return '🔥'
    case 'cups': return '🏆'
    case 'swords': return '⚔️'
    case 'pentacles': return '🪙'
    default: return '🎴'
  }
}

export function getSuitName(suit: string | undefined, suits: Suit[]): string {
  if (!suit) return 'Arcano Maior'
  const s = suits.find(s => s.name_en === suit)
  return s?.name_pt || suit
}

export function formatInterval(days: number): string {
  if (days === 0) return 'Agora'
  if (days === 1) return '1 dia'
  if (days < 30) return `${days} dias`
  if (days < 365) {
    const m = Math.floor(days / 30)
    return m === 1 ? '1 mês' : `${m} meses`
  }
  const y = Math.floor(days / 365)
  return y === 1 ? '1 ano' : `${y} anos`
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}
