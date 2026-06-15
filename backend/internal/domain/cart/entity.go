package cart

import "time"

// Cart belongs to one user and is locked to a single store.
type Cart struct {
	ID        string
	UserID    string
	StoreID   *string
	Items     []*CartItem
	CreatedAt time.Time
	UpdatedAt time.Time
}

// IsEmpty returns true when the cart has no items.
func (c *Cart) IsEmpty() bool {
	return len(c.Items) == 0
}

// BelongsToStore returns true when the cart is locked to the given storeID.
func (c *Cart) BelongsToStore(storeID string) bool {
	if c.StoreID == nil {
		return true // empty cart: accepts any store
	}
	return *c.StoreID == storeID
}

// ProductSnapshot holds display fields joined from the products table.
type ProductSnapshot struct {
	Name      string
	Price     int64
	Stock     int
	StoreID   string
	StoreName string
}

// CartItem is a single line entry in a cart.
type CartItem struct {
	ID        string
	CartID    string
	ProductID string
	Quantity  int
	Product   *ProductSnapshot
	CreatedAt time.Time
	UpdatedAt time.Time
}
