// Package router provides a reusable Gin engine factory for both
// standard HTTP server and Vercel serverless function deployments.
package router

import (
	"database/sql"
	"log"
	"os"

	"github.com/gin-gonic/gin"
	_ "github.com/lib/pq"

	"github.com/jamile-dev/lets-tarot/api/internal/config"
	"github.com/jamile-dev/lets-tarot/api/internal/database"
	"github.com/jamile-dev/lets-tarot/api/internal/handlers"
	"github.com/jamile-dev/lets-tarot/api/internal/middleware"
)

// InitEnv initializes environment variables with sensible defaults.
// This must be called before InitRouter in serverless environments
// where env vars might not be pre-set.
func InitEnv() {
	if os.Getenv("JWT_SECRET") == "" {
		os.Setenv("JWT_SECRET", "dev-secret-change-in-production-32ch!")
	}
	if os.Getenv("CLIENT_URL") == "" {
		os.Setenv("CLIENT_URL", "http://localhost:5173")
	}
	if os.Getenv("CDN_BASE_URL") == "" {
		os.Setenv("CDN_BASE_URL", "https://cdn.jsdelivr.net/gh/jamile-dev/lets-tarot@v0.1.0/cards")
	}
}

// NewRouter creates and returns a configured Gin engine.
// In serverless mode, db may be nil (demo mode with in-memory card data).
// The db is cached globally for warm starts.
var cachedDB *sql.DB
var cachedRouter *gin.Engine
var cachedJWTSecret string

// InitRouter initializes the Gin router with all routes and middleware.
// Uses global caching for serverless warm starts.
func InitRouter() *gin.Engine {
	if cachedRouter != nil {
		return cachedRouter
	}

	InitEnv()
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// Initialize DB connection (non-fatal)
	if cfg.DSN != "" && cachedDB == nil {
		cachedDB, err = database.NewPostgresConnection(cfg.DSN)
		if err != nil {
			log.Printf("Database connection failed (non-fatal): %v", err)
			cachedDB = nil
		} else {
			if err := database.Migrate(cachedDB); err != nil {
				log.Printf("Migrations failed: %v", err)
			}
			database.SeedCardsOnce(cachedDB)
		}
	}

	cachedJWTSecret = cfg.JWTSecret
	gin.SetMode(gin.ReleaseMode)

	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(middleware.Logger())

	// Set db and jwt_secret in context for handlers
	r.Use(func(c *gin.Context) {
		if cachedDB != nil {
			c.Set("db", cachedDB)
		} else {
			c.Set("db", nil)
		}
		c.Set("jwt_secret", cachedJWTSecret)
		c.Next()
	})

	r.Use(middleware.CORS(cfg.ClientURL))

	r.GET("/health", handlers.HealthCheck)

	v1 := r.Group("/api/v1")
	{
		cards := v1.Group("/cards")
		{
			cards.GET("", handlers.GetAllCards)
			cards.GET("/random", handlers.GetRandomCards)
			cards.GET("/search", handlers.SearchCards)
			cards.GET("/:id", handlers.GetCardByID)
			cards.GET("/major", handlers.GetMajorArcana)
			cards.GET("/minor", handlers.GetMinorArcana)
		}

		v1.GET("/suits", handlers.GetSuits)

		// TODO: /suits/:suit route not yet implemented

		auth := v1.Group("/auth")
		{
			auth.POST("/register", handlers.Register)
			auth.POST("/login", handlers.Login)
			auth.GET("/me", middleware.AuthRequired(cachedJWTSecret), handlers.GetCurrentUser)
			auth.POST("/refresh", handlers.RefreshToken)
		}

		protected := v1.Group("")
		protected.Use(middleware.AuthRequired(cachedJWTSecret))
		{
			protected.GET("/users/me/decks", handlers.GetUserDecks)
			protected.POST("/users/me/decks", handlers.CreateDeck)
			protected.GET("/users/me/decks/:id", handlers.GetDeckByID)
			protected.PUT("/users/me/decks/:id", handlers.UpdateDeck)
			protected.DELETE("/users/me/decks/:id", handlers.DeleteDeck)
			protected.POST("/users/me/decks/:id/cards", handlers.AddCardToDeck)
			protected.DELETE("/users/me/decks/:id/cards/:cardId", handlers.RemoveCardFromDeck)
			protected.GET("/users/me/decks/:id/cards", handlers.GetDeckCards)
			protected.GET("/users/me/reviews", handlers.GetUserReviews)
			protected.POST("/users/me/reviews", handlers.CreateReview)
			protected.GET("/users/me/reviews/due", handlers.GetDueReviews)
			protected.GET("/users/me/reviews/history", handlers.GetReviewHistory)
			protected.GET("/users/me/stats", handlers.GetUserStats)
		}
	}

	cachedRouter = r
	return r
}
