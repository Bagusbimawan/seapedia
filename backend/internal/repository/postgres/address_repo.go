package postgres

import (
	"context"
	"errors"

	"github.com/bagus/seapedia/internal/domain/address"
	"github.com/bagus/seapedia/internal/pkg/apperror"
	"gorm.io/gorm"
)

type addressRepository struct {
	db *gorm.DB
}

// NewAddressRepository returns a postgres-backed address.Repository.
func NewAddressRepository(db *gorm.DB) address.Repository {
	return &addressRepository{db: db}
}

func (r *addressRepository) Create(ctx context.Context, a *address.Address) error {
	m := addressToModel(a)
	return r.db.WithContext(ctx).Create(m).Error
}

func (r *addressRepository) FindByID(ctx context.Context, id string) (*address.Address, error) {
	var m AddressModel
	if err := r.db.WithContext(ctx).First(&m, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperror.NotFound("address not found")
		}
		return nil, err
	}
	return modelToAddress(&m), nil
}

func (r *addressRepository) FindByUserID(ctx context.Context, userID string) ([]*address.Address, error) {
	var models []AddressModel
	if err := r.db.WithContext(ctx).Where("user_id = ?", userID).
		Order("is_default DESC, created_at ASC").Find(&models).Error; err != nil {
		return nil, err
	}
	addrs := make([]*address.Address, 0, len(models))
	for _, m := range models {
		mc := m
		addrs = append(addrs, modelToAddress(&mc))
	}
	return addrs, nil
}

func (r *addressRepository) Update(ctx context.Context, a *address.Address) error {
	return r.db.WithContext(ctx).Model(&AddressModel{}).Where("id = ?", a.ID).
		Updates(map[string]interface{}{
			"label":      a.Label,
			"street":     a.Street,
			"city":       a.City,
			"zip_code":   a.ZipCode,
			"is_default": a.IsDefault,
		}).Error
}

func (r *addressRepository) Delete(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Delete(&AddressModel{}, "id = ?", id).Error
}

func (r *addressRepository) SetDefault(ctx context.Context, userID, addressID string) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// Unset all defaults for this user.
		if err := tx.Model(&AddressModel{}).Where("user_id = ?", userID).
			Update("is_default", false).Error; err != nil {
			return err
		}
		// Set the target address as default.
		return tx.Model(&AddressModel{}).Where("id = ? AND user_id = ?", addressID, userID).
			Update("is_default", true).Error
	})
}

func addressToModel(a *address.Address) *AddressModel {
	return &AddressModel{
		ID:        a.ID,
		UserID:    a.UserID,
		Label:     a.Label,
		Street:    a.Street,
		City:      a.City,
		ZipCode:   a.ZipCode,
		IsDefault: a.IsDefault,
	}
}

func modelToAddress(m *AddressModel) *address.Address {
	return &address.Address{
		ID:        m.ID,
		UserID:    m.UserID,
		Label:     m.Label,
		Street:    m.Street,
		City:      m.City,
		ZipCode:   m.ZipCode,
		IsDefault: m.IsDefault,
		CreatedAt: m.CreatedAt,
		UpdatedAt: m.UpdatedAt,
	}
}
