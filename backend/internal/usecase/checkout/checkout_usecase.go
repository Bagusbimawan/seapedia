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

type storeCheckoutGroup struct {
	storeID    string
	items      []*order.OrderItem
	stockItems []postgres.StockDecrement
	subtotal   int64
}

// Execute performs checkout. Items from multiple stores become separate orders.
func (u *Usecase) Execute(ctx context.Context, buyerID string, input Input) ([]*order.Order, error) {
	cartID, _, cartItems, err := u.cartUC.GetOrCreate(ctx, buyerID)
	if err != nil {
		return nil, err
	}
	if len(cartItems) == 0 {
		return nil, apperror.BadRequest("cart is empty")
	}

	addrUserID, label, street, city, zipCode, err := u.addrRepo.FindByID(ctx, input.AddressID)
	if err != nil {
		return nil, err
	}
	if addrUserID != buyerID {
		return nil, apperror.Forbidden("address does not belong to you")
	}

	groups := make(map[string]*storeCheckoutGroup)
	var totalSubtotal int64

	for _, ci := range cartItems {
		prod, err := u.productRepo.FindByID(ctx, ci.ProductID)
		if err != nil {
			return nil, err
		}
		if prod.Stock < ci.Quantity {
			return nil, apperror.BadRequest("insufficient stock for product " + prod.Name)
		}

		group, ok := groups[prod.StoreID]
		if !ok {
			group = &storeCheckoutGroup{storeID: prod.StoreID}
			groups[prod.StoreID] = group
		}

		lineTotal := prod.Price * int64(ci.Quantity)
		group.subtotal += lineTotal
		totalSubtotal += lineTotal
		group.items = append(group.items, &order.OrderItem{
			ID:            uuid.New().String(),
			ProductID:     prod.ID,
			NameSnapshot:  prod.Name,
			PriceSnapshot: prod.Price,
			Quantity:      ci.Quantity,
		})
		group.stockItems = append(group.stockItems, postgres.StockDecrement{
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
		discountAmount = d.Calculate(totalSubtotal)
		discountID = &d.ID
		isVoucher = d.Kind == discount.KindVoucher
	}

	w, err := u.walletRepo.FindByUserID(ctx, buyerID)
	if err != nil {
		return nil, err
	}

	now := clock.Now()
	deadlineAt := now.AddDate(0, 0, input.DeliveryMethod.DeadlineDays())
	deliveryFee := input.DeliveryMethod.Fee()
	addrSnapshot := order.AddressSnapshot{
		Label:   label,
		Street:  street,
		City:    city,
		ZipCode: zipCode,
	}

	var batch []postgres.CheckoutParams
	var grandTotal int64
	remainingDiscount := discountAmount
	groupKeys := make([]string, 0, len(groups))
	for storeID := range groups {
		groupKeys = append(groupKeys, storeID)
	}

	for i, storeID := range groupKeys {
		group := groups[storeID]
		storeDiscount := int64(0)
		if discountAmount > 0 && totalSubtotal > 0 {
			if i == len(groupKeys)-1 {
				storeDiscount = remainingDiscount
			} else {
				storeDiscount = discountAmount * group.subtotal / totalSubtotal
				remainingDiscount -= storeDiscount
			}
		}

		taxableBase := group.subtotal - storeDiscount
		taxAmount := taxableBase * 12 / 100
		total := taxableBase + taxAmount + deliveryFee
		grandTotal += total

		orderID := uuid.New().String()
		newOrder := &order.Order{
			ID:              orderID,
			BuyerUserID:     buyerID,
			StoreID:         storeID,
			DiscountID:      discountID,
			AddressSnapshot: addrSnapshot,
			DeliveryMethod:  input.DeliveryMethod,
			Subtotal:        group.subtotal,
			DiscountAmount:  storeDiscount,
			TaxAmount:       taxAmount,
			DeliveryFee:     deliveryFee,
			Total:           total,
			Status:          order.StatusSedangDikemas,
			DeadlineAt:      deadlineAt,
			Items:           group.items,
			CreatedAt:       now,
		}

		batch = append(batch, postgres.CheckoutParams{
			Order: newOrder,
			DeliveryJob: &delivery.DeliveryJob{
				ID:            uuid.New().String(),
				OrderID:       orderID,
				EarningAmount: deliveryFee * 80 / 100,
			},
			StockItems: group.stockItems,
		})
	}

	if w.Balance < grandTotal {
		return nil, apperror.BadRequest("insufficient wallet balance")
	}

	if err := u.checkoutRepo.ExecuteBatch(ctx, postgres.CheckoutBatchParams{
		Orders:     batch,
		WalletID:   w.ID,
		GrandTotal: grandTotal,
		DiscountID: discountID,
		IsVoucher:  isVoucher,
		CartID:     cartID,
	}); err != nil {
		return nil, err
	}

	orders := make([]*order.Order, 0, len(batch))
	for _, p := range batch {
		orders = append(orders, p.Order)
	}
	return orders, nil
}
