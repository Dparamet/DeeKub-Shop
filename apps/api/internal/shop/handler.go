package shop

import (
	"errors"
	"log/slog"
	"net/http"
	"regexp"

	"deekub-api/internal/auth"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

var uuidPattern = regexp.MustCompile(`^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$`)

type Handler struct {
	pool        *pgxpool.Pool
	mockEnabled bool
}

func New(pool *pgxpool.Pool, mockEnabled bool) *Handler {
	return &Handler{pool: pool, mockEnabled: mockEnabled}
}

func (h *Handler) RegisterRoutes(router *gin.Engine, authentication *auth.Service) {
	secured := router.Group("", authentication.Middleware())
	secured.GET("/me", func(c *gin.Context) { c.JSON(200, auth.Current(c)) })
	secured.GET("/orders", h.listOrders)
	secured.POST("/orders", h.requireMock, h.createOrder)
	secured.GET("/orders/:id", h.getOrder)
	secured.POST("/orders/:id/mock-payment", h.requireMock, h.payOrder)
	secured.POST("/orders/:id/cancel", h.cancelOrder)
	admin := secured.Group("/admin", auth.RequireAdmin)
	admin.GET("/products", h.listProducts)
	admin.POST("/products", h.createProduct)
	admin.PUT("/products/:id", h.updateProduct)
	admin.GET("/orders", h.listAdminOrders)
}

func (h *Handler) requireMock(c *gin.Context) {
	if !h.mockEnabled {
		c.AbortWithStatusJSON(403, gin.H{"error": gin.H{"code": "mock_disabled"}})
		return
	}
	c.Next()
}

func fail(c *gin.Context, status int, code string) {
	c.JSON(status, gin.H{"error": gin.H{"code": code}})
}

type businessError struct{ code string }

func (e businessError) Error() string { return e.code }

func respondError(c *gin.Context, err error) {
	var business businessError
	var postgres *pgconn.PgError
	switch {
	case errors.As(err, &business):
		fail(c, 409, business.code)
	case errors.Is(err, pgx.ErrNoRows):
		fail(c, 404, "not_found")
	case errors.As(err, &postgres) && postgres.Code == "23505":
		fail(c, 409, "slug_taken")
	default:
		slog.ErrorContext(c.Request.Context(), "shop operation failed", "error", err)
		fail(c, 503, "shop_unavailable")
	}
}

func decode(c *gin.Context, value any) bool {
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, 64<<10)
	if c.ShouldBindJSON(value) != nil {
		fail(c, 400, "invalid_request")
		return false
	}
	return true
}

func validOrderID(c *gin.Context) bool {
	if !uuidPattern.MatchString(c.Param("id")) {
		fail(c, 404, "not_found")
		return false
	}
	return true
}
