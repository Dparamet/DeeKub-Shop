package catalog

import (
	"context"
	"errors"
)

type ProductType string

const (
	ProductTypeTopUp  ProductType = "TOPUP"
	ProductTypeGameKey ProductType = "GAME_KEY"
)

var ErrProductNotFound = errors.New("published product not found")

type AccountField struct {
	ID          string `json:"id"`
	Label       string `json:"label"`
	Placeholder string `json:"placeholder"`
}

type Product struct {
	ID            string         `json:"id"`
	Slug          string         `json:"slug"`
	GameTitle     string         `json:"game_title"`
	Name          string         `json:"name"`
	Type          ProductType    `json:"type"`
	Description   string         `json:"description"`
	PriceMinor    int64          `json:"price_minor"`
	Currency      string         `json:"currency"`
	Platform      string         `json:"platform"`
	Region        string         `json:"region"`
	Artwork       string         `json:"artwork"`
	AccountFields []AccountField `json:"account_fields,omitempty"`
}

type ListFilter struct {
	Type  ProductType
	Query string
}

type Repository interface {
	ListPublished(ctx context.Context, filter ListFilter) ([]Product, error)
	GetPublishedBySlug(ctx context.Context, slug string) (Product, error)
}
