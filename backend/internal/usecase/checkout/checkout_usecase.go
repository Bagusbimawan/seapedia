package checkout

import (
	"context"
	"strings"

	"github.com/bagus/seapedia/internal/domain/delivery"
	"github.com/bagus/seapedia/internal/domain/discount"
	"github.com/bagus/seapedia/internal/domain/order"
	"github.com/bagus/seapedia/internal/domain/product"
	"github.com/bagus/seapedia/internal/domain/wallet"
	"github.com/bagus/seapedia/internal/pkg/apperror"
	"github.com/bagus/seapedia/internal/pkg/clock"
	"github.com/bagus/seapedia/internal/repository/postgres"
	"github.com/google/uuid"
)

// Input holds checkout request data.
type Input struct {
	AddressID      string
	DeliveryMethod order.DeliveryMethod
	DiscountCode   string
}

// Usecase handles checkout business logic.
type Usecase struct {
	checkoutRepo *postgres.CheckoutRepository
	cartUC       CartProvider
	addrRepo     AddressProvider
	productRepo  product.Repository
	discountRepo discount.Repository
	walletRepo   wallet.Repository
}

// CartProvider provides cart access for checkout.
type CartProvider interface {
	GetOrCreate(ctx context.Context, userID string) (cartID string, storeID *string, items []CartItemInfo, err error)
}

// CartItemInfo holds cart item data for checkout.
type CartItemInfo struct {
	ProductID string
	Quantity  int
}

// AddressProvider provides address access.
type AddressProvider interface {
	FindByID(ctx context.Context, id string) (userID, label, street, city, zipCode string, err error)
}

// New creates a new checkout Usecase.
func New(
	checkoutRepo *postgres.CheckoutRepository,
	cartUC CartProvider,
	addrRepo AddressProvider,
	productRepo product.Repository,
	discountRepo discount.Repository,
	walletRepo wallet.Repository,
) *Usecase {
	return &Usecase{
		checkoutRepo: checkoutRepo,
		cartUC:       cartUC,
		addrRepo:     addrRepo,
		productRepo:  productRepo,
		discountRepo: discountRepo,
		walletRepo:   walletRepo,
	}
}

// Execute performs the full checkout flow.
func (u *Usecase) Execute(ctx context.Context, buyerID string, input Input) (*order.Order, error) {
	cartID, storeID, cartItems, err := u.cartUC.GetOrCreate(ctx, buyerID)
	if err != nil {
		return nil, err
	}
	if len(cartItems) == 0 {
		return nil, apperror.BadRequest("cart is empty")
	}
	if storeID == nil {
		return nil, apperror.BadRequest("cart has no store")
	}

	addrUserID, label, street, city, zipCode, err := u.addrRepo.FindByID(ctx, input.AddressID)
	if err != nil {
		return nil, err
	}
	if addrUserID != buyerID {
		return nil, apperror.Forbidden("address does not belong to you")
	}

	var subtotal int64
	var orderItems []*order.OrderItem
	var stockItems []postgres.StockDecrement

	for _, ci := range cartItems {
		prod, err := u.productRepo.FindByID(ctx, ci.ProductID)
		if err != nil {
			return nil, err
		}
		if prod.Stock < ci.Quantity {
			return nil, apperror.BadRequest("insufficient stock for product " + prod.Name)
		}
		lineTotal := prod.Price * int64(ci.Quantity)
		subtotal += lineTotal
		orderItems = append(orderItems, &order.OrderItem{
			ID:            uuid.New().String(),
			ProductID:     prod.ID,
			NameSnapshot:  prod.Name,
			PriceSnapshot: prod.Price,
			Quantity:      ci.Quantity,
		})
		stockItems = append(stockItems, postgres.StockDecrement{
			ProductID: prod.ID,
			Qty:       ci.Quantity,
		})
	}

	var discountAmount int64
	var discountID *string
	var isVoucher bool

	if input.DiscountCode != "" {
		normalizedCode := strings.TrimSpace(strings.ToUpper(input.DiscountCode))
		d, err := u.discountRepo.FindByCode(ctx, normalizedCode)
		if err != nil {
			return nil, err
		}
		if !d.IsUsable(clock.Now()) {
			return nil, apperror.BadRequest("discount is not usable")
		}
		discountAmount = d.Calculate(subtotal)
		discountID = &d.ID
		isVoucher = d.Kind == discount.KindVoucher
	}

	taxableBase := subtotal - discountAmount
	taxAmount := taxableBase * 12 / 100
	deliveryFee := input.DeliveryMethod.Fee()
	total := taxableBase + taxAmount + deliveryFee

	w, err := u.walletRepo.FindByUserID(ctx, buyerID)
	if err != nil {
		return nil, err
	}
	if w.Balance < total {
		return nil, apperror.BadRequest("insufficient wallet balance")
	}

	orderID := uuid.New().String()
	now := clock.Now()
	deadlineAt := now.AddDate(0, 0, input.DeliveryMethod.DeadlineDays())

	newOrder := &order.Order{
		ID:          orderID,
		BuyerUserID: buyerID,
		StoreID:     *storeID,
		DiscountID:  discountID,
		AddressSnapshot: order.AddressSnapshot{
			Label:   label,
			Street:  street,
			City:    city,
			ZipCode: zipCode,
		},
		DeliveryMethod: input.DeliveryMethod,
		Subtotal:       subtotal,
		DiscountAmount: discountAmount,
		TaxAmount:      taxAmount,
		DeliveryFee:    deliveryFee,
		Total:          total,
		Status:         order.StatusSedangDikemas,
		DeadlineAt:     deadlineAt,
		Items:          orderItems,
	}

	earningAmount := deliveryFee * 80 / 100
	deliveryJob := &delivery.DeliveryJob{
		ID:            uuid.New().String(),
		OrderID:       orderID,
		EarningAmount: earningAmount,
	}

	params := postgres.CheckoutParams{
		Order:       newOrder,
		WalletID:    w.ID,
		Total:       total,
		DiscountID:  discountID,
		IsVoucher:   isVoucher,
		CartID:      cartID,
		DeliveryJob: deliveryJob,
		StockItems:  stockItems,
	}

	if err := u.checkoutRepo.Execute(ctx, params); err != nil {
		return nil, err
	}

	newOrder.CreatedAt = now
	return newOrder, nil
}
