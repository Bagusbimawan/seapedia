package order

import (
	"context"
	"time"
)

// Repository defines the persistence interface for the Order domain.
type Repository interface {
	Create(ctx context.Context, order *Order) error
	FindByID(ctx context.Context, id string) (*Order, error)
	ListByBuyer(ctx context.Context, buyerID string, page, limit int) ([]*Order, int64, error)
	ListByStore(ctx context.Context, storeID string, status *Status, page, limit int) ([]*Order, int64, error)
	ListAll(ctx context.Context, status *Status, page, limit int) ([]*Order, int64, error)
	UpdateStatus(ctx context.Context, orderID string, status Status) error
	AddStatusHistory(ctx context.Context, orderID string, status Status) error
	// FindOverdue returns orders that are not in a terminal state and whose deadline has passed.
	FindOverdue(ctx context.Context, now time.Time) ([]*Order, error)
	// FindIncomeByOrder returns the seller income amount for the given order (most recent INCOME entry).
	FindIncomeByOrder(ctx context.Context, orderID string) (int64, error)
}

// SellerIncomeRepository manages seller income records.
type SellerIncomeRepository interface {
	Insert(ctx context.Context, storeID, orderID, incomeType string, amount int64) error
	ListByStore(ctx context.Context, storeID string, page, limit int) ([]SellerIncome, int64, error)
}
