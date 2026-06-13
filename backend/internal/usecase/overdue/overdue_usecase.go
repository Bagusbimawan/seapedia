package overdue

import (
	"context"
	"log"

	"github.com/bagus/seapedia/internal/domain/order"
	"github.com/bagus/seapedia/internal/pkg/clock"
	"github.com/bagus/seapedia/internal/repository/postgres"
)

// Usecase handles overdue order processing.
type Usecase struct {
	orderRepo   order.Repository
	overdueRepo *postgres.OverdueRepository
}

// New creates a new overdue Usecase.
func New(orderRepo order.Repository, overdueRepo *postgres.OverdueRepository) *Usecase {
	return &Usecase{orderRepo: orderRepo, overdueRepo: overdueRepo}
}

// ProcessAll finds and processes all overdue orders.
func (u *Usecase) ProcessAll(ctx context.Context) error {
	orders, err := u.orderRepo.FindOverdue(ctx, clock.Now())
	if err != nil {
		return err
	}
	for _, o := range orders {
		if err := u.overdueRepo.ProcessOverdue(ctx, o.ID); err != nil {
			log.Printf("overdue processing failed for order %s: %v", o.ID, err)
		}
	}
	return nil
}
