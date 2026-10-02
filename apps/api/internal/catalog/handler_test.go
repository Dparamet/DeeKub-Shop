package catalog

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

type stubRepository struct {
	products []Product
	product  Product
	err      error
	filter   ListFilter
	slug     string
}

func (s *stubRepository) ListPublished(_ context.Context, filter ListFilter) ([]Product, error) {
	s.filter = filter
	return s.products, s.err
}

func (s *stubRepository) GetPublishedBySlug(_ context.Context, slug string) (Product, error) {
	s.slug = slug
	return s.product, s.err
}

func newTestRouter(repository Repository) *gin.Engine {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	NewHandler(repository).RegisterRoutes(router.Group(""))
	return router
}

func TestListPublishedProductsReturnsCatalogFields(t *testing.T) {
	repository := &stubRepository{products: []Product{{
		ID: "product-1", Slug: "valorant-475", GameTitle: "VALORANT", Name: "475 VP",
		Type: ProductTypeTopUp, PriceMinor: 15900, Currency: "THB", Platform: "Riot Games",
		Region: "Asia Pacific", Artwork: "valorant",
		AccountFields: []AccountField{{ID: "riot-id", Label: "Riot ID", Placeholder: "ชื่อในเกม"}},
	}}}
	response := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodGet, "/products?type=TOPUP&q=valorant", nil)

	newTestRouter(repository).ServeHTTP(response, request)

	if response.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d; body = %s", response.Code, http.StatusOK, response.Body.String())
	}
	if got, want := response.Header().Get("Content-Type"), "application/json; charset=utf-8"; got != want {
		t.Fatalf("Content-Type = %q, want %q", got, want)
	}
	if repository.filter.Type != ProductTypeTopUp || repository.filter.Query != "valorant" {
		t.Fatalf("filter = %#v, want TOPUP + valorant", repository.filter)
	}
	for _, want := range []string{`"slug":"valorant-475"`, `"price_minor":15900`, `"account_fields"`} {
		if !strings.Contains(response.Body.String(), want) {
			t.Errorf("response missing %s: %s", want, response.Body.String())
		}
	}
}

func TestListPublishedProductsRejectsUnknownType(t *testing.T) {
	response := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodGet, "/products?type=UNSUPPORTED", nil)

	newTestRouter(&stubRepository{}).ServeHTTP(response, request)

	if response.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d", response.Code, http.StatusBadRequest)
	}
	if !strings.Contains(response.Body.String(), `"code":"invalid_product_type"`) {
		t.Fatalf("body = %s, want invalid_product_type", response.Body.String())
	}
}

func TestListPublishedProductsHidesRepositoryErrors(t *testing.T) {
	response := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodGet, "/products", nil)
	newTestRouter(&stubRepository{err: errors.New("database password leaked")}).ServeHTTP(response, request)

	if response.Code != http.StatusInternalServerError {
		t.Fatalf("status = %d, want %d", response.Code, http.StatusInternalServerError)
	}
	if strings.Contains(response.Body.String(), "database password") {
		t.Fatalf("response leaked repository error: %s", response.Body.String())
	}
}

func TestGetPublishedProductBySlug(t *testing.T) {
	repository := &stubRepository{product: Product{ID: "product-2", Slug: "hades-ii-key", Name: "Hades II", Type: ProductTypeGameKey}}
	response := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodGet, "/products/hades-ii-key", nil)

	newTestRouter(repository).ServeHTTP(response, request)

	if response.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d; body = %s", response.Code, http.StatusOK, response.Body.String())
	}
	if repository.slug != "hades-ii-key" || !strings.Contains(response.Body.String(), `"type":"GAME_KEY"`) {
		t.Fatalf("slug = %q; body = %s", repository.slug, response.Body.String())
	}
}

func TestGetPublishedProductReturnsNotFound(t *testing.T) {
	response := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodGet, "/products/missing", nil)
	newTestRouter(&stubRepository{err: ErrProductNotFound}).ServeHTTP(response, request)

	if response.Code != http.StatusNotFound {
		t.Fatalf("status = %d, want %d", response.Code, http.StatusNotFound)
	}
}
