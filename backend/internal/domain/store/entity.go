package store

import "time"

const (
	ProvisionedSeed  = "seed"
	ProvisionedAdmin = "admin"
	ProvisionedSeller = "seller"
)

// Store represents a seller's shop in the marketplace.
type Store struct {
	ID            string
	SellerUserID  string
	Name          string
	Description   string
	ProvisionedBy string
	DemoPassword  string // plaintext for demo panel (admin-created sellers only)
	CreatedAt     time.Time
	UpdatedAt     time.Time
}
