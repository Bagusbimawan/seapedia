package response

import "github.com/gofiber/fiber/v2"

// R is the standard JSON response envelope.
type R struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

// Paginated wraps list responses with pagination metadata.
type Paginated struct {
	Items interface{} `json:"items"`
	Total int64       `json:"total"`
	Page  int         `json:"page"`
	Limit int         `json:"limit"`
}

// OK sends HTTP 200 with data payload.
func OK(c *fiber.Ctx, data interface{}) error {
	return c.Status(fiber.StatusOK).JSON(R{Success: true, Data: data})
}

// Created sends HTTP 201 with data payload.
func Created(c *fiber.Ctx, data interface{}) error {
	return c.Status(fiber.StatusCreated).JSON(R{Success: true, Data: data})
}

// NoContent sends HTTP 204 with no body.
func NoContent(c *fiber.Ctx) error {
	return c.SendStatus(fiber.StatusNoContent)
}

// BadRequest sends HTTP 400 with error message.
func BadRequest(c *fiber.Ctx, msg string) error {
	return c.Status(fiber.StatusBadRequest).JSON(R{Success: false, Error: msg})
}

// Unauthorized sends HTTP 401.
func Unauthorized(c *fiber.Ctx, msg string) error {
	return c.Status(fiber.StatusUnauthorized).JSON(R{Success: false, Error: msg})
}

// Forbidden sends HTTP 403.
func Forbidden(c *fiber.Ctx, msg string) error {
	return c.Status(fiber.StatusForbidden).JSON(R{Success: false, Error: msg})
}

// NotFound sends HTTP 404.
func NotFound(c *fiber.Ctx, msg string) error {
	return c.Status(fiber.StatusNotFound).JSON(R{Success: false, Error: msg})
}

// Conflict sends HTTP 409.
func Conflict(c *fiber.Ctx, msg string) error {
	return c.Status(fiber.StatusConflict).JSON(R{Success: false, Error: msg})
}

// Unprocessable sends HTTP 422.
func Unprocessable(c *fiber.Ctx, msg string) error {
	return c.Status(fiber.StatusUnprocessableEntity).JSON(R{Success: false, Error: msg})
}

// Internal sends HTTP 500 with a generic message.
func Internal(c *fiber.Ctx) error {
	return c.Status(fiber.StatusInternalServerError).JSON(R{Success: false, Error: "internal server error"})
}
