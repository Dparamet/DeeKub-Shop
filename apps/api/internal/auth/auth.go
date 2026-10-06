package auth

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

type User struct {
	ID    string `json:"id"`
	Email string `json:"email"`
	Role  string `json:"role"`
}

type Service struct {
	pool   *pgxpool.Pool
	url    string
	key    string
	client *http.Client
}

func New(pool *pgxpool.Pool, url, key string) *Service {
	return &Service{pool: pool, url: strings.TrimRight(url, "/"), key: key, client: &http.Client{Timeout: 8 * time.Second}}
}

func (s *Service) Middleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Cache-Control", "private, no-store")
		if s.url == "" || s.key == "" {
			reject(c, 503, "auth_not_configured")
			return
		}
		parts := strings.Fields(c.GetHeader("Authorization"))
		if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") || len(parts[1]) > 16000 {
			reject(c, 401, "login_required")
			return
		}
		ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
		defer cancel()
		request, err := http.NewRequestWithContext(ctx, http.MethodGet, s.url+"/auth/v1/user", nil)
		if err != nil {
			reject(c, 503, "auth_unavailable")
			return
		}
		request.Header.Set("Authorization", "Bearer "+parts[1])
		request.Header.Set("apikey", s.key)
		response, err := s.client.Do(request)
		if err != nil {
			reject(c, 503, "auth_unavailable")
			return
		}
		defer response.Body.Close()
		if response.StatusCode == 401 || response.StatusCode == 403 {
			reject(c, 401, "login_required")
			return
		}
		if response.StatusCode != 200 {
			reject(c, 503, "auth_unavailable")
			return
		}
		var identity struct {
			ID        string `json:"id"`
			Email     string `json:"email"`
			Anonymous bool   `json:"is_anonymous"`
		}
		if json.NewDecoder(io.LimitReader(response.Body, 1<<20)).Decode(&identity) != nil || identity.ID == "" || identity.Email == "" || identity.Anonymous {
			reject(c, 401, "login_required")
			return
		}
		user := User{ID: identity.ID, Email: identity.Email}
		// Auth metadata never controls the application's role.
		err = s.pool.QueryRow(ctx, `INSERT INTO profiles(id,email) VALUES($1,$2)
            ON CONFLICT(id) DO UPDATE SET email=EXCLUDED.email RETURNING role`, user.ID, user.Email).Scan(&user.Role)
		if err != nil {
			reject(c, 503, "database_unavailable")
			return
		}
		c.Set("user", user)
		c.Next()
	}
}

func Current(c *gin.Context) User { return c.MustGet("user").(User) }

func RequireAdmin(c *gin.Context) {
	if Current(c).Role != "ADMIN" {
		reject(c, 403, "admin_required")
		return
	}
	c.Next()
}

func reject(c *gin.Context, status int, code string) {
	c.AbortWithStatusJSON(status, gin.H{"error": gin.H{"code": code}})
}
