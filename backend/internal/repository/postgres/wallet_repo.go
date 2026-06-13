package postgres

import (
	"context"
	"errors"

	"github.com/bagus/seapedia/internal/domain/wallet"
	"github.com/bagus/seapedia/internal/pkg/apperror"
	"gorm.io/gorm"
)

type walletRepository struct {
	db *gorm.DB
}

// NewWalletRepository returns a postgres-backed wallet.Repository.
func NewWalletRepository(db *gorm.DB) wallet.Repository {
	return &walletRepository{db: db}
}

func (r *walletRepository) FindByUserID(ctx context.Context, userID string) (*wallet.Wallet, error) {
	var m WalletModel
	if err := r.db.WithContext(ctx).First(&m, "user_id = ?", userID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperror.NotFound("wallet not found")
		}
		return nil, err
	}
	return modelToWallet(&m), nil
}

func (r *walletRepository) CreateWallet(ctx context.Context, w *wallet.Wallet) error {
	m := &WalletModel{
		ID:      w.ID,
		UserID:  w.UserID,
		Balance: w.Balance,
	}
	return r.db.WithContext(ctx).Create(m).Error
}

func (r *walletRepository) Credit(ctx context.Context, walletID string, amount int64, txType wallet.TxType, refOrderID *string) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// Lock the wallet row.
		var m WalletModel
		if err := tx.Set("gorm:query_option", "FOR UPDATE").First(&m, "id = ?", walletID).Error; err != nil {
			return err
		}
		newBalance := m.Balance + amount
		if err := tx.Model(&WalletModel{}).Where("id = ?", walletID).
			Update("balance", newBalance).Error; err != nil {
			return err
		}
		txModel := &WalletTransactionModel{
			ID:           newUUID(),
			WalletID:     walletID,
			Type:         string(txType),
			Amount:       amount,
			BalanceAfter: newBalance,
			RefOrderID:   refOrderID,
		}
		return tx.Create(txModel).Error
	})
}

func (r *walletRepository) Debit(ctx context.Context, walletID string, amount int64, txType wallet.TxType, refOrderID *string) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var m WalletModel
		if err := tx.Set("gorm:query_option", "FOR UPDATE").First(&m, "id = ?", walletID).Error; err != nil {
			return err
		}
		if m.Balance < amount {
			return apperror.BadRequest("insufficient wallet balance")
		}
		newBalance := m.Balance - amount
		if err := tx.Model(&WalletModel{}).Where("id = ?", walletID).
			Update("balance", newBalance).Error; err != nil {
			return err
		}
		txModel := &WalletTransactionModel{
			ID:           newUUID(),
			WalletID:     walletID,
			Type:         string(txType),
			Amount:       amount,
			BalanceAfter: newBalance,
			RefOrderID:   refOrderID,
		}
		return tx.Create(txModel).Error
	})
}

func (r *walletRepository) ListTransactions(ctx context.Context, walletID string, page, limit int) ([]*wallet.WalletTransaction, int64, error) {
	var total int64
	var models []WalletTransactionModel
	offset := (page - 1) * limit

	q := r.db.WithContext(ctx).Model(&WalletTransactionModel{}).Where("wallet_id = ?", walletID)
	q.Count(&total)
	if err := q.Order("created_at DESC").Offset(offset).Limit(limit).Find(&models).Error; err != nil {
		return nil, 0, err
	}

	txs := make([]*wallet.WalletTransaction, 0, len(models))
	for _, m := range models {
		mc := m
		txs = append(txs, &wallet.WalletTransaction{
			ID:           mc.ID,
			WalletID:     mc.WalletID,
			Type:         wallet.TxType(mc.Type),
			Amount:       mc.Amount,
			BalanceAfter: mc.BalanceAfter,
			RefOrderID:   mc.RefOrderID,
			CreatedAt:    mc.CreatedAt,
		})
	}
	return txs, total, nil
}

func modelToWallet(m *WalletModel) *wallet.Wallet {
	return &wallet.Wallet{
		ID:        m.ID,
		UserID:    m.UserID,
		Balance:   m.Balance,
		CreatedAt: m.CreatedAt,
		UpdatedAt: m.UpdatedAt,
	}
}
