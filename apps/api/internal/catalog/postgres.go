package catalog

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PostgresRepository struct {
	pool *pgxpool.Pool
}

func NewPostgresRepository(pool *pgxpool.Pool) *PostgresRepository {
	return &PostgresRepository{pool: pool}
}

func (r *PostgresRepository) ListPublished(ctx context.Context, filter ListFilter) ([]Product, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id::text, slug, game_title, name, product_type, description,
		       price_minor, currency, platform, region, COALESCE(metadata ->> 'artwork', ''),
		       COALESCE(metadata -> 'account_fields', '[]'::jsonb), stock_quantity,
		       COALESCE(metadata ->> 'image_url',''), COALESCE(metadata ->> 'source_url',''),
		       COALESCE(metadata ->> 'activation_guide','')
		FROM products
		WHERE is_published = TRUE
		  AND ($1::text = '' OR product_type = $1)
		  AND ($2::text = '' OR game_title ILIKE '%' || $2 || '%' OR name ILIKE '%' || $2 || '%')
		ORDER BY sort_order, game_title, name`, string(filter.Type), filter.Query)
	if err != nil {
		return nil, fmt.Errorf("query published products: %w", err)
	}
	defer rows.Close()

	products := make([]Product, 0)
	for rows.Next() {
		product, err := scanProduct(rows)
		if err != nil {
			return nil, fmt.Errorf("scan published product: %w", err)
		}
		products = append(products, product)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("read published products: %w", err)
	}
	return products, nil
}

func (r *PostgresRepository) GetPublishedBySlug(ctx context.Context, slug string) (Product, error) {
	row := r.pool.QueryRow(ctx, `
		SELECT id::text, slug, game_title, name, product_type, description,
		       price_minor, currency, platform, region, COALESCE(metadata ->> 'artwork', ''),
		       COALESCE(metadata -> 'account_fields', '[]'::jsonb), stock_quantity,
		       COALESCE(metadata ->> 'image_url',''), COALESCE(metadata ->> 'source_url',''),
		       COALESCE(metadata ->> 'activation_guide','')
		FROM products
		WHERE slug = $1 AND is_published = TRUE`, slug)

	product, err := scanProduct(row)
	if errors.Is(err, pgx.ErrNoRows) {
		return Product{}, ErrProductNotFound
	}
	if err != nil {
		return Product{}, fmt.Errorf("read published product: %w", err)
	}
	return product, nil
}

type rowScanner interface {
	Scan(dest ...any) error
}

func scanProduct(row rowScanner) (Product, error) {
	var product Product
	var accountFields []byte
	err := row.Scan(
		&product.ID,
		&product.Slug,
		&product.GameTitle,
		&product.Name,
		&product.Type,
		&product.Description,
		&product.PriceMinor,
		&product.Currency,
		&product.Platform,
		&product.Region,
		&product.Artwork,
		&accountFields,
		&product.StockQuantity,
		&product.ImageURL,
		&product.SourceURL,
		&product.ActivationGuide,
	)
	if err != nil {
		return Product{}, err
	}
	if err := json.Unmarshal(accountFields, &product.AccountFields); err != nil {
		return Product{}, fmt.Errorf("decode account fields: %w", err)
	}
	if product.AccountFields == nil {
		product.AccountFields = []AccountField{}
	}
	return product, nil
}
