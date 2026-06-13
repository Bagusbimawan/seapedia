package store

import "time"

// Store represents a seller's shop in the marketplace.
type Store struct {
	ID           string
	SellerUserID string
	Name         string
	Description  string
	CreatedAt    time.Time
	UpdatedAt    time.Time
}
