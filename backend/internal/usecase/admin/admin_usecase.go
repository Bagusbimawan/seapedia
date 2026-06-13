package admin

import (
	"context"

	"github.com/bagus/seapedia/internal/domain/order"
	"github.com/bagus/seapedia/internal/domain/store"
	"github.com/bagus/seapedia/internal/domain/user"
	"github.com/bagus/seapedia/internal/pkg/clock"
	"github.com/bagus/seapedia/internal/repository/postgres"
)

// Usecase handles admin business logic.
type Usecase struct {
	userRepo      user.Repository
	storeRepo     store.Repository
	orderRepo     order.Repository
	clockRepo     *postgres.SystemClockRepository
	overdueRunner OverdueProcessor
}

// OverdueProcessor processes overdue orders.
type OverdueProcessor interface {
	ProcessAll(ctx context.Context) error
}

// New creates a new admin Usecase.
func New(
	userRepo user.Repository,
	storeRepo store.Repository,
	orderRepo order.Repository,
	clockRepo *postgres.SystemClockRepository,
	overdueRunner OverdueProcessor,
) *Usecase {
	return &Usecase{
		userRepo:      userRepo,
		storeRepo:     storeRepo,
		orderRepo:     orderRepo,
		clockRepo:     clockRepo,
		overdueRunner: overdueRunner,
	}
}

// ListUsers returns all users.
func (u *Usecase) ListUsers(ctx context.Context, page, limit int) ([]*user.User, int64, error) {
	return u.userRepo.ListAll(ctx, page, limit)
}

// ListStores returns all stores.
func (u *Usecase) ListStores(ctx context.Context, page, limit int) ([]*store.Store, int64, error) {
	return u.storeRepo.ListAll(ctx, page, limit)
}

// ListOrders returns all orders.
func (u *Usecase) ListOrders(ctx context.Context, status *order.Status, page, limit int) ([]*order.Order, int64, error) {
	return u.orderRepo.ListAll(ctx, status, page, limit)
}

// AdvanceDay advances the virtual clock by 24 hours and triggers overdue processing.
func (u *Usecase) AdvanceDay(ctx context.Context) (int64, error) {
	offset, err := u.clockRepo.AdvanceDay(ctx)
	if err != nil {
		return 0, err
	}
	clock.SetOffset(offset)
	if err := u.overdueRunner.ProcessAll(ctx); err != nil {
		return offset, err
	}
	return offset, nil
}
