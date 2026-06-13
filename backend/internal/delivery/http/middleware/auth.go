package middleware

import (
	"strings"

	"github.com/bagus/seapedia/internal/config"
	jwtutil "github.com/bagus/seapedia/internal/pkg/jwt"
	"github.com/bagus/seapedia/internal/pkg/response"
	"github.com/gofiber/fiber/v2"
)

// Auth validates JWT and sets user context locals.
func Auth(cfg *config.Config) fiber.Handler {
	return func(c *fiber.Ctx) error {
		header := c.Get("Authorization")
		if header == "" {
			return response.Unauthorized(c, "missing authorization header")
		}
		parts := strings.SplitN(header, " ", 2)
		if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
			return response.Unauthorized(c, "invalid authorization format")
		}

		claims, err := jwtutil.Parse(cfg.JWTSecret, parts[1])
		if err != nil {
			return response.Unauthorized(c, "invalid or expired token")
		}

		c.Locals("user_id", claims.UserID)
		c.Locals("active_role", claims.ActiveRole)
		return c.Next()
	}
}
