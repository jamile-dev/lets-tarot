package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/jamile-dev/lets-tarot/api/internal/config"
	"github.com/jamile-dev/lets-tarot/api/internal/database"
	"github.com/jamile-dev/lets-tarot/api/internal/handlers"
	"github.com/jamile-dev/lets-tarot/api/internal/middleware"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	db, err := database.NewPostgresDB(cfg.DSN)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	if err := database.Migrate(db); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}

	if err := database.SeedCards(db); err != nil {
		log.Printf("Warning: card seeding failed: %v", err)
	}

	if os.Getenv("GIN_MODE") == "" {
		gin.SetMode(gin.DebugMode)
	}

	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(middleware.Logger())
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

		auth := v1.Group("/auth")
		{
			auth.POST("/register", handlers.Register)
			auth.POST("/login", handlers.Login)
			auth.POST("/refresh", middleware.AuthRequired(cfg.JWTSecret), handlers.RefreshToken)
			auth.GET("/me", middleware.AuthRequired(cfg.JWTSecret), handlers.GetCurrentUser)
		}

		protected := v1.Group("")
		protected.Use(middleware.AuthRequired(cfg.JWTSecret))
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

	addr := ":" + cfg.Port
	log.Printf("Server starting on %s", addr)
	if err := r.Run(addr); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
