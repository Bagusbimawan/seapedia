package address

import "context"

// Repository defines the persistence interface for the Address domain.
type Repository interface {
	Create(ctx context.Context, a *Address) error
	FindByID(ctx context.Context, id string) (*Address, error)
	FindByUserID(ctx context.Context, userID string) ([]*Address, error)
	Update(ctx context.Context, a *Address) error
	Delete(ctx context.Context, id string) error
	// SetDefault unsets the default flag on all other addresses for the user,
	// then sets IsDefault=true on the specified address.
	SetDefault(ctx context.Context, userID, addressID string) error
}
