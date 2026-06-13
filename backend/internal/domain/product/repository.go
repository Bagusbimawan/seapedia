package product

import "context"

// Repository defines the persistence interface for the Product domain.
type Repository interface {
	Create(ctx context.Context, p *Product) error
	FindByID(ctx context.Context, id string) (*Product, error)
	ListByStore(ctx context.Context, storeID string, page, limit int) ([]*Product, int64, error)
	ListAll(ctx context.Context, search string, page, limit int) ([]*Product, int64, error)
	Update(ctx context.Context, p *Product) error
	Delete(ctx context.Context, id string) error
	// DecrementStock atomically reduces stock by qty (ADR-007).
	// Returns error if stock would go negative.
	DecrementStock(ctx context.Context, id string, qty int) error
	// RestoreStock increments stock by qty (used for order reversals).
	RestoreStock(ctx context.Context, id string, qty int) error
}
