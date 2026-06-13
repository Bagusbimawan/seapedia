package handler

import (
	"errors"
	"log"

	"github.com/bagus/seapedia/internal/pkg/apperror"
	"github.com/bagus/seapedia/internal/pkg/response"
	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
)

var validate = validator.New()

// HandleErr converts AppError to HTTP responses.
func HandleErr(c *fiber.Ctx, err error) error {
	var e *apperror.AppError
	if errors.As(err, &e) {
		switch e.Code {
		case 400:
			return response.BadRequest(c, e.Message)
		case 401:
			return response.Unauthorized(c, e.Message)
		case 403:
			return response.Forbidden(c, e.Message)
		case 404:
			return response.NotFound(c, e.Message)
		case 409:
			return response.Conflict(c, e.Message)
		case 422:
			return response.Unprocessable(c, e.Message)
		}
	}
	log.Printf("internal error: %v", err)
	return response.Internal(c)
}

// ParseBody parses and validates a request body.
func ParseBody(c *fiber.Ctx, req interface{}) error {
	if err := c.BodyParser(req); err != nil {
		return response.BadRequest(c, "invalid body")
	}
	if err := validate.Struct(req); err != nil {
		return response.Unprocessable(c, err.Error())
	}
	return nil
}

// Pagination extracts page and limit from query params.
func Pagination(c *fiber.Ctx) (page, limit, offset int) {
	page = c.QueryInt("page", 1)
	if page < 1 {
		page = 1
	}
	limit = c.QueryInt("limit", 10)
	if limit > 100 {
		limit = 100
	}
	if limit < 1 {
		limit = 10
	}
	offset = (page - 1) * limit
	return page, limit, offset
}

// UserID extracts the authenticated user ID from context.
func UserID(c *fiber.Ctx) string {
	return c.Locals("user_id").(string)
}
