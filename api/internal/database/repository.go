package database

import (
	"database/sql"
	"log"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/jamile-dev/lets-tarot/api/internal/models"
	"github.com/jamile-dev/lets-tarot/api/internal/services"
)

var seedOnce sync.Once

func SeedCards(db *sql.DB) error {
	var count int
	err := db.QueryRow("SELECT COUNT(*) FROM cards").Scan(&count)
	if err != nil {
		return err
	}
	if count > 0 {
		log.Println("Cards already seeded, skipping")
		return nil
	}

	cards := models.DefaultCards()
	for _, c := range cards {
		_, err := db.Exec(`
			INSERT INTO cards (id, name_pt, name_short, type, suit, value_int, meaning_up_pt, meaning_rev_pt, desc_pt, image_url)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		`, c.ID, c.NamePT, c.NameShort, c.Type, c.Suit, c.ValueInt, c.MeaningUpPT, c.MeaningRevPT, c.DescPT, c.ImageURL)
		if err != nil {
			return err
		}
	}

	log.Printf("Seeded %d tarot cards", len(cards))
	return nil
}

func SeedCardsOnce(db *sql.DB) {
	seedOnce.Do(func() {
		if err := SeedCards(db); err != nil {
			log.Printf("Card seeding error: %v", err)
		}
	})
}

// User operations

func CreateUser(db *sql.DB, email, passwordHash string) (*models.User, error) {
	user := &models.User{}
	err := db.QueryRow(
		`INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at`,
		email, passwordHash,
	).Scan(&user.ID, &user.Email, &user.CreatedAt)
	return user, err
}

