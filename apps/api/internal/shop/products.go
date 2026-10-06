package shop

import (
	"encoding/json"
	"errors"
	"net/url"
	"regexp"
	"strings"
	"time"

	"deekub-api/internal/catalog"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
)

type ProductInput struct {
	Version         string                 `json:"version"`
	Slug            string                 `json:"slug"`
	GameTitle       string                 `json:"game_title"`
	Name            string                 `json:"name"`
	Type            string                 `json:"type"`
	Description     string                 `json:"description"`
	PriceMinor      int64                  `json:"price_minor"`
	Platform        string                 `json:"platform"`
	Region          string                 `json:"region"`
	Artwork         string                 `json:"artwork"`
	ImageURL        *string                `json:"image_url"`
	SourceURL       *string                `json:"source_url"`
	ActivationGuide *string                `json:"activation_guide"`
	AccountFields   []catalog.AccountField `json:"account_fields"`
	StockQuantity   int                    `json:"stock_quantity"`
	IsPublished     bool                   `json:"is_published"`
}

var slugPattern = regexp.MustCompile(`^[a-z0-9]+(?:-[a-z0-9]+)*$`)
var fieldPattern = regexp.MustCompile(`^[a-z0-9-]{1,40}$`)

func (p *ProductInput) valid() bool {
	p.Name = strings.TrimSpace(p.Name)
	p.GameTitle = strings.TrimSpace(p.GameTitle)
	if !slugPattern.MatchString(p.Slug) || len(p.Slug) > 100 || p.Name == "" || len(p.Name) > 200 || p.GameTitle == "" || len(p.GameTitle) > 150 || len(p.Description) > 4000 || p.Platform == "" || len(p.Platform) > 100 || p.Region == "" || len(p.Region) > 100 || p.PriceMinor < 1 || p.PriceMinor > 100000000 || p.StockQuantity < 0 || p.StockQuantity > 1000000 {
		return false
	}
	if p.Type != "TOPUP" && p.Type != "GAME_KEY" {
		return false
	}
	if p.ImageURL != nil && !validProductURL(*p.ImageURL, true) || p.SourceURL != nil && !validProductURL(*p.SourceURL, false) || p.ActivationGuide != nil && len(*p.ActivationGuide) > 2000 {
		return false
	}
	switch p.Artwork {
	case "valorant", "arena", "genshin", "hades", "stardew", "cyberpunk":
	default:
		return false
	}
	if len(p.AccountFields) > 6 || (p.Type == "TOPUP" && len(p.AccountFields) == 0) || (p.Type == "GAME_KEY" && len(p.AccountFields) > 0) {
		return false
	}
	seen := map[string]bool{}
	for _, f := range p.AccountFields {
		if !fieldPattern.MatchString(f.ID) || seen[f.ID] || strings.TrimSpace(f.Label) == "" || len(f.Label) > 100 || len(f.Placeholder) > 150 {
			return false
		}
		seen[f.ID] = true
	}
	return true
}

func validProductURL(value string, image bool) bool {
	if value == "" {
		return true
	}
	u, err := url.Parse(value)
	if err != nil || len(value) > 1500 || u.Scheme != "https" || u.User != nil || u.Port() != "" || u.Fragment != "" {
		return false
	}
	if image {
		switch u.Hostname() {
		case "shared.akamai.steamstatic.com", "shared.fastly.steamstatic.com":
			return strings.HasPrefix(u.Path, "/store_item_assets/steam/apps/")
		case "play-lh.googleusercontent.com":
			return u.Path != "/"
		case "cms-media.roblox.com":
			return strings.HasPrefix(u.Path, "/assets/")
		case "cmsassets.rgpub.io":
			return strings.HasPrefix(u.Path, "/sanity/images/")
		case "www.pubgmobile.com":
			return strings.HasPrefix(u.Path, "/images/")
		}
		return false
	}
	switch u.Hostname() {
	case "store.steampowered.com", "play.google.com", "www.roblox.com", "en.help.roblox.com", "playvalorant.com", "ff.garena.com", "www.pubgmobile.com":
		return true
	}
	return false
}

const productJSON = `to_jsonb(p) - 'metadata' - 'product_type' || jsonb_build_object('type',p.product_type,'artwork',COALESCE(p.metadata->>'artwork','hades'),'account_fields',COALESCE(p.metadata->'account_fields','[]'::jsonb),'image_url',COALESCE(p.metadata->>'image_url',''),'source_url',COALESCE(p.metadata->>'source_url',''),'activation_guide',COALESCE(p.metadata->>'activation_guide',''))`

func (h *Handler) listProducts(c *gin.Context) {
	rows, err := h.pool.Query(c.Request.Context(), `SELECT `+productJSON+` FROM products p ORDER BY sort_order,game_title,name LIMIT 500`)
	if err != nil {
		respondError(c, err)
		return
	}
	defer rows.Close()
	items := []json.RawMessage{}
	for rows.Next() {
		var item json.RawMessage
		if err := rows.Scan(&item); err != nil {
			respondError(c, err)
			return
		}
		items = append(items, item)
	}
	if rows.Err() != nil {
		respondError(c, rows.Err())
		return
	}
	c.JSON(200, gin.H{"items": items})
}

func (h *Handler) createProduct(c *gin.Context) { h.saveProduct(c, false) }
func (h *Handler) updateProduct(c *gin.Context) { h.saveProduct(c, true) }

func (h *Handler) saveProduct(c *gin.Context, update bool) {
	if update && !validOrderID(c) {
		return
	}
	var p ProductInput
	if !decode(c, &p) {
		return
	}
	if !p.valid() {
		fail(c, 400, "invalid_product")
		return
	}
	if p.AccountFields == nil {
		p.AccountFields = []catalog.AccountField{}
	}
	meta := map[string]any{"artwork": p.Artwork, "account_fields": p.AccountFields}
	if p.ImageURL != nil {
		meta["image_url"] = *p.ImageURL
	}
	if p.SourceURL != nil {
		meta["source_url"] = *p.SourceURL
	}
	if p.ActivationGuide != nil {
		meta["activation_guide"] = *p.ActivationGuide
	}
	metadata, err := json.Marshal(meta)
	if err != nil {
		respondError(c, err)
		return
	}
	args := []any{p.Slug, p.GameTitle, p.Name, p.Type, p.Description, p.PriceMinor, p.Platform, p.Region, p.IsPublished, metadata, p.StockQuantity}
	var id string
	if update {
		args = append(args, c.Param("id"))
		args = append(args, p.Version)
		if _, parseErr := time.Parse(time.RFC3339Nano, p.Version); parseErr != nil {
			fail(c, 400, "invalid_request")
			return
		}
		err = h.pool.QueryRow(c.Request.Context(), `UPDATE products SET slug=$1,game_title=$2,name=$3,product_type=$4,description=$5,price_minor=$6,platform=$7,region=$8,is_published=$9,metadata=metadata || $10::jsonb,stock_quantity=$11,updated_at=now() WHERE id=$12 AND updated_at=$13::timestamptz RETURNING id::text`, args...).Scan(&id)
		if errors.Is(err, pgx.ErrNoRows) {
			fail(c, 409, "product_changed")
			return
		}
	} else {
		err = h.pool.QueryRow(c.Request.Context(), `INSERT INTO products(slug,game_title,name,product_type,description,price_minor,platform,region,is_published,metadata,stock_quantity) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id::text`, args...).Scan(&id)
	}
	if err != nil {
		respondError(c, err)
		return
	}
	c.JSON(200, gin.H{"id": id})
}
