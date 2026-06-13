package apperror

import "fmt"

// AppError is a domain-level error that carries an HTTP status code.
type AppError struct {
	Code    int
	Message string
}

func (e *AppError) Error() string {
	return e.Message
}

// New creates a new AppError with the given HTTP status code and message.
func New(code int, msg string) *AppError {
	return &AppError{Code: code, Message: msg}
}

// Wrap wraps an underlying error with an AppError, preserving context.
func Wrap(code int, msg string, cause error) *AppError {
	return &AppError{
		Code:    code,
		Message: fmt.Sprintf("%s: %v", msg, cause),
	}
}

// Predefined constructors for common HTTP error codes.

func BadRequest(msg string) *AppError      { return New(400, msg) }
func Unauthorized(msg string) *AppError    { return New(401, msg) }
func Forbidden(msg string) *AppError       { return New(403, msg) }
func NotFound(msg string) *AppError        { return New(404, msg) }
func Conflict(msg string) *AppError        { return New(409, msg) }
func Unprocessable(msg string) *AppError   { return New(422, msg) }
func Internal(msg string) *AppError        { return New(500, msg) }
