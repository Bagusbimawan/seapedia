package auth

import (
	"context"
	"strings"

	"github.com/bagus/seapedia/internal/config"
	"github.com/bagus/seapedia/internal/domain/cart"
	"github.com/bagus/seapedia/internal/domain/user"
	"github.com/bagus/seapedia/internal/domain/wallet"
	"github.com/bagus/seapedia/internal/pkg/apperror"
	"github.com/bagus/seapedia/internal/pkg/hash"
	jwtutil "github.com/bagus/seapedia/internal/pkg/jwt"
	"github.com/google/uuid"
)

// RegisterInput holds registration request data.
type RegisterInput struct {
	Username string
	Email    string
	Phone    string
	Password string
	Roles    []user.Role
}

// LoginResult is returned after successful login.
type LoginResult struct {
	Token           string
	User            *user.User
	ActiveRole      user.Role
	NeedsRoleSelect bool
}

// Usecase handles authentication business logic.
type Usecase struct {
	cfg        *config.Config
	userRepo   user.Repository
	walletRepo wallet.Repository
	cartRepo   cart.Repository
}

// New creates a new auth Usecase.
func New(cfg *config.Config, userRepo user.Repository, walletRepo wallet.Repository, cartRepo cart.Repository) *Usecase {
	return &Usecase{cfg: cfg, userRepo: userRepo, walletRepo: walletRepo, cartRepo: cartRepo}
}

// Register creates a new user account.
func (u *Usecase) Register(ctx context.Context, input RegisterInput) (*user.User, error) {
	if len(input.Roles) == 0 {
		return nil, apperror.BadRequest("at least one role is required")
	}
	for _, r := range input.Roles {
		if r == user.RoleAdmin {
			return nil, apperror.Forbidden("cannot self-assign ADMIN role")
		}
	}

	if _, err := u.userRepo.FindByEmail(ctx, strings.ToLower(input.Email)); err == nil {
		return nil, apperror.Conflict("email already registered")
	} else if !isNotFound(err) {
		return nil, err
	}

	if _, err := u.userRepo.FindByUsername(ctx, input.Username); err == nil {
		return nil, apperror.Conflict("username already taken")
	} else if !isNotFound(err) {
		return nil, err
	}

	passwordHash, err := hash.Hash(input.Password)
	if err != nil {
		return nil, apperror.Internal("failed to hash password")
	}

	newUser := &user.User{
		ID:           uuid.New().String(),
		Username:     input.Username,
		Email:        strings.ToLower(input.Email),
		Phone:        input.Phone,
		PasswordHash: passwordHash,
		Roles:        input.Roles,
	}

	if err := u.userRepo.Create(ctx, newUser); err != nil {
		return nil, err
	}

	needsWallet := false
	needsCart := false
	for _, r := range input.Roles {
		if r == user.RoleBuyer || r == user.RoleDriver {
			needsWallet = true
		}
		if r == user.RoleBuyer {
			needsCart = true
		}
	}
	if needsWallet {
		w := &wallet.Wallet{
			ID:      uuid.New().String(),
			UserID:  newUser.ID,
			Balance: 0,
		}
		if err := u.walletRepo.CreateWallet(ctx, w); err != nil {
			return nil, err
		}
	}
	if needsCart {
		c := &cart.Cart{
			ID:     uuid.New().String(),
			UserID: newUser.ID,
		}
		if err := u.cartRepo.CreateCart(ctx, c); err != nil {
			return nil, err
		}
	}

	return newUser, nil
}

// Login authenticates a user and returns a JWT.
func (u *Usecase) Login(ctx context.Context, email, password string) (*LoginResult, error) {
	found, err := u.userRepo.FindByEmail(ctx, strings.ToLower(email))
	if err != nil {
		if isNotFound(err) {
			return nil, apperror.Unauthorized("invalid email or password")
		}
		return nil, err
	}

	if !hash.Compare(found.PasswordHash, password) {
		return nil, apperror.Unauthorized("invalid email or password")
	}

	activeRole := found.DetermineActiveRole()
	needsRoleSelect := activeRole == user.RolePending

	token, err := jwtutil.Generate(u.cfg.JWTSecret, u.cfg.JWTExpiry, found.ID, string(activeRole))
	if err != nil {
		return nil, apperror.Internal("failed to generate token")
	}

	return &LoginResult{
		Token:           token,
		User:            found,
		ActiveRole:      activeRole,
		NeedsRoleSelect: needsRoleSelect,
	}, nil
}

// SwitchRole re-issues a JWT with a new active role.
func (u *Usecase) SwitchRole(ctx context.Context, userID string, role user.Role) (string, error) {
	if role == user.RoleAdmin || role == user.RolePending {
		return "", apperror.BadRequest("invalid role")
	}

	found, err := u.userRepo.FindByID(ctx, userID)
	if err != nil {
		return "", err
	}

	if !found.HasRole(role) {
		return "", apperror.Forbidden("user does not have this role")
	}

	return jwtutil.Generate(u.cfg.JWTSecret, u.cfg.JWTExpiry, found.ID, string(role))
}

// Me returns the current user's profile.
func (u *Usecase) Me(ctx context.Context, userID string) (*user.User, error) {
	return u.userRepo.FindByID(ctx, userID)
}

func isNotFound(err error) bool {
	if e, ok := err.(*apperror.AppError); ok {
		return e.Code == 404
	}
	return false
}
