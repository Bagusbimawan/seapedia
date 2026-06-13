package postgres

import "github.com/google/uuid"

// newUUID generates a new random UUID string.
func newUUID() string {
	return uuid.New().String()
}
