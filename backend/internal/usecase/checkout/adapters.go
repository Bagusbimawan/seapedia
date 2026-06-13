package checkout

import (
	"context"

	cartuc "github.com/bagus/seapedia/internal/usecase/cart"
	addruc "github.com/bagus/seapedia/internal/usecase/address"
)

// CartAdapter adapts cart usecase for checkout.
type CartAdapter struct {
	uc *cartuc.Usecase
}

// NewCartAdapter creates a CartAdapter.
func NewCartAdapter(uc *cartuc.Usecase) *CartAdapter {
	return &CartAdapter{uc: uc}
}

// GetOrCreate returns cart data for checkout.
func (a *CartAdapter) GetOrCreate(ctx context.Context, userID string) (string, *string, []CartItemInfo, error) {
	c, err := a.uc.GetOrCreate(ctx, userID)
	if err != nil {
		return "", nil, nil, err
	}
	items := make([]CartItemInfo, 0, len(c.Items))
	for _, item := range c.Items {
		items = append(items, CartItemInfo{
			ProductID: item.ProductID,
			Quantity:  item.Quantity,
		})
	}
	return c.ID, c.StoreID, items, nil
}

// AddressAdapter adapts address usecase for checkout.
type AddressAdapter struct {
	uc *addruc.Usecase
}

// NewAddressAdapter creates an AddressAdapter.
func NewAddressAdapter(uc *addruc.Usecase) *AddressAdapter {
	return &AddressAdapter{uc: uc}
}

// FindByID returns address data for checkout.
func (a *AddressAdapter) FindByID(ctx context.Context, id string) (string, string, string, string, string, error) {
	addr, err := a.uc.GetByID(ctx, id)
	if err != nil {
		return "", "", "", "", "", err
	}
	return addr.UserID, addr.Label, addr.Street, addr.City, addr.ZipCode, nil
}
