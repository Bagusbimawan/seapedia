package store

import (
	"context"

	"github.com/bagus/seapedia/internal/domain/store"
	"github.com/bagus/seapedia/internal/pkg/apperror"
	"github.com/google/uuid"
)

// Usecase handles store business logic.
type Usecase struct {
	storeRepo store.Repository
}

// New creates a new store Usecase.
func New(storeRepo store.Repository) *Usecase {
	return &Usecase{storeRepo: storeRepo}
}

// CreateStore creates a store for the seller (1 store per seller).
func (u *Usecase) CreateStore(ctx context.Context, sellerID, name, description string) (*store.Store, error) {
	if _, err := u.storeRepo.FindBySellerID(ctx, sellerID); err == nil {
		return nil, apperror.Conflict("seller already has a store")
	} else if !isNotFound(err) {
		return nil, err
	}

	s := &store.Store{
		ID:           uuid.New().String(),
		SellerUserID: sellerID,
		Name:         name,
		Description:  description,
	}
	if err := u.storeRepo.Create(ctx, s); err != nil {
		return nil, err
	}
	return s, nil
}

// GetSellerStore returns the seller's own store.
func (u *Usecase) GetSellerStore(ctx context.Context, sellerID string) (*store.Store, error) {
	return u.storeRepo.FindBySellerID(ctx, sellerID)
}

// UpdateStore updates the seller's store.
func (u *Usecase) UpdateStore(ctx context.Context, sellerID, name, description string) (*store.Store, error) {
	s, err := u.storeRepo.FindBySellerID(ctx, sellerID)
	if err != nil {
		return nil, err
	}
	s.Name = name
	s.Description = description
	if err := u.storeRepo.Update(ctx, s); err != nil {
		return nil, err
	}
	return s, nil
}

// GetPublicStore returns a store by ID (public).
func (u *Usecase) GetPublicStore(ctx context.Context, id string) (*store.Store, error) {
	return u.storeRepo.FindByID(ctx, id)
}

// ListAll returns all stores (admin).
func (u *Usecase) ListAll(ctx context.Context, page, limit int) ([]*store.Store, int64, error) {
	return u.storeRepo.ListAll(ctx, page, limit)
}

func isNotFound(err error) bool {
	if e, ok := err.(*apperror.AppError); ok {
		return e.Code == 404
	}
	return false
}
