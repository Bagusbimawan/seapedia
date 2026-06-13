package cart

import (
	"context"

	"github.com/bagus/seapedia/internal/domain/cart"
	"github.com/bagus/seapedia/internal/domain/product"
	"github.com/bagus/seapedia/internal/pkg/apperror"
	"github.com/google/uuid"
)

// Usecase handles cart business logic.
type Usecase struct {
	cartRepo    cart.Repository
	productRepo product.Repository
}

// New creates a new cart Usecase.
func New(cartRepo cart.Repository, productRepo product.Repository) *Usecase {
	return &Usecase{cartRepo: cartRepo, productRepo: productRepo}
}

// GetOrCreate returns the buyer's cart, creating one if needed.
func (u *Usecase) GetOrCreate(ctx context.Context, userID string) (*cart.Cart, error) {
	c, err := u.cartRepo.FindByUserID(ctx, userID)
	if err == nil {
		return c, nil
	}
	if !isNotFound(err) {
		return nil, err
	}
	newCart := &cart.Cart{
		ID:     uuid.New().String(),
		UserID: userID,
	}
	if err := u.cartRepo.CreateCart(ctx, newCart); err != nil {
		return nil, err
	}
	return u.cartRepo.FindByUserID(ctx, userID)
}

// AddItem adds a product to the cart with single-store enforcement.
func (u *Usecase) AddItem(ctx context.Context, userID, productID string, qty int) (*cart.Cart, error) {
	if qty <= 0 {
		return nil, apperror.BadRequest("quantity must be positive")
	}

	prod, err := u.productRepo.FindByID(ctx, productID)
	if err != nil {
		return nil, err
	}

	c, err := u.GetOrCreate(ctx, userID)
	if err != nil {
		return nil, err
	}

	if !c.IsEmpty() && !c.BelongsToStore(prod.StoreID) {
		return nil, apperror.BadRequest("cart is locked to another store, please clear cart first")
	}

	if c.StoreID == nil {
		storeID := prod.StoreID
		if err := u.cartRepo.UpdateStoreID(ctx, c.ID, &storeID); err != nil {
			return nil, err
		}
	}

	if err := u.cartRepo.AddItem(ctx, c.ID, productID, qty); err != nil {
		return nil, err
	}
	return u.cartRepo.FindByUserID(ctx, userID)
}

// UpdateItem updates quantity of a cart item.
func (u *Usecase) UpdateItem(ctx context.Context, userID, productID string, qty int) (*cart.Cart, error) {
	if qty <= 0 {
		return nil, apperror.BadRequest("quantity must be positive")
	}
	c, err := u.GetOrCreate(ctx, userID)
	if err != nil {
		return nil, err
	}
	if err := u.cartRepo.UpdateItem(ctx, c.ID, productID, qty); err != nil {
		return nil, err
	}
	return u.cartRepo.FindByUserID(ctx, userID)
}

// RemoveItem removes a product from the cart.
func (u *Usecase) RemoveItem(ctx context.Context, userID, productID string) (*cart.Cart, error) {
	c, err := u.GetOrCreate(ctx, userID)
	if err != nil {
		return nil, err
	}
	if err := u.cartRepo.RemoveItem(ctx, c.ID, productID); err != nil {
		return nil, err
	}
	updated, err := u.cartRepo.FindByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if updated.IsEmpty() {
		_ = u.cartRepo.UpdateStoreID(ctx, c.ID, nil)
		updated, _ = u.cartRepo.FindByUserID(ctx, userID)
	}
	return updated, nil
}

// Clear removes all items from the cart.
func (u *Usecase) Clear(ctx context.Context, userID string) error {
	c, err := u.GetOrCreate(ctx, userID)
	if err != nil {
		return err
	}
	return u.cartRepo.ClearCart(ctx, c.ID)
}

func isNotFound(err error) bool {
	if e, ok := err.(*apperror.AppError); ok {
		return e.Code == 404
	}
	return false
}
