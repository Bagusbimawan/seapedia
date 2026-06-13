package delivery

import (
	"context"

	"github.com/bagus/seapedia/internal/domain/delivery"
	"github.com/bagus/seapedia/internal/domain/order"
	"github.com/bagus/seapedia/internal/domain/wallet"
	"github.com/bagus/seapedia/internal/pkg/apperror"
)

// Usecase handles delivery job business logic.
type Usecase struct {
	deliveryRepo delivery.Repository
	orderRepo    order.Repository
	walletRepo   wallet.Repository
}

// New creates a new delivery Usecase.
func New(deliveryRepo delivery.Repository, orderRepo order.Repository, walletRepo wallet.Repository) *Usecase {
	return &Usecase{deliveryRepo: deliveryRepo, orderRepo: orderRepo, walletRepo: walletRepo}
}

// ListAvailable returns jobs not yet taken by a driver.
func (u *Usecase) ListAvailable(ctx context.Context, page, limit int) ([]*delivery.DeliveryJob, int64, error) {
	return u.deliveryRepo.ListAvailable(ctx, page, limit)
}

// ListHistory returns completed jobs for a driver.
func (u *Usecase) ListHistory(ctx context.Context, driverID string, page, limit int) ([]*delivery.DeliveryJob, int64, error) {
	return u.deliveryRepo.ListByDriver(ctx, driverID, page, limit)
}

// TakeJob atomically assigns a driver to a job.
func (u *Usecase) TakeJob(ctx context.Context, driverID, jobID string) (*delivery.DeliveryJob, error) {
	job, err := u.deliveryRepo.FindByID(ctx, jobID)
	if err != nil {
		return nil, err
	}

	o, err := u.orderRepo.FindByID(ctx, job.OrderID)
	if err != nil {
		return nil, err
	}
	if o.Status != order.StatusMenungguPengirim {
		return nil, apperror.BadRequest("order is not ready for pickup")
	}

	if err := u.deliveryRepo.TakeJob(ctx, jobID, driverID); err != nil {
		return nil, err
	}

	if err := u.orderRepo.UpdateStatus(ctx, job.OrderID, order.StatusSedangDikirim); err != nil {
		return nil, err
	}
	if err := u.orderRepo.AddStatusHistory(ctx, job.OrderID, order.StatusSedangDikirim); err != nil {
		return nil, err
	}

	return u.deliveryRepo.FindByID(ctx, jobID)
}

// CompleteJob marks a delivery as complete and credits the driver.
func (u *Usecase) CompleteJob(ctx context.Context, driverID, jobID string) (*delivery.DeliveryJob, error) {
	job, err := u.deliveryRepo.FindByID(ctx, jobID)
	if err != nil {
		return nil, err
	}
	if job.DriverUserID == nil || *job.DriverUserID != driverID {
		return nil, apperror.Forbidden("job does not belong to you")
	}
	if job.CompletedAt != nil {
		return nil, apperror.BadRequest("job already completed")
	}

	o, err := u.orderRepo.FindByID(ctx, job.OrderID)
	if err != nil {
		return nil, err
	}
	if o.Status != order.StatusSedangDikirim {
		return nil, apperror.BadRequest("order is not in delivery")
	}

	if err := u.deliveryRepo.CompleteJob(ctx, jobID); err != nil {
		return nil, err
	}
	if err := u.orderRepo.UpdateStatus(ctx, job.OrderID, order.StatusPesananSelesai); err != nil {
		return nil, err
	}
	if err := u.orderRepo.AddStatusHistory(ctx, job.OrderID, order.StatusPesananSelesai); err != nil {
		return nil, err
	}

	w, err := u.walletRepo.FindByUserID(ctx, driverID)
	if err != nil {
		return nil, err
	}
	refOrderID := job.OrderID
	if err := u.walletRepo.Credit(ctx, w.ID, job.EarningAmount, wallet.TxRefund, &refOrderID); err != nil {
		return nil, err
	}

	return u.deliveryRepo.FindByID(ctx, jobID)
}
