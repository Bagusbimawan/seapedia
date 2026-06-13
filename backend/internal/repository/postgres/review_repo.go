package postgres

import (
	"context"

	"github.com/bagus/seapedia/internal/domain/review"
	"gorm.io/gorm"
)

type reviewRepository struct {
	db *gorm.DB
}

// NewReviewRepository returns a postgres-backed review.Repository.
func NewReviewRepository(db *gorm.DB) review.Repository {
	return &reviewRepository{db: db}
}

func (r *reviewRepository) Create(ctx context.Context, rev *review.AppReview) error {
	m := &AppReviewModel{
		ID:           rev.ID,
		ReviewerName: rev.ReviewerName,
		Rating:       rev.Rating,
		Comment:      rev.Comment,
		UserID:       rev.UserID,
	}
	return r.db.WithContext(ctx).Create(m).Error
}

func (r *reviewRepository) ListAll(ctx context.Context, page, limit int) ([]*review.AppReview, int64, error) {
	var total int64
	var models []AppReviewModel
	offset := (page - 1) * limit

	q := r.db.WithContext(ctx).Model(&AppReviewModel{})
	q.Count(&total)
	if err := q.Order("created_at DESC").Offset(offset).Limit(limit).Find(&models).Error; err != nil {
		return nil, 0, err
	}

	reviews := make([]*review.AppReview, 0, len(models))
	for _, m := range models {
		reviews = append(reviews, &review.AppReview{
			ID:           m.ID,
			ReviewerName: m.ReviewerName,
			Rating:       m.Rating,
			Comment:      m.Comment,
			UserID:       m.UserID,
			CreatedAt:    m.CreatedAt,
		})
	}
	return reviews, total, nil
}
