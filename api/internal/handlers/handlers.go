package handlers

import (
	"database/sql"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jamile-dev/lets-tarot/api/internal/database"
	"github.com/jamile-dev/lets-tarot/api/internal/middleware"
	"github.com/jamile-dev/lets-tarot/api/internal/models"
	"golang.org/x/crypto/bcrypt"
)

// getDB extracts the database connection from context safely.
// Returns the *sql.DB or nil if not available.
func getDB(c *gin.Context) *sql.DB {
	dbVal, exists := c.Get("db")
	if !exists {
		return nil
	}
	db, ok := dbVal.(*sql.DB)
	if !ok || db == nil {
		return nil
	}
	return db
}

// requireDB checks that the DB is available and returns an error if not.
func requireDB(c *gin.Context) (*sql.DB, bool) {
	db := getDB(c)
	if db == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "database not available"})
		return nil, false
	}
	return db, true
}

// getUserID extrai o UUID do contexto de forma segura.
func getUserID(c *gin.Context) (uuid.UUID, bool) {
	v, exists := c.Get("user_id")
	if !exists {
		return uuid.Nil, false
	}
	switch val := v.(type) {
	case uuid.UUID:
		return val, val != uuid.Nil
	case string:
		id, err := uuid.Parse(val)
		return id, err == nil && id != uuid.Nil
	default:
		return uuid.Nil, false
	}
}

// ---- Cards (públicos) ----

func GetAllCards(c *gin.Context) {
	db, ok := requireDB(c)
	if !ok {
		return
	}
	cards, err := database.GetAllCards(db)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"cards": cards})
}

func GetCardByID(c *gin.Context) {
	db, ok := requireDB(c)
	if !ok {
		return
	}
	id := c.Param("id")
	card, err := database.GetCardByID(db, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if card == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "card not found"})
		return
	}
	c.JSON(http.StatusOK, card)
}

func GetRandomCards(c *gin.Context) {
	db, ok := requireDB(c)
	if !ok {
		return
	}
	count := 1
	if n := c.Query("n"); n != "" {
		if parsed, err := strconv.Atoi(n); err == nil && parsed > 0 && parsed <= 78 {
			count = parsed
		}
	}
	cards, err := database.GetRandomCards(db, count)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"cards": cards})
}

func SearchCards(c *gin.Context) {
	db, ok := requireDB(c)
	if !ok {
		return
	}
	q := c.Query("q")
	if q == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "query parameter 'q' is required"})
		return
	}
	cards, err := database.SearchCards(db, q)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"cards": cards})
}

func GetMajorArcana(c *gin.Context) {
	db, ok := requireDB(c)
	if !ok {
		return
	}
	cards, err := database.GetMajorArcana(db)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"cards": cards})
}

func GetMinorArcana(c *gin.Context) {
	db, ok := requireDB(c)
	if !ok {
		return
	}
	cards, err := database.GetMinorArcana(db)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"cards": cards})
}

func GetSuits(c *gin.Context) {
	db, ok := requireDB(c)
	if !ok {
		return
	}
	suits, err := database.GetSuits(db)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"suits": suits})
}

// ---- Auth ----

func Register(c *gin.Context) {
	db, ok := requireDB(c)
	if !ok {
		return
	}
	var input models.RegisterInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to hash password"})
		return
	}

	user, err := database.CreateUser(db, input.Email, string(hash))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create user"})
		return
	}

	userUUID, _ := uuid.Parse(user.ID.String())
	token, err := middleware.GenerateToken(userUUID, user.Email, c.GetString("jwt_secret"))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate token"})
		return
	}

	c.JSON(http.StatusCreated, models.AuthResponse{
		User: models.UserResponse{
			ID:        user.ID,
			Email:     user.Email,
			CreatedAt: user.CreatedAt,
		},
		Token: token,
	})
}

func Login(c *gin.Context) {
	db, ok := requireDB(c)
	if !ok {
		return
	}
	var input models.LoginInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := database.GetUserByEmail(db, input.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database error"})
		return
	}
	if user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(input.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}

	userUUID, _ := uuid.Parse(user.ID.String())
	token, err := middleware.GenerateToken(userUUID, user.Email, c.GetString("jwt_secret"))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, models.AuthResponse{
		User: models.UserResponse{
			ID:        user.ID,
			Email:     user.Email,
			CreatedAt: user.CreatedAt,
		},
		Token: token,
	})
}

func GetCurrentUser(c *gin.Context) {
	db, ok := requireDB(c)
	if !ok {
		return
	}
	userID, ok := getUserID(c)
	if !ok {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid session"})
		return
	}
	user, err := database.GetUserByID(db, userID)
	if err != nil || user == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}
	c.JSON(http.StatusOK, models.UserResponse{
		ID:        user.ID,
		Email:     user.Email,
		CreatedAt: user.CreatedAt,
	})
}

