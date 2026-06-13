package product

import (
	"context"

	"github.com/bagus/seapedia/internal/domain/product"
	"github.com/bagus/seapedia/internal/domain/store"
	"github.com/bagus/seapedia/internal/pkg/apperror"
	"github.com/google/uuid"
)

// Usecase handles product business logic.
type Usecase struct {
	productRepo product.Repository
	storeRepo   store.Repository
}

// New creates a new product Usecase.
func New(productRepo product.Repository, storeRepo store.Repository) *Usecase {
	return &Usecase{productRepo: productRepo, storeRepo: storeRepo}
}

// ListPublic lists all products with optional search.
func (u *Usecase) ListPublic(ctx context.Context, search string, page, limit int) ([]*product.Product, int64, error) {
	return u.productRepo.ListAll(ctx, search, page, limit)
}

// GetByID returns a product by ID.
func (u *Usecase) GetByID(ctx context.Context, id string) (*product.Product, error) {
	return u.productRepo.FindByID(ctx, id)
}

// ListBySeller lists products for the seller's store.
func (u *Usecase) ListBySeller(ctx context.Context, sellerID string, page, limit int) ([]*product.Product, int64, error) {
	s, err := u.storeRepo.FindBySellerID(ctx, sellerID)
	if err != nil {
		return nil, 0, err
	}
	return u.productRepo.ListByStore(ctx, s.ID, page, limit)
}

// Create creates a product in the seller's store.
func (u *Usecase) Create(ctx context.Context, sellerID, name, description string, price int64, stock int) (*product.Product, error) {
	s, err := u.storeRepo.FindBySellerID(ctx, sellerID)
	if err != nil {
		return nil, err
	}
	p := &product.Product{
		ID:          uuid.New().String(),
		StoreID:     s.ID,
		Name:        name,
		Description: description,
		Price:       price,
		Stock:       stock,
	}
	if err := u.productRepo.Create(ctx, p); err != nil {
		return nil, err
	}
	return p, nil
}

// Update updates a product owned by the seller.
func (u *Usecase) Update(ctx context.Context, sellerID, productID, name, description string, price int64, stock int) (*product.Product, error) {
	s, err := u.storeRepo.FindBySellerID(ctx, sellerID)
	if err != nil {
		return nil, err
	}
	p, err := u.productRepo.FindByID(ctx, productID)
	if err != nil {
		return nil, err
	}
	if p.StoreID != s.ID {
		return nil, apperror.Forbidden("product does not belong to your store")
	}
	p.Name = name
	p.Description = description
	p.Price = price
	p.Stock = stock
	if err := u.productRepo.Update(ctx, p); err != nil {
		return nil, err
	}
	return p, nil
}

// Delete removes a product owned by the seller.
func (u *Usecase) Delete(ctx context.Context, sellerID, productID string) error {
	s, err := u.storeRepo.FindBySellerID(ctx, sellerID)
	if err != nil {
		return err
	}
	p, err := u.productRepo.FindByID(ctx, productID)
	if err != nil {
		return err
	}
	if p.StoreID != s.ID {
		return apperror.Forbidden("product does not belong to your store")
	}
	return u.productRepo.Delete(ctx, productID)
}
