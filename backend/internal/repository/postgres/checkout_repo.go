package postgres

import (
	"context"

	"github.com/bagus/seapedia/internal/domain/delivery"
	"github.com/bagus/seapedia/internal/domain/order"
	"github.com/bagus/seapedia/internal/domain/wallet"
	"github.com/bagus/seapedia/internal/pkg/apperror"
	"gorm.io/gorm"
)

// CheckoutParams holds all data needed for a transactional checkout.
type CheckoutParams struct {
	Order       *order.Order
	WalletID    string
	Total       int64
	DiscountID  *string
	IsVoucher   bool
	CartID      string
	DeliveryJob *delivery.DeliveryJob
	StockItems  []StockDecrement
}

// CheckoutBatchParams holds data for a multi-store checkout transaction.
type CheckoutBatchParams struct {
	Orders     []CheckoutParams
	WalletID   string
	GrandTotal int64
	DiscountID *string
	IsVoucher  bool
	CartID     string
}

// StockDecrement pairs a product ID with quantity to decrement.
type StockDecrement struct {
	ProductID string
	Qty       int
}

// CheckoutRepository executes checkout in a single DB transaction.
type CheckoutRepository struct {
	db *gorm.DB
}

// NewCheckoutRepository returns a new CheckoutRepository.
func NewCheckoutRepository(db *gorm.DB) *CheckoutRepository {
	return &CheckoutRepository{db: db}
}

// Execute runs the full checkout transaction atomically.
func (r *CheckoutRepository) Execute(ctx context.Context, p CheckoutParams) error {
	return r.ExecuteBatch(ctx, CheckoutBatchParams{
		Orders:     []CheckoutParams{p},
		WalletID:   p.WalletID,
		GrandTotal: p.Total,
		DiscountID: p.DiscountID,
		IsVoucher:  p.IsVoucher,
		CartID:     p.CartID,
	})
}

// ExecuteBatch creates one or more orders in a single wallet debit.
func (r *CheckoutRepository) ExecuteBatch(ctx context.Context, batch CheckoutBatchParams) error {
	if len(batch.Orders) == 0 {
		return apperror.BadRequest("no orders to checkout")
	}

	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		for _, p := range batch.Orders {
			for _, item := range p.StockItems {
				result := tx.Exec(
					"UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?",
					item.Qty, item.ProductID, item.Qty,
				)
				if result.Error != nil {
					return result.Error
				}
				if result.RowsAffected == 0 {
					return apperror.BadRequest("insufficient stock for product " + item.ProductID)
				}
			}
		}

		var w WalletModel
		if err := tx.Set("gorm:query_option", "FOR UPDATE").First(&w, "id = ?", batch.WalletID).Error; err != nil {
			return err
		}
		if w.Balance < batch.GrandTotal {
			return apperror.BadRequest("insufficient wallet balance")
		}
		newBalance := w.Balance - batch.GrandTotal
		if err := tx.Model(&WalletModel{}).Where("id = ?", batch.WalletID).
			Update("balance", newBalance).Error; err != nil {
			return err
		}

		firstOrderID := batch.Orders[0].Order.ID
		txModel := &WalletTransactionModel{
			ID:           newUUID(),
			WalletID:     batch.WalletID,
			Type:         string(wallet.TxPayment),
			Amount:       batch.GrandTotal,
			BalanceAfter: newBalance,
			RefOrderID:   &firstOrderID,
		}
		if err := tx.Create(txModel).Error; err != nil {
			return err
		}

		for _, p := range batch.Orders {
			om := orderToModel(p.Order)
			if err := tx.Create(om).Error; err != nil {
				return err
			}
			for _, item := range p.Order.Items {
				im := &OrderItemModel{
					ID:            item.ID,
					OrderID:       p.Order.ID,
					ProductID:     item.ProductID,
					NameSnapshot:  item.NameSnapshot,
					PriceSnapshot: item.PriceSnapshot,
					Quantity:      item.Quantity,
				}
				if err := tx.Create(im).Error; err != nil {
					return err
				}
			}

			history := &OrderStatusHistoryModel{
				ID:      newUUID(),
				OrderID: p.Order.ID,
				Status:  string(order.StatusSedangDikemas),
			}
			if err := tx.Create(history).Error; err != nil {
				return err
			}

			dm := &DeliveryJobModel{
				ID:            p.DeliveryJob.ID,
				OrderID:       p.DeliveryJob.OrderID,
				EarningAmount: p.DeliveryJob.EarningAmount,
			}
			if err := tx.Create(dm).Error; err != nil {
				return err
			}
		}

		if batch.IsVoucher && batch.DiscountID != nil {
			result := tx.Exec(
				"UPDATE discounts SET remaining_usage = remaining_usage - 1 WHERE id = ? AND remaining_usage > 0",
				*batch.DiscountID,
			)
			if result.Error != nil {
				return result.Error
			}
			if result.RowsAffected == 0 {
				return apperror.BadRequest("discount usage exhausted")
			}
		}

		if err := tx.Delete(&CartItemModel{}, "cart_id = ?", batch.CartID).Error; err != nil {
			return err
		}
		if err := tx.Model(&CartModel{}).Where("id = ?", batch.CartID).Update("store_id", nil).Error; err != nil {
			return err
		}

		return nil
	})
}
