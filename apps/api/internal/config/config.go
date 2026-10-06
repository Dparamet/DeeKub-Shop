package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
)

type Config struct {
	Port        string
	DatabaseURL string
	SupabaseURL string
	SupabaseKey string
	MockEnabled bool
}

func Load() (Config, error) {
	return FromLookup(os.Getenv)
}

func FromLookup(lookup func(string) string) (Config, error) {
	port := lookup("PORT")
	if port == "" {
		port = "8080"
	}
	portNumber, err := strconv.Atoi(port)
	if err != nil || portNumber < 1 || portNumber > 65535 {
		return Config{}, fmt.Errorf("PORT must be an integer from 1 to 65535")
	}

	databaseURL := strings.TrimSpace(lookup("DATABASE_URL"))
	if databaseURL == "" {
		return Config{}, fmt.Errorf("DATABASE_URL is required")
	}

	url := strings.TrimRight(strings.TrimSpace(lookup("NEXT_PUBLIC_SUPABASE_URL")), "/")
	key := strings.TrimSpace(lookup("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"))
	if url != "" && !strings.HasPrefix(url, "https://") {
		return Config{}, fmt.Errorf("NEXT_PUBLIC_SUPABASE_URL must use HTTPS")
	}
	if strings.HasPrefix(key, "sb_secret_") {
		return Config{}, fmt.Errorf("use a Supabase publishable key, never a secret key")
	}
	appEnv := strings.TrimSpace(lookup("APP_ENV"))
	if appEnv == "" {
		appEnv = "development"
	}
	if appEnv != "development" && appEnv != "production" {
		return Config{}, fmt.Errorf("APP_ENV must be development or production")
	}
	return Config{Port: port, DatabaseURL: databaseURL, SupabaseURL: url, SupabaseKey: key, MockEnabled: appEnv == "development"}, nil
}
