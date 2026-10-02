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

	return Config{Port: port, DatabaseURL: databaseURL}, nil
}
