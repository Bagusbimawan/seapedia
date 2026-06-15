package admin

import (
	"context"
	"strings"

	"github.com/bagus/seapedia/internal/domain/order"
	"github.com/bagus/seapedia/internal/domain/store"
	"github.com/bagus/seapedia/internal/domain/user"
	"github.com/bagus/seapedia/internal/pkg/apperror"
	"github.com/bagus/seapedia/internal/pkg/clock"
	"github.com/bagus/seapedia/internal/pkg/hash"
	"github.com/bagus/seapedia/internal/repository/postgres"
	"github.com/google/uuid"
)

// Usecase handles admin business logic.
type Usecase struct {
	userRepo      user.Repository
	storeRepo     store.Repository
	orderRepo     order.Repository
	clockRepo     *postgres.SystemClockRepository
	overdueRunner OverdueProcessor
}

// OverdueProcessor processes overdue orders.
type OverdueProcessor interface {
	ProcessAll(ctx context.Context) error
}

// New creates a new admin Usecase.
func New(
	userRepo user.Repository,
	storeRepo store.Repository,
	orderRepo order.Repository,
	clockRepo *postgres.SystemClockRepository,
	overdueRunner OverdueProcessor,
) *Usecase {
	return &Usecase{
		userRepo:      userRepo,
		storeRepo:     storeRepo,
		orderRepo:     orderRepo,
		clockRepo:     clockRepo,
		overdueRunner: overdueRunner,
	}
}

// ListUsers returns all users.
func (u *Usecase) ListUsers(ctx context.Context, page, limit int) ([]*user.User, int64, error) {
	return u.userRepo.ListAll(ctx, page, limit)
}

// ListStores returns all stores.
func (u *Usecase) ListStores(ctx context.Context, page, limit int) ([]*store.Store, int64, error) {
	return u.storeRepo.ListAll(ctx, page, limit)
}

// CreateStore creates a store for a seller user (admin action).
func (u *Usecase) CreateStore(ctx context.Context, sellerUserID, name, description string) (*store.Store, error) {
	seller, err := u.userRepo.FindByID(ctx, sellerUserID)
	if err != nil {
		return nil, err
	}

	hasSellerRole := false
	for _, r := range seller.Roles {
		if r == user.RoleSeller {
			hasSellerRole = true
			break
		}
	}
	if !hasSellerRole {
		return nil, apperror.BadRequest("user does not have SELLER role")
	}

	if _, err := u.storeRepo.FindBySellerID(ctx, sellerUserID); err == nil {
		return nil, apperror.Conflict("seller already has a store")
	} else if !isNotFound(err) {
		return nil, err
	}

	s := &store.Store{
		ID:            uuid.New().String(),
		SellerUserID:  sellerUserID,
		Name:          name,
		Description:   description,
		ProvisionedBy: store.ProvisionedAdmin,
	}
	if err := u.storeRepo.Create(ctx, s); err != nil {
		return nil, err
	}
	return s, nil
}

// CreateSellerResult is returned after admin creates a seller account + store.
type CreateSellerResult struct {
	User         *user.User
	Store        *store.Store
	DemoPassword string
}

// CreateSeller creates a seller user and store (shown on login demo panel).
func (u *Usecase) CreateSeller(ctx context.Context, username, email, password, storeName, storeDesc string) (*CreateSellerResult, error) {
	email = strings.ToLower(strings.TrimSpace(email))
	username = strings.TrimSpace(username)
	storeName = strings.TrimSpace(storeName)

	if len(password) < 6 {
		return nil, apperror.BadRequest("password minimal 6 karakter")
	}

	if _, err := u.userRepo.FindByEmail(ctx, email); err == nil {
		return nil, apperror.Conflict("email already registered")
	} else if !isNotFound(err) {
		return nil, err
	}

	if _, err := u.userRepo.FindByUsername(ctx, username); err == nil {
		return nil, apperror.Conflict("username already taken")
	} else if !isNotFound(err) {
		return nil, err
	}

	passwordHash, err := hash.Hash(password)
	if err != nil {
		return nil, apperror.Internal("failed to hash password")
	}

	newUser := &user.User{
		ID:           uuid.New().String(),
		Username:     username,
		Email:        email,
		PasswordHash: passwordHash,
		Roles:        []user.Role{user.RoleSeller},
	}
	if err := u.userRepo.Create(ctx, newUser); err != nil {
		return nil, err
	}

	s := &store.Store{
		ID:            uuid.New().String(),
		SellerUserID:  newUser.ID,
		Name:          storeName,
		Description:   strings.TrimSpace(storeDesc),
		ProvisionedBy: store.ProvisionedAdmin,
		DemoPassword:  password,
	}
	if err := u.storeRepo.Create(ctx, s); err != nil {
		return nil, err
	}

	return &CreateSellerResult{
		User:         newUser,
		Store:        s,
		DemoPassword: password,
	}, nil
}

func isNotFound(err error) bool {
	if e, ok := err.(*apperror.AppError); ok {
		return e.Code == 404
	}
	return false
}

// ListOrders returns all orders.
func (u *Usecase) ListOrders(ctx context.Context, status *order.Status, page, limit int) ([]*order.Order, int64, error) {
	return u.orderRepo.ListAll(ctx, status, page, limit)
}

// AdvanceDay advances the virtual clock by 24 hours and triggers overdue processing.
func (u *Usecase) AdvanceDay(ctx context.Context) (int64, error) {
	offset, err := u.clockRepo.AdvanceDay(ctx)
	if err != nil {
		return 0, err
	}
	clock.SetOffset(offset)
	if err := u.overdueRunner.ProcessAll(ctx); err != nil {
		return offset, err
	}
	return offset, nil
}
