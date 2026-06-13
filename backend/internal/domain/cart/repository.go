package cart

import "context"

// Repository defines the persistence interface for the Cart domain.
type Repository interface {
	FindByUserID(ctx context.Context, userID string) (*Cart, error)
	CreateCart(ctx context.Context, c *Cart) error
	// AddItem upserts a cart item (insert or increment quantity).
	AddItem(ctx context.Context, cartID, productID string, qty int) error
	UpdateItem(ctx context.Context, cartID, productID string, qty int) error
	RemoveItem(ctx context.Context, cartID, productID string) error
	// ClearCart removes all items from the cart and resets store_id to NULL.
	ClearCart(ctx context.Context, cartID string) error
	UpdateStoreID(ctx context.Context, cartID string, storeID *string) error
	// GetItemsWithProducts returns cart items (populated).
	GetItemsWithProducts(ctx context.Context, cartID string) ([]*CartItem, error)
}
