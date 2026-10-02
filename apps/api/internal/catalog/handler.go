package catalog

import (
	"errors"
	"log/slog"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	repository Repository
}

func NewHandler(repository Repository) *Handler {
	return &Handler{repository: repository}
}

func (h *Handler) RegisterRoutes(router gin.IRoutes) {
	router.GET("/products", h.listPublished)
	router.GET("/products/:slug", h.getPublished)
}

func (h *Handler) listPublished(c *gin.Context) {
	productType, ok := parseProductType(c.Query("type"))
	if !ok {
		writeError(c, http.StatusBadRequest, "invalid_product_type")
		return
	}

	query := strings.TrimSpace(c.Query("q"))
	if len(query) > 120 {
		writeError(c, http.StatusBadRequest, "query_too_long")
		return
	}

	products, err := h.repository.ListPublished(c.Request.Context(), ListFilter{Type: productType, Query: query})
	if err != nil {
		slog.ErrorContext(c.Request.Context(), "catalog list failed", "error", err)
		writeError(c, http.StatusInternalServerError, "catalog_unavailable")
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": products})
}

func (h *Handler) getPublished(c *gin.Context) {
	product, err := h.repository.GetPublishedBySlug(c.Request.Context(), c.Param("slug"))
	if errors.Is(err, ErrProductNotFound) {
		writeError(c, http.StatusNotFound, "product_not_found")
		return
	}
	if err != nil {
		slog.ErrorContext(c.Request.Context(), "catalog detail failed", "error", err)
		writeError(c, http.StatusInternalServerError, "catalog_unavailable")
		return
	}
	c.JSON(http.StatusOK, product)
}

func parseProductType(value string) (ProductType, bool) {
	if strings.TrimSpace(value) == "" {
		return "", true
	}
	switch ProductType(strings.ToUpper(strings.TrimSpace(value))) {
	case ProductTypeTopUp:
		return ProductTypeTopUp, true
	case ProductTypeGameKey:
		return ProductTypeGameKey, true
	default:
		return "", false
	}
}

func writeError(c *gin.Context, status int, code string) {
	c.JSON(status, gin.H{"error": gin.H{"code": code}})
}
