package wallet

import "time"

// TxType represents the type of a wallet transaction.
type TxType string

const (
	TxTopup   TxType = "TOPUP"
	TxPayment TxType = "PAYMENT"
	TxRefund  TxType = "REFUND"
)

// Wallet holds a user's balance.
type Wallet struct {
	ID        string
	UserID    string
	Balance   int64
	CreatedAt time.Time
	UpdatedAt time.Time
}

// WalletTransaction is a record of a balance change.
type WalletTransaction struct {
	ID           string
	WalletID     string
	Type         TxType
	Amount       int64
	BalanceAfter int64
	RefOrderID   *string
	CreatedAt    time.Time
}
