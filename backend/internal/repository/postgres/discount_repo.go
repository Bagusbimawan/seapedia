package postgres

import (
	"context"
	"errors"
	"strings"

	"github.com/bagus/seapedia/internal/domain/discount"
	"github.com/bagus/seapedia/internal/pkg/apperror"
	"gorm.io/gorm"
)

type discountRepository struct {
	db *gorm.DB
}

// NewDiscountRepository returns a postgres-backed discount.Repository.
func NewDiscountRepository(db *gorm.DB) discount.Repository {
	return &discountRepository{db: db}
}

func (r *discountRepository) Create(ctx context.Context, d *discount.Discount) error {
	m := &DiscountModel{
		ID:             d.ID,
		Code:           d.Code,
		Kind:           string(d.Kind),
		DiscountType:   string(d.DiscountType),
		DiscountValue:  d.DiscountValue,
		ExpiryDate:     d.ExpiryDate,
		RemainingUsage: d.RemainingUsage,
	}
	return r.db.WithContext(ctx).Create(m).Error
}

func (r *discountRepository) FindByCode(ctx context.Context, code string) (*discount.Discount, error) {
	var m DiscountModel
	normalized := strings.TrimSpace(strings.ToUpper(code))
	if err := r.db.WithContext(ctx).Where("UPPER(code) = ?", normalized).First(&m).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperror.NotFound("discount not found")
		}
		return nil, err
	}
	return modelToDiscount(&m), nil
}

func (r *discountRepository) ListByKind(ctx context.Context, kind discount.Kind, page, limit int) ([]*discount.Discount, int64, error) {
	var total int64
	var models []DiscountModel
	offset := (page - 1) * limit

	q := r.db.WithContext(ctx).Model(&DiscountModel{}).Where("kind = ?", string(kind))
	q.Count(&total)
	if err := q.Order("created_at DESC").Offset(offset).Limit(limit).Find(&models).Error; err != nil {
		return nil, 0, err
	}

	discounts := make([]*discount.Discount, 0, len(models))
	for _, m := range models {
		mc := m
		discounts = append(discounts, modelToDiscount(&mc))
	}
	return discounts, total, nil
}

func (r *discountRepository) DecrementUsage(ctx context.Context, id string) error {
	result := r.db.WithContext(ctx).Exec(
		"UPDATE discounts SET remaining_usage = remaining_usage - 1 WHERE id = ? AND remaining_usage > 0",
		id,
	)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return apperror.BadRequest("discount usage exhausted")
	}
	return nil
}

func modelToDiscount(m *DiscountModel) *discount.Discount {
	return &discount.Discount{
		ID:             m.ID,
		Code:           m.Code,
		Kind:           discount.Kind(m.Kind),
		DiscountType:   discount.DiscountType(m.DiscountType),
		DiscountValue:  m.DiscountValue,
		ExpiryDate:     m.ExpiryDate,
		RemainingUsage: m.RemainingUsage,
		CreatedAt:      m.CreatedAt,
	}
}
