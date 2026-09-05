package database

import (
	"database/sql"
	"fmt"
	"log"

	_ "github.com/lib/pq"
)

func NewPostgresDB(dsn string) (*sql.DB, error) {
	if dsn == "" {
		return nil, fmt.Errorf("DATABASE_URL is not set")
	}

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)

	log.Println("Database connection established")
	return db, nil
}

func Migrate(db *sql.DB) error {
	migrations := []string{
		`CREATE TABLE IF NOT EXISTS users (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			email VARCHAR(255) UNIQUE NOT NULL,
			password_hash VARCHAR(255) NOT NULL,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
		)`,
		`CREATE TABLE IF NOT EXISTS cards (
			id VARCHAR(10) PRIMARY KEY,
			name_pt VARCHAR(255) NOT NULL,
			name_short VARCHAR(10) NOT NULL,
			type VARCHAR(20) NOT NULL CHECK (type IN ('major', 'minor')),
			suit VARCHAR(20),
			value_int INTEGER,
			meaning_up_pt TEXT NOT NULL,
			meaning_rev_pt TEXT NOT NULL,
			desc_pt TEXT,
			image_url TEXT,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
		)`,
		`CREATE TABLE IF NOT EXISTS decks (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			name VARCHAR(255) NOT NULL,
			description TEXT,
			is_default BOOLEAN DEFAULT FALSE,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
		)`,
		`CREATE TABLE IF NOT EXISTS deck_cards (
			deck_id UUID REFERENCES decks(id) ON DELETE CASCADE,
			card_id VARCHAR(10) REFERENCES cards(id) ON DELETE CASCADE,
			added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			PRIMARY KEY (deck_id, card_id)
		)`,
		`CREATE TABLE IF NOT EXISTS reviews (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			card_id VARCHAR(10) NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
			deck_id UUID REFERENCES decks(id) ON DELETE CASCADE,
			rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
			notes TEXT,
			reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			next_review_at TIMESTAMP WITH TIME ZONE,
			interval_days INTEGER DEFAULT 1,
			ease_factor FLOAT DEFAULT 2.5,
			PRIMARY KEY (user_id, card_id, deck_id, reviewed_at)
		)`,
		`CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id)`,
		`CREATE INDEX IF NOT EXISTS idx_reviews_next_review ON reviews(next_review_at)`,
		`CREATE INDEX IF NOT EXISTS idx_reviews_card_id ON reviews(card_id)`,
		`CREATE INDEX IF NOT EXISTS idx_deck_cards_deck ON deck_cards(deck_id)`,
		`CREATE INDEX IF NOT EXISTS idx_decks_user ON decks(user_id)`,
	}

	for _, m := range migrations {
		if _, err := db.Exec(m); err != nil {
			return fmt.Errorf("migration failed: %w", err)
		}
	}

	log.Println("Database migrations completed")
	return nil
}
