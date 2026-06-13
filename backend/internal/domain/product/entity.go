package product

import "time"

// Product represents a sellable item in a store.
type Product struct {
	ID          string
	StoreID     string
	Name        string
	Description string
	Price       int64
	Stock       int
	CreatedAt   time.Time
	UpdatedAt   time.Time
}
