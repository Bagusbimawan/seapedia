package address

import "time"

// Address is a user's saved delivery address.
type Address struct {
	ID        string
	UserID    string
	Label     string
	Street    string
	City      string
	ZipCode   string
	IsDefault bool
	CreatedAt time.Time
	UpdatedAt time.Time
}
