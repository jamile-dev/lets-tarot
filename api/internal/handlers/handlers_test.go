package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// testUserID é um UUID fixo usado nos testes para injetar no contexto.
const testUserID = "11111111-1111-1111-1111-111111111111"

// setupTestEngine cria um engine de teste com rotas e um middleware que
// injeta um user_id fake para handlers protegidos.
func setupTestEngine() *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()

	// Middleware que injeta user_id + db (nil) no contexto para testes.
	r.Use(func(c *gin.Context) {
		c.Set("user_id", uuid.MustParse(testUserID))
		c.Set("db", nil)
		c.Next()
	})

	r.GET("/health", HealthCheck)
	r.GET("/api/v1/cards/search", SearchCards)
	r.POST("/api/v1/auth/register", Register)
	r.POST("/api/v1/auth/login", Login)
	r.POST("/api/v1/users/me/decks", CreateDeck)
	r.POST("/api/v1/users/me/reviews", CreateReview)
	return r
}

func TestHealthCheck_ReturnsOK(t *testing.T) {
	r := setupTestEngine()
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/health", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("status = %d, want 200", w.Code)
	}

	var resp map[string]interface{}
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to parse JSON: %v", err)
	}

	if resp["status"] != "ok" {
		t.Errorf("status = %v, want ok", resp["status"])
	}
	if resp["service"] != "lets-tarot-api" {
		t.Errorf("service = %v, want lets-tarot-api", resp["service"])
	}
	if _, ok := resp["timestamp"]; !ok {
		t.Error("missing timestamp")
	}
}

func TestSearchCards_MissingQueryParam(t *testing.T) {
	r := setupTestEngine()
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/cards/search", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("status = %d, want 400", w.Code)
	}

	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	if resp["error"] == "" {
		t.Error("error message empty")
	}
}

func TestSearchCards_EmptyQueryParam(t *testing.T) {
	r := setupTestEngine()
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/cards/search?q=", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("status = %d, want 400", w.Code)
	}
}

func TestRegister_MissingFields(t *testing.T) {
	r := setupTestEngine()
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/auth/register", bytes.NewBufferString(`{}`))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("status = %d, want 400", w.Code)
	}
}

func TestRegister_InvalidEmail(t *testing.T) {
	r := setupTestEngine()
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/auth/register", bytes.NewBufferString(`{"email": "invalid", "password": "password123"}`))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("status = %d, want 400", w.Code)
	}
}

func TestRegister_ShortPassword(t *testing.T) {
	r := setupTestEngine()
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/auth/register", bytes.NewBufferString(`{"email": "test@example.com", "password": "123"}`))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("status = %d, want 400", w.Code)
	}
}

func TestCreateDeck_MissingName(t *testing.T) {
	r := setupTestEngine()
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/users/me/decks", bytes.NewBufferString(`{}`))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("status = %d, want 400", w.Code)
	}
}

func TestCreateReview_BadJSON(t *testing.T) {
	r := setupTestEngine()
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/users/me/reviews", bytes.NewBufferString("not json"))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("status = %d, want 400", w.Code)
	}
}

func TestCreateReview_MissingCardID(t *testing.T) {
	r := setupTestEngine()
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/users/me/reviews", bytes.NewBufferString(`{"rating": 5}`))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("status = %d, want 400", w.Code)
	}
}

func TestCreateReview_RatingTooHigh(t *testing.T) {
	r := setupTestEngine()
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/users/me/reviews", bytes.NewBufferString(`{"card_id": "ar01", "rating": 6}`))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("status = %d, want 400 (rating > 5)", w.Code)
	}
}

func TestCreateReview_RatingTooSmall(t *testing.T) {
	r := setupTestEngine()
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/users/me/reviews", bytes.NewBufferString(`{"card_id": "ar01", "rating": 0}`))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("status = %d, want 400 (rating < 1)", w.Code)
	}
}

func TestCreateReview_NegativeRating(t *testing.T) {
	r := setupTestEngine()
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/users/me/reviews", bytes.NewBufferString(`{"card_id": "ar01", "rating": -1}`))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("status = %d, want 400 (rating negativo)", w.Code)
	}
}
