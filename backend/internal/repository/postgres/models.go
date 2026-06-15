package postgres

import (
	"database/sql/driver"
	"encoding/json"
	"fmt"
	"time"
)

// ──────────────────────────────────────────────
// Custom JSONB type for address snapshot
// ──────────────────────────────────────────────

// AddressSnapshotJSON is a JSONB-serialisable address snapshot.
type AddressSnapshotJSON struct {
	Label   string `json:"label"`
	Street  string `json:"street"`
	City    string `json:"city"`
	ZipCode string `json:"zip_code"`
}

func (a AddressSnapshotJSON) Value() (driver.Value, error) {
	b, err := json.Marshal(a)
	return string(b), err
}

func (a *AddressSnapshotJSON) Scan(value interface{}) error {
	var bytes []byte
	switch v := value.(type) {
	case string:
		bytes = []byte(v)
	case []byte:
		bytes = v
	default:
		return fmt.Errorf("cannot scan type %T into AddressSnapshotJSON", value)
	}
	return json.Unmarshal(bytes, a)
}

// ──────────────────────────────────────────────
// GORM Models (separate from domain entities)
// ──────────────────────────────────────────────

// UserModel maps to the users table.
type UserModel struct {
	ID           string    `gorm:"type:uuid;primaryKey"`
	Username     string    `gorm:"uniqueIndex;not null;size:100"`
	Email        string    `gorm:"uniqueIndex;not null;size:255"`
	Phone        string    `gorm:"size:20"`
	PasswordHash string    `gorm:"not null"`
	CreatedAt    time.Time `gorm:"autoCreateTime"`
	UpdatedAt    time.Time `gorm:"autoUpdateTime"`
}

func (UserModel) TableName() string { return "users" }

// UserRoleModel maps to the user_roles table.
type UserRoleModel struct {
	ID     string `gorm:"type:uuid;primaryKey"`
	UserID string `gorm:"type:uuid;not null;index"`
	Role   string `gorm:"size:20;not null"`
}

func (UserRoleModel) TableName() string { return "user_roles" }

// AddressModel maps to the addresses table.
type AddressModel struct {
	ID        string    `gorm:"type:uuid;primaryKey"`
	UserID    string    `gorm:"type:uuid;not null;index"`
	Label     string    `gorm:"size:100"`
	Street    string    `gorm:"type:text"`
	City      string    `gorm:"size:100"`
	ZipCode   string    `gorm:"size:10"`
	IsDefault bool      `gorm:"not null;default:false"`
	CreatedAt time.Time `gorm:"autoCreateTime"`
	UpdatedAt time.Time `gorm:"autoUpdateTime"`
}

func (AddressModel) TableName() string { return "addresses" }

// StoreModel maps to the stores table.
type StoreModel struct {
	ID            string    `gorm:"type:uuid;primaryKey"`
	SellerUserID  string    `gorm:"type:uuid;uniqueIndex;not null"`
	Name          string    `gorm:"uniqueIndex;not null;size:200"`
	Description   string    `gorm:"type:text"`
	ProvisionedBy string    `gorm:"size:20;not null;default:seller"`
	DemoPassword  string    `gorm:"size:100"`
	CreatedAt     time.Time `gorm:"autoCreateTime"`
	UpdatedAt     time.Time `gorm:"autoUpdateTime"`
}

func (StoreModel) TableName() string { return "stores" }

// ProductModel maps to the products table.
type ProductModel struct {
	ID          string    `gorm:"type:uuid;primaryKey"`
	StoreID     string    `gorm:"type:uuid;not null;index"`
	Name        string    `gorm:"not null;size:255"`
	Description string    `gorm:"type:text"`
	Price       int64     `gorm:"not null"`
	Stock       int       `gorm:"not null;default:0"`
	CreatedAt   time.Time `gorm:"autoCreateTime"`
	UpdatedAt   time.Time `gorm:"autoUpdateTime"`
}

func (ProductModel) TableName() string { return "products" }

// WalletModel maps to the wallets table.
type WalletModel struct {
	ID        string    `gorm:"type:uuid;primaryKey"`
	UserID    string    `gorm:"type:uuid;uniqueIndex;not null"`
	Balance   int64     `gorm:"not null;default:0"`
	CreatedAt time.Time `gorm:"autoCreateTime"`
	UpdatedAt time.Time `gorm:"autoUpdateTime"`
}

func (WalletModel) TableName() string { return "wallets" }

// WalletTransactionModel maps to the wallet_transactions table.
type WalletTransactionModel struct {
	ID           string    `gorm:"type:uuid;primaryKey"`
	WalletID     string    `gorm:"type:uuid;not null;index"`
	Type         string    `gorm:"size:20;not null"`
	Amount       int64     `gorm:"not null"`
	BalanceAfter int64     `gorm:"not null"`
	RefOrderID   *string   `gorm:"type:uuid"`
	CreatedAt    time.Time `gorm:"autoCreateTime"`
}

func (WalletTransactionModel) TableName() string { return "wallet_transactions" }

// CartModel maps to the carts table.
type CartModel struct {
	ID        string    `gorm:"type:uuid;primaryKey"`
	UserID    string    `gorm:"type:uuid;uniqueIndex;not null"`
	StoreID   *string   `gorm:"type:uuid"`
	CreatedAt time.Time `gorm:"autoCreateTime"`
	UpdatedAt time.Time `gorm:"autoUpdateTime"`
}

