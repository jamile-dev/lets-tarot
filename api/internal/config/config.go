package config

import (
	"os"
	"strconv"
)

type Config struct {
	Port         string
	DSN          string
	JWTSecret    string
	ClientURL    string
	SupabaseURL  string
	SupabaseKey  string
	CDNBaseURL   string
}

func Load() (*Config, error) {
	port := getEnv("PORT", "8080")
	dsn := getEnv("DATABASE_URL", "")
	jwtSecret := getEnv("JWT_SECRET", "")
	clientURL := getEnv("CLIENT_URL", "http://localhost:5173")
	supabaseURL := getEnv("SUPABASE_URL", "")
	supabaseKey := getEnv("SUPABASE_ANON_KEY", "")
	cdnBaseURL := getEnv("CDN_BASE_URL", "https://cdn.jsdelivr.net/gh/jamile-dev/lets-tarot@main/cards")

	return &Config{
		Port:        port,
		DSN:         dsn,
		JWTSecret:   jwtSecret,
		ClientURL:   clientURL,
		SupabaseURL: supabaseURL,
		SupabaseKey: supabaseKey,
		CDNBaseURL:  cdnBaseURL,
	}, nil
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}

func getEnvInt(key string, fallback int) int {
	if value, ok := os.LookupEnv(key); ok {
		if i, err := strconv.Atoi(value); err == nil {
			return i
		}
	}
	return fallback
}
