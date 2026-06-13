package address

import (
	"context"

	addr "github.com/bagus/seapedia/internal/domain/address"
	"github.com/bagus/seapedia/internal/pkg/apperror"
	"github.com/google/uuid"
)

// Usecase handles address business logic.
type Usecase struct {
	addrRepo addr.Repository
}

// New creates a new address Usecase.
func New(addrRepo addr.Repository) *Usecase {
	return &Usecase{addrRepo: addrRepo}
}

// GetByID returns an address by ID.
func (u *Usecase) GetByID(ctx context.Context, id string) (*addr.Address, error) {
	return u.addrRepo.FindByID(ctx, id)
}

// List returns all addresses for a user.
func (u *Usecase) List(ctx context.Context, userID string) ([]*addr.Address, error) {
	return u.addrRepo.FindByUserID(ctx, userID)
}

// Create creates a new address.
func (u *Usecase) Create(ctx context.Context, userID, label, street, city, zipCode string, isDefault bool) (*addr.Address, error) {
	a := &addr.Address{
		ID:        uuid.New().String(),
		UserID:    userID,
		Label:     label,
		Street:    street,
		City:      city,
		ZipCode:   zipCode,
		IsDefault: isDefault,
	}
	if err := u.addrRepo.Create(ctx, a); err != nil {
		return nil, err
	}
	if isDefault {
		if err := u.addrRepo.SetDefault(ctx, userID, a.ID); err != nil {
			return nil, err
		}
		a.IsDefault = true
	}
	return a, nil
}

// Update updates an address owned by the user.
func (u *Usecase) Update(ctx context.Context, userID, addressID, label, street, city, zipCode string) (*addr.Address, error) {
	a, err := u.addrRepo.FindByID(ctx, addressID)
	if err != nil {
		return nil, err
	}
	if a.UserID != userID {
		return nil, apperror.Forbidden("address does not belong to you")
	}
	a.Label = label
	a.Street = street
	a.City = city
	a.ZipCode = zipCode
	if err := u.addrRepo.Update(ctx, a); err != nil {
		return nil, err
	}
	return a, nil
}

// Delete removes an address.
func (u *Usecase) Delete(ctx context.Context, userID, addressID string) error {
	a, err := u.addrRepo.FindByID(ctx, addressID)
	if err != nil {
		return err
	}
	if a.UserID != userID {
		return apperror.Forbidden("address does not belong to you")
	}
	return u.addrRepo.Delete(ctx, addressID)
}

// SetDefault sets an address as the default.
func (u *Usecase) SetDefault(ctx context.Context, userID, addressID string) error {
	a, err := u.addrRepo.FindByID(ctx, addressID)
	if err != nil {
		return err
	}
	if a.UserID != userID {
		return apperror.Forbidden("address does not belong to you")
	}
	return u.addrRepo.SetDefault(ctx, userID, addressID)
}
