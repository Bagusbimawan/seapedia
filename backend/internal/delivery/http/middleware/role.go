package middleware

import (
	"github.com/bagus/seapedia/internal/domain/user"
	"github.com/bagus/seapedia/internal/pkg/response"
	"github.com/gofiber/fiber/v2"
)

// RequireRole guards endpoints by active JWT role.
func RequireRole(roles ...user.Role) fiber.Handler {
	return func(c *fiber.Ctx) error {
		raw := c.Locals("active_role")
		if raw == nil {
			return response.Forbidden(c, "insufficient role")
		}
		active := user.Role(raw.(string))
		for _, r := range roles {
			if active == r {
				return c.Next()
			}
		}
		return response.Forbidden(c, "insufficient role")
	}
}