func RefreshToken(c *gin.Context) {
	var input struct {
		Token string `json:"token"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if input.Token == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "token is required"})
		return
	}

	claims := &middleware.Claims{}
	token, err := middleware.ValidateToken(input.Token, c.GetString("jwt_secret"))
	if err != nil || token == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid or expired token"})
		return
	}

	newToken, err := middleware.GenerateToken(claims.UserID, claims.Email, c.GetString("jwt_secret"))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to refresh token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token": newToken,
		"user": gin.H{
			"id":    claims.UserID.String(),
			"email": claims.Email,
		},
	})
}

// ---- Decks (protegidos) ----

func GetUserDecks(c *gin.Context) {
	db, ok := requireDB(c)
	if !ok {
		return
	}
	userID, ok := getUserID(c)
	if !ok {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid session"})
		return
	}
	decks, err := database.GetDecksByUser(db, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"decks": decks})
}

func CreateDeck(c *gin.Context) {
	db, ok := requireDB(c)
	if !ok {
		return
	}
	userID, ok := getUserID(c)
	if !ok {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid session"})
		return
	}
	var input models.CreateDeckInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	deck, err := database.CreateDeck(db, userID, input.Name, input.Description, false)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, deck)
}

func GetDeckByID(c *gin.Context) {
	db, ok := requireDB(c)
	if !ok {
		return
	}
	userID, ok := getUserID(c)
	if !ok {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid session"})
		return
	}
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid deck id"})
		return
	}

	deck, err := database.GetDeckByID(db, id)
	if err != nil || deck == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "deck not found"})
		return
	}
	if deck.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "access denied"})
		return
	}

	cards, err := database.GetDeckCards(db, id)
	if err != nil {
		cards = []models.Card{}
	}

	c.JSON(http.StatusOK, gin.H{"deck": deck, "cards": cards})
}

func UpdateDeck(c *gin.Context) {
	db, ok := requireDB(c)
	if !ok {
		return
	}
	userID, ok := getUserID(c)
	if !ok {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid session"})
		return
	}
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid deck id"})
		return
	}

	var input models.UpdateDeckInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	deck, err := database.UpdateDeck(db, id, input.Name, input.Description)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if deck.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "access denied"})
		return
	}
	c.JSON(http.StatusOK, deck)
}

func DeleteDeck(c *gin.Context) {
	db, ok := requireDB(c)
	if !ok {
		return
	}
	userID, ok := getUserID(c)
	if !ok {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid session"})
		return
	}
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid deck id"})
		return
	}

	deck, err := database.GetDeckByID(db, id)
	if err != nil || deck == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "deck not found"})
		return
	}
	if deck.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "access denied"})
		return
	}

	if err := database.DeleteDeck(db, id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}

// ---- Deck cards ----

func AddCardToDeck(c *gin.Context) {
	db, ok := requireDB(c)
	if !ok {
		return
	}
	userID, ok := getUserID(c)
	if !ok {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid session"})
		return
	}
	deckIDStr := c.Param("id")
	deckID, err := uuid.Parse(deckIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid deck id"})
		return
	}

	var input models.AddCardInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// card_id é string (ex: "ar01"), não UUID
	deck, err := database.GetDeckByID(db, deckID)
	if err != nil || deck == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "deck not found"})
		return
	}
	if deck.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "access denied"})
		return
	}

	if err := database.AddCardToDeck(db, deckID, input.CardID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusCreated)
}

func RemoveCardFromDeck(c *gin.Context) {
	db, ok := requireDB(c)
	if !ok {
		return
	}
	userID, ok := getUserID(c)
	if !ok {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid session"})
		return
	}
	deckIDStr := c.Param("id")
	deckID, err := uuid.Parse(deckIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid deck id"})
		return
	}

	cardIDStr := c.Param("cardId")
	// card_id é string (ex: "ar01"), não UUID
	deck, err := database.GetDeckByID(db, deckID)
	if err != nil || deck == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "deck not found"})
		return
	}
	if deck.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "access denied"})
		return
	}

	if err := database.RemoveCardFromDeck(db, deckID, cardIDStr); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}

func GetDeckCards(c *gin.Context) {
	db, ok := requireDB(c)
	if !ok {
		return
	}
	userID, ok := getUserID(c)
	if !ok {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid session"})
		return
	}
	deckIDStr := c.Param("id")
	deckID, err := uuid.Parse(deckIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid deck id"})
		return
	}

	deck, err := database.GetDeckByID(db, deckID)
	if err != nil || deck == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "deck not found"})
		return
	}
	if deck.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "access denied"})
		return
	}

	cards, err := database.GetDeckCards(db, deckID)
	if err != nil {
		cards = []models.Card{}
	}
	c.JSON(http.StatusOK, gin.H{"cards": cards})
}

// ---- Reviews ----

func GetUserReviews(c *gin.Context) {
	db, ok := requireDB(c)
	if !ok {
		return
	}
	userID, ok := getUserID(c)
	if !ok {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid session"})
		return
	}
	reviews, err := database.GetReviewHistory(db, userID, 100, 0)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"reviews": reviews})
}

func CreateReview(c *gin.Context) {
	db, ok := requireDB(c)
	if !ok {
		return
	}
	userID, ok := getUserID(c)
	if !ok {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid session"})
		return
	}
	var input models.CreateReviewInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Verify card exists
	card, err := database.GetCardByID(db, input.CardID)
	if err != nil || card == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "card not found"})
		return
	}

	// Get deck_id
	var deckID *uuid.UUID
	if input.DeckID != nil {
		deckIDU, err := uuid.Parse(*input.DeckID)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid deck id"})
			return
		}
		deck, err := database.GetDeckByID(db, deckIDU)
		if err != nil || deck == nil || deck.UserID != userID {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid deck"})
			return
		}
		deckID = &deckIDU
	}

	// Get previous review for this card to compute SM-2
	var prevInterval, prevEase interface{}
	row := db.QueryRow(`SELECT interval_days, ease_factor FROM reviews WHERE user_id = $1 AND card_id = $2 ORDER BY reviewed_at DESC LIMIT 1`, userID, input.CardID)
	row.Scan(&prevInterval, &prevEase)

	intervalDays, easeFactor := models.ComputeSpacedRepetition(input.Rating, 0, 2.5)
	if pi, ok := prevInterval.(int); ok {
		intervalDays, easeFactor = models.ComputeSpacedRepetition(input.Rating, pi, 2.5)
	} else if pi, ok := prevInterval.(float64); ok {
		intervalDays, easeFactor = models.ComputeSpacedRepetition(input.Rating, int(pi), 2.5)
	}

	now := time.Now()
	nextReview := now.AddDate(0, 0, intervalDays)

	review := &models.Review{
		UserID:       userID,
		CardID:       input.CardID,
		DeckID:       deckID,
		Rating:       input.Rating,
		Notes:        input.Notes,
		ReviewedAt:   now,
		NextReviewAt: nextReview,
		IntervalDays: intervalDays,
		EaseFactor:   easeFactor,
	}

	if err := database.CreateReview(db, review); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"review": review,
	})
}

func GetDueReviews(c *gin.Context) {
	db, ok := requireDB(c)
	if !ok {
		return
	}
	userID, ok := getUserID(c)
	if !ok {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid session"})
		return
	}

	var deckID *uuid.UUID
	if deckIDStr := c.Query("deck_id"); deckIDStr != "" {
		deckIDU, err := uuid.Parse(deckIDStr)
		if err == nil {
			deckID = &deckIDU
		}
	}

	limit := 50
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 {
			limit = parsed
		}
	}

	reviews, err := database.GetDueCards(db, userID, deckID, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"reviews": reviews})
}

func GetReviewHistory(c *gin.Context) {
	db, ok := requireDB(c)
	if !ok {
		return
	}
	userID, ok := getUserID(c)
	if !ok {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid session"})
		return
	}

	limit := 100
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil {
			limit = parsed
		}
	}

	offset := 0
	if o := c.Query("offset"); o != "" {
		if parsed, err := strconv.Atoi(o); err == nil {
			offset = parsed
		}
	}

	reviews, err := database.GetReviewHistory(db, userID, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"reviews": reviews})
}

// ---- Stats ----

func GetUserStats(c *gin.Context) {
	db, ok := requireDB(c)
	if !ok {
		return
	}
	userID, ok := getUserID(c)
	if !ok {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid session"})
		return
	}

	total, _ := database.GetReviewCount(db, userID)
	due, _ := database.GetDueCount(db, userID)
	today, _ := database.GetTodayReviewCount(db, userID)
	streak, _ := database.GetStreak(db, userID)

	cardsLearnt := 0
	row := db.QueryRow(`SELECT COUNT(DISTINCT card_id) FROM reviews WHERE user_id = $1`, userID)
	row.Scan(&cardsLearnt)

	avgRating := 0.0
	row2 := db.QueryRow(`SELECT AVG(rating) FROM reviews WHERE user_id = $1`, userID)
	row2.Scan(&avgRating)

	c.JSON(http.StatusOK, models.UserStats{
		TotalReviews:  total,
		DueToday:      due,
		ReviewsToday:  today,
		CurrentStreak: streak,
		CardsLearnt:   cardsLearnt,
		AverageRating: avgRating,
	})
}
