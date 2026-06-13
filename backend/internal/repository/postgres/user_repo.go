package postgres

import (
	"context"
	"errors"

	"github.com/bagus/seapedia/internal/domain/user"
	"github.com/bagus/seapedia/internal/pkg/apperror"
	"gorm.io/gorm"
)

type userRepository struct {
	db *gorm.DB
}

// NewUserRepository returns a postgres-backed user.Repository.
func NewUserRepository(db *gorm.DB) user.Repository {
	return &userRepository{db: db}
}

func (r *userRepository) Create(ctx context.Context, u *user.User) error {
	m := &UserModel{
		ID:           u.ID,
		Username:     u.Username,
		Email:        u.Email,
		Phone:        u.Phone,
		PasswordHash: u.PasswordHash,
	}
	if err := r.db.WithContext(ctx).Create(m).Error; err != nil {
		return err
	}
	for _, role := range u.Roles {
		rm := &UserRoleModel{
			ID:     newUUID(),
			UserID: u.ID,
			Role:   string(role),
		}
		if err := r.db.WithContext(ctx).Create(rm).Error; err != nil {
			return err
		}
	}
	return nil
}

func (r *userRepository) FindByID(ctx context.Context, id string) (*user.User, error) {
	var m UserModel
	if err := r.db.WithContext(ctx).First(&m, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperror.NotFound("user not found")
		}
		return nil, err
	}
	u := modelToUser(&m)
	roles, err := r.GetRoles(ctx, id)
	if err != nil {
		return nil, err
	}
	u.Roles = roles
	return u, nil
}

func (r *userRepository) FindByEmail(ctx context.Context, email string) (*user.User, error) {
	var m UserModel
	if err := r.db.WithContext(ctx).First(&m, "email = ?", email).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperror.NotFound("user not found")
		}
		return nil, err
	}
	u := modelToUser(&m)
	roles, err := r.GetRoles(ctx, m.ID)
	if err != nil {
		return nil, err
	}
	u.Roles = roles
	return u, nil
}

func (r *userRepository) FindByUsername(ctx context.Context, username string) (*user.User, error) {
	var m UserModel
	if err := r.db.WithContext(ctx).First(&m, "username = ?", username).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperror.NotFound("user not found")
		}
		return nil, err
	}
	u := modelToUser(&m)
	roles, err := r.GetRoles(ctx, m.ID)
	if err != nil {
		return nil, err
	}
	u.Roles = roles
	return u, nil
}

func (r *userRepository) ListAll(ctx context.Context, page, limit int) ([]*user.User, int64, error) {
	var total int64
	var models []UserModel
	offset := (page - 1) * limit

	r.db.WithContext(ctx).Model(&UserModel{}).Count(&total)
	if err := r.db.WithContext(ctx).Offset(offset).Limit(limit).Find(&models).Error; err != nil {
		return nil, 0, err
	}

	users := make([]*user.User, 0, len(models))
	for _, m := range models {
		mc := m
		u := modelToUser(&mc)
		roles, _ := r.GetRoles(ctx, u.ID)
		u.Roles = roles
		users = append(users, u)
	}
	return users, total, nil
}

func (r *userRepository) GetRoles(ctx context.Context, userID string) ([]user.Role, error) {
	var roleModels []UserRoleModel
	if err := r.db.WithContext(ctx).Where("user_id = ?", userID).Find(&roleModels).Error; err != nil {
		return nil, err
	}
	roles := make([]user.Role, 0, len(roleModels))
	for _, rm := range roleModels {
		roles = append(roles, user.Role(rm.Role))
	}
	return roles, nil
}

// ── helpers ──────────────────────────────────────────────────────────────────

func modelToUser(m *UserModel) *user.User {
	return &user.User{
		ID:           m.ID,
		Username:     m.Username,
		Email:        m.Email,
		Phone:        m.Phone,
		PasswordHash: m.PasswordHash,
		CreatedAt:    m.CreatedAt,
		UpdatedAt:    m.UpdatedAt,
	}
}