func GetUserByEmail(db *sql.DB, email string) (*models.User, error) {
	user := &models.User{}
	err := db.QueryRow(
		`SELECT id, email, password_hash, created_at FROM users WHERE email = $1`,
		email,
	).Scan(&user.ID, &user.Email, &user.PasswordHash, &user.CreatedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return user, err
}

func GetUserByID(db *sql.DB, id uuid.UUID) (*models.User, error) {
	user := &models.User{}
	err := db.QueryRow(
		`SELECT id, email, created_at FROM users WHERE id = $1`,
		id,
	).Scan(&user.ID, &user.Email, &user.CreatedAt)
	return user, err
}

// Deck operations

func CreateDeck(db *sql.DB, userID uuid.UUID, name, desc string, isDefault bool) (*models.Deck, error) {
	deck := &models.Deck{}
	err := db.QueryRow(
		`INSERT INTO decks (user_id, name, description, is_default) VALUES ($1, $2, $3, $4)
		 RETURNING id, user_id, name, description, is_default, created_at`,
		userID, name, desc, isDefault,
	).Scan(&deck.ID, &deck.UserID, &deck.Name, &deck.Description, &deck.IsDefault, &deck.CreatedAt)
	return deck, err
}

func GetDecksByUser(db *sql.DB, userID uuid.UUID) ([]models.Deck, error) {
	rows, err := db.Query(
		`SELECT id, user_id, name, description, is_default, created_at, updated_at
		 FROM decks WHERE user_id = $1 ORDER BY created_at DESC`,
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var decks []models.Deck
	for rows.Next() {
		var d models.Deck
		if err := rows.Scan(&d.ID, &d.UserID, &d.Name, &d.Description, &d.IsDefault, &d.CreatedAt, &d.UpdatedAt); err != nil {
			return nil, err
		}
		decks = append(decks, d)
	}
	return decks, rows.Err()
}

func GetDeckByID(db *sql.DB, id uuid.UUID) (*models.Deck, error) {
	deck := &models.Deck{}
	err := db.QueryRow(
		`SELECT id, user_id, name, description, is_default, created_at, updated_at
		 FROM decks WHERE id = $1`,
		id,
	).Scan(&deck.ID, &deck.UserID, &deck.Name, &deck.Description, &deck.IsDefault, &deck.CreatedAt, &deck.UpdatedAt)
	return deck, err
}

func UpdateDeck(db *sql.DB, id uuid.UUID, name, desc string) (*models.Deck, error) {
	deck := &models.Deck{}
	err := db.QueryRow(
		`UPDATE decks SET name = $2, description = $3, updated_at = NOW()
		 WHERE id = $1
		 RETURNING id, user_id, name, description, is_default, created_at, updated_at`,
		id, name, desc,
	).Scan(&deck.ID, &deck.UserID, &deck.Name, &deck.Description, &deck.IsDefault, &deck.CreatedAt, &deck.UpdatedAt)
	return deck, err
}

func DeleteDeck(db *sql.DB, id uuid.UUID) error {
	_, err := db.Exec(`DELETE FROM decks WHERE id = $1`, id)
	return err
}

func AddCardToDeck(db *sql.DB, deckID uuid.UUID, cardID string) error {
	_, err := db.Exec(
		`INSERT INTO deck_cards (deck_id, card_id) VALUES ($1, $2)
		 ON CONFLICT (deck_id, card_id) DO NOTHING`,
		deckID, cardID,
	)
	return err
}

func RemoveCardFromDeck(db *sql.DB, deckID uuid.UUID, cardID string) error {
	_, err := db.Exec(
		`DELETE FROM deck_cards WHERE deck_id = $1 AND card_id = $2`,
		deckID, cardID,
	)
	return err
}

func GetDeckCards(db *sql.DB, deckID uuid.UUID) ([]models.Card, error) {
	rows, err := db.Query(`
		SELECT c.id, c.name_pt, c.name_short, c.type, c.suit, c.value_int,
		       c.meaning_up_pt, c.meaning_rev_pt, c.desc_pt, c.image_url
		FROM cards c
		JOIN deck_cards dc ON c.id = dc.card_id
		WHERE dc.deck_id = $1
		ORDER BY
			CASE WHEN c.type = 'major' THEN 0 ELSE 1 END,
			c.value_int,
			c.suit
	`, deckID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var cards []models.Card
	for rows.Next() {
		var c models.Card
		if err := rows.Scan(&c.ID, &c.NamePT, &c.NameShort, &c.Type, &c.Suit, &c.ValueInt,
			&c.MeaningUpPT, &c.MeaningRevPT, &c.DescPT, &c.ImageURL); err != nil {
			return nil, err
		}
		cards = append(cards, c)
	}
	return cards, rows.Err()
}

// Review operations (spaced repetition)

func CreateReview(db *sql.DB, r *models.Review) error {
	_, err := db.Exec(`
		INSERT INTO reviews (user_id, card_id, deck_id, rating, notes, next_review_at, interval_days, ease_factor)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`, r.UserID, r.CardID, r.DeckID, r.Rating, r.Notes, r.NextReviewAt, r.IntervalDays, r.EaseFactor)
	return err
}

func GetDueCards(db *sql.DB, userID uuid.UUID, deckID *uuid.UUID, limit int) ([]models.ReviewCard, error) {
	var args []interface{}
	args = append(args, userID)

	query := `
		SELECT r.card_id, c.name_pt, c.name_short, c.type, c.suit, c.value_int,
		       c.meaning_up_pt, c.meaning_rev_pt, c.desc_pt, c.image_url,
		       r.rating, r.notes, r.reviewed_at, r.next_review_at,
		       r.interval_days, r.ease_factor, r.deck_id
		FROM reviews r
		JOIN cards c ON r.card_id = c.id
		WHERE r.user_id = $1 AND r.next_review_at <= NOW()
	`
	paramCount := 1

	if deckID != nil {
		paramCount++
		args = append(args, *deckID)
		query += ` AND r.deck_id = $` + itoa(paramCount)
	}

	paramCount++
	args = append(args, limit)
	query += ` ORDER BY r.next_review_at ASC LIMIT $` + itoa(paramCount)

	rows, err := db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var reviews []models.ReviewCard
	for rows.Next() {
		var rc models.ReviewCard
		var deckIDStr sql.NullString
		if err := rows.Scan(&rc.Card.ID, &rc.Card.NamePT, &rc.Card.NameShort, &rc.Card.Type,
			&rc.Card.Suit, &rc.Card.ValueInt, &rc.Card.MeaningUpPT, &rc.Card.MeaningRevPT,
			&rc.Card.DescPT, &rc.Card.ImageURL, &rc.Rating, &rc.Notes, &rc.ReviewedAt,
			&rc.NextReviewAt, &rc.IntervalDays, &rc.EaseFactor, &deckIDStr); err != nil {
			return nil, err
		}
		if deckIDStr.Valid {
			u, _ := uuid.Parse(deckIDStr.String)
			rc.DeckID = &u
		}
		reviews = append(reviews, rc)
	}
	return reviews, rows.Err()
}

func GetReviewHistory(db *sql.DB, userID uuid.UUID, limit, offset int) ([]models.ReviewCard, error) {
	rows, err := db.Query(`
		SELECT r.card_id, c.name_pt, c.name_short, c.type, c.suit, c.value_int,
		       c.meaning_up_pt, c.meaning_rev_pt, c.desc_pt, c.image_url,
		       r.rating, r.notes, r.reviewed_at, r.next_review_at,
		       r.interval_days, r.ease_factor, r.deck_id
		FROM reviews r
		JOIN cards c ON r.card_id = c.id
		WHERE r.user_id = $1
		ORDER BY r.reviewed_at DESC
		LIMIT $2 OFFSET $3
	`, userID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var reviews []models.ReviewCard
	for rows.Next() {
		var rc models.ReviewCard
		var deckIDStr sql.NullString
		if err := rows.Scan(&rc.Card.ID, &rc.Card.NamePT, &rc.Card.NameShort, &rc.Card.Type,
			&rc.Card.Suit, &rc.Card.ValueInt, &rc.Card.MeaningUpPT, &rc.Card.MeaningRevPT,
			&rc.Card.DescPT, &rc.Card.ImageURL, &rc.Rating, &rc.Notes, &rc.ReviewedAt,
			&rc.NextReviewAt, &rc.IntervalDays, &rc.EaseFactor, &deckIDStr); err != nil {
			return nil, err
		}
		if deckIDStr.Valid {
			u, _ := uuid.Parse(deckIDStr.String)
			rc.DeckID = &u
		}
		reviews = append(reviews, rc)
	}
	return reviews, rows.Err()
}

func GetReviewCount(db *sql.DB, userID uuid.UUID) (int, error) {
	var count int
	err := db.QueryRow(`SELECT COUNT(*) FROM reviews WHERE user_id = $1`, userID).Scan(&count)
	return count, err
}

func GetDueCount(db *sql.DB, userID uuid.UUID) (int, error) {
	var count int
	err := db.QueryRow(`SELECT COUNT(*) FROM reviews WHERE user_id = $1 AND next_review_at <= NOW()`, userID).Scan(&count)
	return count, err
}

func GetTodayReviewCount(db *sql.DB, userID uuid.UUID) (int, error) {
	var count int
	err := db.QueryRow(`SELECT COUNT(*) FROM reviews WHERE user_id = $1 AND DATE(reviewed_at) = CURRENT_DATE`, userID).Scan(&count)
	return count, err
}

func GetStreak(db *sql.DB, userID uuid.UUID) (int, error) {
	rows, err := db.Query(`
		SELECT DATE(reviewed_at) as day, COUNT(*) as cnt
		FROM reviews
		WHERE user_id = $1
		GROUP BY DATE(reviewed_at)
		ORDER BY day DESC
	`, userID)
	if err != nil {
		return 0, err
	}
	defer rows.Close()

	streak := 0
	var prevDate string
	first := true

	for rows.Next() {
		var day string
		var cnt int
		if err := rows.Scan(&day, &cnt); err != nil {
			return 0, err
		}
		if first {
			if cnt > 0 {
				streak = 1
			}
			first = false
			prevDate = day
			continue
		}
		// Check if consecutive day
		prev, _ := time.Parse("2006-01-02", prevDate)
		cur, _ := time.Parse("2006-01-02", day)
		diff := int(cur.Sub(prev).Hours() / 24)
		if diff == 1 {
			streak++
			prevDate = day
		} else {
			break
		}
	}

	return streak, nil
}

func GetCardReviewStats(db *sql.DB, userID uuid.UUID) (map[string]int, error) {
	rows, err := db.Query(`
		SELECT card_id, COUNT(*) as review_count, AVG(rating) as avg_rating
		FROM reviews
		WHERE user_id = $1
		GROUP BY card_id
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	stats := make(map[string]int)
	for rows.Next() {
		var cardID string
		var count int
		var avg float64
		if err := rows.Scan(&cardID, &count, &avg); err != nil {
			return nil, err
		}
		stats[cardID] = count
	}
	return stats, rows.Err()
}

// Card operations

func GetCardByID(db *sql.DB, id string) (*models.Card, error) {
	c := &models.Card{}
	err := db.QueryRow(`
		SELECT id, name_pt, name_short, type, suit, value_int,
		       meaning_up_pt, meaning_rev_pt, desc_pt, image_url
		FROM cards WHERE id = $1
	`, id).Scan(&c.ID, &c.NamePT, &c.NameShort, &c.Type, &c.Suit, &c.ValueInt,
		&c.MeaningUpPT, &c.MeaningRevPT, &c.DescPT, &c.ImageURL)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return c, err
}

func GetAllCards(db *sql.DB) ([]models.Card, error) {
	return filterCards(db, "", 0, 78)
}

func GetMajorArcana(db *sql.DB) ([]models.Card, error) {
	return filterCards(db, "major", 0, 22)
}

func GetMinorArcana(db *sql.DB) ([]models.Card, error) {
	return filterCards(db, "minor", 0, 56)
}

func filterCards(db *sql.DB, cardType string, offset, limit int) ([]models.Card, error) {
	var rows *sql.Rows
	var err error

	query := `
		SELECT id, name_pt, name_short, type, suit, value_int,
		       meaning_up_pt, meaning_rev_pt, desc_pt, image_url
		FROM cards WHERE 1=1
	`
	args := []interface{}{}

	if cardType != "" {
		query += ` AND type = $` + itoa(len(args)+1)
		args = append(args, cardType)
	}

	query += ` ORDER BY
		CASE WHEN type = 'major' THEN 0 ELSE 1 END,
		value_int,
		suit
		LIMIT $` + itoa(len(args)+1) + ` OFFSET $` + itoa(len(args)+2)
	args = append(args, limit, offset)

	rows, err = db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var cards []models.Card
	for rows.Next() {
		var c models.Card
		if err := rows.Scan(&c.ID, &c.NamePT, &c.NameShort, &c.Type, &c.Suit, &c.ValueInt,
			&c.MeaningUpPT, &c.MeaningRevPT, &c.DescPT, &c.ImageURL); err != nil {
			return nil, err
		}
		cards = append(cards, c)
	}
	return cards, rows.Err()
}

func GetSuits(db *sql.DB) ([]models.Suit, error) {
	rows, err := db.Query(`
		SELECT DISTINCT suit,
			CASE suit
				WHEN 'wands' THEN 'Paus'
				WHEN 'cups' THEN 'Copas'
				WHEN 'swords' THEN 'Espadas'
				WHEN 'pentacles' THEN 'Ouros'
			END as name_pt
		FROM cards
		WHERE type = 'minor' AND suit IS NOT NULL
		ORDER BY suit
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var suits []models.Suit
	for rows.Next() {
		var s models.Suit
		if err := rows.Scan(&s.NameEN, &s.NamePT); err != nil {
			return nil, err
		}
		suits = append(suits, s)
	}
	return suits, rows.Err()
}

func SearchCards(db *sql.DB, query string) ([]models.Card, error) {
	searchTerm := "%" + query + "%"
	rows, err := db.Query(`
		SELECT id, name_pt, name_short, type, suit, value_int,
		       meaning_up_pt, meaning_rev_pt, desc_pt, image_url
		FROM cards
		WHERE LOWER(name_pt) LIKE LOWER($1)
		   OR LOWER(meaning_up_pt) LIKE LOWER($1)
		   OR LOWER(meaning_rev_pt) LIKE LOWER($1)
		   OR LOWER(desc_pt) LIKE LOWER($1)
		ORDER BY
			CASE WHEN type = 'major' THEN 0 ELSE 1 END,
			value_int,
			suit
	`, searchTerm)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var cards []models.Card
	for rows.Next() {
		var c models.Card
		if err := rows.Scan(&c.ID, &c.NamePT, &c.NameShort, &c.Type, &c.Suit, &c.ValueInt,
			&c.MeaningUpPT, &c.MeaningRevPT, &c.DescPT, &c.ImageURL); err != nil {
			return nil, err
		}
		cards = append(cards, c)
	}
	return cards, rows.Err()
}

func GetRandomCards(db *sql.DB, count int) ([]models.Card, error) {
	rows, err := db.Query(`
		SELECT id, name_pt, name_short, type, suit, value_int,
		       meaning_up_pt, meaning_rev_pt, desc_pt, image_url
		FROM cards ORDER BY RANDOM() LIMIT $1
	`, count)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var cards []models.Card
	for rows.Next() {
		var c models.Card
		if err := rows.Scan(&c.ID, &c.NamePT, &c.NameShort, &c.Type, &c.Suit, &c.ValueInt,
			&c.MeaningUpPT, &c.MeaningRevPT, &c.DescPT, &c.ImageURL); err != nil {
			return nil, err
		}
		cards = append(cards, c)
	}
	return cards, rows.Err()
}

// Apply SM-2 after a review
func ApplySpacedRepetition(review *models.Review) {
	intervalDays, easeFactor := services.ComputeSpacedRepetition(
		review.Rating,
		review.IntervalDays,
		review.EaseFactor,
	)
	review.IntervalDays = intervalDays
	review.EaseFactor = easeFactor
	review.NextReviewAt = time.Now().AddDate(0, 0, intervalDays)
}

// itoa converts int to string without fmt import
func itoa(i int) string {
	if i == 0 {
		return "0"
	}
	result := ""
	for i > 0 {
		result = string(rune('0'+i%10)) + result
		i /= 10
	}
	return result
}
