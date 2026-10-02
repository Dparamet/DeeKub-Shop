package config

import "testing"

func TestFromLookupUsesDefaultPort(t *testing.T) {
	config, err := FromLookup(func(key string) string {
		if key == "DATABASE_URL" {
			return "postgres://local"
		}
		return ""
	})

	if err != nil {
		t.Fatalf("FromLookup() error = %v", err)
	}
	if config.Port != "8080" {
		t.Fatalf("Port = %q, want 8080", config.Port)
	}
}

func TestFromLookupRequiresDatabaseURL(t *testing.T) {
	_, err := FromLookup(func(string) string { return "" })
	if err == nil || err.Error() != "DATABASE_URL is required" {
		t.Fatalf("error = %v, want DATABASE_URL is required", err)
	}
}

func TestFromLookupRejectsInvalidPort(t *testing.T) {
	_, err := FromLookup(func(key string) string {
		if key == "PORT" {
			return "70000"
		}
		return "postgres://local"
	})
	if err == nil || err.Error() != "PORT must be an integer from 1 to 65535" {
		t.Fatalf("error = %v, want invalid port error", err)
	}
}
