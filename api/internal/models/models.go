package models

import (
	"time"

	"github.com/google/uuid"
)

type User struct {
	ID           uuid.UUID `json:"id"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type Deck struct {
	ID          uuid.UUID `json:"id"`
	UserID      uuid.UUID `json:"user_id"`
	Name        string    `json:"name"`
	Description string    `json:"description,omitempty"`
	IsDefault   bool      `json:"is_default"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type Review struct {
	ID           uuid.UUID `json:"id"`
	UserID       uuid.UUID `json:"user_id"`
	CardID       string    `json:"card_id"`
	DeckID       *uuid.UUID `json:"deck_id,omitempty"`
	Rating       int       `json:"rating"`
	Notes        string    `json:"notes,omitempty"`
	ReviewedAt   time.Time `json:"reviewed_at"`
	NextReviewAt time.Time `json:"next_review_at"`
	IntervalDays int       `json:"interval_days"`
	EaseFactor   float64   `json:"ease_factor"`
}

type ReviewCard struct {
	Card        Card      `json:"card"`
	Rating      int       `json:"rating"`
	Notes       string    `json:"notes,omitempty"`
	ReviewedAt  time.Time `json:"reviewed_at"`
	NextReviewAt time.Time `json:"next_review_at"`
	IntervalDays int      `json:"interval_days"`
	EaseFactor  float64   `json:"ease_factor"`
	DeckID      *uuid.UUID `json:"deck_id,omitempty"`
}

type Suit struct {
	NameEN string `json:"name_en"`
	NamePT string `json:"name_pt"`
}

type UserStats struct {
	TotalReviews  int     `json:"total_reviews"`
	DueToday      int     `json:"due_today"`
	ReviewsToday  int     `json:"reviews_today"`
	CurrentStreak int     `json:"current_streak"`
	LongestStreak int     `json:"longest_streak"`
	CardsLearnt   int     `json:"cards_learnt"`
	AverageRating float64 `json:"average_rating"`
}

type RegisterInput struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
}

type LoginInput struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type CreateDeckInput struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
}

type UpdateDeckInput struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
}

type AddCardInput struct {
	CardID string `json:"card_id" binding:"required"`
}

type CreateReviewInput struct {
	CardID string  `json:"card_id" binding:"required"`
	DeckID *string `json:"deck_id"`
	Rating int     `json:"rating" binding:"required,min=1,max=5"`
	Notes  string  `json:"notes"`
}

type UserResponse struct {
	ID        uuid.UUID `json:"id"`
	Email     string    `json:"email"`
	CreatedAt time.Time `json:"created_at"`
}

type AuthResponse struct {
	User  UserResponse `json:"user"`
	Token string       `json:"token"`
}
