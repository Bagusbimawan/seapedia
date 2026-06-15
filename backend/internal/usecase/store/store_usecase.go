package store

import (
	"context"

	"github.com/bagus/seapedia/internal/domain/store"
	"github.com/bagus/seapedia/internal/domain/user"
	"github.com/bagus/seapedia/internal/pkg/apperror"
	"github.com/google/uuid"
)

// DemoSeller is public seller info for the login demo panel.
type DemoSeller struct {
	Email        string
	Username     string
	StoreName    string
	DemoPassword string
}

// Usecase handles store business logic.
type Usecase struct {
	storeRepo store.Repository
	userRepo  user.Repository
}

// New creates a new store Usecase.
func New(storeRepo store.Repository, userRepo user.Repository) *Usecase {
	return &Usecase{storeRepo: storeRepo, userRepo: userRepo}
}

// CreateStore creates a store for the seller (1 store per seller).
func (u *Usecase) CreateStore(ctx context.Context, sellerID, name, description string) (*store.Store, error) {
	if _, err := u.storeRepo.FindBySellerID(ctx, sellerID); err == nil {
		return nil, apperror.Conflict("seller already has a store")
	} else if !isNotFound(err) {
		return nil, err
	}

	s := &store.Store{
		ID:            uuid.New().String(),
		SellerUserID:  sellerID,
		Name:          name,
		Description:   description,
		ProvisionedBy: store.ProvisionedSeller,
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

// ListDemoSellers returns seed + admin sellers for the public demo panel.
func (u *Usecase) ListDemoSellers(ctx context.Context) ([]DemoSeller, error) {
	stores, _, err := u.storeRepo.ListForDemoPanel(ctx, 1, 100)
	if err != nil {
		return nil, err
	}

	items := make([]DemoSeller, 0, len(stores))
	for _, s := range stores {
		seller, err := u.userRepo.FindByID(ctx, s.SellerUserID)
		if err != nil {
			continue
		}
		password := s.DemoPassword
		if password == "" && seller.Email == "seller@seapedia.com" {
			password = "seller123"
		}
		items = append(items, DemoSeller{
			Email:        seller.Email,
			Username:     seller.Username,
			StoreName:    s.Name,
			DemoPassword: password,
		})
	}
	return items, nil
}

func isNotFound(err error) bool {
	if e, ok := err.(*apperror.AppError); ok {
		return e.Code == 404
	}
	return false
}
