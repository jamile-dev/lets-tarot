package main

import (
	"log"
	"os"

	"github.com/jamile-dev/lets-tarot/api/internal/router"
)

func main() {
	router.InitEnv()
	r := router.InitRouter()

	addr := ":8080"
	if port := os.Getenv("PORT"); port != "" {
		addr = ":" + port
	}

	log.Printf("Server starting on %s", addr)
	if err := r.Run(addr); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
