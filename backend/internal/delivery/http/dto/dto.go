package dto

import (
	"time"

	"github.com/bagus/seapedia/internal/domain/address"
	"github.com/bagus/seapedia/internal/domain/cart"
	"github.com/bagus/seapedia/internal/domain/delivery"
	"github.com/bagus/seapedia/internal/domain/discount"
	"github.com/bagus/seapedia/internal/domain/order"
	"github.com/bagus/seapedia/internal/domain/product"
	"github.com/bagus/seapedia/internal/domain/review"
	"github.com/bagus/seapedia/internal/domain/store"
	"github.com/bagus/seapedia/internal/domain/user"
	"github.com/bagus/seapedia/internal/domain/wallet"
)

// ── Auth ──────────────────────────────────────────────────────────────────────

type RegisterReq struct {
	Username string   `json:"username" validate:"required,min=3,max=100"`
	Email    string   `json:"email" validate:"required,email"`
	Phone    string   `json:"phone" validate:"omitempty,max=20"`
	Password string   `json:"password" validate:"required,min=8"`
	Roles    []string `json:"roles" validate:"required,min=1,dive,oneof=SELLER BUYER DRIVER"`
}

type LoginReq struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

type SwitchRoleReq struct {
	Role string `json:"role" validate:"required,oneof=SELLER BUYER DRIVER"`
}

type UserResponse struct {
	ID       string   `json:"id"`
	Username string   `json:"username"`
	Email    string   `json:"email"`
	Phone    string   `json:"phone"`
	Roles    []string `json:"roles"`
}

type LoginResponse struct {
	Token           string       `json:"token"`
	User            UserResponse `json:"user"`
	ActiveRole      string       `json:"active_role"`
	NeedsRoleSelect bool         `json:"needs_role_select"`
}

func ToUserResponse(u *user.User) UserResponse {
	roles := make([]string, 0, len(u.Roles))
	for _, r := range u.Roles {
		roles = append(roles, string(r))
	}
	return UserResponse{
		ID:       u.ID,
		Username: u.Username,
		Email:    u.Email,
		Phone:    u.Phone,
		Roles:    roles,
	}
}

// ── Store ─────────────────────────────────────────────────────────────────────

type CreateStoreReq struct {
	Name        string `json:"name" validate:"required,min=2,max=200"`
	Description string `json:"description" validate:"omitempty,max=2000"`
}

type AdminCreateStoreReq struct {
	SellerUserID string `json:"seller_user_id" validate:"required,uuid"`
	Name         string `json:"name" validate:"required,min=2,max=200"`
	Description  string `json:"description" validate:"omitempty,max=2000"`
}

type StoreResponse struct {
	ID            string `json:"id"`
	SellerUserID  string `json:"seller_user_id"`
	Name          string `json:"name"`
	Description   string `json:"description"`
	ProvisionedBy string `json:"provisioned_by,omitempty"`
	CreatedAt     string `json:"created_at"`
}

func ToStoreResponse(s *store.Store) StoreResponse {
	return StoreResponse{
		ID:            s.ID,
		SellerUserID:  s.SellerUserID,
		Name:          s.Name,
		Description:   s.Description,
		ProvisionedBy: s.ProvisionedBy,
		CreatedAt:     s.CreatedAt.Format(time.RFC3339),
	}
}

type DemoSellerResponse struct {
	Email        string `json:"email"`
	Username     string `json:"username"`
	StoreName    string `json:"store_name"`
	DemoPassword string `json:"demo_password,omitempty"`
}

func ToDemoSellerResponse(email, username, storeName, demoPassword string) DemoSellerResponse {
	return DemoSellerResponse{
		Email:        email,
		Username:     username,
		StoreName:    storeName,
		DemoPassword: demoPassword,
	}
}

type AdminCreateSellerReq struct {
	Username    string `json:"username" validate:"required,min=3,max=100"`
	Email       string `json:"email" validate:"required,email"`
	Password    string `json:"password" validate:"required,min=6"`
	StoreName   string `json:"store_name" validate:"required,min=2,max=200"`
	Description string `json:"description" validate:"omitempty,max=2000"`
}

