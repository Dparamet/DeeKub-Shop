package main

import (
	"context"
	"log/slog"
	"os"
	"time"

	"deekub-api/internal/config"
	"deekub-api/internal/db"
)

func main() {
	if err := run(); err != nil {
		slog.Error("database migration failed", "error", err)
		os.Exit(1)
	}
}

func run() error {
	settings, err := config.Load()
	if err != nil {
		return err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	pool, err := db.OpenPool(ctx, settings.DatabaseURL)
	if err != nil {
		return err
	}
	defer pool.Close()
	backup, err := db.BackupApplication(ctx, pool)
	if err != nil {
		return err
	}
	slog.Info("application data snapshot saved", "path", backup)

	if err := db.ApplyMigrations(ctx, pool); err != nil {
		return err
	}
	slog.Info("database migrations applied")
	return nil
}
