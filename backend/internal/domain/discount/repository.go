package discount

import "context"

// Repository defines the persistence interface for the Discount domain.
type Repository interface {
	Create(ctx context.Context, d *Discount) error
	FindByCode(ctx context.Context, code string) (*Discount, error)
	ListByKind(ctx context.Context, kind Kind, page, limit int) ([]*Discount, int64, error)
	DecrementUsage(ctx context.Context, id string) error
}
