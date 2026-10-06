package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"deekub-api/internal/auth"
	"deekub-api/internal/catalog"
	"deekub-api/internal/config"
	"deekub-api/internal/db"
	"deekub-api/internal/httpapi"
	"deekub-api/internal/shop"
)

func main() {
	if err := run(); err != nil {
		slog.Error("API server stopped", "error", err)
		os.Exit(1)
	}
}

func run() error {
	settings, err := config.Load()
	if err != nil {
		return err
	}

	pool, err := db.OpenPool(context.Background(), settings.DatabaseURL)
	if err != nil {
		return err
	}
	defer pool.Close()

	store := shop.New(pool, settings.MockEnabled)
	signalCtx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	go func() {
		ticker := time.NewTicker(time.Minute)
		defer ticker.Stop()
		for {
			ctx, cancel := context.WithTimeout(signalCtx, 20*time.Second)
			if err := store.ExpireOrders(ctx); err != nil && signalCtx.Err() == nil {
				slog.Error("expire orders failed", "error", err)
			}
			cancel()
			select {
			case <-signalCtx.Done():
				return
			case <-ticker.C:
			}
		}
	}()
	server := &http.Server{
		Addr:              ":" + settings.Port,
		Handler:           httpapi.NewRouter(httpapi.Dependencies{Catalog: catalog.NewHandler(catalog.NewPostgresRepository(pool)), Database: pool, Auth: auth.New(pool, settings.SupabaseURL, settings.SupabaseKey), Shop: store}),
		ReadHeaderTimeout: 5 * time.Second,
	}

	serverErrors := make(chan error, 1)
	go func() {
		slog.Info("API server listening", "port", settings.Port)
		serverErrors <- server.ListenAndServe()
	}()

	select {
	case err := <-serverErrors:
		if errors.Is(err, http.ErrServerClosed) {
			return nil
		}
		return err
	case <-signalCtx.Done():
	}

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := server.Shutdown(shutdownCtx); err != nil {
		return err
	}
	return nil
}
