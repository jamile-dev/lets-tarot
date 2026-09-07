package database

import (
	"database/sql"
	"strings"

	_ "github.com/lib/pq"
)

func NewPostgresConnection(dsn string) (*sql.DB, error) {
	// Ensure sslmode=require is set (needed for Render PostgreSQL)
	if !strings.Contains(dsn, "sslmode=") {
		if strings.Contains(dsn, "?") {
			dsn = dsn + "&sslmode=require"
		} else {
			dsn = dsn + "?sslmode=require"
		}
	}
	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, err
	}
	if err := db.Ping(); err != nil {
		db.Close()
		return nil, err
	}
	return db, nil
}

func Migrate(db *sql.DB) error {
	migrations := []string{
		// Users table
		`CREATE TABLE IF NOT EXISTS users (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			email VARCHAR(255) UNIQUE NOT NULL,
			password_hash VARCHAR(255) NOT NULL,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
		)`,
		// Cards table
		`CREATE TABLE IF NOT EXISTS cards (
			id VARCHAR(50) PRIMARY KEY,
			name_pt VARCHAR(255) NOT NULL,
			name_short VARCHAR(50) NOT NULL,
			type VARCHAR(20) NOT NULL,
			suit VARCHAR(50),
			value_int INTEGER,
			meaning_up_pt TEXT,
			meaning_rev_pt TEXT,
			desc_pt TEXT,
			image_url TEXT,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
		)`,
		// Decks table
		`CREATE TABLE IF NOT EXISTS decks (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			user_id UUID REFERENCES users(id) ON DELETE CASCADE,
			name VARCHAR(255) NOT NULL,
			description TEXT,
			is_default BOOLEAN DEFAULT FALSE,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			UNIQUE(user_id, name)
		)`,
		// Deck cards table
		`CREATE TABLE IF NOT EXISTS deck_cards (
			deck_id UUID REFERENCES decks(id) ON DELETE CASCADE,
			card_id VARCHAR(50) REFERENCES cards(id) ON DELETE CASCADE,
			PRIMARY KEY (deck_id, card_id)
		)`,
		// Reviews table
		`CREATE TABLE IF NOT EXISTS reviews (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			user_id UUID REFERENCES users(id) ON DELETE CASCADE,
			card_id VARCHAR(50) REFERENCES cards(id) ON DELETE CASCADE,
			deck_id UUID REFERENCES decks(id) ON DELETE SET NULL,
			rating INTEGER NOT NULL,
			notes TEXT,
			reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			next_review_at TIMESTAMP WITH TIME ZONE NOT NULL,
			interval_days INTEGER NOT NULL,
			ease_factor DECIMAL(5,4) NOT NULL
		)`,
		// Indexes
		`CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id)`,
		`CREATE INDEX IF NOT EXISTS idx_reviews_next_review_at ON reviews(next_review_at)`,
		`CREATE INDEX IF NOT EXISTS idx_reviews_card_id ON reviews(card_id)`,
		`CREATE INDEX IF NOT EXISTS idx_deck_cards_deck_id ON deck_cards(deck_id)`,
		`CREATE INDEX IF NOT EXISTS idx_deck_cards_card_id ON deck_cards(card_id)`,
		`CREATE INDEX IF NOT EXISTS idx_cards_type ON cards(type)`,
		`CREATE INDEX IF NOT EXISTS idx_cards_suit ON cards(suit)`,
	}

	for _, migration := range migrations {
		if _, err := db.Exec(migration); err != nil {
			return err
		}
	}

	return nil
}
