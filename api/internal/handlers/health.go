package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

func HealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":    "ok",
		"service":   "lets-tarot-api",
		"timestamp": time.Now().UTC().Format(time.RFC3339),
	})
}
