package postgres

import (
	"context"
	"errors"

	"github.com/bagus/seapedia/internal/domain/order"
	"github.com/bagus/seapedia/internal/domain/wallet"
	"gorm.io/gorm"
)

// OverdueRepository processes overdue orders in a single transaction.
type OverdueRepository struct {
	db *gorm.DB
}

// NewOverdueRepository returns a new OverdueRepository.
func NewOverdueRepository(db *gorm.DB) *OverdueRepository {
	return &OverdueRepository{db: db}
}

// ProcessOverdue handles refund, reversal, stock restore for one overdue order.
func (r *OverdueRepository) ProcessOverdue(ctx context.Context, orderID string) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var om OrderModel
		if err := tx.Set("gorm:query_option", "FOR UPDATE").First(&om, "id = ?", orderID).Error; err != nil {
			return err
		}
		status := order.Status(om.Status)
		if status.IsTerminal() {
			return nil
		}

		if err := tx.Model(&OrderModel{}).Where("id = ?", orderID).
			Update("status", string(order.StatusDikembalikan)).Error; err != nil {
			return err
		}
		history := &OrderStatusHistoryModel{
			ID:      newUUID(),
			OrderID: orderID,
			Status:  string(order.StatusDikembalikan),
		}
		if err := tx.Create(history).Error; err != nil {
			return err
		}

		var buyerWallet WalletModel
		if err := tx.First(&buyerWallet, "user_id = ?", om.BuyerUserID).Error; err != nil {
			return err
		}
		newBalance := buyerWallet.Balance + om.Total
		if err := tx.Model(&WalletModel{}).Where("id = ?", buyerWallet.ID).
			Update("balance", newBalance).Error; err != nil {
			return err
		}
		refOrderID := orderID
		refundTx := &WalletTransactionModel{
			ID:           newUUID(),
			WalletID:     buyerWallet.ID,
			Type:         string(wallet.TxRefund),
			Amount:       om.Total,
			BalanceAfter: newBalance,
			RefOrderID:   &refOrderID,
		}
		if err := tx.Create(refundTx).Error; err != nil {
			return err
		}

		var income SellerIncomeModel
		err := tx.Where("order_id = ? AND type = 'INCOME'", orderID).
			Order("created_at DESC").First(&income).Error
		if err == nil {
			reversal := &SellerIncomeModel{
				ID:      newUUID(),
				StoreID: income.StoreID,
				OrderID: orderID,
				Type:    "REVERSAL",
				Amount:  income.Amount,
			}
			if err := tx.Create(reversal).Error; err != nil {
				return err
			}
		} else if !isNotFound(err) {
			return err
		}

		var items []OrderItemModel
		if err := tx.Where("order_id = ?", orderID).Find(&items).Error; err != nil {
			return err
		}
		for _, item := range items {
			result := tx.Exec(
				"UPDATE products SET stock = stock + ? WHERE id = ?",
				item.Quantity, item.ProductID,
			)
			if result.Error != nil {
				return result.Error
			}
		}

		return nil
	})
}

func isNotFound(err error) bool {
	return errors.Is(err, gorm.ErrRecordNotFound)
}
