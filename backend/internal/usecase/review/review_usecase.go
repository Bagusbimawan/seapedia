package review

import (
	"context"

	"github.com/bagus/seapedia/internal/domain/review"
	"github.com/microcosm-cc/bluemonday"
	"github.com/google/uuid"
)

var sanitizePolicy = bluemonday.StrictPolicy()

// Usecase handles app review business logic.
type Usecase struct {
	reviewRepo review.Repository
}

// New creates a new review Usecase.
func New(reviewRepo review.Repository) *Usecase {
	return &Usecase{reviewRepo: reviewRepo}
}

// List returns paginated reviews.
func (u *Usecase) List(ctx context.Context, page, limit int) ([]*review.AppReview, int64, error) {
	return u.reviewRepo.ListAll(ctx, page, limit)
}

// Create creates a new review with XSS sanitization.
func (u *Usecase) Create(ctx context.Context, reviewerName string, rating int, comment string, userID *string) (*review.AppReview, error) {
	sanitized := sanitizePolicy.Sanitize(comment)
	r := &review.AppReview{
		ID:           uuid.New().String(),
		ReviewerName: reviewerName,
		Rating:       rating,
		Comment:      sanitized,
		UserID:       userID,
	}
	if err := u.reviewRepo.Create(ctx, r); err != nil {
		return nil, err
	}
	return r, nil
}
