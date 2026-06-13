package store

import "context"

// Repository defines the persistence interface for the Store domain.
type Repository interface {
	Create(ctx context.Context, s *Store) error
	FindByID(ctx context.Context, id string) (*Store, error)
	FindBySellerID(ctx context.Context, sellerID string) (*Store, error)
	Update(ctx context.Context, s *Store) error
	ListAll(ctx context.Context, page, limit int) ([]*Store, int64, error)
}
