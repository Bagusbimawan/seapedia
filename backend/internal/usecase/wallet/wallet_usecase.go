package wallet

import (
	"context"

	"github.com/bagus/seapedia/internal/domain/wallet"
	"github.com/google/uuid"
)

// Usecase handles wallet business logic.
type Usecase struct {
	walletRepo wallet.Repository
}

// New creates a new wallet Usecase.
func New(walletRepo wallet.Repository) *Usecase {
	return &Usecase{walletRepo: walletRepo}
}

// GetWallet returns the buyer's wallet.
func (u *Usecase) GetWallet(ctx context.Context, userID string) (*wallet.Wallet, error) {
	return u.walletRepo.FindByUserID(ctx, userID)
}

// Topup adds balance to the buyer's wallet.
func (u *Usecase) Topup(ctx context.Context, userID string, amount int64) (*wallet.Wallet, error) {
	w, err := u.walletRepo.FindByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if err := u.walletRepo.Credit(ctx, w.ID, amount, wallet.TxTopup, nil); err != nil {
		return nil, err
	}
	return u.walletRepo.FindByUserID(ctx, userID)
}

// ListTransactions returns paginated wallet transactions.
func (u *Usecase) ListTransactions(ctx context.Context, userID string, page, limit int) ([]*wallet.WalletTransaction, int64, error) {
	w, err := u.walletRepo.FindByUserID(ctx, userID)
	if err != nil {
		return nil, 0, err
	}
	return u.walletRepo.ListTransactions(ctx, w.ID, page, limit)
}

// EnsureWallet creates a wallet if it doesn't exist.
func (u *Usecase) EnsureWallet(ctx context.Context, userID string) (*wallet.Wallet, error) {
	w, err := u.walletRepo.FindByUserID(ctx, userID)
	if err == nil {
		return w, nil
	}
	newWallet := &wallet.Wallet{
		ID:      uuid.New().String(),
		UserID:  userID,
		Balance: 0,
	}
	if err := u.walletRepo.CreateWallet(ctx, newWallet); err != nil {
		return nil, err
	}
	return newWallet, nil
}
