package review

import "context"

// Repository defines the persistence interface for the AppReview domain.
type Repository interface {
	Create(ctx context.Context, r *AppReview) error
	ListAll(ctx context.Context, page, limit int) ([]*AppReview, int64, error)
}
