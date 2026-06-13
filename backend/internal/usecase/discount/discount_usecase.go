package discount

import (
	"context"
	"time"

	"github.com/bagus/seapedia/internal/domain/discount"
	"github.com/bagus/seapedia/internal/pkg/apperror"
	"github.com/bagus/seapedia/internal/pkg/clock"
	"github.com/google/uuid"
)

// Usecase handles discount business logic.
type Usecase struct {
	discountRepo discount.Repository
}

// New creates a new discount Usecase.
func New(discountRepo discount.Repository) *Usecase {
	return &Usecase{discountRepo: discountRepo}
}

// ListVouchers returns available vouchers.
func (u *Usecase) ListVouchers(ctx context.Context, page, limit int) ([]*discount.Discount, int64, error) {
	return u.discountRepo.ListByKind(ctx, discount.KindVoucher, page, limit)
}

// ListPromos returns available promos.
func (u *Usecase) ListPromos(ctx context.Context, page, limit int) ([]*discount.Discount, int64, error) {
	return u.discountRepo.ListByKind(ctx, discount.KindPromo, page, limit)
}

// CreateVoucher creates a new voucher (admin).
func (u *Usecase) CreateVoucher(ctx context.Context, code string, discountType discount.DiscountType, value int64, expiry time.Time, remainingUsage int) (*discount.Discount, error) {
	usage := remainingUsage
	d := &discount.Discount{
		ID:             uuid.New().String(),
		Code:           code,
		Kind:           discount.KindVoucher,
		DiscountType:   discountType,
		DiscountValue:  value,
		ExpiryDate:     expiry,
		RemainingUsage: &usage,
	}
	if err := u.discountRepo.Create(ctx, d); err != nil {
		return nil, err
	}
	return d, nil
}

// CreatePromo creates a new promo (admin).
func (u *Usecase) CreatePromo(ctx context.Context, code string, discountType discount.DiscountType, value int64, expiry time.Time) (*discount.Discount, error) {
	d := &discount.Discount{
		ID:            uuid.New().String(),
		Code:          code,
		Kind:          discount.KindPromo,
		DiscountType:  discountType,
		DiscountValue: value,
		ExpiryDate:    expiry,
	}
	if err := u.discountRepo.Create(ctx, d); err != nil {
		return nil, err
	}
	return d, nil
}

// Validate checks if a discount code is usable and returns the calculated amount for a subtotal.
func (u *Usecase) Validate(ctx context.Context, code string, subtotal int64) (*discount.Discount, int64, error) {
	d, err := u.discountRepo.FindByCode(ctx, code)
	if err != nil {
		return nil, 0, err
	}
	if !d.IsUsable(clock.Now()) {
		return nil, 0, apperror.BadRequest("discount is not usable")
	}
	amount := d.Calculate(subtotal)
	return d, amount, nil
}
