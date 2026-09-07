// Vercel Go serverless function entry point.
// This file is in api/ directory so Vercel auto-detects it as a Go function.
// The route pattern is /api/index.go → all paths route here.
// We forward all requests to the Gin router initialized from the shared router package.
package handler

import (
	"net/http"

	"github.com/jamile-dev/lets-tarot/api/internal/router"
)

// Handler is the entry point for Vercel serverless functions.
var Handler = func(w http.ResponseWriter, r *http.Request) {
	// Initialize router (cached for warm starts)
	r2 := router.InitRouter()
	r2.ServeHTTP(w, r)
}
