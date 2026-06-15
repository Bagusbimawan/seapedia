package order

import (
	"context"

	"github.com/bagus/seapedia/internal/domain/order"
	"github.com/bagus/seapedia/internal/domain/store"
	"github.com/bagus/seapedia/internal/pkg/apperror"
)

// Usecase handles order business logic.
type Usecase struct {
	orderRepo  order.Repository
	incomeRepo order.SellerIncomeRepository
	storeRepo  store.Repository
}

// New creates a new order Usecase.
func New(orderRepo order.Repository, incomeRepo order.SellerIncomeRepository, storeRepo store.Repository) *Usecase {
	return &Usecase{orderRepo: orderRepo, incomeRepo: incomeRepo, storeRepo: storeRepo}
}

// GetBuyerOrder returns an order for the buyer.
func (u *Usecase) GetBuyerOrder(ctx context.Context, buyerID, orderID string) (*order.Order, error) {
	o, err := u.orderRepo.FindByID(ctx, orderID)
	if err != nil {
		return nil, err
	}
	if o.BuyerUserID != buyerID {
		return nil, apperror.Forbidden("order does not belong to you")
	}
	return o, nil
}

// ListBuyerOrders lists orders for a buyer.
func (u *Usecase) ListBuyerOrders(ctx context.Context, buyerID string, page, limit int) ([]*order.Order, int64, error) {
	return u.orderRepo.ListByBuyer(ctx, buyerID, page, limit)
}

// GetSellerOrder returns an order for the seller.
func (u *Usecase) GetSellerOrder(ctx context.Context, sellerID, orderID string) (*order.Order, error) {
	s, err := u.storeRepo.FindBySellerID(ctx, sellerID)
	if err != nil {
		return nil, err
	}
	o, err := u.orderRepo.FindByID(ctx, orderID)
	if err != nil {
		return nil, err
	}
	if o.StoreID != s.ID {
		return nil, apperror.Forbidden("order does not belong to your store")
	}
	return o, nil
}

// ListSellerOrders lists orders for the seller's store.
func (u *Usecase) ListSellerOrders(ctx context.Context, sellerID string, status *order.Status, page, limit int) ([]*order.Order, int64, error) {
	s, err := u.storeRepo.FindBySellerID(ctx, sellerID)
	if err != nil {
		return nil, 0, err
	}
	return u.orderRepo.ListByStore(ctx, s.ID, status, page, limit)
}

// MarkReady transitions order to MENUNGGU_PENGIRIM and records seller income.
func (u *Usecase) MarkReady(ctx context.Context, sellerID, orderID string) (*order.Order, error) {
	s, err := u.storeRepo.FindBySellerID(ctx, sellerID)
	if err != nil {
		return nil, err
	}
	o, err := u.orderRepo.FindByID(ctx, orderID)
	if err != nil {
		return nil, err
	}
	if o.StoreID != s.ID {
		return nil, apperror.Forbidden("order does not belong to your store")
	}

	if o.Status == order.StatusMenungguPengirim {
		return o, nil
	}
	if o.Status != order.StatusSedangDikemas {
		return nil, apperror.BadRequest("order is not in SEDANG_DIKEMAS status")
	}
	if !o.Status.CanTransitionTo(order.StatusMenungguPengirim) {
		return nil, apperror.BadRequest("invalid status transition")
	}

	if err := u.orderRepo.UpdateStatus(ctx, orderID, order.StatusMenungguPengirim); err != nil {
		return nil, err
	}
	if err := u.orderRepo.AddStatusHistory(ctx, orderID, order.StatusMenungguPengirim); err != nil {
		return nil, err
	}

	incomeAmount := o.Total - o.DeliveryFee
	if incomeAmount > 0 {
		existing, err := u.orderRepo.FindIncomeByOrder(ctx, orderID)
		if err != nil {
			return nil, err
		}
		if existing == 0 {
			if err := u.incomeRepo.Insert(ctx, s.ID, orderID, "INCOME", incomeAmount); err != nil {
				return nil, err
			}
		}
	}

	o.Status = order.StatusMenungguPengirim
	return o, nil
}

// ListAll lists all orders (admin).
func (u *Usecase) ListAll(ctx context.Context, status *order.Status, page, limit int) ([]*order.Order, int64, error) {
	return u.orderRepo.ListAll(ctx, status, page, limit)
}

// ListSellerIncome lists seller income records.
func (u *Usecase) ListSellerIncome(ctx context.Context, sellerID string, page, limit int) ([]order.SellerIncome, int64, error) {
	s, err := u.storeRepo.FindBySellerID(ctx, sellerID)
	if err != nil {
		return nil, 0, err
	}
	return u.incomeRepo.ListByStore(ctx, s.ID, page, limit)
}
