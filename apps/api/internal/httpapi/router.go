package httpapi

import (
	"context"
	"net/http"
	"time"

	"deekub-api/internal/catalog"
	"github.com/gin-gonic/gin"
)

type ReadinessChecker interface {
	Ping(context.Context) error
}

type Dependencies struct {
	Catalog  *catalog.Handler
	Database ReadinessChecker
}

func NewRouter(dependencies Dependencies) *gin.Engine {
	router := gin.New()
	router.Use(gin.Recovery())

	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})
	router.GET("/readyz", func(c *gin.Context) {
		if dependencies.Database == nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{"status": "not_ready"})
			return
		}

		ctx, cancel := context.WithTimeout(c.Request.Context(), 2*time.Second)
		defer cancel()
		if err := dependencies.Database.Ping(ctx); err != nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{"status": "not_ready"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"status": "ready"})
	})

	if dependencies.Catalog != nil {
		dependencies.Catalog.RegisterRoutes(router)
	}
	return router
}