type AdminCreateSellerResponse struct {
	User         UserResponse  `json:"user"`
	Store        StoreResponse `json:"store"`
	DemoPassword string        `json:"demo_password"`
}

// ── Product ───────────────────────────────────────────────────────────────────

type CreateProductReq struct {
	Name        string `json:"name" validate:"required,min=2,max=255"`
	Description string `json:"description" validate:"omitempty,max=2000"`
	Price       int64  `json:"price" validate:"required,min=1"`
	Stock       int    `json:"stock" validate:"required,min=0"`
}

type ProductResponse struct {
	ID          string `json:"id"`
	StoreID     string `json:"store_id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Price       int64  `json:"price"`
	Stock       int    `json:"stock"`
	CreatedAt   string `json:"created_at"`
}

func ToProductResponse(p *product.Product) ProductResponse {
	return ProductResponse{
		ID:          p.ID,
		StoreID:     p.StoreID,
		Name:        p.Name,
		Description: p.Description,
		Price:       p.Price,
		Stock:       p.Stock,
		CreatedAt:   p.CreatedAt.Format(time.RFC3339),
	}
}

// ── Wallet ────────────────────────────────────────────────────────────────────

type TopupReq struct {
	Amount int64 `json:"amount" validate:"required,min=1"`
}

type WalletResponse struct {
	ID      string `json:"id"`
	UserID  string `json:"user_id"`
	Balance int64  `json:"balance"`
}

type WalletTxResponse struct {
	ID           string  `json:"id"`
	Type         string  `json:"type"`
	Amount       int64   `json:"amount"`
	BalanceAfter int64   `json:"balance_after"`
	RefOrderID   *string `json:"ref_order_id"`
	CreatedAt    string  `json:"created_at"`
}

func ToWalletResponse(w *wallet.Wallet) WalletResponse {
	return WalletResponse{ID: w.ID, UserID: w.UserID, Balance: w.Balance}
}

func ToWalletTxResponse(t *wallet.WalletTransaction) WalletTxResponse {
	return WalletTxResponse{
		ID:           t.ID,
		Type:         string(t.Type),
		Amount:       t.Amount,
		BalanceAfter: t.BalanceAfter,
		RefOrderID:   t.RefOrderID,
		CreatedAt:    t.CreatedAt.Format(time.RFC3339),
	}
}

// ── Address ───────────────────────────────────────────────────────────────────

type CreateAddressReq struct {
	Label      string `json:"label" validate:"required,min=1,max=100"`
	Street     string `json:"street" validate:"required,min=1"`
	City       string `json:"city" validate:"required,min=1,max=100"`
	ZipCode    string `json:"zip_code" validate:"required,min=1,max=10"`
	IsDefault  bool   `json:"is_default"`
}

type AddressResponse struct {
	ID        string `json:"id"`
	Label     string `json:"label"`
	Street    string `json:"street"`
	City      string `json:"city"`
	ZipCode   string `json:"zip_code"`
	IsDefault bool   `json:"is_default"`
}

func ToAddressResponse(a *address.Address) AddressResponse {
	return AddressResponse{
		ID:        a.ID,
		Label:     a.Label,
		Street:    a.Street,
		City:      a.City,
		ZipCode:   a.ZipCode,
		IsDefault: a.IsDefault,
	}
}

// ── Cart ──────────────────────────────────────────────────────────────────────

type AddCartItemReq struct {
	ProductID string `json:"product_id" validate:"required,uuid"`
	Quantity  int    `json:"quantity" validate:"required,min=1"`
}

type UpdateCartItemReq struct {
	Quantity int `json:"quantity" validate:"required,min=1"`
}

type CartItemResponse struct {
	ProductID string `json:"product_id"`
	Quantity  int    `json:"quantity"`
	Name      string `json:"name,omitempty"`
	Price     int64  `json:"price,omitempty"`
	Stock     int    `json:"stock,omitempty"`
	StoreID   string `json:"store_id,omitempty"`
	StoreName string `json:"store_name,omitempty"`
}

type CartResponse struct {
	ID      string             `json:"id"`
	StoreID *string            `json:"store_id"`
	Items   []CartItemResponse `json:"items"`
}

func ToCartResponse(c *cart.Cart) CartResponse {
	items := make([]CartItemResponse, 0, len(c.Items))
	for _, item := range c.Items {
		resp := CartItemResponse{
			ProductID: item.ProductID,
			Quantity:  item.Quantity,
		}
		if item.Product != nil {
			resp.Name = item.Product.Name
			resp.Price = item.Product.Price
			resp.Stock = item.Product.Stock
			resp.StoreID = item.Product.StoreID
			resp.StoreName = item.Product.StoreName
		}
		items = append(items, resp)
	}
	return CartResponse{ID: c.ID, StoreID: c.StoreID, Items: items}
}

// ── Checkout ──────────────────────────────────────────────────────────────────

type CheckoutReq struct {
	AddressID      string `json:"address_id" validate:"required,uuid"`
	DeliveryMethod string `json:"delivery_method" validate:"required,oneof=INSTANT NEXT_DAY REGULAR"`
	DiscountCode   string `json:"discount_code" validate:"omitempty"`
}

type CheckoutResponse struct {
	Orders []OrderResponse `json:"orders"`
}

func ToCheckoutResponse(orders []*order.Order) CheckoutResponse {
	items := make([]OrderResponse, 0, len(orders))
	for _, o := range orders {
		items = append(items, ToOrderResponse(o))
	}
	return CheckoutResponse{Orders: items}
}

// ── Order ─────────────────────────────────────────────────────────────────────

type OrderResponse struct {
	ID              string                `json:"id"`
	BuyerUserID     string                `json:"buyer_user_id"`
	StoreID         string                `json:"store_id"`
	DeliveryMethod  string                `json:"delivery_method"`
	Subtotal        int64                 `json:"subtotal"`
	DiscountAmount  int64                 `json:"discount_amount"`
	TaxAmount       int64                 `json:"tax_amount"`
	DeliveryFee     int64                 `json:"delivery_fee"`
	Total           int64                 `json:"total"`
	Status          string                `json:"status"`
	DeadlineAt      string                `json:"deadline_at"`
	AddressSnapshot order.AddressSnapshot `json:"address_snapshot"`
	Items           []OrderItemResponse   `json:"items,omitempty"`
	CreatedAt       string                `json:"created_at"`
}

type OrderItemResponse struct {
	ProductID     string `json:"product_id"`
	NameSnapshot  string `json:"name_snapshot"`
	PriceSnapshot int64  `json:"price_snapshot"`
	Quantity      int    `json:"quantity"`
}

func ToOrderResponse(o *order.Order) OrderResponse {
	items := make([]OrderItemResponse, 0, len(o.Items))
	for _, item := range o.Items {
		items = append(items, OrderItemResponse{
			ProductID:     item.ProductID,
			NameSnapshot:  item.NameSnapshot,
			PriceSnapshot: item.PriceSnapshot,
			Quantity:      item.Quantity,
		})
	}
	return OrderResponse{
		ID:              o.ID,
		BuyerUserID:     o.BuyerUserID,
		StoreID:         o.StoreID,
		DeliveryMethod:  string(o.DeliveryMethod),
		Subtotal:        o.Subtotal,
		DiscountAmount:  o.DiscountAmount,
		TaxAmount:       o.TaxAmount,
		DeliveryFee:     o.DeliveryFee,
		Total:           o.Total,
		Status:          string(o.Status),
		DeadlineAt:      o.DeadlineAt.Format(time.RFC3339),
		AddressSnapshot: o.AddressSnapshot,
		Items:           items,
		CreatedAt:       o.CreatedAt.Format(time.RFC3339),
	}
}

// ── Discount ──────────────────────────────────────────────────────────────────

type CreateVoucherReq struct {
	Code           string `json:"code" validate:"required,min=2,max=50"`
	DiscountType   string `json:"discount_type" validate:"required,oneof=PERCENT FIXED"`
	DiscountValue  int64  `json:"discount_value" validate:"required,min=1"`
	ExpiryDate     string `json:"expiry_date" validate:"required"`
	RemainingUsage int    `json:"remaining_usage" validate:"required,min=1"`
}

type CreatePromoReq struct {
	Code          string `json:"code" validate:"required,min=2,max=50"`
	DiscountType  string `json:"discount_type" validate:"required,oneof=PERCENT FIXED"`
	DiscountValue int64  `json:"discount_value" validate:"required,min=1"`
	ExpiryDate    string `json:"expiry_date" validate:"required"`
}

type ValidateDiscountReq struct {
	Code     string `json:"code" validate:"required"`
	Subtotal int64  `json:"subtotal" validate:"required,min=1"`
}

type DiscountResponse struct {
	ID             string `json:"id"`
	Code           string `json:"code"`
	Kind           string `json:"kind"`
	DiscountType   string `json:"discount_type"`
	DiscountValue  int64  `json:"discount_value"`
	ExpiryDate     string `json:"expiry_date"`
	RemainingUsage *int   `json:"remaining_usage"`
}

func ToDiscountResponse(d *discount.Discount) DiscountResponse {
	return DiscountResponse{
		ID:             d.ID,
		Code:           d.Code,
		Kind:           string(d.Kind),
		DiscountType:   string(d.DiscountType),
		DiscountValue:  d.DiscountValue,
		ExpiryDate:     d.ExpiryDate.Format(time.RFC3339),
		RemainingUsage: d.RemainingUsage,
	}
}

// ── Delivery ──────────────────────────────────────────────────────────────────

type DeliveryJobResponse struct {
	ID            string  `json:"id"`
	OrderID       string  `json:"order_id"`
	DriverUserID  *string `json:"driver_user_id"`
	EarningAmount int64   `json:"earning_amount"`
	StoreName     string  `json:"store_name,omitempty"`
	TakenAt       *string `json:"taken_at"`
	CompletedAt   *string `json:"completed_at"`
	CreatedAt     string  `json:"created_at"`
}

func ToDeliveryJobResponse(j *delivery.DeliveryJob) DeliveryJobResponse {
	resp := DeliveryJobResponse{
		ID:            j.ID,
		OrderID:       j.OrderID,
		DriverUserID:  j.DriverUserID,
		EarningAmount: j.EarningAmount,
		StoreName:     j.StoreName,
		CreatedAt:     j.CreatedAt.Format(time.RFC3339),
	}
	if j.TakenAt != nil {
		s := j.TakenAt.Format(time.RFC3339)
		resp.TakenAt = &s
	}
	if j.CompletedAt != nil {
		s := j.CompletedAt.Format(time.RFC3339)
		resp.CompletedAt = &s
	}
	return resp
}

// ── Review ────────────────────────────────────────────────────────────────────

type CreateReviewReq struct {
	ReviewerName string `json:"reviewer_name" validate:"required,min=2,max=100"`
	Rating       int    `json:"rating" validate:"required,min=1,max=5"`
	Comment      string `json:"comment" validate:"required,min=1,max=2000"`
}

type ReviewResponse struct {
	ID           string `json:"id"`
	ReviewerName string `json:"reviewer_name"`
	Rating       int    `json:"rating"`
	Comment      string `json:"comment"`
	CreatedAt    string `json:"created_at"`
}

func ToReviewResponse(r *review.AppReview) ReviewResponse {
	return ReviewResponse{
		ID:           r.ID,
		ReviewerName: r.ReviewerName,
		Rating:       r.Rating,
		Comment:      r.Comment,
		CreatedAt:    r.CreatedAt.Format(time.RFC3339),
	}
}

// ── Seller Income ─────────────────────────────────────────────────────────────

type SellerIncomeResponse struct {
	ID        string `json:"id"`
	StoreID   string `json:"store_id"`
	OrderID   string `json:"order_id"`
	Type      string `json:"type"`
	Amount    int64  `json:"amount"`
	CreatedAt string `json:"created_at"`
}

func ToSellerIncomeResponse(i order.SellerIncome) SellerIncomeResponse {
	return SellerIncomeResponse{
		ID:        i.ID,
		StoreID:   i.StoreID,
		OrderID:   i.OrderID,
		Type:      i.Type,
		Amount:    i.Amount,
		CreatedAt: i.CreatedAt.Format(time.RFC3339),
	}
}

// ── Admin ─────────────────────────────────────────────────────────────────────

type AdvanceDayResponse struct {
	OffsetHours int64 `json:"offset_hours"`
}
