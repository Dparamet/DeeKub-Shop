package main

import (
	"context"
	"errors"
	"log/slog"
	"net/mail"
	"os"
	"strings"
	"time"

	"deekub-api/internal/config"
	"deekub-api/internal/db"

	"github.com/jackc/pgx/v5"
)

func main() {
	if len(os.Args) != 2 {
		slog.Error("usage: npm run admin:grant -- email@example.com")
		os.Exit(1)
	}
	email := strings.TrimSpace(os.Args[1])
	if _, err := mail.ParseAddress(email); err != nil {
		slog.Error("valid account email required")
		os.Exit(1)
	}
	settings, err := config.Load()
	if err != nil {
		slog.Error("configuration failed", "error", err)
		os.Exit(1)
	}
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	pool, err := db.OpenPool(ctx, settings.DatabaseURL)
	if err != nil {
		slog.Error("database connection failed")
		os.Exit(1)
	}
	defer pool.Close()
	var confirmed, anonymous bool
	err = pool.QueryRow(ctx, `SELECT email_confirmed_at IS NOT NULL, coalesce(is_anonymous,false)
        FROM auth.users WHERE lower(email)=lower($1)`, email).Scan(&confirmed, &anonymous)
	if errors.Is(err, pgx.ErrNoRows) {
		slog.Error("account email not found in this Supabase project", "email", email)
		os.Exit(1)
	}
	if err != nil {
		slog.Error("unable to check Auth account")
		os.Exit(1)
	}
	if !confirmed || anonymous {
		slog.Error("account email must be confirmed before granting ADMIN", "email", email)
		os.Exit(1)
	}
	result, err := pool.Exec(ctx, `INSERT INTO profiles(id,email,role)
        SELECT id,email,'ADMIN' FROM auth.users WHERE lower(email)=lower($1) AND email_confirmed_at IS NOT NULL AND is_anonymous IS NOT TRUE
        ON CONFLICT(id) DO UPDATE SET role='ADMIN',email=EXCLUDED.email`, email)
	if err != nil {
		slog.Error("grant failed; run npm run db:migrate first")
		os.Exit(1)
	}
	if result.RowsAffected() != 1 {
		slog.Error("account not found or email not confirmed; sign up and confirm email first")
		os.Exit(1)
	}
	slog.Info("ADMIN granted; sign in at /admin")
}
