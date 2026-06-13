package wallet

import "context"

// Repository defines the persistence interface for the Wallet domain.
type Repository interface {
	FindByUserID(ctx context.Context, userID string) (*Wallet, error)
	CreateWallet(ctx context.Context, w *Wallet) error
	// Credit adds the amount to the wallet balance and records a transaction.
	Credit(ctx context.Context, walletID string, amount int64, txType TxType, refOrderID *string) error
	// Debit subtracts the amount from the wallet balance, returning an error if insufficient.
	Debit(ctx context.Context, walletID string, amount int64, txType TxType, refOrderID *string) error
	ListTransactions(ctx context.Context, walletID string, page, limit int) ([]*WalletTransaction, int64, error)
}
