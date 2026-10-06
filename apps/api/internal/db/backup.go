package db

import (
	"context"
	"encoding/json"
	"os"
	"path/filepath"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Snapshot application rows before schema changes; files stay in the ignored cache.
func BackupApplication(ctx context.Context, pool *pgxpool.Pool) (string, error) {
	tx, err := pool.BeginTx(ctx, pgx.TxOptions{IsoLevel: pgx.RepeatableRead, AccessMode: pgx.ReadOnly})
	if err != nil {
		return "", err
	}
	defer tx.Rollback(context.Background())
	tables := map[string]json.RawMessage{}
	for _, name := range []string{"products", "profiles", "orders", "order_items", "order_events", "schema_migrations"} {
		var exists bool
		if err = tx.QueryRow(ctx, `SELECT to_regclass($1) IS NOT NULL`, "public."+name).Scan(&exists); err != nil {
			return "", err
		}
		if !exists {
			continue
		}
		var rows json.RawMessage
		if err = tx.QueryRow(ctx, `SELECT COALESCE(jsonb_agg(to_jsonb(t)),'[]'::jsonb) FROM public.`+name+` t`).Scan(&rows); err != nil {
			return "", err
		}
		tables[name] = rows
	}
	if err = tx.Commit(ctx); err != nil {
		return "", err
	}
	data, err := json.MarshalIndent(tables, "", "  ")
	if err != nil {
		return "", err
	}
	dir := filepath.Join(".cache", "backups")
	if err = os.MkdirAll(dir, 0700); err != nil {
		return "", err
	}
	path := filepath.Join(dir, time.Now().UTC().Format("20060102T150405.000000000")+".json")
	return path, os.WriteFile(path, data, 0600)
}
