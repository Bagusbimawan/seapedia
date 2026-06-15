package product

import "time"

// Product represents a sellable item in a store.
type Product struct {
	ID          string
	StoreID     string
	StoreName   string // populated on public list (JOIN stores)
	Name        string
	Description string
	Price       int64
	Stock       int
	CreatedAt   time.Time
	UpdatedAt   time.Time
}