func (CartModel) TableName() string { return "carts" }

// CartItemModel maps to the cart_items table.
type CartItemModel struct {
	ID        string    `gorm:"type:uuid;primaryKey"`
	CartID    string    `gorm:"type:uuid;not null;index"`
	ProductID string    `gorm:"type:uuid;not null"`
	Quantity  int       `gorm:"not null"`
	CreatedAt time.Time `gorm:"autoCreateTime"`
	UpdatedAt time.Time `gorm:"autoUpdateTime"`
}

func (CartItemModel) TableName() string { return "cart_items" }

// DiscountModel maps to the discounts table.
type DiscountModel struct {
	ID             string    `gorm:"type:uuid;primaryKey"`
	Code           string    `gorm:"uniqueIndex;size:50"`
	Kind           string    `gorm:"size:20;not null"`
	DiscountType   string    `gorm:"size:20;not null"`
	DiscountValue  int64     `gorm:"not null"`
	ExpiryDate     time.Time `gorm:"not null"`
	RemainingUsage *int      `gorm:""`
	CreatedAt      time.Time `gorm:"autoCreateTime"`
}

func (DiscountModel) TableName() string { return "discounts" }

// OrderModel maps to the orders table.
type OrderModel struct {
	ID              string              `gorm:"type:uuid;primaryKey"`
	BuyerUserID     string              `gorm:"type:uuid;not null;index"`
	StoreID         string              `gorm:"type:uuid;not null;index"`
	DiscountID      *string             `gorm:"type:uuid"`
	AddressSnapshot AddressSnapshotJSON `gorm:"type:jsonb;not null;default:'{}'"`
	DeliveryMethod  string              `gorm:"size:20;not null"`
	Subtotal        int64               `gorm:"not null;default:0"`
	DiscountAmount  int64               `gorm:"not null;default:0"`
	TaxAmount       int64               `gorm:"not null;default:0"`
	DeliveryFee     int64               `gorm:"not null;default:0"`
	Total           int64               `gorm:"not null;default:0"`
	Status          string              `gorm:"size:30;not null;default:'SEDANG_DIKEMAS';index"`
	DeadlineAt      time.Time           `gorm:"index"`
	CreatedAt       time.Time           `gorm:"autoCreateTime"`
	UpdatedAt       time.Time           `gorm:"autoUpdateTime"`
}

func (OrderModel) TableName() string { return "orders" }

// OrderItemModel maps to the order_items table.
type OrderItemModel struct {
	ID            string `gorm:"type:uuid;primaryKey"`
	OrderID       string `gorm:"type:uuid;not null;index"`
	ProductID     string `gorm:"type:uuid;not null"`
	NameSnapshot  string `gorm:"size:255;not null"`
	PriceSnapshot int64  `gorm:"not null"`
	Quantity      int    `gorm:"not null"`
}

func (OrderItemModel) TableName() string { return "order_items" }

// OrderStatusHistoryModel maps to the order_status_history table.
type OrderStatusHistoryModel struct {
	ID        string    `gorm:"type:uuid;primaryKey"`
	OrderID   string    `gorm:"type:uuid;not null;index"`
	Status    string    `gorm:"size:30;not null"`
	CreatedAt time.Time `gorm:"autoCreateTime"`
}

func (OrderStatusHistoryModel) TableName() string { return "order_status_history" }

// DeliveryJobModel maps to the delivery_jobs table.
type DeliveryJobModel struct {
	ID            string     `gorm:"type:uuid;primaryKey"`
	OrderID       string     `gorm:"type:uuid;uniqueIndex;not null"`
	DriverUserID  *string    `gorm:"type:uuid;index"`
	EarningAmount int64      `gorm:"not null;default:0"`
	TakenAt       *time.Time `gorm:""`
	CompletedAt   *time.Time `gorm:""`
	CreatedAt     time.Time  `gorm:"autoCreateTime"`
}

func (DeliveryJobModel) TableName() string { return "delivery_jobs" }

// SellerIncomeModel maps to the seller_incomes table.
type SellerIncomeModel struct {
	ID        string    `gorm:"type:uuid;primaryKey"`
	StoreID   string    `gorm:"type:uuid;not null;index"`
	OrderID   string    `gorm:"type:uuid;not null;index"`
	Type      string    `gorm:"size:20;not null"`
	Amount    int64     `gorm:"not null"`
	CreatedAt time.Time `gorm:"autoCreateTime"`
}

func (SellerIncomeModel) TableName() string { return "seller_incomes" }

// AppReviewModel maps to the app_reviews table.
type AppReviewModel struct {
	ID           string    `gorm:"type:uuid;primaryKey"`
	ReviewerName string    `gorm:"size:100;not null"`
	Rating       int       `gorm:"not null"`
	Comment      string    `gorm:"type:text"`
	UserID       *string   `gorm:"type:uuid"`
	CreatedAt    time.Time `gorm:"autoCreateTime"`
}

func (AppReviewModel) TableName() string { return "app_reviews" }

// SystemClockModel maps to the system_clock table.
type SystemClockModel struct {
	ID          int       `gorm:"primaryKey;default:1"`
	OffsetHours int64     `gorm:"not null;default:0"`
	UpdatedAt   time.Time `gorm:"autoUpdateTime"`
}

func (SystemClockModel) TableName() string { return "system_clock" }
