package user

import "context"

// Repository defines the persistence interface for the User domain.
type Repository interface {
	Create(ctx context.Context, u *User) error
	FindByID(ctx context.Context, id string) (*User, error)
	FindByEmail(ctx context.Context, email string) (*User, error)
	FindByUsername(ctx context.Context, username string) (*User, error)
	ListAll(ctx context.Context, page, limit int) ([]*User, int64, error)
	GetRoles(ctx context.Context, userID string) ([]Role, error)
}
